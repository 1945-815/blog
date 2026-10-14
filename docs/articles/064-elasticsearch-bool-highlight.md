---
title: "Elasticsearch bool 查询与高亮：组合过滤条件并返回可展示片段"
date: "2027-06-08"
categories: ["搜索"]
tags: ["Elasticsearch", "bool", "Highlight", "Java API Client"]
description: "在索引映射文章之后，继续拆解 must、filter、should 的查询语义，以及高亮结果的安全组装。"
plan_date: "2026-07-22"
phase: "Java 后端实习与业务实践"
---

# Elasticsearch bool 查询与高亮：组合过滤条件并返回可展示片段

> **计划公开日期：**2027-06-08　·　**学习阶段参考日期：**2026-07-22　·　**阶段：**Java 后端实习与业务实践。本文承接已有 mapping 与分析器文章，重点放在查询组合和响应处理；代码需按项目 Elasticsearch 客户端版本核对。

## 一、为什么学习这个技术

已有文章介绍了 Elasticsearch 的 text/keyword 字段、分词和标题正文检索。真实搜索接口通常还要组合关键词、发布状态、价格范围、排序和高亮：用户希望找到相关文档，同时不能看到草稿或其他租户数据，结果还要能在页面中突出命中词。

把一组条件都塞进 match 里既表达不了业务约束，也容易混淆“必须满足”与“提高相关性”。理解 bool 查询的 must、filter、should、must_not，再正确处理高亮片段，才能把搜索语义和页面展示分开设计。

## 二、核心概念

must 表示子查询必须匹配，并参与相关性评分；filter 也必须匹配，但不参与评分，适合状态、租户、价格这类结构化约束；must_not 排除命中条件的文档；should 用作可选加分条件，或通过 minimum_should_match 明确要求命中数量。

should 有一个容易遗漏的默认规则：当 bool 同时包含 must 或 filter 时，should 默认可以只是加分项；若 bool 只有 should，则默认至少命中一个。产品逻辑需要“标题或正文至少命中一个”时，可以用 multi_match 放在 must，或者设置 minimum_should_match，不能仅凭字段名猜布尔含义。

高亮是搜索响应里的附加片段，不会修改索引源文档。客户端要根据命中字段取片段，再决定展示；如果某字段没有高亮片段，应回退到原始字段。高亮返回的标签是 HTML 字符串，不能未经转义或净化就当作可信 HTML 渲染。

## 三、底层原理

全文查询会在分词后的索引结构上计算命中和相关性分数；bool 组合子句后，must 与 should 的得分可参与最终排序，而 filter 负责布尔过滤，不改变得分。把结构化条件放进 filter，能把业务限制和文本相关性区分开。

高亮器依据查询条件和字段内容生成一个或多个片段，再把命中的词包在 pre_tags/post_tags 里。片段可能截取正文的一部分，不能假定它永远等于完整 _source 字段。复杂布尔查询中，高亮内容也不应被用作授权或命中条件的唯一证明，真正结果仍以 query 与文档访问边界为准。

过滤租户和权限是后端安全边界。即使前端传了 tenantId，也必须由认证上下文确定允许的数据范围，不能信任客户端任意指定的租户值。索引设计文章讲字段和分析器；本文不重复建立 mapping，而聚焦查询 DSL 和结果映射。

## 四、代码案例

先用 Query DSL 表达“标题或简介命中关键词，状态必须已发布，价格小于 5000；标题命中时额外提升相关性”。filter 中的条件不影响文本评分；should 作为可选加分项，不会排除只命中简介的文档。

~~~json
GET products/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "蓝牙耳机",
            "fields": ["title^3", "intro"]
          }
        }
      ],
      "filter": [
        {"term": {"status": "PUBLISHED"}},
        {"range": {"price": {"lt": 5000}}}
      ],
      "should": [
        {"match": {"title": {"query": "蓝牙耳机", "boost": 2}}}
      ]
    }
  },
  "highlight": {
    "pre_tags": ["<em>"],
    "post_tags": ["</em>"],
    "fields": {
      "title": {},
      "intro": {}
    }
  },
  "from": 0,
  "size": 10
}
~~~

索引数据来自关系库时，先选择搜索列表需要的字段，避免把整张业务表无差别同步到搜索索引。

