---
title: "Elasticsearch 深分页：用 PIT 与 search_after 稳定翻页"
date: "2027-08-17"
categories: ["搜索"]
tags: ["Elasticsearch", "PIT", "search_after", "分页", "性能优化"]
description: "从分片排序成本出发，设计连续翻页所需的 PIT、排序游标、授权范围和过期恢复，补全搜索接口的深分页边界。"
plan_date: "2026-07-28"
phase: "后端工程实践"
---

# Elasticsearch 深分页：用 PIT 与 search_after 稳定翻页

## 问题背景

接下来需要解决的是用户持续点击“加载更多”时，如何避免深 offset 带来的排序开销，并减少索引刷新引起的重复和漏项。

不能简单把最大结果窗口改得更大。搜索请求可能分发到多个分片，每个分片都要参与收集前面被跳过的候选结果；页码越深，这些工作越多。本文把交互限定为顺序向后翻页，再据此选择 PIT 和 search_after，避免接口承诺实际上无法低成本完成的任意跳页。

## 核心概念

from/size 表示跳过多少条再取多少条。默认结果窗口限制的是 from 与 size 之和，通常为 10000，并非只要 from 不超过 10000 就一定可以查询。search_after 使用上一页最后一个命中的排序值继续检索，不能仅凭页码直接跳到遥远的一页。

PIT，即时间点视图，为一组搜索保留一致的索引视图。它不是永久备份，也不表示跨 MySQL 与 Elasticsearch 的分布式快照。后续索引更新不会自动进入原视图；保留 PIT 还会占用旧段、文件句柄等资源，因此需要较短有效期和明确关闭时机。[Elasticsearch PIT API](https://www.elastic.co/guide/en/elasticsearch/reference/8.19/point-in-time-api.html)

排序必须能确定稳定顺序。本文按 published_at 降序，再显式按 `_shard_doc` 升序，后者在同一 PIT 内提供区分相同时间文档的依据。下一页必须完整回传最后一条命中的 sort 数组，包括值的类型，不能只记录文章时间。[Elasticsearch 分页文档](https://www.elastic.co/guide/en/elasticsearch/reference/8.19/paginate-search-results.html)

## 底层原理

请求先通过身份校验，服务端固定租户过滤条件和排序规则，然后创建 PIT。第一页没有 search_after；响应中的最后一个 sort 数组成为下一页边界。继续请求时复用相同查询、相同排序和有效 PIT，服务端从排序边界之后返回结果。

PIT 的标识在后续响应中可能更新，调用方应保存最新返回值，不能始终使用第一次打开时得到的 ID。keep_alive 只需要覆盖下一次请求之间的间隔，持续翻页时可以续期；它不要求一开始就设置成整个导出任务的总耗时。

游标应绑定用户、租户、查询指纹、排序规则和有效期。编码成 Base64 不等于防篡改。可以把这些信息存放在服务端会话中，只向前端返回随机会话号；如果使用签名游标，也仍要重新检查当前用户的权限。权限撤销后继续使用旧授权范围是不正确的。

## 代码案例

以下 REST 请求可在隔离的 Elasticsearch 8.19 测试集群中执行。mapping 只包含分页所需字段；认证与 HTTPS 按已有集群配置启用，不能为了复制示例去关闭生产认证。

~~~json
PUT /article-page-demo
{
  "mappings": {
    "properties": {
      "tenant_id": { "type": "keyword" },
      "title": { "type": "text" },
      "published_at": { "type": "date" }
    }
  }
}
~~~

写入几条时间相同的合成文档后，先刷新测试索引，再打开 PIT，便于观察末尾排序字段的作用：

~~~http
POST /article-page-demo/_refresh
POST /article-page-demo/_pit?keep_alive=1m
~~~

把打开操作返回的 ID 放入下方请求。使用 PIT 时，搜索路径不再带索引名。

~~~json
POST /_search
{
  "size": 20,
  "track_total_hits": false,
  "pit": { "id": "REPLACE_WITH_PIT_ID", "keep_alive": "1m" },
  "query": { "term": { "tenant_id": "tenant-demo" } },
  "sort": [
    { "published_at": "desc" },
    { "_shard_doc": "asc" }
  ]
}
~~~

Java 层用 JDK 17 HttpClient 和 Spring Boot 已管理的 Jackson 依赖组织同样的请求，避免在字符串里拼接用户字段。下面是分页基础方法；base 指向已配置好的集群地址，http 应由项目创建并设置连接超时。认证头在现有客户端封装中统一增加。

~~~java
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

public record PitPageClient(HttpClient http, ObjectMapper json, URI base) {
    public record Page(JsonNode hits, String pitId, JsonNode after) {}

    public Page next(String pitId, JsonNode after, String authorizedTenant)
            throws IOException, InterruptedException {
        ObjectNode body = json.createObjectNode();
        body.put("size", 20).put("track_total_hits", false);
        body.putObject("pit").put("id", pitId).put("keep_alive", "1m");
        body.putObject("query").putObject("term")
            .put("tenant_id", authorizedTenant);
        var sort = body.putArray("sort");
        sort.addObject().put("published_at", "desc");
        sort.addObject().put("_shard_doc", "asc");
        if (after != null) {
            body.set("search_after", after);
        }
        var request = HttpRequest.newBuilder(base.resolve("/_search"))
            .timeout(Duration.ofSeconds(10))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body.toString())).build();
        var response = http.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new IOException("搜索失败，状态码=" + response.statusCode());
        }
        JsonNode result = json.readTree(response.body());
        if (result.path("timed_out").asBoolean() ||
            result.path("_shards").path("failed").asInt() > 0) {
            throw new IOException("查询不完整，不推进游标");
        }
        JsonNode hits = result.path("hits").path("hits");
        JsonNode next = hits.isEmpty() ? null : hits.get(hits.size() - 1).path("sort");
        return new Page(hits, result.path("pit_id").asText(pitId), next);
    }
}
~~~

