---
title: "Spring IoC 与 DI：对象创建和依赖管理"
date: "2026-12-08"
categories: ["Spring"]
tags: [
  "Java",
  "Spring Boot",
  "后端基础"
]
description: "从手动创建对象过渡到容器注入，理解 IoC、DI 和构造器依赖。"
plan_date: "2024-04-20"
phase: "数据库与 Spring 基础"
---

# Spring IoC 与 DI：对象创建和依赖管理

### 文章定位

这篇文章把控制反转和依赖注入落到一个很小的通知服务示例。代码展示容器如何组装对象，不代表我在公司搭建过生产级 Spring 架构。

### 学习目标

- 用对象创建责任解释 IoC。
- 用构造器注入表达服务依赖。
- 理解 Spring Bean 的默认作用域和容器边界。

## 一、为什么学习这个技术

如果业务服务在自己的方法里直接 new 一个具体发送器，替换实现或隔离测试都需要修改业务类。服务增长后，对象的创建和依赖关系散落在各处，初始化、配置和生命周期也难以统一管理。

IoC 把对象创建和组装交给容器；DI 是容器向对象提供其依赖的一种方式。业务对象依然调用依赖完成工作，但不再负责寻找或创建具体依赖。

## 二、技术原理

Spring ApplicationContext 根据配置元数据注册并创建 Bean，再按构造器参数或其他注入点解析依赖。构造器注入能让必需依赖在对象创建时就明确，也方便测试时传入替代实现。对必需依赖，构造器通常比可变字段注入更容易读和验证。

默认 singleton 作用域表示同一个 Spring 容器对某个 Bean 定义通常复用一个实例；它不意味着 JVM 中永远只有一个对象。若 Bean 保存可变请求状态，多个请求共享实例可能出现数据串扰，应把请求数据放在方法局部变量或合适的作用域中。

## 三、核心代码实现

下面示例保存为 IocDemo.java，依赖 Spring Framework 的 spring-context。用 Maven 引入与项目一致的 Spring 版本后可运行；这里只用配置类的 Bean 方法说明容器组装，不需要启动 Web 服务。

~~~java
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

public class IocDemo {
    interface NotificationGateway {
        void send(String recipient, String message);
    }

    static class ConsoleGateway implements NotificationGateway {
        @Override
        public void send(String recipient, String message) {
            System.out.println("发送给 " + recipient + "：" + message);
        }
    }

    static class ReminderService {
        private final NotificationGateway gateway;

        ReminderService(NotificationGateway gateway) {
            this.gateway = gateway;
        }

        void remind(String recipient) {
            gateway.send(recipient, "请查看待办事项");
        }
    }

    @Configuration
    static class AppConfig {
        @Bean
        NotificationGateway notificationGateway() {
            return new ConsoleGateway();
        }

        @Bean
        ReminderService reminderService(NotificationGateway gateway) {
            return new ReminderService(gateway);
        }
    }

    public static void main(String[] args) {
        AnnotationConfigApplicationContext context =
                new AnnotationConfigApplicationContext(AppConfig.class);
        try {
            context.getBean(ReminderService.class).remind("学习者");
        } finally {
            context.close();
        }
    }
}
~~~

这里 ReminderService 不知道 gateway 是如何创建的，只声明自己需要 NotificationGateway。测试时可以传入一个记录调用参数的假实现；应用配置则决定实际提供哪个实现。真实 Spring Boot 项目常通过 @Service、@Component、@Configuration 和构造器注入组织这些关系，组件扫描与配置方式应保持清晰一致。

## 四、实际应用

课程资料还练习了 Bean 作用域与第三方对象注册。默认单例适合无请求状态的服务组件；`prototype` 每次获取创建新实例，Web 环境中的 `request`、`session` 则跟随相应上下文。把某个用户的可变请求数据放在默认单例字段上会造成并发请求相互影响。不是自己编写的类无法加 `@Component` 时，可以在配置类中使用 `@Bean` 显式创建，或按框架提供的 `@Import` 机制导入配置；具体选择取决于需要控制的构造参数与生命周期。

学习阶段可以从 Controller、Service、Mapper 的依赖链练习：请求对象由 Web 层接收，Service 通过构造器依赖 Mapper，容器在启动时组装这些 Bean。课程项目中的做法适合帮助理解框架机制，但不能据此声称有企业架构维护经历。

增加第三方客户端时，可以用 @Bean 在配置类中创建并配置客户端，然后将接口注入到业务服务。配置应集中管理；密钥等敏感信息从安全配置来源读取，不写入源码。

## 五、问题记录

- **把 IoC 和 DI 当成同义词：**IoC 是控制权转移的设计思想，DI 是实现这种思想的一类方式。
- **不明确的依赖：**多个 Bean 实现同一接口时，容器需要可区分的候选；可通过明确配置或限定符表达选择。
- **循环依赖：**A 依赖 B 且 B 依赖 A 往往表示职责耦合，优先重新划分职责，不要把容器“能否兜底”当成设计依据。
- **共享可变状态：**单例 Bean 通常被多个请求复用，因此不要把当前用户或请求数据存进实例字段。

## 六、改进方向

优先使用构造器声明必需依赖，依赖过多时检查类职责是否过宽。容器配置保持可读、可测试；测试业务逻辑时直接构造对象或使用测试容器，按测试目标选择即可。

## 七、个人思考

容器的价值不只是少写几次 new，而是把依赖关系变得可见，并在创建阶段验证对象能否组装。构造器告诉读代码的人“这个类离不开什么”，容器则负责把这些声明连接起来。

## 延伸：面试问答

### IoC 和 DI 分别是什么？

IoC 表示对象控制权从对象自身转到外部容器；DI 是容器把对象依赖提供给它的一种实现方式。

### 为什么常建议使用构造器注入？

必需依赖通过构造器显式表达，对象创建后不会处于依赖缺失状态，也便于单元测试替换依赖。

### Spring 默认单例是否等于线程安全？

不是。单例说明容器中的实例复用方式，不保证对象内部可变状态能被并发安全访问。

## 参考资料

- [Spring Framework：IoC Container and Beans](https://docs.spring.io/spring-framework/reference/core/beans/introduction.html)
- [Spring Framework：Dependency Injection](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html)
