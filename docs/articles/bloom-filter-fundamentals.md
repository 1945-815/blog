---
title: "布隆过滤器入门：用概率结构拦截不存在的数据"
date: "2026-10-16"
categories: ["Redis"]
tags: ["布隆过滤器", "Guava", "Redis", "缓存"]
description: "从本地课程 PDF 整理布隆过滤器的误判、容量与删除边界，并对照 Guava 和 Redis Bloom。"
plan_date: "2026-10-16"
phase: "企业开发技术学习"
---

# 布隆过滤器入门：用概率结构拦截不存在的数据

## 学习来源与目标

本地 `10.1作业/布隆过滤器.pdf` 介绍位数组、多组哈希、误判、Guava 和 Redis Bloom。本文不照搬 PDF 中的手写哈希实现，而是说明概率结构的边界，并用成熟 API 演示。

布隆过滤器回答的是“这个元素一定不在集合里吗？”它可以快速排除确定不存在的数据，常见设计场景包括缓存穿透防护和大集合存在性预筛查。它不保存原始对象，也不能替代数据库中的最终查询。

## 一、位数组与多次映射

添加元素时，根据多个哈希映射位置把位数组中的对应位设为 1。检查元素时，若有任一位置为 0，则元素一定没有被添加过；若所有位置都是 1，只能说“可能存在”，因为不同元素可能映射到相同位。

因此会有假阳性，但在容量、哈希和生命周期假设成立且元素没有删除的前提下，不会出现假阴性。假阳性意味着后续查询仍要访问真实数据源，不能据此直接返回业务对象。

## 二、误判率和容量

初始化时需要估算预计插入数量和可接受的误判概率。预计容量越接近真实规模、目标误判率越低，所需位空间和哈希次数通常越多。若实际写入量远超容量估计，误判率会高于原目标。

选择时要在空间、误判率和查询成本间权衡，并监控元素规模。过滤器不是越大越好，也不适合设置没有依据的固定容量。

## 三、Guava 教学示例

下面示例使用 Guava BloomFilter 的常见 API。项目应通过依赖管理固定兼容版本；示例容量只是教学参数，不是课程项目数据。

~~~java
import com.google.common.hash.BloomFilter;
import com.google.common.hash.Funnels;

import java.nio.charset.StandardCharsets;

public class UsernameBloomDemo {
    public static void main(String[] args) {
        long expectedInsertions = 100_000L;
        double falsePositiveProbability = 0.01;

        BloomFilter<CharSequence> filter = BloomFilter.create(
                Funnels.stringFunnel(StandardCharsets.UTF_8),
                expectedInsertions,
                falsePositiveProbability);

        filter.put("user-1001");

        if (!filter.mightContain("user-2002")) {
            System.out.println("确定不存在，可以跳过后续查询");
        } else {
            System.out.println("可能存在，仍需查询真实数据源");
        }
    }
}
~~~

`mightContain` 返回 true 不代表元素一定存在。Guava 的 API 接收预计插入数量和误判目标；使用时应结合具体版本文档确认参数及过滤器容量行为。[Guava BloomFilter API](https://guava.dev/releases/20.0/api/docs/com/google/common/hash/BloomFilter.html)

## 四、Redis Bloom 方案

需要多个服务共享过滤器时，可以评估 Redis Bloom 模块提供的命令：

~~~text
BF.RESERVE users:bf 0.01 100000
BF.ADD users:bf user-1001
BF.EXISTS users:bf user-2002
~~~

这些命令需要部署提供 Redis Bloom 能力，不是所有 Redis 安装默认都支持。先核对 Redis 发行版、模块和托管服务兼容情况。正向判断仍可能误判，真实数据读取不能省略。[Redis Bloom 官方说明](https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/)

## 五、删除、更新和重建

标准 Bloom filter 只把位从 0 改为 1，不记录某一位由哪个元素设置，所以不能安全地按元素删除；清除一个位可能影响其他元素的判断。需要支持删除时，可以考虑计数型变体、周期性重建，或选择支持删除的索引结构，并评估额外空间和并发更新。

过滤器通常是派生索引，不是权威数据。初始化、增量更新和重建策略需要与真实数据源保持可恢复关系。

## 六、面试问题

**布隆过滤器为什么会误判？** 不同元素的多个哈希位置可能碰撞，使未添加元素的检查位也全为 1。

**为什么不能把正向判断当作命中？** 正向结果只表示可能存在，仍要查权威数据源。

**标准 Bloom filter 能否删除元素？** 不能安全删除单个元素；清位可能影响其他元素的判断。

## 资料来源

- 本地 `10.1作业/布隆过滤器.pdf`
- [Redis Bloom filter 文档](https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/)
- [Guava BloomFilter API](https://guava.dev/releases/20.0/api/docs/com/google/common/hash/BloomFilter.html)