第一次调用传入打开 PIT 得到的 ID，after 为 null；之后用 Page 的 pitId 和 after 继续。authorizedTenant 必须来自认证与授权结果。返回零条时停止，正常结束、取消和异常清理时，都应尝试关闭最新 PIT：

~~~json
DELETE /_pit
{ "id": "LATEST_PIT_ID" }
~~~

若使用服务端游标会话，SQL 模型可以如下。这里只登记会话元数据，不拿 SQL 模拟 Elasticsearch 的内部快照；超时和过期清理需另行实现。

~~~sql
CREATE TABLE search_session (
  id CHAR(36) PRIMARY KEY,
  owner_id BIGINT NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  query_hash CHAR(64) NOT NULL,
  pit_id TEXT NOT NULL,
  after_values JSON NULL,
  expires_at DATETIME NOT NULL,
  INDEX idx_expiry (expires_at)
);
~~~

## 稳定翻页的工程边界

文档检索页面可以保留浅分页，连续浏览大量结果时使用游标接口，批量导出则使用有并发限制的后台任务。三种交互对总数、排序和耗时的要求不同。关闭 track_total_hits 表示此流程不请求精确总数，前端不能据此伪造“共几百页”。

PIT 过期后，服务端应返回明确的会话过期状态，让用户重新开始查询。不能悄悄打开新 PIT 再接着使用旧 sort 值，因为视图发生变化，可能重复或漏掉文档。请求超时、分片失败时也不要推进游标；重试应从最后一个已确认交付的边界开始。

可用相同发布时间、翻页期间新增文档、短 keep_alive 过期和用户权限变更等场景核对行为，并记录每页耗时、活跃会话数和过期次数；性能结论需基于目标环境的实际测量。

## 常见问题
### 把 max_result_window 调大就解决深分页了吗？

它只是放宽限制，没有消除各分片收集、排序与协调节点合并大量候选结果的成本。

### search_after 为什么还要配 PIT？

search_after 只提供排序边界；PIT 才能让多次请求围绕同一索引视图查询。是否需要快照一致性，取决于业务对翻页期间变更的容忍度。

### 用户必须跳到第 500 页怎么办？

先确认交互必要性，可以缩小查询范围、提供检索条件或异步导出。不能把顺序游标接口包装成低成本的任意页码查询。

## 设计取舍与结论

分页策略取决于是否需要任意跳页。`search_after` 适合按稳定排序连续翻页，PIT 为一段分页过程提供一致视图；游标过期、权限变化和资源释放都应纳入接口约定。
