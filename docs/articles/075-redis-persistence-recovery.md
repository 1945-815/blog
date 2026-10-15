---
title: "Redis 持久化与恢复：RDB、AOF 和缓存重建的边界"
date: "2027-08-24"
categories: ["Redis"]
tags: ["Redis", "RDB", "AOF", "故障恢复", "缓存"]
description: "根据数据能否重建选择 Redis 持久化策略，区分快照、刷盘、复制和备份，并设计一次可核对的恢复练习。"
plan_date: "2026-08-25"
phase: "Java 后端实习与业务实践"
---

# Redis 持久化与恢复：RDB、AOF 和缓存重建的边界

## 一、为什么学习这个技术

已有 Redis 文章覆盖 TTL、热门文档缓存、分布式锁和每日配额，本地 Redis 笔记还包含 RDB 与 AOF。继续学习时，我发现“键设置了过期时间”和“服务重启以后还能读到什么”是不同的问题。缓存、配额和业务记录也不能用同一种恢复承诺。

我想回答的具体问题是：Redis 重启或磁盘故障之后，哪些数据可以从 MySQL 重建，哪些数据丢失会改变业务结果，怎样证明备份能用？因此本文先根据数据价值选择策略，再看配置项，而不是背一个默认推荐答案。

## 二、核心概念

RDB 保存某个时间点的数据快照；AOF 保存可用于重建数据的变更记录，并通过重写压缩历史冗余。持久化关注本机重启后恢复什么，复制关注把数据传到另一个节点，备份关注保留独立副本与历史版本。这些能力互相补充，不能互相替代。

恢复目标可以分成两项：允许丢失多少最近写入，以及允许服务中断多久。排行榜如果能从明细表重新计算，重点可能是重建期间的数据库压力；验证码或额度计数如果丢失会改变判断，则必须重新定义失败时的业务行为，不能仅说“Redis 很快”。

appendfsync 有 always、everysec、no 等策略。no 表示不由 Redis 主动调用 fsync，数据仍会写入文件并交给操作系统安排刷盘，不能解释为“不保存”。everysec 通常把损失窗口控制在约一秒的量级，但应用不能把它当成任意硬件故障下的绝对零风险承诺。[Redis 持久化说明](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)

## 三、底层原理

BGSAVE 通常由子进程生成快照，父进程继续处理请求。fork 和写时复制并非没有成本：快照期间大量页面被修改，会增加额外内存占用，磁盘写入也会与业务竞争资源。SAVE 则会阻塞服务执行快照，不能随意在繁忙实例上调用。

AOF 重写根据当前数据状态生成更紧凑的恢复表示，而不是无限保留每次历史写入。从 Redis 7 开始，AOF 由基础文件、增量文件和 manifest 共同管理；只复制一个旧印象中的 appendonly.aof 文件，可能无法形成有效备份。备份时还要处理重写期间文件集合变化的问题。

TTL 不会因为备份恢复就重新从原时长开始计算。已经过期的键不应借恢复重新获得完整生命期。与此同时，异步复制和本地刷盘解决的是不同链路上的确认问题，业务收到一次成功响应，并不自动等于数据已进入所有副本与离线备份。

## 四、代码案例

以下配置用于一个独立的练习实例，数据目录为持久卷，不能直接套到已有生产实例。save 条件是一组可独立触发的规则，不是要求所有行同时满足。

~~~text
dir /data
dbfilename dump.rdb
save 300 10
appendonly yes
appendfsync everysec
appenddirname appendonlydir
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
~~~

启动前确保 `/data` 可写、容量足够且目录来自持久卷。容器删除之后仍需保留该卷；同时准备存放在独立位置的备份。RDB 与 AOF 同时启用时，正常启动优先使用 AOF 恢复，不能简单把一份较新的 RDB 放进去就断定恢复结果会来自它。

Spring Boot 3.5 中只配置连接参数，不在应用启动时修改 Redis 持久化设置。这里使用独立练习端口 6380，避免误操作默认实例。

~~~yaml
spring:
  data:
    redis:
      host: 127.0.0.1
      port: 6380
      connect-timeout: 1s
      timeout: 1s
~~~

练习数据由 MySQL 保存权威的公开文档摘要，Redis 只提供可以重建的短期缓存：

