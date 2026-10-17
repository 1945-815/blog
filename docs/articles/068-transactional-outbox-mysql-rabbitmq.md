---
title: "Transactional Outbox：让 MySQL 写入与 RabbitMQ 事件可靠衔接"
date: "2027-07-06"
categories: ["项目实践"]
tags: ["Java", "MySQL", "RabbitMQ", "Outbox", "最终一致性"]
description: "围绕数据库与消息双写的失败窗口，设计 Outbox 表、轮询发布、消费幂等和故障恢复边界。"
plan_date: "2026-07-06"
phase: "Java 后端实习与业务实践"
---

# Transactional Outbox：让 MySQL 写入与 RabbitMQ 事件可靠衔接

## 一、为什么学习这个技术

假设创建订单后要发送“订单已创建”事件给库存、通知或搜索索引服务。常见写法是在 `@Transactional` 方法里先插订单再发 RabbitMQ。数据库提交成功后，如果应用在发布消息前崩溃，下游永远收不到事件；若先发消息再提交，数据库回滚时下游却处理了一个不存在的订单。

MySQL 事务和 RabbitMQ broker 通常属于两个独立资源，普通 `@Transactional` 不会把它们变成同一个原子提交。直接在业务事务里发布只能改变“哪一个失败窗口更大”，不能消除双写问题。Outbox 的核心是先把“需要发消息”也作为本地数据库数据，与业务写入在同一事务中提交，再由后台发布器转发到 MQ。

## 二、核心概念

Outbox 是业务库中的待发布事件表。业务事务一次性写入订单与事件，两者同时提交或回滚。独立发布器扫描待处理事件，向 RabbitMQ 发布；收到确认后把事件标记为已发送。若应用在提交后、发送前宕机，重启后仍能从表中恢复事件。

它提供的是“至少一次”倾向的可靠投递链路，并非端到端 exactly-once。发布成功但应用在更新 Outbox 状态前宕机时，同一事件可能再次发布。消费者必须使用稳定的 `event_id` 做幂等；业务是否重复执行由消费者的数据库约束或状态机保护。

发布器需要控制并发领取、重试、退避和积压监控。多实例可以使用短事务加锁领取一批事件并写入租约，随后在事务外发消息，避免数据库锁包住网络调用。租约过期可供其他实例接管；状态更新必须验证租约或版本，防止旧 worker 覆盖新结果。

## 三、底层原理

可靠性来自故障恢复点被持久化：订单事务提交之后，待发送事件已经在 MySQL 中。应用可以反复尝试把 Outbox 事件转发到消息代理。发送端 publisher confirm 用于判断 broker 对发布操作的确认；若 exchange 存在但消息没有路由到队列，还需开启 mandatory 与 returns 才能发现不可路由情况。confirm 表示 broker 接受了发布，不代表消费者已经完成业务处理。

发布器的关键窗口可以分成三段：领取事件、将消息交给 broker、标记数据库事件已发送。若在第二段前崩溃，租约超时后重新领取；若 broker 已确认而第三段尚未提交就崩溃，会再次发布，因此事件 id 必须稳定。若第三段先执行再发布，崩溃则会永久丢消息，所以绝不能在确认前标记发送成功。

数据库也承担可运维性责任。状态索引需要匹配待发送查询；旧成功事件按保留期归档或清理；失败次数、最早未发送时间和积压数量需要监控。大表应按创建时间分批清理，不要让一次删除长时间占用资源。

## 四、代码案例

下面以订单与 Outbox 事件为例。`event_id` 由应用生成并同时作为消息 id。状态含义为 0 待发送、1 已领取、2 已发送、3 达到上限需人工检查。生产系统还应增加租约到期时间、错误摘要和版本字段。

~~~sql
CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE outbox_event (
  event_id CHAR(36) PRIMARY KEY,
  aggregate_type VARCHAR(64) NOT NULL,
  aggregate_id BIGINT NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  payload JSON NOT NULL,
  status TINYINT NOT NULL DEFAULT 0,
  retry_count INT NOT NULL DEFAULT 0,
  lease_owner VARCHAR(80) NULL,
  lease_until DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME NULL,
  KEY idx_outbox_poll (status, lease_until, created_at)
);

-- 每个 worker 在短事务中领取最多 50 条待处理或租约已过期记录
SELECT event_id, payload
FROM outbox_event
WHERE status IN (0, 1)
  AND (lease_until IS NULL OR lease_until < NOW())
ORDER BY created_at
LIMIT 50
FOR UPDATE SKIP LOCKED;

-- 在同一短事务内为刚刚选中的 ID 设置租约，再提交事务
UPDATE outbox_event
SET status = 1,
    lease_owner = 'publisher-1',
    lease_until = DATE_ADD(NOW(), INTERVAL 60 SECOND)
WHERE event_id IN (?, ?, ?)
  AND (lease_until IS NULL OR lease_until < NOW());
~~~

`IN` 中的占位符数量按本批领取到的事件数生成，参数由 JDBC 绑定；多个 worker 领取时，事务内先锁定并更新租约，再提交。

业务写入在同一个 Spring 事务中插入订单和 Outbox。这里用 `ObjectMapper` 序列化一个明确版本化的事件 DTO；不要把整个数据库实体直接当消息契约。

