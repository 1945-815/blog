---
title: "Java 设计模式总览：按创建、结构与行为梳理"
date: "2026-10-16"
categories: ["Java 基础"]
tags: ["Java", "设计模式", "面向对象"]
description: "整理常见设计模式分类，并用独立 Java 示例说明策略模式的适用边界。"
plan_date: "2026-10-16"
phase: "Java 与并发"
---

# Java 设计模式总览：按创建、结构与行为梳理


本文整理常见模式及其适用边界，示例围绕对象之间的协作关系展开。

设计模式描述常见的对象协作方式，目的是让变化点更容易被定位和替换。模式名称本身不保证代码更好：如果一个简单条件分支被拆成很多无必要的类，反而增加理解和维护成本。

## 三类模式

### 创建型：对象怎样创建

- 单例：控制某类实例的创建范围。
- 工厂方法：由创建者的不同实现选择具体产品。
- 抽象工厂：围绕一组相关产品抽象创建过程。
- 建造者：分步骤构造参数较多的对象。
- 原型：从已有对象复制创建新对象。

### 结构型：对象怎样组合

- 适配器：让接口不兼容的调用方和被调用方协作。
- 桥接：把两个独立变化维度分开。
- 组合：用统一接口处理树形结构中的单个对象和对象集合。
- 装饰器：在不改原对象类型的情况下叠加行为。
- 外观：为一组子系统提供更简单的入口。
- 享元：复用可共享的状态以减少对象数量。
- 代理：在访问目标对象前后增加控制逻辑。

### 行为型：对象怎样协作

- 责任链：让多个处理者按顺序尝试处理请求。
- 命令：把请求封装成可传递或排队的对象。
- 解释器：用一组规则解释特定的小型语言或表达式。
- 迭代器：用统一方式遍历集合。
- 中介者：集中协调多个对象的交互。
- 备忘录：保存对象在某一时刻的状态，以便后续恢复。
- 观察者：在状态变化时通知订阅者。
- 状态：让行为随内部状态变化。
- 策略：把可替换算法封装成共同接口。
- 模板方法：固定算法骨架，把部分步骤留给子类。
- 访问者：将对对象结构的操作与结构类型分离。

不同教材对模式名称和归类的表述可能略有不同，实际判断应看参与对象和变化点。

## 用策略模式隔离可替换规则

如果结算折扣规则会按会员类型变化，可以把计算规则抽成接口。下面是一个独立的 Java 示例：

~~~java
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

public class CheckoutDemo {
    interface DiscountPolicy {
        BigDecimal apply(BigDecimal original);
    }

    static final class RegularPolicy implements DiscountPolicy {
        public BigDecimal apply(BigDecimal original) {
            return original;
        }
    }

    static final class MemberPolicy implements DiscountPolicy {
        public BigDecimal apply(BigDecimal original) {
            return original.multiply(new BigDecimal("0.90"));
        }
    }

    static final class CheckoutService {
        private final Map<String, DiscountPolicy> policies;

        CheckoutService(Map<String, DiscountPolicy> policies) {
            this.policies = policies;
        }

        BigDecimal quote(String level, BigDecimal original) {
            DiscountPolicy policy = policies.get(level);
            if (policy == null) {
                throw new IllegalArgumentException("unknown level: " + level);
            }
            return policy.apply(original);
        }
    }

    public static void main(String[] args) {
        Map<String, DiscountPolicy> policies = new HashMap<String, DiscountPolicy>();
        policies.put("regular", new RegularPolicy());
        policies.put("member", new MemberPolicy());

        CheckoutService checkout = new CheckoutService(policies);
        System.out.println(checkout.quote("member", new BigDecimal("100.00")));
    }
}
~~~

新增一种稳定且独立的规则时，可以增加策略实现并注册到集合中，不必在结算流程里堆叠分支。若规则只有一个简单条件，普通 `if` 足够清晰，就不必为了套模式制造类层级。

## 怎么判断是否值得引入模式

1. 先识别具体变化点：对象创建、对象组合，还是算法协作。
2. 看变化是否独立、是否在多个调用处重复。
3. 估算引入接口、实现类和配置后的阅读成本。
4. 用可读性和测试边界判断收益，而不是用模式名称证明设计高级。

## 常见问题

**设计模式解决什么问题？** 它总结常见的对象协作结构，帮助表达变化边界，但不替代需求分析。

**策略模式和工厂模式有什么区别？** 策略关注可替换的行为，工厂关注对象创建；一个系统可同时使用两者，但职责不同。

**什么时候不需要设计模式？** 逻辑简单、变化点不明显，或引入抽象比当前分支更难理解时，直接实现更合适。


- 示例用于说明模式如何切分变化点，是否采用仍取决于需求变化和实现复杂度。