~~~sql
CREATE TABLE product (
    id BIGINT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    intro TEXT,
    status VARCHAR(24) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    updated_at DATETIME NOT NULL,
    KEY idx_status_updated (status, updated_at)
);

SELECT id, title, intro, status, price, updated_at
FROM product
WHERE status = 'PUBLISHED'
ORDER BY updated_at DESC;
~~~

Java 侧使用 Elasticsearch Java API Client 8.x 的类型化请求。客户端及 Spring Data Elasticsearch 版本不同，构造器细节会变化，升级时应查对应版本文档。

~~~java
SearchResponse<ProductDoc> response = client.search(s -> s
        .index("products")
        .query(q -> q.bool(b -> b
                .must(m -> m.multiMatch(mm -> mm
                        .query(keyword)
                        .fields(Arrays.asList("title^3", "intro"))))
                .filter(f -> f.term(t -> t.field("status")
                        .value(FieldValue.of("PUBLISHED"))))
                .filter(f -> f.range(r -> r.number(
                        n -> n.field("price").lt(5000.0))))
                .should(sh -> sh.match(m -> m
                        .field("title").query(keyword).boost(2.0f)))))
        .highlight(h -> h.preTags("<em>").postTags("</em>")
                .fields("title", f -> f)
                .fields("intro", f -> f))
        .from(0)
        .size(10),
    ProductDoc.class);

for (Hit<ProductDoc> hit : response.hits().hits()) {
    ProductDoc source = hit.source();
    Map<String, List<String>> snippets = hit.highlight();
    List<String> titleParts = snippets.getOrDefault(
            "title", Collections.singletonList(source.title()));
    System.out.println(titleParts.get(0));
}
~~~

客户端连接地址通过应用配置提供；生产环境还要使用受控凭据和 TLS 配置。

~~~yaml
spring:
  elasticsearch:
    uris: http://localhost:9200
~~~

实际调用示例：`curl "http://localhost:8080/api/products/search?q=%E8%93%9D%E7%89%99%E8%80%B3%E6%9C%BA&page=1&pageSize=10"`。服务端需要限制 pageSize，并由服务端上下文追加租户过滤，而不是直接采用用户传来的租户号。

## 五、项目真实落地

在可复现的商品搜索练习中，我会先把搜索行为写成业务句子，再映射到 DSL：关键词检索进 must，状态与范围进 filter，非必需的标题匹配进 should。随后用几条边界数据验证：只有标题命中、只有简介命中、价格刚好等于上限、草稿状态和不同租户。

高亮片段应作为展示字段单独返回，源文档内容仍保持原样。若前端使用 v-html 一类能力，必须对内容和高亮标记做安全处理，不能让文档正文中的脚本借助高亮接口进入页面。若搜索结果还要查 MySQL 完整详情，可以以 ES 返回的 ID 作为候选，再按业务权限回查。

调试时可以先去掉 highlight，只验证命中文档和过滤范围；再逐步加排序与高亮。每次只调整一个子句，便于分辨“没有命中”来自分析器、must 语义、filter 条件还是数据同步。

## 六、常见面试问题

### 初级：must 与 filter 有什么区别？

两者都要求文档匹配。must 参与相关性评分；filter 不参与评分，适合结构化限制或精确条件。

### 中级：有 must 时 should 是必选条件吗？

不一定。含 must/filter 时，should 默认可选并主要用于加分；要强制命中需要设置 minimum_should_match，或将逻辑改写为必须条件。

### 项目问题：搜索高亮为什么不能直接替换原字段并渲染？

高亮通常是片段而非完整正文，并且标签字符串需要按安全策略处理。应保留 source，单独映射展示片段，过滤或净化不可信 HTML。

## 七、个人总结

通过这次整理，我把之前“会写 match 和高亮”的印象推进到“能解释每个查询子句的业务含义”。作为一名 2027 届 Java 后端实习生，我会先用边界样例验证 must、filter 和 should 的组合，再确认租户权限和高亮渲染安全，避免只看 DSL 能返回结果就认为搜索功能已经正确。

## 参考资料

- [Elasticsearch bool query](https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-bool-query)
- [Elasticsearch highlighting](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/highlighting)
- [Elasticsearch Java API Client](https://www.elastic.co/docs/reference/elasticsearch/clients/java)
