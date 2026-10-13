---
title: "Java 集合的选择：List、Set、Map 分别解决什么问题"
date: "2026-10-13"
categories: ["Java 基础"]
tags: [
  "Java",
  "集合",
  "数据结构"
]
description: "从顺序、去重与键值查找需求出发，选择 Java 集合并理解常见边界。"
plan_date: "2026-10-02"
---

# Java 集合的选择：List、Set、Map 分别解决什么问题

## 文章定位

这篇文章对应路线图中的“Java 基础”阶段，目标是把概念、实现和验证过程连接起来。内容以个人学习与简历可支撑的实践为边界；没有经过本人环境验证的操作应在发布前补做。

## 学习目标

- 能解释本文核心机制以及它解决的问题。
- 能搭建最小示例，并说明输入、输出和失败路径。
- 能区分通用 Demo、个人练习与实习协作内容。

## 背景与问题

业务代码经常把查询结果转成集合、按标识去重或建立快速索引。先确定访问方式和数据约束，比从熟悉的实现类开始更稳妥。

## 核心概念与设计

List 表达有序序列并允许重复；Set 表达唯一性约束；Map 表达键到值的映射。接口描述使用语义，具体实现再决定顺序、并发和性能特征。HashMap 依靠哈希定位桶，冲突时还需要在桶内继续比较。

## 实现与运行机制

列表展示通常使用 ArrayList；需要按插入顺序去重可先理解 LinkedHashSet；按 id 查询可构建 Map。对象判等要同时检查 equals 与 hashCode。对外返回时说明顺序是否稳定，不能把 HashMap 的遍历顺序当作接口契约。

HashMap 先根据键的 hashCode 计算散列位置，再在桶中通过哈希与 equals 找到键。具体容量调整和冲突处理属于实现细节，依赖 JDK 版本；查阅所用版本源码比死记某一版本阈值更可靠。ArrayList 则以可扩展数组存储，按下标访问直接，插入中间位置需要搬移元素。

## 源码与机制观察

**源码观察：**在所用 JDK 的 ArrayList 实现中查看底层数组扩容和元素搬移；在 HashMap 中追踪 hash 扰动、桶索引和冲突比较。实现细节会随 JDK 版本变化，结论应标出本地验证的版本。

```java
Map<Long, Document> byId = documents.stream()
    .collect(Collectors.toMap(Document::getId, Function.identity()));
// 若 id 可能重复，应显式定义合并策略，而不是依赖默认行为。
```
## 实践边界与常见问题

可变对象作为 Map 键时，修改参与 hashCode 的字段会导致后续查找失效；自定义对象若只覆写 equals 而遗漏 hashCode，会破坏散列集合约定。遍历期间直接结构性修改集合可能触发并发修改异常。多线程场景要明确同步策略。

## 高频面试问题

### List、Set、Map 如何选？

看业务语义：保留顺序和重复用 List，唯一元素用 Set，按键查值用 Map；再根据并发和顺序要求选择实现。

### HashMap 是否保证遍历顺序？

不应依赖其遍历顺序作为业务保证；需要稳定顺序时选有序实现或显式排序。

### 为什么 equals 和 hashCode 要一起实现？

散列容器先用哈希缩小查找范围，再用 equals 判断相等；相等对象必须有相同哈希值。

## 项目追问

**追问：**如果把这项技术放进简历所述的文档管理、预约或审批场景，如何说明自己的工作？

**回答思路：**先限定本人实际负责范围，再讲接口边界、数据流、异常路径和验证方法。若内容来自独立 Demo，应直接说明是个人练习，不借用公司项目表述。

## 总结

先用集合表达业务约束，再选实现。面试和代码评审时，能够说清顺序、重复、判等与并发边界，比只背复杂度更有用。

## 参考资料

- [Java Collections Framework](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/package-summary.html)
- [HashMap API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html)
