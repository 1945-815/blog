---
title: "Redis 分布式锁实践：租约、唯一标识与数据库兜底"
date: "2027-03-30"
categories: ["Redis"]
tags: ["Redis", "分布式锁", "幂等", "并发控制"]
description: "从 SET NX PX 和比较后删除 Lua 脚本理解锁租约，并说明 Redis 锁与数据库约束的职责边界。"
plan_date: "2026-03-22"
phase: "Java 后端实习与业务实践"
---

# Redis 分布式锁实践：租约、唯一标识与数据库兜底

## 一、为什么学习这个技术

同一订单可能被两个请求同时处理；同一份统计任务也可能在多实例环境中同时启动。单机 synchronized 只能协调同一个 JVM 内的线程，不能让另一台服务进程看到这把锁。Redis 可以作为跨实例的短期协调点，但使用错误会造成锁永不释放、误删他人锁或任务超时后并发执行。

锁只能限制一段临界操作的并发，不能保证进程崩溃后的业务结果自动回滚，也不能取代唯一约束。设计前要先问：不加锁会造成什么错误？能否用数据库条件更新或幂等键直接解决？若确需锁，再明确锁资源、持有期限和失败策略。

## 二、核心概念

常见单实例 Redis 锁使用 SET key token NX PX ttl：只有键不存在时才设置，并同时写入过期时间。token 是本次持有者生成的随机唯一值，用于安全释放。不能先 SETNX、再单独 EXPIRE，因为两条命令之间进程崩溃会留下无过期时间的锁。

过期时间是一段租约，不是永久互斥证明。若业务执行超过 TTL，锁可能已被新请求获取；旧请求恢复后仍继续写入，就会出现两个执行者。锁值校验加 Lua 比较删除可以防止旧持有者删掉新锁，却不能阻止旧持有者继续访问数据库或第三方资源。对高风险写操作还要考虑数据库版本条件或 fencing token。

## 三、底层原理

Redis 将 SET 命令中的 NX 条件和 PX 过期时间作为一个原子操作执行。释放脚本在 Redis 侧比较当前 value 与调用者 token，匹配才 DEL，避免“租约过期—别人重新加锁—旧客户端执行 DEL”造成误删。

这一方案的安全边界受 Redis 部署和故障切换语义影响。简单主从异步复制可能在主节点故障切换时丢失刚写入的锁，使两个客户端都认为自己持锁。锁实现不能只看 Java API 名称；关键资金、库存或不可逆操作应优先依赖数据库唯一约束、条件更新或具备单调 fencing 语义的协调方案。

## 四、代码案例

配置明确锁租期和等待策略，等待时间应有限，避免请求线程无限循环：

~~~yaml
app:
  locks:
    order-lease: 15s
    acquire-timeout: 300ms
~~~

订单表用业务幂等键兜住最终一致性。Redis 锁降低同一请求并发进入的概率，唯一索引才是在数据库写入层的最终竞争裁决：

~~~sql
CREATE TABLE order_request (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  request_key VARCHAR(80) NOT NULL,
  order_id BIGINT NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_request_key (request_key)
);
~~~

Spring Data Redis 可设置有期限的唯一 token，并用 Lua 脚本比较后释放：

~~~java
String key = "lock:order:" + orderId;
String token = UUID.randomUUID().toString();
Boolean acquired = redisTemplate.opsForValue()
    .setIfAbsent(key, token, Duration.ofSeconds(15));
if (!Boolean.TRUE.equals(acquired)) {
    throw new BusyException("订单正在处理中");
}
try {
    orderService.confirmOnce(orderId, requestKey);
} finally {
    redisTemplate.execute(unlockScript, List.of(key), token);
}
~~~

unlockScript 的脚本逻辑为：读取 KEYS[1]，仅当其值等于 ARGV[1] 时删除，否则返回 0。实际实现应使用 DefaultRedisScript 执行该脚本，不要把 GET 和 DEL 分成两个网络命令。调用方传入 confirmOnce(orderId, requestKey)，服务层仍应在事务内写入唯一 requestKey 并更新订单状态。

~~~lua
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
else
  return 0
end
~~~

## 五、项目真实落地

在企业项目中，我们通常按业务资源生成锁键，例如订单号或用户 ID，并设置随机 token、租约和有限等待。成功后做尽可能短的临界操作， finally 中尝试安全释放；进程崩溃时由 TTL 回收。业务写入再由数据库唯一约束或版本条件守住，外部通知放在可靠的事务后事件或补偿链路处理。

常见问题包括 TTL 短于任务耗时、客户端时钟被用于判断租期、异常路径忘记释放，以及锁争用时无限自旋。先测量临界区耗时并留出抖动，再决定是否需要续租；续租失败时必须定义任务是否停止。若资源能识别单调递增的 fencing token，可拒绝旧 token 的写入；若下游不校验，单靠 Redis 锁并不能解决持锁过期后的陈旧写入。

网络超时也需要单独处理：客户端可能没有收到 SET 的响应，却无法确定 Redis 是否已经保存了 token。对无法确认锁状态的请求应采用保守失败策略，不能假设锁一定没拿到后继续执行。监控可以记录获取成功率、等待时长、持有时长、释放失败和租期耗尽次数，帮助发现 TTL 与真实任务时长不匹配。

## 六、常见面试问题

### 初级：SET NX PX 分别解决什么问题？

NX 保证键不存在时才获取锁；PX 在同一命令中设置有限租期，降低进程崩溃后永久占锁的风险。

### 中级：为什么释放锁要用 Lua 比较 token？

先 GET 再 DEL 不是原子操作，期间锁可能过期并被他人取得。Lua 在 Redis 内完成比较和删除，只释放当前持有者的锁。

### 项目：Redis 锁能保证订单绝不重复吗？

不能单独保证。锁可能过期或在故障切换时丢失；关键写入仍需要数据库唯一键、条件更新和幂等处理。锁主要减少并发冲突，不是唯一正确性来源。

## 七、个人总结

作为一名 2027 届 Java 后端实习生，我会把 Redis 锁看成有期限的协调租约。获得锁、释放锁和业务提交是三个不同边界；把它们混为一谈会产生错误的安全感。先用数据库约束表达业务唯一性，再决定是否需要锁来降低冲突，设计会更扎实。

## 参考资料

- [Redis：Distributed Locks](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/)
- [Redis：SET command](https://redis.io/docs/latest/commands/set/)
