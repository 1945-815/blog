---
title: "第一次理解 Java 类和对象：字段、方法与封装"
date: "2026-10-20"
categories: ["Java 基础"]
tags: [
  "Java",
  "Java 后端",
  "后端基础"
]
description: "从一个可运行的 Book 示例理解类、对象、字段、方法和封装边界。"
plan_date: "2023-10-30"
phase: "Java 基础与数据结构"
---

# 第一次理解 Java 类和对象：字段、方法与封装

### 文章定位

这篇文章回到 Java 入门时的一个关键变化：从“写几条语句”转向“用对象表达一类事物”。示例是独立练习，不对应真实公司的产品或业务。

### 学习目标

- 说清类是描述，对象是按描述创建出来的具体实例。
- 能区分字段、构造方法和实例方法。
- 理解为什么字段通常不直接开放给调用方修改。

## 一、为什么学习这个技术

刚开始写程序时，变量和方法足以完成小练习；当数据和操作逐渐变多，若每段代码都能随意改动所有数据，就很难判断对象当前是否仍然有效。

例如一本书可以有标题和价格。创建对象时应当有标题，价格不能为负数；之后修改价格也需要经过规则检查。把数据和负责维护数据的方法放进同一个类，能让规则有明确归属。

## 二、技术原理

类描述对象有哪些状态和行为。字段保存每个对象自己的状态，构造方法在创建对象时建立初始状态，实例方法在对象上执行操作。调用 new 时会创建对象，并调用匹配的构造方法。

封装的重点不是把字段写成 private 就结束了，而是控制状态变化的入口。调用方可以读取需要的信息，但修改动作应通过有意义的方法完成。这个示例用 private 字段和调价方法保证价格始终非负。

Java 中的基本类型保存值；引用类型变量保存对象引用。两个变量若指向同一个对象，通过其中一个引用调用修改方法后，另一个引用观察到的也是同一对象状态。这是后续学习集合、参数传递和对象关系时需要建立的直觉。

## 三、核心代码实现

下面的代码可保存为 ClassObjectDemo.java，使用 JDK 编译运行。它用 BigDecimal 表示金额，避免用二进制浮点数直接保存价格。

~~~java
import java.math.BigDecimal;
import java.math.RoundingMode;

public class ClassObjectDemo {
    static class Book {
        private final String title;
        private BigDecimal price;

        Book(String title, BigDecimal price) {
            if (title == null || title.trim().isEmpty()) {
                throw new IllegalArgumentException("书名不能为空");
            }
            this.title = title;
            this.price = normalizePrice(price);
        }

        public String getTitle() {
            return title;
        }

        public BigDecimal getPrice() {
            return price;
        }

        public void setPrice(BigDecimal price) {
            this.price = normalizePrice(price);
        }

        private static BigDecimal normalizePrice(BigDecimal price) {
            if (price == null || price.signum() < 0) {
                throw new IllegalArgumentException("价格不能为负数或空");
            }
            return price.setScale(2, RoundingMode.HALF_UP);
        }
        public void applyDiscount(BigDecimal rate) {
            if (rate == null || rate.signum() < 0 || rate.compareTo(BigDecimal.ONE) > 0) {
                throw new IllegalArgumentException("折扣率必须在 0 到 1 之间");
            }
            setPrice(price.multiply(rate));
        }
    }

    public static void main(String[] args) {
        Book book = new Book("Java 入门练习", new BigDecimal("49.90"));
        book.applyDiscount(new BigDecimal("0.8"));

        System.out.println(book.getTitle());
        System.out.println(book.getPrice());
    }
}
~~~

预期输出为书名和 39.92。这里的预期值来自代码计算，未声称在用户的本地环境运行过。构造方法和公开调价方法共用同一静态校验逻辑，减少了创建对象和后续修改之间的规则差异。

## 四、真实项目落地

在课程练习中，可以把学生、课程或订单抽象成类，先识别哪些数据属于同一个对象，再确定哪些操作要保持数据有效。这里的 Book 只是一段教学 Demo，不代表真实项目经历。

进入更复杂的项目后，还需要继续考虑对象职责、持久化模型与接口模型是否相同，以及哪些状态允许被修改。入门时先做到字段有边界、方法有明确动作，已经能减少不少随意赋值。

## 五、遇到的问题

常见困惑是把 private 理解成“不能使用”。调用方仍可以通过 public 方法完成需要的操作；区别是对象有机会检查参数并维持自身约束。

另一个问题是把所有字段都加上 getter 和 setter。这样虽然字段语法上是私有的，实际却把全部修改权重新开放。是否需要 setter，应由状态变化规则决定。

## 六、优化方案

- 不可变状态优先使用 final，并在构造时完成校验。
- 使用名称表达业务动作的方法，例如 applyDiscount，而不是暴露没有约束的通用修改入口。
- 金额示例使用 BigDecimal，并明确舍入规则。
- 参数校验应与对象承担的规则匹配，避免把数据库或业务层的全部校验都塞进一个简单实体。

## 七、个人思考

我对面向对象的第一层理解，不是“把代码拆成很多类”，而是让数据和合法操作在同一个边界里。类名和方法名如果能准确表达这条边界，后续阅读代码的人就更容易知道状态由谁维护。

## 延伸：面试问答

### 类和对象有什么区别？

类是对象的描述，定义状态和行为；对象是依据类创建出的具体实例，每个实例有自己的状态。

### 为什么字段通常声明为 private？

避免调用方绕开校验随意改动状态，再通过公开方法提供受控访问和修改。

### 构造方法和普通方法有什么不同？

构造方法与类同名、没有返回类型，在创建对象时调用；普通方法有返回类型，通过对象或类调用来执行操作。

## 参考资料

- [Java Language Basics: Classes and Objects](https://docs.oracle.com/javase/tutorial/java/javaOO/classes.html)
- [BigDecimal API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html)