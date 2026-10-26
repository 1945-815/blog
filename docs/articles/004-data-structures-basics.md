---
title: "数据结构入门：数组、链表、栈、队列与复杂度"
date: "2026-10-27"
categories: ["Java 基础"]
tags: [
  "Java",
  "数据结构",
  "集合"
]
description: "用小型 Java 示例比较数组、链表、栈和队列的访问方式与复杂度边界。"
plan_date: "2023-11-28"
phase: "Java 与并发"
---

# 数据结构入门：数组、链表、栈、队列与复杂度

## 问题背景

相同的数据可以用不同结构保存，但不同操作的成本不同。按下标读取、在头部插入、先进先出处理任务，分别更适合不同结构。先从操作需求出发，再决定怎么保存，比只背名称和定义更实用。

学习复杂度也不是为了给每段代码贴一个数字，而是帮助预测数据量增长后，哪种操作可能成为瓶颈。

## 核心原理

数组把元素按连续下标组织，按下标访问是 O(1)，但固定长度数组创建后不能直接扩容。在数组中间插入或删除通常要搬移后续元素，因此是 O(n)。

链表由节点和链接组成。找到指定位置通常要从头遍历，耗时 O(n)；若已经持有目标节点的前驱引用，在其后插入新节点可以只调整链接，耗时 O(1)。若寻找位置的成本也算进去，整体仍可能是 O(n)。

栈遵循后进先出，队列遵循先进先出。它们是访问规则；实现可以选择数组或链表。哈希表根据键的哈希值定位候选位置，常见实现的查找平均期望为 O(1)，但不能把它理解成任何数据分布和实现下都保证恒定耗时。

## 实现示例

保存为 DataStructuresDemo.java 后可用 JDK 编译运行。这里用数组、手写单向链表、ArrayDeque 和 HashMap 展示不同访问方式。

~~~java
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Map;

public class DataStructuresDemo {
    static class Node {
        final int value;
        Node next;

        Node(int value) {
            this.value = value;
        }
    }

    public static void main(String[] args) {
        int[] scores = {88, 92, 79};
        System.out.println("数组第二个成绩：" + scores[1]);

        Node head = new Node(88);
        head.next = new Node(92);
        head.next.next = new Node(79);
        for (Node current = head; current != null; current = current.next) {
            System.out.print(current.value + " ");
        }
        System.out.println();

        Deque<String> stack = new ArrayDeque<>();
        stack.push("页面 A");
        stack.push("页面 B");
        System.out.println("栈顶：" + stack.pop());

        Deque<String> queue = new ArrayDeque<>();
        queue.addLast("任务 A");
        queue.addLast("任务 B");
        System.out.println("先处理：" + queue.removeFirst());

        Map<String, Integer> scoreByName = new HashMap<>();
        scoreByName.put("小林", 92);
        System.out.println("小林成绩：" + scoreByName.get("小林"));
    }
}
~~~

输出依次展示数组按下标读取、链表从头遍历、栈先取出后压入的元素、队列先取出先放入的元素，以及按键查询 Map。链表遍历循环从头指针逐节点前进，不能像数组一样直接跳到任意位置。

| 结构或操作 | 常见复杂度 | 需要说明的前提 |
| --- | --- | --- |
| 数组按下标读取 | O(1) | 下标有效 |
| 数组中间插入或删除 | O(n) | 后续元素需要搬移 |
| 链表按位置查找 | O(n) | 从头部逐个访问 |
| 已知前驱节点后插入链表节点 | O(1) | 不含寻找前驱节点的成本 |
| ArrayDeque 两端操作 | 均摊 O(1) | 动态数组扩容会带来个别较贵操作 |
| HashMap 按键查询 | 平均期望 O(1) | 受哈希分布、实现和负载影响 |

## 应用场景与边界

队列适合按顺序处理待办任务，栈可表示最近操作的撤销顺序，Map 则适合按稳定标识查找对象。选择结构时要先明确访问方式和一致性要求，再比较实现复杂度与数据规模。

选择结构前先写出主要操作：需要按位置频繁读取吗？是否要求去重？需要保持插入顺序吗？数据是否在两端增删？回答这些问题后，再比较实现类的复杂度和约束。

## 边界与常见问题

只看“插入是 O(1)”容易忽略链表需要先找到位置。复杂度应该说清操作从哪里开始、是否已经拿到节点引用。

另一个误区是把所有 List 实现都当成数组。ArrayList 适合按下标访问；LinkedList 通过节点连接元素，随机按下标访问需要逐个走过前面的节点。

## 改进思路

- 先列主要操作，再选数据结构。
- 复杂度描述同时交代均摊、平均或最坏等前提。
- 在 Java 业务代码里优先使用成熟集合；手写结构用于理解原理或满足明确需求。
- 真正的性能判断结合数据规模、访问模式和测量结果，不凭结构名称猜测。

## 设计取舍与结论

数据结构让我开始用“数据如何组织、操作从哪里开始、需要移动多少元素”来理解代码。复杂度是比较方案的语言，场景和前提才决定结论是否成立。

## 常见问题

### 数组和链表的主要差异是什么？

数组支持快速下标访问，但中间修改通常要搬移元素；链表访问指定位置需要遍历，但已知位置后调整链接可以较快。

### 栈和队列分别适合什么访问顺序？

栈是后进先出，队列是先进先出。它们描述访问规则，不限定底层实现。

### 为什么 HashMap 的查找不能简单说成永远 O(1)？

常见情况下查找接近常数时间，但结果受哈希分布、冲突和具体实现影响，复杂度结论应说明前提。

## 补充：数组复制与冒泡排序

数组长度创建后固定；有效下标是 `0` 到 `length - 1`，越界访问会抛出 `ArrayIndexOutOfBoundsException`。`Arrays.copyOf` 生成新数组；直接把数组变量赋给另一个变量只会共享同一个数组对象。下面的独立示例可在 JDK 8+ 编译运行，保存为 `ArrayCopySortDemo.java`：

~~~java
import java.util.Arrays;

public class ArrayCopySortDemo {
    public static void main(String[] args) {
        int[] source = {5, 2, 4, 1};
        int[] copy = Arrays.copyOf(source, source.length);
        for (int end = copy.length - 1; end > 0; end--) {
            boolean swapped = false;
            for (int i = 0; i < end; i++) {
                if (copy[i] > copy[i + 1]) {
                    int temp = copy[i];
                    copy[i] = copy[i + 1];
                    copy[i + 1] = temp;
                    swapped = true;
                }
            }
            if (!swapped) break;
        }
        System.out.println(Arrays.toString(source)); // [5, 2, 4, 1]
        System.out.println(Arrays.toString(copy));   // [1, 2, 4, 5]
    }
}
~~~

冒泡排序用相邻比较理解元素交换；一般场景可直接用 `Arrays.sort`。上例内层比较次数随数组长度平方增长，提前结束只改善已经有序等输入，不能改变最坏情况下的 O(n²)。

## 参考资料

- [Java Collections Framework](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/package-summary.html)
- [ArrayDeque API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayDeque.html)
- [HashMap API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html)
