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
phase: "Java 与并发"
---

# Java 多线程起步：共享状态、线程安全与同步

## 问题背景

单线程代码通常按书写顺序执行。多个线程访问同一个可变对象时，操作可能交错，最终结果就不一定等于每个任务结果的简单累加。多线程不是“让代码自动更快”，而是引入了共享状态、可见性和任务生命周期等额外问题。

先用很小的例子看清共享计数的正确性，再学习线程池、阻塞队列和并发工具类，会比一开始就背线程状态更容易建立判断依据。

## 核心原理

count++ 大致包含读取、加一和写回几个步骤。两个线程可能读到相同旧值，再分别写回相同的新值，造成更新丢失。把方法声明为 synchronized，会让同一个 Counter 对象上的同步方法互斥执行，并建立相应的可见性关系。

线程池管理工作线程，应用提交的是任务而不是长期手动管理每个 Thread。线程数、队列容量、拒绝策略和关闭流程都应根据任务类型与系统资源设计；固定线程池示例只用于说明提交与等待。

## 实现示例

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

## 实际应用

可以用多个线程并发更新同一个计数器，对比同步方法、`AtomicInteger` 和线程安全集合的适用范围。服务端还要限制线程池资源，并明确共享状态由谁管理：本地对象、数据库事务还是专门的并发协调组件。选择方案前要说明并发边界。

## 并发执行与资源边界

- **只看一次输出：**调度变化后问题可能重新出现；并发正确性需要从共享状态和操作原子性推理。
- **把 volatile 当锁：**volatile 保障可见性和特定顺序关系，但不能让 value++ 这类复合操作变成原子操作。
- **没有收尾线程池：**不关闭线程池可能阻止进程退出；服务中还需结合应用生命周期管理。
- **无限等待：**Future.get 可能等待很久；生产代码通常要设合理超时，并明确取消和补偿策略。
- **忽略中断：**捕获 InterruptedException 后若不能继续向上抛，应恢复当前线程的中断标记。

## 改进思路

计数器只是在演示同步，并不意味着所有共享字段都应加锁。对于简单原子数值可评估 AtomicInteger；对于任务生产消费可使用有界 BlockingQueue；对 IO 密集和 CPU 密集任务，线程数也不能照搬同一个经验值。应通过任务时延、队列长度和资源使用情况判断是否需要调整。

## 设计取舍与结论

多线程的第一步不是追求同时执行，而是找到共享的可变状态。能减少共享就先减少共享；无法避免时，再选合适的同步机制，并把线程池关闭、异常传播和超时放进设计里。

## 用 `Lock` 与 `Condition` 协调生产者和消费者

下面是一格缓冲区的独立示例。`await` 会在等待时释放关联锁；被唤醒后重新获得锁并检查条件。`signalAll` 只通知等待线程，并不保证它立刻运行。与之相比，`Thread.sleep` 不会释放已持有的这把锁。

~~~java
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

public class ConditionDemo {
    static class Slot {
        private final ReentrantLock lock = new ReentrantLock();
        private final Condition changed = lock.newCondition();
        private int value; // 仅允许 0 或 1

        void produce() throws InterruptedException {
            lock.lockInterruptibly();
            try {
                while (value == 1) changed.await();
                value = 1;
                changed.signalAll();
            } finally {
                lock.unlock();
            }
        }

        void consume() throws InterruptedException {
            lock.lockInterruptibly();
            try {
                while (value == 0) changed.await();
                value = 0;
                changed.signalAll();
            } finally {
                lock.unlock();
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Slot slot = new Slot();
        Thread producer = new Thread(() -> {
            try { for (int i = 0; i < 3; i++) slot.produce(); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });
        Thread consumer = new Thread(() -> {
            try { for (int i = 0; i < 3; i++) slot.consume(); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });
        producer.start();
        consumer.start();
        producer.join();
        consumer.join();
        System.out.println("三次生产和消费已结束");
    }
}
~~~

保存为 `ConditionDemo.java`，JDK 8+ 可运行。线程被中断时本例恢复中断标记后退出；若生产者中途退出而消费者仍等待，完整服务还需要关闭状态或超时唤醒机制。本例只演示同步协议。实际任务队列优先评估 `BlockingQueue`，避免自行维护条件变量。

### 创建方式、状态与线程池参数

线程任务可以通过继承 `Thread`、实现 `Runnable` 或实现 `Callable<V>` 表达。`Thread.start()` 请求启动新线程，直接调用 `run()` 只是当前线程的一次普通方法调用。`Runnable` 不返回结果；`Callable<V>` 可以返回结果并声明受检异常，通过 `ExecutorService.submit` 可得到 `Future<V>`。选择时应看任务是否需要返回值、异常传播和线程池管理，而不是把两种接口理解成互斥的使用方式。

`Thread.State` 列出 `NEW`、`RUNNABLE`、`BLOCKED`、`WAITING`、`TIMED_WAITING`、`TERMINATED`；这些是 Java 层状态，不等同于操作系统线程调度的全部细节。调试等待问题时要同时看持有的锁、等待的条件以及中断路径。

自定义 `ThreadPoolExecutor` 时，需要一起考虑核心线程数、最大线程数、空闲保留时间及单位、工作队列、线程工厂和拒绝策略。队列若无界，最大线程数可能长期不起预期作用，任务积压也会带来内存风险；拒绝策略必须与上游限流和失败反馈相配合。本文的固定线程池只演示任务提交与关闭，不能直接当作高负载服务的线程池配置。

## 参考资料

- [Oracle Java Tutorial：Synchronization](https://docs.oracle.com/javase/tutorial/essential/concurrency/sync.html)
- [Oracle Java Tutorial：Atomic Access](https://docs.oracle.com/javase/tutorial/essential/concurrency/atomic.html)
- [Java SE API：ExecutorService](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/ExecutorService.html)
