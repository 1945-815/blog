---
title: "MyBatis 查询与批量写入性能：识别 N+1 并控制数据库往返"
date: "2027-02-09"
categories: ["持久层"]
tags: ["MyBatis", "SQL", "性能优化"]
description: "从查询次数、关联加载和批处理边界入手，分析 MyBatis 常见的 N+1 与批量写入问题。"
plan_date: "2026-02-10"
phase: "后端工程实践"
---

# MyBatis 查询与批量写入性能：识别 N+1 并控制数据库往返

## 问题背景

功能测试中只有几条数据时，逐条加载关联对象或逐条插入通常很难被发现。进入列表页、导入文件或批量更新场景后，数据库调用次数可能随记录数线性增加。慢的原因未必是某条 SQL 没有索引，也可能是应用用许多短查询拼出了一个本该一次完成的结果。

分析性能前先测量：记录请求耗时、SQL 数量、每条 SQL 的参数和数据库执行计划。只看到 MyBatis Mapper 方法被调用一次，并不能说明数据库只执行了一次 SQL；嵌套查询、循环调用和 ORM 延迟加载都可能在一次 Java 调用中触发多次往返。

## 核心概念

N+1 指先查一批主记录，再为每条主记录各发一条关联查询。若主记录 100 条，粗略就是 1 次列表查询加 100 次关联查询。可选方案是 JOIN 一次取回、先查主记录再按主键批量查关联表，或在确实需要时做分页预取。选型要考虑结果重复、对象组装成本、单次结果集大小和数据库索引。

批量写入也有不同层次：一个包含多组 values 的 SQL、JDBC PreparedStatement 批处理、MyBatis 的 Batch Executor，以及应用层分片循环并不完全等价。ExecutorType.BATCH 会缓存更新操作并在 flush 时批量发送；它不会自动把任意循环变成一条 INSERT，也不会替代事务、错误处理或分批控制。

## 底层原理

MyBatis Mapper 调用经由代理进入 SqlSession 和 Executor。默认 SIMPLE Executor 会为一次更新创建语句并执行；BATCH Executor 会复用语句并暂存更新，执行查询或显式 flush 时再把批次交给 JDBC 驱动。驱动能否进一步合并网络包或改写 SQL，取决于驱动版本和连接配置，应通过实际指标验证，不能仅凭“用了批处理”推断吞吐量。

嵌套查询的风险则来自调用链：结果映射读取关联属性时，如果映射配置触发另一个 select，结果集中的每一行都可能再次访问数据库。日志中出现连续且结构相同的 SQL 是重要线索。JOIN 或批量 IN 查询可以减少往返，但 IN 列表要分片，JOIN 结果也可能因一对多关系重复主表列。

排查时可以先对照一页数据的预期记录数和 SQL 总数，再检查重复 SQL 是否只改变主键参数。开发环境可短期开启 Mapper SQL 日志，注意对手机号、令牌等参数脱敏；生产环境优先用受控的指标和慢查询记录，避免把敏感参数完整写入普通应用日志。优化后再比较相同数据量下的查询次数、数据库耗时和返回行数。

## 代码案例

先建立一个最小数据模型：

~~~sql
CREATE TABLE orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(40) NOT NULL UNIQUE,
  buyer_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL,
  KEY idx_buyer_created (buyer_id, created_at)
);
CREATE TABLE order_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  sku_code VARCHAR(40) NOT NULL,
  quantity INT NOT NULL,
  KEY idx_order_id (order_id)
);
~~~

MyBatis 可将字段下划线映射为 Java 驼峰名，连接地址和口令由环境注入：

~~~yaml
mybatis:
  configuration:
    map-underscore-to-camel-case: true
spring:
  datasource:
    url: ${DB_URL:jdbc:mysql://localhost:3306/shop_demo}
    username: ${DB_USER:root}
    password: ${DB_PASSWORD:}
~~~

N+1 的原始写法可能是循环中按订单 ID 查询明细：

~~~java
List<Order> orders = orderMapper.selectRecentByBuyer(buyerId);
for (Order order : orders) {
    order.setItems(itemMapper.selectByOrderId(order.getId())); // 每条订单再查一次
}
~~~

可以将所有订单 ID 收集后按固定上限分片查询明细，再按 orderId 分组组装。Mapper SQL 使用集合参数绑定：

~~~xml
<select id="selectByOrderIds" resultType="OrderItem">
  SELECT id, order_id AS orderId, sku_code AS skuCode, quantity
  FROM order_item
  WHERE order_id IN
  <foreach collection="orderIds" item="id" open="(" separator="," close=")">
    #{id}
  </foreach>
</select>
~~~

Mapper 方法显式命名参数，避免 XML 集合名与 Java 形参名不一致：

~~~java
List<OrderItem> selectByOrderIds(@Param("orderIds") List<Long> orderIds);
~~~

批量写入的最小调用示意如下。真实 Spring 项目可使用专门配置为 ExecutorType.BATCH 的 SqlSessionTemplate，并由事务管理器控制边界；不要在同一业务中混用不同 ExecutorType 的 SqlSession 而不了解其事务行为。

~~~java
SqlSession session = sqlSessionFactory.openSession(ExecutorType.BATCH, false);
try {
    OrderItemMapper mapper = session.getMapper(OrderItemMapper.class);
    int count = 0;
    for (OrderItem item : items) {
        mapper.insert(item);
        if (++count % 500 == 0) session.flushStatements();
    }
    session.flushStatements();
    session.commit();
} catch (RuntimeException ex) {
    session.rollback();
    throw ex;
} finally {
    session.close();
}
~~~

使用 Mapper 的实际入口可以是 batchWriter.insertItems(items)。每次提交前应校验输入、控制单批大小并观察锁等待与内存占用。若需要自增主键回填，要单独验证具体驱动和执行器的行为；不能假设批处理返回值与逐条执行完全相同。

## 优化验证与适用范围

排查查询性能时，先用 SQL 日志确认调用次数，再用代表性数据量复现。列表读取可比较 N+1、JOIN 和两段式批量查询；批量写入则记录每批条数、耗时、失败位置和事务范围，并用 EXPLAIN 检查过滤与排序条件是否匹配索引。

常见问题包括 JOIN 后分页重复、IN 参数过多、一个超大事务锁表、批次中途失败后部分数据不一致。可按业务键分页读取，在查询关联数据时按上限分片，批量写入按可恢复边界提交，并使用唯一约束或幂等键保障重试安全。这里是通用方案示意，不声称已经在企业生产库验证。

如果批次很大，还要检查每次 flush 后是否释放了不再需要的对象引用，避免 Java 堆内存随输入规模增长。批大小不应机械固定为 500：它受字段数、数据库参数限制、网络、事务时长和锁竞争影响，应以测试环境测量为准。读写拆分也要遵循一致性要求，不能为减少查询就把刚写入的数据读到延迟副本上。

## 设计取舍与结论

数据库访问成本可以从往返次数、返回行数、执行计划和事务范围分解。比较改动前后的结果时，应保持数据规模与查询条件一致，才能解释性能差异。

## 参考资料

- [MyBatis Configuration](https://mybatis.org/mybatis-3/configuration)
- [MyBatis Java API：ExecutorType](https://mybatis.org/mybatis-3/java-api.html)
