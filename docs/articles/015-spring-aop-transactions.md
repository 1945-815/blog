---
title: "Spring AOP 与事务：横切逻辑和事务边界"
date: "2026-12-15"
categories: ["Spring"]
tags: [
  "Java",
  "Spring Boot",
  "数据库"
]
description: "用代理、切面和事务注解理解横切逻辑，以及事务失效时应检查的边界。"
plan_date: "2024-05-25"
phase: "数据库与 Spring 基础"
---

# Spring AOP 与事务：横切逻辑和事务边界

### 学习目标

- 区分切面、通知、切点、目标对象和代理。
- 理解声明式事务由 Spring 代理在调用边界上处理。
- 知道默认回滚规则和自调用的限制。

## 一、为什么学习这个技术

日志、鉴权、事务和指标等能力会横跨多个业务方法。如果每个方法都重复写相同的开关、计时和清理逻辑，容易遗漏，也会让主要业务步骤变得难读。

AOP 把横切逻辑放到匹配规则和通知中。Spring 的声明式事务使用代理和拦截器在目标方法调用前后管理事务。理解代理路径，比单纯记住“加注解就有事务”更能帮助定位行为差异。

## 二、技术原理

切点定义哪些方法会被匹配，通知定义匹配后执行什么逻辑，切面把切点和通知组织在一起。Spring AOP 通过运行时代理拦截方法调用。只有调用经过代理，相关通知才有机会执行；目标对象内部通过 this 调用同类方法，会绕过外层代理。

JDK 动态代理针对接口方法创建代理对象；基于子类的代理可以处理没有接口的目标类，但 `final` 类不能被继承，`final` 方法不能被覆盖。选用哪种代理还受 Spring 配置和版本影响，不能只根据业务类“写了接口”就断定当前一定使用 JDK 代理。判断事务是否生效时，应先确认调用是否经过容器提供的代理，再看方法可见性、异常回滚规则和事务管理器。

在常见 Spring 声明式事务默认设置下，传播行为是 REQUIRED，RuntimeException 和 Error 会触发回滚，受检异常默认不会回滚。具体规则可以通过 rollbackFor 等属性调整，实际项目还要确认事务管理器、数据源和代理配置。

## 三、核心代码实现

业务代码示意：两个 Mapper 写入应作为同一个业务操作提交或回滚。方法需要通过 Spring 容器提供的代理对象从外部调用，不能直接在自己构造的普通对象上期待事务生效。

~~~java
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {
    private final BookingMapper bookingMapper;
    private final BookingItemMapper itemMapper;

    public BookingService(
            BookingMapper bookingMapper,
            BookingItemMapper itemMapper) {
        this.bookingMapper = bookingMapper;
        this.itemMapper = itemMapper;
    }

    @Transactional
    public void create(Booking booking, BookingItem item) {
        if (item.getQuantity() <= 0) {
            throw new IllegalArgumentException("数量必须大于 0");
        }

        bookingMapper.insert(booking);
        item.setBookingId(booking.getId());
        // 如果第二次写入失败并抛出运行时异常，默认规则会回滚当前事务。
        itemMapper.insert(item);
    }
}
~~~

这段代码是服务层示意，运行需要应用中已配置的 Spring 容器、事务管理器和 Mapper 实现。若业务异常是受检异常，需要根据实际语义显式配置 rollbackFor。不要在方法里捕获异常后只记录日志并正常返回，否则事务拦截器可能观察不到需要回滚的失败。

一个仅用于观察调用边界的日志切面可以写成：

~~~java
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class ServiceTimingAspect {
    @Around("execution(* demo.service..*.*(..))")
    public Object logCall(ProceedingJoinPoint invocation) throws Throwable {
        long start = System.nanoTime();
        try {
            return invocation.proceed();
        } finally {
            long elapsedNanos = System.nanoTime() - start;
            System.out.println(
                    invocation.getSignature().getName()
                            + " 耗时纳秒：" + elapsedNanos);
        }
    }
}
~~~

项目使用注解式切面时需要配置 AOP 支持，例如 Spring Boot 项目引入对应 AOP starter。计时示例只用于解释 around 通知的前后边界；生产监控应使用统一指标和日志方案，避免把敏感参数写入日志。

## 四、实际应用

数据库事务通常放在一个清晰的业务服务方法边界：先校验输入，再在同一个事务内完成相关数据库写操作。调用外部 HTTP 服务、发送消息等非事务资源不能因为加了 @Transactional 就自动与数据库形成原子提交，需要使用可靠消息、Outbox 或补偿等合适方案。

学习阶段可以在本地数据库做两个表的写入实验：在第二次写入后抛运行时异常，再查询两张表确认回滚效果。该验证仅代表本地练习。

## 五、问题记录

- **同类方法自调用：**从一个方法直接调用同对象上的另一个事务方法，可能没有经过代理。
- **错误的异常假设：**默认规则不会因所有 Exception 都自动回滚；受检异常需要按业务需要设置。
- **吞掉异常：**拦截器看到方法正常返回时，无法根据已吞掉的信息推断应该回滚。
- **事务范围过大：**在事务中执行慢速外部调用会延长连接和锁的占用，应重新划分边界。
- **认为 AOP 是任意代码注入：**Spring AOP 主要围绕方法执行做代理，切点范围和代理限制要结合实际配置理解。

## 六、改进方向

让事务方法表达一个完整且适度的数据库工作单元，明确哪些异常回滚、哪些情况可以提交。检查问题时从“调用是否经过代理、方法是否被切点匹配、事务管理器是否正确、异常是否传播、操作是否使用同一资源”逐项排查，而不是只看注解是否存在。

## 七、个人思考

注解提供的是声明，运行时行为还依赖调用路径、代理、事务管理器和异常规则。理解这些条件后，AOP 就不再像魔法，事务也能从业务一致性要求出发设计。

## 延伸：面试问答

### Spring AOP 中切点和通知分别表示什么？

切点匹配哪些连接点，通知描述匹配后执行的逻辑；切面把两者组合起来。

### 为什么同类方法调用可能让 @Transactional 失效？

目标对象内部的 this 调用绕过代理，没有进入事务拦截器。

### Spring 默认事务遇到受检异常会回滚吗？

常见默认规则下不会。可以通过 rollbackFor 配置，并应按项目版本和事务配置核对实际行为。

## 参考资料

- [Spring Framework：AOP Concepts](https://docs.spring.io/spring-framework/reference/core/aop/introduction-defn.html)
- [Spring Framework：Proxying Mechanisms](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)
- [Spring Framework：Using @Transactional](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html)
