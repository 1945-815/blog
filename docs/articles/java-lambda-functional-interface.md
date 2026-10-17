---
title: "从商品筛选理解 Lambda、函数式接口与方法引用"
date: "2026-10-16"
categories: ["Java 基础"]
tags: ["Java", "Lambda", "函数式接口", "Stream"]
description: "把匿名内部类改写为 Lambda，再用方法引用连接 Stream；示例以 JDK 8 课堂商品筛选为依据。"
plan_date: "2026-10-16"
phase: "Java 基础与数据结构"
---

# 从商品筛选理解 Lambda、函数式接口与方法引用

这里保留这个课堂练习的输入与目标，代码重新整理为一个可运行的 JDK 8 示例；它不是企业商品系统的实现。

## 从重复的筛选循环开始

如果“名称包含手机”和“价格不低于 8000”各写一遍循环，循环本身完全相同，变化的是判断条件。可以把条件作为 `Predicate<Product>` 传入。`Predicate<T>` 是 JDK 提供的函数式接口，核心抽象方法 `test(T)` 返回布尔值。

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.function.Predicate;
import java.util.stream.Collectors;

public class ProductFilterDemo {
    static final class Product {
        private final String name;
        private final int price;
        private final String brand;

        Product(String name, int price, String brand) {
            this.name = name;
            this.price = price;
            this.brand = brand;
        }

        String getName() { return name; }
        int getPrice() { return price; }
        String getBrand() { return brand; }
    }

    static List<Product> filter(List<Product> source, Predicate<Product> condition) {
        List<Product> result = new ArrayList<>();
        for (Product product : source) {
            if (condition.test(product)) {
                result.add(product);
            }
        }
        return result;
    }

    public static void main(String[] args) {
        List<Product> products = Arrays.asList(
            new Product("苹果手机", 12000, "苹果"),
            new Product("苹果电脑", 10000, "苹果"),
            new Product("华为手机", 5000, "华为")
        );

        // 变化的条件可以直接写在调用处。
        List<Product> phones = filter(products, product -> product.getName().contains("手机"));
        List<Product> expensive = filter(products, product -> product.getPrice() >= 8000);

        // Product::getName 是方法引用，与 product -> product.getName() 对应。
        List<String> phoneNames = phones.stream()
            .map(Product::getName)
            .collect(Collectors.toList());
        System.out.println(phoneNames); // [苹果手机, 华为手机]
        System.out.println(expensive.size()); // 2
    }
}
```

用 `javac ProductFilterDemo.java && java ProductFilterDemo` 运行，要求 JDK 8 或更新版本。这里用 `int` 表达课堂练习中的整数价格；涉及实际金额计算时应按币种与精度要求选择 `BigDecimal`，不能直接套用这个字段类型。

## Lambda 为什么能传给接口参数

Lambda 需要一个明确的目标类型。函数式接口恰好只有一个抽象方法，因此编译器知道 Lambda 的参数和返回值对应哪一个方法。`@FunctionalInterface` 可以让编译器检查这一约束，但没有注解、仍满足条件的接口也可以接收 Lambda。接口的 `default` 或 `static` 方法不计入这一个抽象方法。

课堂上先写匿名内部类、再改成 Lambda 很有帮助，因为这能看清楚“传入的是一个实现判断行为的对象”，而不是把 Lambda 当成独立执行的脚本。写成 `product -> product.getPrice() >= 8000` 后，也可以进一步把已有方法作为方法引用，但只有当目标函数式接口的参数和返回类型匹配时才成立。

## 与 Stream 的边界

Lambda 是表达行为的一种语法，Stream 是组织集合处理步骤的 API，两者经常一起用，但不是同一概念。上例 `filter` 是普通循环加 Lambda；`phones.stream().map(Product::getName)` 则使用了 Stream。Stream 的惰性执行、分组统计和并行注意事项见 [Stream API 与副作用](/articles/stream-api-side-effects)。

## 容易误解的地方

- “只有接口才能写 Lambda”需要更准确地说成：Lambda 表达式必须有函数式接口作为目标类型。
- 方法引用不负责自动选择“名字相近的方法”；编译器按目标方法签名匹配。
- 使用 Lambda 不会自动提高性能。筛选是否保留为循环、是否改用 Stream，先看可读性和实际数据量。
- 本文的 `Collectors.toList()` 可用于 JDK 8；`Stream.toList()` 从 Java 16 才可用。


参考：[Java 8 Predicate](https://docs.oracle.com/javase/8/docs/api/java/util/function/Predicate.html)、[Java 8 Lambda 表达式教程](https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html)。
