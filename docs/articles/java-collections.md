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
plan_date: "2023-11-18"
phase: "Java 基础与数据结构"
---

# Java 集合的选择：List、Set、Map 分别解决什么问题

### 学习目标

- 能解释本文核心机制以及它解决的问题。
- 能搭建最小示例，并说明输入、输出和失败路径。
- 能区分通用 Demo、个人练习与实习协作内容。

## 一、为什么学习这个技术

业务代码经常把查询结果转成集合、按标识去重或建立快速索引。先确定访问方式和数据约束，比从熟悉的实现类开始更稳妥。

## 二、技术原理

List 表达有序序列并允许重复；Set 表达唯一性约束；Map 表达键到值的映射。接口描述使用语义，具体实现再决定顺序、并发和性能特征。HashMap 依靠哈希定位桶，冲突时还需要在桶内继续比较。

## 三、核心代码实现

列表展示通常使用 ArrayList；需要按插入顺序去重可先理解 LinkedHashSet；按 id 查询可构建 Map。对象判等要同时检查 equals 与 hashCode。对外返回时说明顺序是否稳定，不能把 HashMap 的遍历顺序当作接口契约。

HashMap 先根据键的 hashCode 计算散列位置，再在桶中通过哈希与 equals 找到键。具体容量调整和冲突处理属于实现细节，依赖 JDK 版本；查阅所用版本源码比死记某一版本阈值更可靠。ArrayList 则以可扩展数组存储，按下标访问直接，插入中间位置需要搬移元素。

### 源码与机制观察

**源码观察：**在所用 JDK 的 ArrayList 实现中查看底层数组扩容和元素搬移；在 HashMap 中追踪 hash 扰动、桶索引和冲突比较。实现细节会随 JDK 版本变化，结论应标出本地验证的版本。

```java
Map<Long, Document> byId = documents.stream()
    .collect(Collectors.toMap(Document::getId, Function.identity()));
// 若 id 可能重复，应显式定义合并策略，而不是依赖默认行为。
```

## 四、真实项目落地

个人练习可以把一组文档先放入 List 展示，再用 Set 检查重复 id、用 Map 建立按 id 查找的索引。该示例用于理解集合语义，不代表当时的企业开发经历。

## 五、遇到的问题

可变对象作为 Map 键时，修改参与 hashCode 的字段会导致后续查找失效；自定义对象若只覆写 equals 而遗漏 hashCode，会破坏散列集合约定。遍历期间直接结构性修改集合可能触发并发修改异常。多线程场景要明确同步策略。

## 六、优化方案

先确定顺序、唯一性和查找方式，再选实现类；自定义键补齐 equals 与 hashCode 的约定，多线程访问另行设计同步方式。

## 七、个人思考

先用集合表达业务约束，再选实现。面试和代码评审时，能够说清顺序、重复、判等与并发边界，比只背复杂度更有用。

## 延伸：面试问答

### List、Set、Map 如何选？

看业务语义：保留顺序和重复用 List，唯一元素用 Set，按键查值用 Map；再根据并发和顺序要求选择实现。

### HashMap 是否保证遍历顺序？

不应依赖其遍历顺序作为业务保证；需要稳定顺序时选有序实现或显式排序。

### 为什么 equals 和 hashCode 要一起实现？

散列容器先用哈希缩小查找范围，再用 equals 判断相等；相等对象必须有相同哈希值。

## 延伸：项目追问

**追问：**如果把这项技术放进简历所述的文档管理、预约或审批场景，如何说明自己的工作？

**回答思路：**先限定本人实际负责范围，再讲接口边界、数据流、异常路径和验证方法。若内容来自独立 Demo，应直接说明是个人练习，不借用公司项目表述。

## 补充：从数组升级到集合的可运行练习

下面的练习按“保存顺序—去重—按键查找”推进，保存为 `CollectionChoiceDemo.java`，JDK 8+ 可运行：

~~~java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class CollectionChoiceDemo {
    public static void main(String[] args) {
        List<String> plates = new ArrayList<>();
        plates.add("A123");
        plates.add("B456");
        plates.add("A123");
        System.out.println(plates.get(1));       // B456

        Set<String> distinct = new HashSet<>(plates);
        System.out.println(distinct.size());     // 2，不依赖遍历顺序

        Map<String, Integer> visits = new HashMap<>();
        for (String plate : plates) {
            visits.merge(plate, 1, Integer::sum);
        }
        System.out.println(visits.get("A123")); // 2

        LinkedList<String> waiting = new LinkedList<>(plates);
        System.out.println(waiting.removeFirst());
    }
}
~~~

数组读长度用 `length`，字符串长度用 `length()`，集合元素数用 `size()`。`ArrayList` 按下标访问直接，但中间插入可能搬移元素；`LinkedList` 在已知节点处增删可改链接，但按下标找位置仍需遍历。不要把“LinkedList 增删一定快”当成无条件结论。`HashSet` 的唯一性依赖 `equals`/`hashCode`，`HashMap` 的键也一样；需要输出稳定顺序时选有序实现或排序。泛型的类型擦除细节另见 [泛型文章](./071-java-generics-type-erasure.md)。

## 参考资料

- [Java Collections Framework](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/package-summary.html)
- [HashMap API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html)
