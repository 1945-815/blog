---
title: "MySQL InnoDB MVCC：一致性读与事务快照"
date: "2027-06-29"
categories: ["数据库"]
tags: ["MySQL", "InnoDB", "MVCC", "事务隔离"]
description: "通过两个事务的可复现实验理解 InnoDB 版本链、一致性读快照，以及普通查询和锁定读的差异。"
plan_date: "2024-02-17"
phase: "Spring 与数据持久化"
---

# MySQL InnoDB MVCC：一致性读与事务快照

## 问题背景

开发中经常遇到“另一个事务已经更新并提交，但我当前事务为什么还看到旧值”的问题。如果只把事务隔离记成四个名字，遇到这种现象时很难判断是缓存、隔离级别还是代码事务边界导致。理解一致性读能帮助我们分析报表读取、并发修改、长事务和库存展示等场景。

MVCC 也不是“所有 SQL 都不加锁”。普通一致性读、`SELECT ... FOR UPDATE`、`UPDATE` 的读写行为不同。把这些操作混为一谈，容易在库存扣减或状态迁移时误以为普通查询已经锁住了数据。

## 核心概念

MVCC（多版本并发控制）让 InnoDB 在需要时读取行的历史版本。行的修改会生成 undo 信息，旧版本可通过版本链还原；普通一致性读根据当前事务的 Read View 判断哪个已提交版本对自己可见。它减少了读与写之间不必要的互相等待，但并不替代锁和业务约束。

在 InnoDB 默认 `REPEATABLE READ` 下，同一个事务的普通一致性读使用该事务第一次一致性读建立的快照。因此事务期间其他事务提交的更新通常不会改变后续普通读看到的版本。`READ COMMITTED` 则在每次一致性读时建立新的快照，所以同一事务两次普通查询可能看到不同的已提交结果。

锁定读是另一条路径。`SELECT ... FOR UPDATE` 和 `SELECT ... FOR SHARE` 会请求相应锁，读到当前可用于锁定的版本；`UPDATE`、`DELETE` 也属于写操作，并受索引访问范围和锁策略影响。用唯一索引等值查询通常只锁命中的索引记录；范围查询可能涉及间隙锁或 next-key lock。具体锁范围要结合执行计划、索引和隔离级别判断。

## 底层原理

InnoDB 记录包含事务相关信息和指向 undo 版本的线索。当一行被更新时，旧字段值可保存在 undo 记录中，形成可沿链回溯的历史版本。Read View 记录快照建立时活跃事务的可见性边界。执行普通读时，InnoDB 根据版本提交状态和 Read View 的边界向前查找，直到找到当前事务允许读取的版本。

因此旧版本不会立刻全部消失：活跃事务仍可能需要它们完成一致性读。长时间不提交的事务会让旧版本保留更久，增加 undo 清理压力，并可能影响空间回收和系统维护。只读事务也应及时结束，不要让事务跨越漫长的用户交互或外部网络调用。

以下 SQL 用来观察普通一致性读的差异。先初始化数据，然后分别在两个 MySQL 会话执行步骤。默认隔离级别通常为 RR，验证时建议显式设置，避免实例配置造成误判。

~~~sql
CREATE TABLE inventory_demo (
  sku_id BIGINT PRIMARY KEY,
  available INT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
INSERT INTO inventory_demo(sku_id, available) VALUES (77, 10);

-- 会话 A：默认 RR，第一次普通 SELECT 建立一致性读快照
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
START TRANSACTION;
SELECT available FROM inventory_demo WHERE sku_id = 77;
-- 暂停，在会话 B 更新并提交后，再执行下一句
SELECT available FROM inventory_demo WHERE sku_id = 77;
COMMIT;

-- 会话 B：与会话 A 并行执行
START TRANSACTION;
UPDATE inventory_demo SET available = 9 WHERE sku_id = 77;
COMMIT;
~~~

会话 A 的两次普通读取在 RR 下仍会看到快照里的旧值。把 A 的隔离级别改为 RC 并重做实验，第二次一致性读会建立新快照，可以看到 B 已提交的新值。再把 A 的第二次读取换成 `SELECT ... FOR UPDATE`，就可以观察锁定读和普通快照读并非同一种操作。

## 代码案例

Spring 的 `Isolation.DEFAULT` 表示使用底层数据库的默认隔离级别；如果服务方法显式选择隔离级别，要确认事务代理实际生效、连接来自预期数据源，且没有自调用绕过代理。下面用 JDBC 展示一段适合本地并发实验的只读服务。暂停只为演示，生产代码不应在事务内 `sleep`。

~~~java
@Service
public class InventorySnapshotService {
    private final JdbcTemplate jdbc;

    public InventorySnapshotService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ, readOnly = true)
    public List<Integer> observeTwice(long skuId) {
        Integer first = jdbc.queryForObject(
            "SELECT available FROM inventory_demo WHERE sku_id = ?",
            Integer.class, skuId);
        try {
            Thread.sleep(5000); // 仅用于演示会话间隔
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("读取实验被中断", e);
        }
        Integer second = jdbc.queryForObject(
            "SELECT available FROM inventory_demo WHERE sku_id = ?",
            Integer.class, skuId);
        return List.of(first, second);
    }
}
~~~

本地数据库连接示例：

~~~yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/backend_demo?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: ${DB_USER:root}
    password: ${DB_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver
~~~

接口调用：

~~~bash
curl "http://localhost:8080/api/inventory/77/observe-twice"
~~~

在另一个 SQL 客户端中，服务返回前执行 `UPDATE inventory_demo SET available = 9 WHERE sku_id = 77;` 并提交。RR 下返回的两个值应体现同一个一致性快照；若实验结果不同，先检查请求是否处于同一事务、数据库实际隔离级别、是否走了读写分离副本，以及是不是把第二条语句改成了锁定读。

## 一致性读取的应用边界

一致性读适合读取某个一致时点的数据；锁定读、条件更新或唯一约束则适用于协调并发写入。比如库存展示可以是普通查询，扣减库存应使用原子条件更新并检查受影响行数，不能依赖“先查到库存大于零”。

排查慢查询或事务等待时，除了看 SQL 和索引，也要看事务持续时间、锁等待、隔离级别和是否存在长时间未提交连接。需要多条查询看到同一逻辑快照时，RR 可能符合预期；若每次读都希望拿到最新已提交版本，可评估 RC，但必须一起检查锁策略、复制行为和业务一致性要求。

隔离级别会改变并发事务可见的数据范围。调整前应在目标 MySQL 版本上设计并执行并发验证，并评估现有事务、锁等待和读写负载。

## 设计取舍与结论

MVCC 的快照读与锁定读承担不同职责。遇到读到旧值或并发写冲突时，应同时检查事务边界、隔离级别、SQL 类型、索引和连接路由。

## 参考资料

- [MySQL 8.4：InnoDB 多版本控制](https://dev.mysql.com/doc/refman/8.4/en/innodb-multi-versioning.html)
- [MySQL 8.4：一致性非锁定读](https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html)
- [MySQL 8.4：InnoDB 事务隔离级别](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html)