~~~sql
CREATE TABLE public_article_summary (
  id BIGINT PRIMARY KEY,
  summary VARCHAR(1000) NOT NULL,
  version BIGINT NOT NULL
);
INSERT INTO public_article_summary VALUES (1, 'Redis 持久化练习', 1);
SELECT summary FROM public_article_summary WHERE id = ?;
~~~

Java 使用 Spring Data Redis 与 JdbcTemplate。这里只缓存公开内容；若存在租户或用户权限，需要在查库前完成授权，并把隔离维度加入缓存键。数据更新时的失效策略参见已有缓存文章。

~~~java
import java.time.Duration;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class ArticleSummaryReader {
    private final StringRedisTemplate redis;
    private final JdbcTemplate jdbc;

    public ArticleSummaryReader(StringRedisTemplate redis, JdbcTemplate jdbc) {
        this.redis = redis;
        this.jdbc = jdbc;
    }

    public String read(long id) {
        String key = "demo:public-article:" + id;
        boolean connected = true;
        try {
            String cached = redis.opsForValue().get(key);
            if (cached != null) return cached;
        } catch (RedisConnectionFailureException ex) {
            connected = false;
            // 接入项目监控计数；不在每次失败时重复输出完整堆栈。
        }
        String summary = jdbc.queryForObject(
            "SELECT summary FROM public_article_summary WHERE id = ?",
            String.class, id);
        if (connected) {
            try {
                redis.opsForValue().set(key, summary, Duration.ofMinutes(5));
            } catch (RedisConnectionFailureException ex) {
                // 本例允许缓存写入失败，数据库查询结果仍可返回。
            }
        }
        return summary;
    }
}
~~~

这个方法只展示连接失败时的回源路径，超时与其他 Redis 异常应按项目异常策略分类处理。数据库不存在记录也需要映射为明确的业务结果。不能为了“降级成功”吞掉所有异常，更不能让大量请求无上限地直接冲向 MySQL。

实际检查可以在隔离实例中执行：

~~~bash
redis-cli -p 6380 SET demo:recovery:marker checkpoint-1 EX 600
redis-cli -p 6380 BGSAVE
redis-cli -p 6380 INFO persistence
redis-cli -p 6380 GET demo:recovery:marker
redis-cli -p 6380 TTL demo:recovery:marker
~~~

等 INFO 显示快照结束且最近保存状态成功后，再保存备份清单。将备份恢复到另一个独立实例，核对 marker、剩余 TTL、抽样值和键数量。只做正常关机重启不能模拟突然断电，也不能据此证明实际数据丢失窗口。

## 五、项目真实落地

对于公开文档缓存，我会先设置数据库连接池与回源并发上限，再考虑热点预热和过期时间抖动。Redis 恢复后不立即全量重建所有键，优先恢复热点并观察数据库压力。是否关闭这类缓存的持久化，取决于重建成本、冷启动目标和容量，不存在统一答案。

对于每日配额，恢复旧值可能让用户获得额外操作次数，直接清零也可能改变规则。需要业务决定故障时拒绝操作、暂时降级，还是依据持久明细重建；不能复用公开文档缓存的“缺了就回源”逻辑。恢复策略必须与业务约束一起设计。

我会记录备份来源实例、Redis 版本、配置、生成时间、文件校验值和恢复步骤，并在演练中保存实际恢复耗时。磁盘满、写权限变化、AOF 重写失败也要通过 INFO 与日志发现。本文只有演练方案与示例，没有把未执行的故障演练写成生产结论。

## 六、常见面试问题

### 初级：开启 AOF 后还需要备份吗？

需要。本地持久化文件也可能与磁盘一起损坏，错误删除的数据还可能被写入持久化结果。独立备份保留另一份恢复依据。

### 中级：RDB 为什么会占用额外内存？

后台快照期间父子进程共享页面，父进程修改页面会触发写时复制。额外占用受数据规模、写入强度和快照持续时间影响。

### 项目：Redis 恢复成功为什么接口仍然很慢？

可能是缓存尚未充分恢复、热点回源拥堵、磁盘 IO 竞争或连接重建。应结合命中率、数据库负载和错误率定位，不能只看 Redis 进程是否启动。

## 七、个人总结

作为一名 2027 届 Java 后端实习生，我现在会先问一份 Redis 数据能否重建、丢失会改变什么结果，再决定持久化方案。通过这次整理，我认识到配置打开并不等于恢复能力已经验证；真正能说明问题的是独立恢复流程、核对结果和明确的业务降级边界。
