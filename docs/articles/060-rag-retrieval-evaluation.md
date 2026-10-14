---
title: "RAG 检索评估：用黄金问题集定位召回与回答问题"
date: "2027-05-11"
categories: ["AI 应用"]
tags: ["RAG", "评估", "Elasticsearch", "检索质量"]
description: "为现有 RAG 链路建立固定评估集，用 Recall@K、MRR 和回答忠实度分开分析检索与生成。"
plan_date: "2026-10-28"
phase: "AI 应用探索"
---

# RAG 检索评估：用黄金问题集定位召回与回答问题

> **计划公开日期：**2027-05-11　·　**学习阶段参考日期：**2026-10-28　·　**阶段：**AI 应用探索。参考日期表示学习路线顺序，不代表历史发文。

## 一、为什么学习这个技术

已有 RAG 学习资料把旅游攻略问答链路跑通了：问题向量化、到 Elasticsearch 做 KNN 检索、把候选攻略交给大模型生成答案。链路能返回文本，只能证明组件连通，不能证明检索到的是正确攻略，也不能证明答案确实由检索内容支持。

如果只凭几个主观问题调 embedding 模型、topK 或提示词，很难判断某次改动是提升还是退步。为固定问题准备人工确认的相关文档和参考答案，再分开观察检索与生成，能把“没找到资料”和“找到资料但回答错”定位为不同故障。评估集的目标是辅助决策，不是制造一个看起来漂亮的总分。

## 二、核心概念

黄金问题集是一组版本化的评估样本，至少保存问题、预期相关文档 ID；若要评价回答，还可以保存参考答案或关键事实。样本应覆盖常见问法、同义表达、长尾主题、无答案问题和容易混淆的实体。相关文档由人确认，不应直接把当前检索结果当成标准答案。

标注粒度也会影响指标解释：如果系统返回的是文本块，标准答案应标注相关 chunk，或明确把 chunk 映射回文档 ID；只标文档而一次文档拆成多个块时，重复块可能让统计虚高。样本要保留来源和标注版本，问题集合变化后分别比较，避免把数据集更新误判为模型效果变化。

Recall@K 表示前 K 个结果中找回的相关文档占全部已标注相关文档的比例，适合观察是否漏召回。Precision@K 表示前 K 个结果里相关文档的占比，适合观察噪声。MRR 看第一个相关结果排在第几位，位置越靠前分数越高。它们评的是检索排名，不评价答案写得是否准确。

生成阶段可额外检查忠实度、回答相关性和答案完整性。RAGAS 等框架提供 context precision、context recall、faithfulness、answer relevancy 等指标；其中部分指标由另一个大模型裁判，成本更高且有判断波动。评估报告应同时保留原始问题、检索文档、回答、模型版本和人工复核结果，不能只存一个均分。

## 三、底层原理

离线评估按固定顺序运行：加载某一版本样本；使用指定 embedding 模型与索引版本执行检索；保存 topK 文档 ID 和分数；按人工标注计算检索指标；需要时再调用生成模型并评估回答。比较不同切分策略、向量模型或查询参数时，要固定其余变量，避免把多个变更的影响混在一起。

Recall@K 和 MRR 可以由 Java 确定性计算，不需要再次调用 LLM。忠实度指标通常先从回答中提取可核验主张，再判断每个主张能否从检索上下文推出。LLM 裁判本身也可能遗漏或误判，所以应抽样人工核对，并把裁判模型、提示词版本和运行时间一起记录。

## 四、代码案例

Java 中先实现稳定、可复算的检索指标。expectedDocIds 是人工标注的相关攻略 ID，retrievedDocIds 按本次检索得分从高到低排列：

~~~java
static double recallAtK(List<String> retrievedDocIds,
                        Set<String> expectedDocIds, int k) {
    if (expectedDocIds.isEmpty()) return 0.0;
    long hit = retrievedDocIds.stream().limit(k)
            .distinct().filter(expectedDocIds::contains).count();
    return (double) hit / expectedDocIds.size();
}

