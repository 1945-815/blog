---
title: "Java Lambda、函数式接口与方法引用：以目录项筛选为例"
date: "2026-10-16"
categories: ["Java 基础"]
tags: ["Java", "Lambda", "函数式接口", "Stream"]
description: "从匿名内部类到 Lambda 和方法引用，解释 JDK 8 函数式接口与 Stream 的连接方式。"
plan_date: "2026-10-16"
phase: "Java 与并发"
---

# Java Lambda、函数式接口与方法引用：以目录项筛选为例

下面通过目录项标题和浏览次数说明如何将筛选条件作为行为传入，并给出可直接运行的 JDK 8 示例。

## 从重复的筛选循环开始

如果“标题包含并发”和“浏览次数不少于 8”各写一遍循环，循环本身完全相同，变化的是判断条件。可以把条件作为 `Predicate<CatalogEntry>` 传入。`Predicate<T>` 是 JDK 提供的函数式接口，核心抽象方法 `test(T)` 返回布尔值。

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.function.Predicate;
import java.util.stream.Collectors;

public class CatalogEntryFilterDemo {
    static final class CatalogEntry {
        private final String title;
        private final int viewCount;

        CatalogEntry(String title, int viewCount) {
            this.title = title;
            this.viewCount = viewCount;
        }

        String getTitle() { return title; }
        int getViewCount() { return viewCount; }
    }

    static List<CatalogEntry> filter(List<CatalogEntry> source,
                                     Predicate<CatalogEntry> condition) {
        List<CatalogEntry> result = new ArrayList<>();
        for (CatalogEntry entry : source) {
            if (condition.test(entry)) {
                result.add(entry);
            }
        }
        return result;
    }

    public static void main(String[] args) {
        List<CatalogEntry> entries = Arrays.asList(
            new CatalogEntry("Java 并发基础", 12),
            new CatalogEntry("数据库索引", 8),
            new CatalogEntry("消息确认机制", 5)
        );

        // 变化的条件可以直接写在调用处。
        List<CatalogEntry> concurrency = filter(entries,
            entry -> entry.getTitle().contains("并发"));
        List<CatalogEntry> popular = filter(entries,
            entry -> entry.getViewCount() >= 8);

        // CatalogEntry::getTitle 是方法引用，与 entry -> entry.getTitle() 对应。
        List<String> titles = concurrency.stream()
            .map(CatalogEntry::getTitle)
            .collect(Collectors.toList());
        System.out.println(titles); // [Java 并发基础]
        System.out.println(popular.size()); // 2
    }
}
```

用 `javac CatalogEntryFilterDemo.java && java CatalogEntryFilterDemo` 运行，要求 JDK 8 或更新版本。示例中的浏览次数使用 `int`；若字段可能超出整数范围，应选择更合适的数值类型。

## Lambda 为什么能传给接口参数

Lambda 需要一个明确的目标类型。函数式接口恰好只有一个抽象方法，因此编译器知道 Lambda 的参数和返回值对应哪一个方法。`@FunctionalInterface` 可以让编译器检查这一约束，但没有注解、仍满足条件的接口也可以接收 Lambda。接口的 `default` 或 `static` 方法不计入这一个抽象方法。

将匿名内部类改写为 Lambda 有助于看清楚“传入的是一个实现判断行为的对象”，而不是把 Lambda 当成独立执行的脚本。写成 `entry -> entry.getViewCount() >= 8` 后，也可以进一步把已有方法作为方法引用，但只有当目标函数式接口的参数和返回类型匹配时才成立。

## 与 Stream 的边界

Lambda 是表达行为的一种语法，Stream 是组织集合处理步骤的 API，两者经常一起用，但不是同一概念。上例 `filter` 是普通循环加 Lambda；`concurrency.stream().map(CatalogEntry::getTitle)` 则使用了 Stream。Stream 的惰性执行、分组统计和并行注意事项见 [Stream API 与副作用](/articles/stream-api-side-effects)。

## 容易误解的地方

- “只有接口才能写 Lambda”需要更准确地说成：Lambda 表达式必须有函数式接口作为目标类型。
- 方法引用不负责自动选择“名字相近的方法”；编译器按目标方法签名匹配。
- 使用 Lambda 不会自动提高性能。筛选是否保留为循环、是否改用 Stream，先看可读性和实际数据量。
- 本文的 `Collectors.toList()` 可用于 JDK 8；`Stream.toList()` 从 Java 16 才可用。


参考：[Java 8 Predicate](https://docs.oracle.com/javase/8/docs/api/java/util/function/Predicate.html)、[Java 8 Lambda 表达式教程](https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html)。
