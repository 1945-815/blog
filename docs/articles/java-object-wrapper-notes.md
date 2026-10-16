---
title: "Object 与包装类：判等、装箱和类型转换"
date: "2026-10-16"
categories: ["Java 基础"]
tags: ["Java", "Object", "包装类"]
description: "依据面向对象与常用类课堂笔记，区分引用判等、equals/hashCode、自动装箱及字符串转换。"
plan_date: "2026-10-16"
phase: "Java 基础与数据结构"
---

# Object 与包装类：判等、装箱和类型转换

本篇依据 2026 年 3 月 10–11 日的本地课堂笔记整理，属于学习示例。`Object` 是 Java 类层次结构的根；`Integer` 等包装类把基本类型值放进对象语境，便于与泛型、集合等 API 配合。

## `==`、`equals` 与 `hashCode`

`==` 比较两个引用是否指向同一对象；`equals` 可由类定义“内容相等”的规则。若两个对象 `equals` 为真，它们的 `hashCode` 必须相同，才能在 `HashSet`、`HashMap` 等散列容器中正常查找。相同哈希值却不要求对象一定相等。`toString` 用于提供可读表示，写日志时也需避免泄露敏感字段。

~~~java
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

public class ObjectWrapperDemo {
    static final class StudentKey {
        private final long id;

        StudentKey(long id) { this.id = id; }

        @Override public boolean equals(Object other) {
            if (this == other) return true;
            if (!(other instanceof StudentKey)) return false;
            return id == ((StudentKey) other).id;
        }

        @Override public int hashCode() { return Objects.hash(id); }

        @Override public String toString() { return "StudentKey{id=" + id + "}"; }
    }

    public static void main(String[] args) {
        Set<StudentKey> keys = new HashSet<>();
        keys.add(new StudentKey(42));
        System.out.println(keys.contains(new StudentKey(42))); // true

        int value = Integer.parseInt("42");
        Integer boxed = value;             // 自动装箱
        int unboxed = boxed;               // 自动拆箱
        System.out.println(String.valueOf(unboxed));
    }
}
~~~

保存为 `ObjectWrapperDemo.java`，用 JDK 8+ 执行 `javac ObjectWrapperDemo.java` 和 `java ObjectWrapperDemo`。例子把 ID 定义为不可变值，避免把会变化的字段作为散列键。

## 包装类的三个边界

1. `Integer.parseInt("42")` 得到 `int`；`Integer.valueOf("42")` 得到 `Integer`；`String.valueOf(42)` 得到字符串。输入无法解析时会抛 `NumberFormatException`，调用方应按输入边界处理。
2. 包装类可以表示 `null`，基本类型不能。对 `null` 拆箱会抛 `NullPointerException`，不能把它理解成自动变成零。
3. 不要依赖包装类对象的 `==` 判断数值相等；某些值可能复用缓存对象，但缓存行为不能替代内容判等。数值比较可先拆箱或用 `equals`，同时处理空值。

在集合中，`List<Integer>` 可以保存包装类型，但不能写 `List<int>`。需要大量数值计算时，装箱会引入对象和空值语义，应先明确数据范围与接口要求。

## 资料与延伸

- 本地资料：`day07 完全面向对象 -- 接口.md`、`day08 核心类库 -- 常用类.md`；笔记中 `==`/`equals`、重写 `hashCode`、基本类型与包装类转换均有对应章节。
- 需要选择实际集合实现时，接着看 [Java 集合的选择](./java-collections.md)。
- [Object API](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Object.html)
- [Integer API](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Integer.html)
