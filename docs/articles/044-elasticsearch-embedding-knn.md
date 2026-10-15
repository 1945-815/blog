---
title: "Embedding 接入 Elasticsearch：dense_vector、KNN 与维度核对"
date: "2027-01-19"
categories: ["AI 应用"]
tags: [
  "Elasticsearch",
  "Embedding",
  "向量检索",
  "RAG"
]
description: "把课程 RAG 示例中的向量长度、索引映射和 KNN 查询联系起来。"
plan_date: "2026-12-10"
phase: "AI 应用探索"
---

# Embedding 接入 Elasticsearch：dense_vector、KNN 与维度核对

### 文章定位

我的 RAG 学习资料记录了用阿里云千问 Embedding 生成 768 维向量，并将向量写入 Elasticsearch 8.x，通过余弦相似度取 topK。本文整理模型输出、索引字段和检索向量之间必须满足的约束；这里的配置属于课程 Demo，维度应以实际模型响应和部署版本为准。

### 学习目标

- 解释 Embedding 输出向量如何进入 Elasticsearch。
- 保证索引映射维度与写入、查询向量一致。
- 理解近似 KNN 的结果数量、候选集和过滤条件。

## 一、为什么学习这个技术

关键词检索依赖词面匹配，用户的表达和文档里的词可能不同。Embedding 把文本转换为向量后，可以按向量相似度检索候选文档，再把候选内容交给后续生成环节。

这条链路中最容易忽略的是向量模型和索引映射之间的契约。模型改变、维度改变或向量语义空间不一致，都会使已有数据与新查询失去可比性。

## 二、技术原理

Embedding 是固定长度的数值数组。Elasticsearch 的 dense_vector 字段需要指定向量维度；KNN 查询使用的 query_vector 元素个数必须与映射维度一致。课程资料记录的 768 维是当时配置，不应被推广成所有 Qwen 模型或所有部署版本的固定事实。

索引开启近似向量检索后，Elasticsearch 使用向量索引结构加速近邻搜索。近似搜索用速度换取一定的候选准确度；k 决定返回数量，num_candidates 控制每个分片参与候选合并的规模，需结合数据量和查询效果调节。

## 三、核心代码实现

先建立显式的向量维度校验。该 Java 类可独立保存为 EmbeddingDimensionGuard.java 并用 JDK 17 运行；它演示写入 Elasticsearch 前的基本不变量：

~~~java
public class EmbeddingDimensionGuard {
    public static void requireDimension(float[] vector, int expected) {
        if (vector == null) {
            throw new IllegalArgumentException("embedding 不能为空");
        }
        if (vector.length != expected) {
            throw new IllegalArgumentException(
                    "向量维度不匹配：期望 " + expected + "，实际 " + vector.length);
        }
    }

    public static void main(String[] args) {
        // 测试时用小向量演示；实际向量应来自当前 Embedding 模型响应。
        float[] demo = {0.12f, -0.08f, 0.31f};
        requireDimension(demo, 3);
        System.out.println("维度检查通过：" + demo.length);
    }
}
~~~

课程 Demo 的索引映射示意：

~~~json
PUT travel_strategy
{
  "mappings": {
    "properties": {
      "title": { "type": "text" },
      "content": { "type": "text" },
      "embedding": {
        "type": "dense_vector",
        "dims": 768,
        "index": true,
        "similarity": "cosine"
      }
    }
  }
}
~~~

查询时使用同一模型和同一维度生成 query_vector。下列数组是省略号表示的请求结构，不是可直接执行的完整向量：

~~~json
POST travel_strategy/_search
{
  "knn": {
    "field": "embedding",
    "query_vector": [0.12, -0.08, 0.31],
    "k": 5,
    "num_candidates": 100
  },
  "_source": ["title", "content"]
}
~~~

将该请求用于 768 维映射时，query_vector 也必须有 768 个元素。把上面三元素示意数组直接提交给该索引会因为维度不匹配失败。课程配置中的千问模型调用使用服务端返回的真实向量；写入前和检索前都应记录并校验维度。

## 四、实际应用

课程 RAG 示例的链路是：文档文本经 Embedding 服务转换，向量连同业务字段存入 Elasticsearch；用户问题也用同一 Embedding 模型转换，再执行 KNN 并取少量候选内容。topK=5 是该练习的初始设置，不是所有检索任务的最佳值。

切换 Embedding 模型时，需要考虑重建或迁移索引并重新生成已有文档向量。仅把查询侧模型改掉、却保留旧向量，可能让相似度结果失去意义。生产环境还需要权限过滤、文档版本、删除同步、超时和调用费用管理。

## 五、问题记录

- **mapping 与实际向量长度不同：**写入或查询失败；在两个边界都做显式校验。
- **生成模型和查询模型不一致：**两组向量可能不在同一语义空间，即使维度相同也不能说明兼容。
- **拿固定维数当模型承诺：**不同模型、版本或配置可以产生不同长度；以部署结果和模型文档为准。
- **只调大 k：**候选噪声会变多；需要结合过滤、分块、召回和后续重排评估。
- **把近似搜索当精确最近邻：**索引与候选参数会影响召回，必须用代表性数据验证。

## 六、改进方向

将模型名称、模型版本、维度和相似度配置作为索引版本的一部分记录；对文档向量和查询向量使用统一封装与校验。评估时检查召回样例、相似度分布和过滤后的结果，再调整 k、num_candidates 和 chunk 策略。

## 七、个人思考

向量检索不是“把一串数字放进 Elasticsearch”就结束。Embedding 模型定义了向量空间，索引映射承载维度与相似度约束，查询必须沿用相同约定。把这些契约写清楚，排查维度报错和召回异常会更有方向。

## 延伸：面试问答

### dense_vector 的 dims 表示什么？

它表示该向量字段中每个向量包含的元素数量，查询向量也必须符合该维度。

### 768 维是不是所有 Embedding 模型都固定如此？

不是。维度取决于实际模型和配置，应读取真实响应并与索引映射核对。

### KNN 中 k 和 num_candidates 分别起什么作用？

k 表示目标返回近邻数量；num_candidates 控制近似检索中候选规模，会影响性能与召回表现。

## 参考资料

- [Elasticsearch 8.19：kNN Search](https://www.elastic.co/guide/en/elasticsearch/reference/8.19/knn-search.html)
- [Elasticsearch：dense_vector Field Type](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/dense-vector)
- [Elasticsearch 8.19：kNN Query](https://www.elastic.co/guide/en/elasticsearch/reference/8.19/query-dsl-knn-query.html)
