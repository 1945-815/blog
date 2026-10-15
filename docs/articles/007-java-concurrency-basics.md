---
title: "Java 多线程起步：共享状态、线程安全与同步"
date: "2026-12-01"
categories: ["Java 基础"]
tags: [
  "Java",
  "Java 后端",
  "后端基础"
]
description: "用共享计数器观察竞态条件，并通过同步和线程池建立并发入门模型。"
plan_date: "2023-12-28"
phase: "Java 基础与数据结构"
---

# Java 多线程起步：共享状态、线程安全与同步

### 文章定位

这篇文章从共享计数器理解线程干扰、同步和任务提交。代码用于 Java 多线程入门，不把创建线程等同于系统性能优化，也不对应企业并发故障经历。

### 学习目标

- 解释为什么 count++ 不是一个整体原子操作。
- 用同步保护共享对象的不变量。
- 通过线程池提交任务，并等待任务完成。

## 一、为什么学习这个技术

单线程代码通常按书写顺序执行。多个线程访问同一个可变对象时，操作可能交错，最终结果就不一定等于每个任务结果的简单累加。多线程不是“让代码自动更快”，而是引入了共享状态、可见性和任务生命周期等额外问题。

先用很小的例子看清共享计数的正确性，再学习线程池、阻塞队列和并发工具类，会比一开始就背线程状态更容易建立判断依据。

## 二、技术原理

count++ 大致包含读取、加一和写回几个步骤。两个线程可能读到相同旧值，再分别写回相同的新值，造成更新丢失。把方法声明为 synchronized，会让同一个 Counter 对象上的同步方法互斥执行，并建立相应的可见性关系。

线程池管理工作线程，应用提交的是任务而不是长期手动管理每个 Thread。线程数、队列容量、拒绝策略和关闭流程都应根据任务类型与系统资源设计；固定线程池示例只用于说明提交与等待。

## 三、核心代码实现

保存为 ConcurrentCounterDemo.java，可用 JDK 17 编译运行。示例创建四个工作线程，每个任务累加 100,000 次，最后应打印 400000。

~~~java
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

public class ConcurrentCounterDemo {
    static class Counter {
        private int value;

        // 同一 Counter 实例上的调用由同一把对象锁保护。
        synchronized void increment() {
            value++;
        }

        synchronized int value() {
            return value;
        }
    }

    public static void main(String[] args) throws Exception {
        Counter counter = new Counter();
        ExecutorService pool = Executors.newFixedThreadPool(4);
        List<Future<?>> futures = new ArrayList<>();

        try {
            for (int task = 0; task < 4; task++) {
                futures.add(pool.submit(() -> {
                    for (int i = 0; i < 100_000; i++) {
                        counter.increment();
                    }
                }));
            }

            // get 等待任务完成，并把任务中的异常交回当前线程。
            for (Future<?> future : futures) {
                future.get();
            }
        } finally {
            pool.shutdown();
            if (!pool.awaitTermination(5, TimeUnit.SECONDS)) {
                pool.shutdownNow();
            }
        }

        System.out.println("最终计数：" + counter.value());
    }
}
~~~

如果移除 increment 上的 synchronized，程序就存在竞态条件，但某次运行仍可能碰巧输出 400000；这不代表代码正确。并发缺陷往往依赖调度时机，不能靠一次运行验证不存在。

## 四、实际应用

课程练习中可以用多个任务模拟并发访问同一个对象，并比较同步方法、AtomicInteger 和线程安全集合的适用范围。进入服务端开发后，更常见的做法是限制线程池资源，把共享状态交给数据库事务、并发控制或专门的并发组件管理。选择方案前要说明状态归谁所有、并发边界在哪里。

## 五、问题记录

- **只看一次输出：**调度变化后问题可能重新出现；并发正确性需要从共享状态和操作原子性推理。
- **把 volatile 当锁：**volatile 保障可见性和特定顺序关系，但不能让 value++ 这类复合操作变成原子操作。
- **没有收尾线程池：**不关闭线程池可能阻止进程退出；服务中还需结合应用生命周期管理。
- **无限等待：**Future.get 可能等待很久；生产代码通常要设合理超时，并明确取消和补偿策略。
- **忽略中断：**捕获 InterruptedException 后若不能继续向上抛，应恢复当前线程的中断标记。

## 六、改进方向

计数器只是在演示同步，并不意味着所有共享字段都应加锁。对于简单原子数值可评估 AtomicInteger；对于任务生产消费可使用有界 BlockingQueue；对 IO 密集和 CPU 密集任务，线程数也不能照搬同一个经验值。应通过任务时延、队列长度和资源使用情况判断是否需要调整。

## 七、个人思考

多线程的第一步不是追求同时执行，而是找到共享的可变状态。能减少共享就先减少共享；无法避免时，再选合适的同步机制，并把线程池关闭、异常传播和超时放进设计里。

## 延伸：面试问答

### 为什么 count++ 不是线程安全的？

它包含读取、计算和写回等步骤，多个线程的步骤可能交错，造成丢失更新。

### synchronized 除了互斥还提供什么？

退出同步区域与后续获取同一把锁之间建立 happens-before 关系，帮助后续访问看到此前线程的修改。

### volatile 能替代 synchronized 吗？

不能。volatile 主要解决可见性与特定内存顺序问题，不提供复合操作的互斥。

## 参考资料

- [Oracle Java Tutorial：Synchronization](https://docs.oracle.com/javase/tutorial/essential/concurrency/sync.html)
- [Oracle Java Tutorial：Atomic Access](https://docs.oracle.com/javase/tutorial/essential/concurrency/atomic.html)
- [Java SE API：ExecutorService](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/ExecutorService.html)
