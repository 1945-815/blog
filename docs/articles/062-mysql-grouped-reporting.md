---
title: "MySQL 分组统计：从订单明细到分类报表"
date: "2027-05-25"
categories: ["数据库"]
tags: ["MySQL", "GROUP BY", "HAVING", "报表查询"]
description: "用订单明细设计分组报表，区分 WHERE 与 HAVING，并说明聚合查询的正确性和性能边界。"
plan_date: "2025-09-13"
phase: "Spring 与数据持久化"
---

# MySQL 分组统计：从订单明细到分类报表

## 问题背景

在后端报表中，常见需求包括统计每个商品分类的订单数和销售额，或筛选达到指定成交量的分类。如果把明细全部查到 Java 内存再循环累加，数据量增加后会抬高网络传输、堆内存和代码复杂度。

GROUP BY 和聚合函数可以让数据库直接按维度计算汇总结果。真正要掌握的不是背出 COUNT、SUM、AVG，而是知道哪些条件在分组前筛选，哪些条件必须在聚合之后判断，并确保每一行报表都能被明确解释。

## 核心概念

GROUP BY 将符合条件的明细行按一个或多个字段划分成组，再对每组计算 COUNT、SUM、AVG、MIN、MAX 等聚合值。比如按 category_id 分组，每个分类生成一行总数和总金额。

WHERE 面向分组前的明细行，适合过滤状态、租户、时间范围；HAVING 面向分组结果，适合过滤 SUM(amount) 或 COUNT(*)。可以记住逻辑处理顺序：FROM/JOIN、WHERE、GROUP BY、HAVING、SELECT、ORDER BY、LIMIT。写 SQL 的顺序不同于数据库理解查询的逻辑顺序。

COUNT(*) 计算组内行数，COUNT(column) 忽略该列为 NULL 的行，COUNT(DISTINCT user_id) 统计去重用户。SUM 对 NULL 的处理与业务零值不同：没有有效值时结果可能为 NULL，接口是否转成 0 应有明确约定。

## 底层原理

数据库先访问符合 FROM/JOIN 条件的数据，再应用 WHERE 过滤，然后根据分组键构造聚合结果。索引能帮助缩小输入范围或支持排序分组，但 GROUP BY 不等于“有索引就一定快”。要结合筛选条件、分组字段、数据分布、执行计划和返回行数验证。

开启 ONLY_FULL_GROUP_BY 时，SELECT、HAVING 和 ORDER BY 中非聚合表达式应出现在分组字段中，或能由分组键函数依赖地确定。随意选一个组里的商品名称没有确定业务含义；关闭 SQL 模式只会让不确定结果被接受，不能修正查询设计。

报表是读模型。明细表继续作为事实来源，汇总值应由 SQL 聚合得到；若统计跨度很大，可以考虑异步汇总表或定时汇总，但必须定义数据延迟和重算策略。不能为了少写代码就把所有历史明细无限期放进一次同步接口查询。

## 代码案例

示例表记录已支付订单的商品分类与金额。报表还可按租户、币种和退款状态拆分口径；这些维度应先明确业务定义，再加入 SQL。

~~~sql
CREATE TABLE order_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    paid_at DATETIME NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    KEY idx_status_paid_category (status, paid_at, category_id)
);

SELECT category_id,
       COUNT(DISTINCT order_id) AS order_count,
       COUNT(DISTINCT user_id) AS buyer_count,
       SUM(amount) AS total_amount,
       AVG(amount) AS avg_item_amount
FROM order_item
WHERE status = 'PAID'
  AND paid_at >= ?
  AND paid_at < ?
GROUP BY category_id
HAVING COUNT(DISTINCT order_id) >= ?
ORDER BY total_amount DESC
LIMIT ? OFFSET ?;
~~~

这个查询中，状态和支付时间先筛明细，分组后才知道一个分类的订单量，因此订单量门槛要放在 HAVING。展示“分类名称”时应将分类表关联进来，并确保关联关系是一对一，避免 JOIN 把明细重复放大。

MySQL 8.0 起分组不再隐式保证排序；上面的 `ORDER BY total_amount DESC` 是报表顺序的必要约束。如果要按分类编号展示，显式写 `ORDER BY category_id ASC`，不能依靠偶然的执行计划。

当一个查询结果要充当另一个查询的条件时，可以使用子查询。下面用已支付订单明细查出金额合计至少达到门槛的用户，`HAVING` 判断每组汇总值，外层只读取对应用户的明细。此例展示子查询语法，实际报表仍需先确认“金额合计”是按商品行还是订单计算。