static double mrrAtK(List<String> retrievedDocIds,
                     Set<String> expectedDocIds, int k) {
    for (int i = 0; i < Math.min(k, retrievedDocIds.size()); i++) {
        if (expectedDocIds.contains(retrievedDocIds.get(i))) {
            return 1.0 / (i + 1);
        }
    }
    return 0.0;
}
~~~

配置中固定索引、模型和数据集版本，避免把不同实验结果直接比较：

~~~yaml
rag:
  evaluation:
    dataset-version: travel-golden-v1
    index-name: strategy-vector-v3
    embedding-model: qwen-text-embedding
    top-k: 5
    capture-retrieved-context: true
~~~

MySQL 可保存评估样本和运行结果，JSON 字段记录相关文档 ID：

~~~sql
CREATE TABLE rag_eval_case (
  id BIGINT PRIMARY KEY,
  dataset_version VARCHAR(64) NOT NULL,
  question TEXT NOT NULL,
  expected_doc_ids JSON NOT NULL,
  reference_answer TEXT NULL
);

SELECT id, question, expected_doc_ids, reference_answer
FROM rag_eval_case
WHERE dataset_version = ?
ORDER BY id;
~~~

实际调用示例：POST /internal/rag/evaluations/runs，JSON 请求体为 {"datasetVersion":"travel-golden-v1","topK":5}。后台逐条调用已有的检索服务，将结果与 expected_doc_ids 比较，最终返回平均 Recall@5、MRR@5 和未召回样本列表。这个接口应限制为开发或受控运维入口，不开放给匿名用户。

## 五、项目真实落地

在企业项目中，我们通常先从真实问题日志中抽取脱敏样本，再由业务人员确认相关资料和可接受答案。旅游攻略学习项目可以先用几十条人工样本验证流程，样本量不代表生产效果。上线前还需考虑文档更新、权限过滤、删除同步和不同用户可见范围，避免评估集泄露真实敏感内容。

一次完整复盘可以按症状分类：Recall@K 低，检查问题改写、分块、向量模型、过滤条件和索引更新；Recall 尚可但 MRR 低，检查排序或重排；检索质量稳定但忠实度低，检查提示词是否要求依据上下文回答、是否允许明确拒答，以及上下文长度；答案相关性低，检查问题理解和生成模型。先定位哪一段退化，再调整参数。

评估也要记录延迟、模型调用次数、token 用量和失败率。人工标注需要抽样复核，指标阈值由具体业务确定。不能把 LLM 裁判得分当成绝对事实，更不能根据小样本分数宣称系统准确率已达到某个生产水平。

实验记录最好包含代码版本、索引别名实际指向、Embedding 模型与维度、过滤条件、topK、重排配置、生成模型和提示词版本。每次只改变少数变量，并保留失败样本清单。比如同一个问题连续返回错误攻略，优先确认向量字段是否由当前模型生成，再检查查询过滤；不要先改生成提示词来掩盖召回错误。

## 六、常见面试问题

**初级：Recall@K 和 Precision@K 分别表示什么？** Recall 关注所有相关资料中找回了多少；Precision 关注返回的资料里有多少相关。两者衡量不同问题。

**中级：MRR 为什么看第一个相关结果？** 对用户通常先看到排名靠前的候选，MRR 用第一个相关结果的倒数排名反映首个有效结果的位置；它不说明后续结果是否完整。

**项目：如何判断回答质量下降是检索还是生成导致的？** 固定评估集并保存检索上下文，先比较 Recall、Precision、MRR，再对同一上下文比较生成结果和忠实度。实验记录索引、Embedding、提示词及模型版本，必要时人工复核。

## 七、个人总结

作为 2027 届 Java 后端实习生，我开始把 RAG 看成可以逐段观测和回归的应用链路。一个 Demo 返回了答案，只能说明主流程走通；固定问题集、检索指标、答案复核和版本记录，才能让我有证据说明一次改动解决了什么问题。

## 参考资料

- [Ragas 可用评估指标](https://docs.ragas.io/en/latest/concepts/metrics/available_metrics/)
- [RAGAS：自动评估检索增强生成的研究论文](https://arxiv.org/abs/2309.15217)