~~~java
@Service
public class OrderApplicationService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    @Transactional
    public String createOrder(long orderId, long userId) throws JsonProcessingException {
        String eventId = UUID.randomUUID().toString();
        var event = new OrderCreatedEvent(1, eventId, orderId, userId);
        jdbc.update("INSERT INTO orders(id, user_id, status) VALUES (?, ?, 'CREATED')",
            orderId, userId);
        jdbc.update("""
            INSERT INTO outbox_event(event_id, aggregate_type, aggregate_id,
              event_type, payload, status)
            VALUES (?, 'Order', ?, 'OrderCreated', CAST(? AS JSON), 0)
            """, eventId, orderId, objectMapper.writeValueAsString(event));
        return eventId;
    }
}

record OrderCreatedEvent(int schemaVersion, String eventId,
                         long orderId, long userId) {}
~~~

发布器配置 publisher confirm 和 returns。示例里的 `claimBatch`、`markSent`、`scheduleRetry` 是需要由 JDBC Repository 实现的短事务操作；发布网络调用在事务之外执行。

~~~yaml
spring:
  rabbitmq:
    host: localhost
    port: 5672
    username: ${RABBIT_USER:guest}
    password: ${RABBIT_PASSWORD:guest}
    publisher-confirm-type: correlated
    publisher-returns: true
    template:
      mandatory: true
app:
  outbox:
    batch-size: 50
    lease-seconds: 60
    max-retries: 12
~~~

~~~java
@Component
public class OutboxPublisher {
    private final RabbitTemplate rabbit;
    private final OutboxRepository repository;

    @Scheduled(fixedDelayString = "${app.outbox.poll-delay-ms:500}")
    public void publishBatch() {
        for (OutboxEvent event : repository.claimBatch(50, "publisher-1")) {
            CorrelationData correlation = new CorrelationData(event.eventId());
            rabbit.convertAndSend("order.events", "order.created",
                event.payload(), correlation);
            correlation.getFuture().whenComplete((confirm, error) -> {
                if (error != null || !confirm.isAck() || correlation.getReturn() != null) {
                    repository.scheduleRetry(event.eventId(), safeReason(error, confirm));
                } else {
                    repository.markSent(event.eventId());
                }
            });
        }
    }
}
~~~

`repository` 的异步状态更新需要使用独立 Spring Bean 的事务方法，不能依赖同类自调用的 `@Transactional`。确认异步到达时租约可能已过期，因此 `markSent` 还应按事件 id 和当前状态做条件更新。调用入口示例：

~~~bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{"orderId":9001,"userId":42}'
~~~

## 五、项目真实落地

在企业项目中，我们通常会在“本地数据库更新必须最终触发外部异步动作”的场景评估 Outbox，例如订单状态变化后通知下游、业务记录变更后更新搜索索引。方案需要与消费者幂等、事件 schema 版本、消息顺序、重放和监控一起设计，不能只增加一张表就认为问题结束。

落地时最常见的坑是：发布失败无限重试造成 broker 压力；消息确认后状态更新失败导致重复；多实例重复领取；一次发布过多导致内存和连接池打满；死信事件没有排查入口。可使用有界批次、指数退避并加入随机抖动、租约与 `SKIP LOCKED`、最大重试和人工重放流程。业务要求严格顺序时，还要按聚合 id 分区或保证同一聚合的前序事件未完成时不发布后续事件。

消费者可以先插入 `processed_event(event_id)` 唯一键，再在同一事务里完成业务更新；重复键表示该事件已处理。但如果副作用还包含另一个外部系统，同样需要 Outbox 或幂等 token 扩展边界。验收应模拟提交后宕机、确认后状态更新前宕机、重复投递、不可路由、broker 暂停和数据库恢复，并检查最终状态，而非只看正常路径日志。

本文是基于消息可靠性学习整理出的通用可复现实验，没有把 Outbox 描述成我已在真实企业系统完成的改造。

## 六、常见面试问题

### 初级：Outbox 解决什么问题？

让业务记录和待发布事件在同一个数据库事务中提交，避免“业务提交了但消息记录没有留下”的双写缺口。

### 中级：Outbox 能保证 exactly-once 吗？

不能。发布确认后、数据库标记前的故障会导致重复发布。常见方案按至少一次处理，并用稳定事件 id 与消费者幂等保证业务效果可重复执行。

### 项目：publisher confirm 成功就表示消费者处理完成了吗？

不表示。confirm 是 broker 对生产者发布的确认；消费者是否收到、处理并提交自己的数据库事务是另一条链路。

### 项目：如何避免多个发布器重复领取？

在短数据库事务中通过行锁、`SKIP LOCKED` 或条件更新领取事件并设置租约，发布时在事务外执行；状态写回校验租约或版本，并允许租约超时恢复。

## 七、个人总结

作为一名 2027 届 Java 后端实习生，我把 Outbox 记成“先把待办消息和业务数据一起落库，再让后台可靠地送出去”。它解决的是跨资源双写的持久化窗口，但重复仍然存在，所以发布端确认、消费者幂等、有限重试、租约恢复和积压监控都缺一不可。面试时我会把保证边界讲清楚，不把 broker confirm 说成端到端一次且仅一次。

## 参考资料

- [Spring AMQP：Publisher Confirms and Returns](https://docs.spring.io/spring-amqp/reference/amqp/template.html)
- [Spring AMQP：连接与确认配置](https://docs.spring.io/spring-amqp/reference/4.0/amqp/connections.html)
- [RabbitMQ：Consumer Acknowledgements and Publisher Confirms](https://www.rabbitmq.com/docs/confirms)