~~~sql
SELECT id, order_id, user_id, amount
FROM order_item
WHERE user_id IN (
    SELECT user_id
    FROM order_item
    WHERE status = 'PAID'
    GROUP BY user_id
    HAVING SUM(amount) >= ?
)
ORDER BY user_id, id;
~~~

Java 层只负责接收参数、校验日期范围并调用 Mapper，不把金额聚合逻辑搬到内存。MyBatis 配置示例如下：

~~~yaml
mybatis:
  mapper-locations: classpath:/mapper/**/*.xml
  configuration:
    map-underscore-to-camel-case: true
~~~

~~~java
@Mapper
public interface CategoryReportMapper {
    List<CategoryReportRow> selectPaidSummary(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("minOrders") long minOrders,
            @Param("offset") int offset,
            @Param("pageSize") int pageSize);
}

public class CategoryReportRow {
    private Long categoryId;
    private Long orderCount;
    private Long buyerCount;
    private BigDecimal totalAmount;
    private BigDecimal avgItemAmount;
    // getter/setter 省略
}
~~~

Mapper XML 将上面的统计 SQL 与 Java 参数绑定起来。本文不在 Java 里复制聚合逻辑，XML 是执行查询的唯一位置。

~~~xml
<select id="selectPaidSummary" resultType="com.example.report.CategoryReportRow">
  SELECT category_id AS categoryId,
         COUNT(DISTINCT order_id) AS orderCount,
         COUNT(DISTINCT user_id) AS buyerCount,
         SUM(amount) AS totalAmount,
         AVG(amount) AS avgItemAmount
  FROM order_item
  WHERE status = 'PAID'
    AND paid_at &gt;= #{from}
    AND paid_at &lt; #{to}
  GROUP BY category_id
  HAVING COUNT(DISTINCT order_id) &gt;= #{minOrders}
  ORDER BY totalAmount DESC
  LIMIT #{pageSize} OFFSET #{offset}
</select>
~~~

实际调用示例：`curl "http://localhost:8080/api/reports/categories?from=2026-04-01T00:00:00&to=2026-05-01T00:00:00&minOrders=5&page=1&pageSize=20"`。Controller 要限制 pageSize 上限、校验 from 小于 to，并把一基页码换算为 offset；日期边界也应按业务时区约定转换。

## 报表口径与查询边界

后台报表接口可以按以下步骤设计：先明确“订单数”按订单主表还是订单商品行计算，明确取消和退款如何影响销售额，再写 SQL。一个订单有多个商品行时，直接 COUNT(*) 得到的是商品行数，不是订单数，这种口径差异应在字段名称和接口文档中说明。

常见问题是统计结果重复或金额偏大。排查顺序是先单表聚合验证，再加入维表关联；检查关联键是否唯一、是否一对多；最后对照少量订单人工核算。性能方面先查看 EXPLAIN 和筛选范围，再观察组合索引能否服务 WHERE 条件，不能仅凭索引列包含 GROUP BY 字段就断言优化有效。

当报表被高频查询时，可以加缓存或物化汇总，但要记录刷新频率、过期时间、补数方法和实时性承诺。性能收益应通过相同数据规模和查询条件下的基线对比确认。

## 常见问题
### WHERE 和 HAVING 有什么区别？

WHERE 过滤参与分组的明细行；HAVING 过滤聚合后的分组，通常会引用聚合表达式。

### GROUP BY 查询为什么报 ONLY_FULL_GROUP_BY 错误？

查询选择了无法由分组键唯一确定的非聚合字段。应调整分组或查询结构，不要为了通过 SQL 而随意关闭模式。

### 为什么报表销售额比订单金额大？

优先检查明细统计口径、JOIN 是否放大行数、订单多商品拆行、退款和取消处理，以及金额字段是否重复汇总。用少量主键样本和业务账单逐笔对账。

## 设计取舍与结论

报表 SQL 的首要约束是统计口径：定义分组维度、去重规则、关联基数和时间边界后，再检查 `GROUP BY`、`HAVING` 与执行计划。

## 参考资料

- [MySQL 8.4 GROUP BY Handling](https://dev.mysql.com/doc/refman/8.4/en/group-by-handling.html)
- [MySQL 8.4 GROUP BY Modifiers](https://dev.mysql.com/doc/refman/8.4/en/group-by-modifiers.html)
- [MySQL 8.0 ORDER BY Optimization](https://dev.mysql.com/doc/refman/8.0/en/order-by-optimization.html)
