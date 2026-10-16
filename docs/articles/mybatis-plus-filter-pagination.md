---
title: "用 MyBatis-Plus 实现条件筛选和分页查询"
date: "2026-10-13"
categories: ["持久层"]
tags: [
  "MyBatis-Plus",
  "MySQL",
  "分页"
]
description: "从查询 DTO 到条件构造和分页响应，搭建可控的列表接口查询链路。"
plan_date: "2024-07-20"
phase: "数据库与 Spring 基础"
---

# 用 MyBatis-Plus 实现条件筛选和分页查询

### 文章定位

这篇文章对应路线图中的“持久层”阶段，目标是把概念、实现和验证过程连接起来。内容以个人学习与简历可支撑的实践为边界；示例代码与机制分析应结合实际依赖版本和运行环境核对。

### 学习目标

- 能解释本文核心机制以及它解决的问题。
- 能搭建最小示例，并说明输入、输出和失败路径。
- 能区分通用 Demo、个人练习与实习协作内容。

## 一、为什么学习这个技术

文档和管理列表通常按分类、关键词、状态过滤并分页返回。把所有条件拼成动态 SQL 容易漏掉空值处理，也可能开放不安全的排序参数。

## 二、技术原理

请求 DTO 只承载查询条件；服务层校验分页范围并组装查询；Mapper 执行数据库查询；响应 DTO 隔离持久化模型。分页插件帮助生成分页 SQL，但总数查询与排序规则仍要按数据库和插件版本验证。

## 三、核心代码实现

对可选分类和状态使用条件构造器，仅在值有效时添加 where 条件。页码、页大小设上限；排序字段通过白名单映射为预定义列，不把客户端字符串直接交给 SQL。接口返回 records、total、page、size 等明确信息。

查询条件从 Controller DTO 进入服务层，再被映射成 QueryWrapper 或自定义 SQL。分页拦截器在执行阶段改写查询并可能生成 count 查询。大偏移量分页会增加扫描成本，可根据场景评估基于游标或时间/id 的 seek pagination。

### 源码与机制观察

**源码观察：**检查 MybatisPlusInterceptor 对 Executor 查询的拦截点和分页拦截器如何调整 SQL。插件版本和分页方言会影响配置；分页插件应按官方版本文档设置，并验证 count SQL。

```java
Page<Document> page = new Page<>(safePage, safeSize);
LambdaQueryWrapper<Document> query = Wrappers.lambdaQuery();
query.eq(categoryId != null, Document::getCategoryId, categoryId)
     .orderByDesc(Document::getUpdatedAt);
IPage<Document> result = mapper.selectPage(page, query);
```

### 补充：BaseMapper CRUD 与分页插件

本地《MyBatis-Plus.md》从 `department`、`employee` 表讲解通用 Mapper、实体映射、Wrapper 和分页。下面保留 `department` 示例的字段含义，DDL 写成精简的 MySQL 形式：

```sql
CREATE TABLE department (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(14),
  sn VARCHAR(13),
  PRIMARY KEY (id)
);
```

实体和 Mapper 只需声明表映射与主键策略，就能调用 `BaseMapper` 提供的单表方法：

```java
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

@TableName("department")
public class Department {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String sn;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSn() { return sn; }
    public void setSn(String sn) { this.sn = sn; }
}

@Mapper
public interface DepartmentMapper extends BaseMapper<Department> {
}

// 在 Spring 管理的 Service 中注入 DepartmentMapper mapper 后：
Department department = mapper.selectById(1L);
Department added = new Department();
added.setName("财务部");
added.setSn("cwb");
mapper.insert(added);
```

“通用 CRUD 不用手写 SQL”仅适用于框架已覆盖的单表操作；复杂联表、聚合、锁定或有特殊执行计划要求时，仍应编写并审查明确 SQL。`updateById` 的字段更新策略也要与“字段未传”和“清空字段”语义匹配。

分页示例还需要在 MyBatis-Plus 中注册分页拦截器，单靠 `Page` 参数并不会自动启用分页。下面是当前官方文档的 MySQL 配置形式：

```java
import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MybatisPlusConfig {
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(
            new PaginationInnerInterceptor(DbType.MYSQL)
        );
        return interceptor;
    }
}
```

使用多个内置拦截器时，分页拦截器按官方说明放在最后。当前官网说明自 MyBatis-Plus 3.5.9 起，分页插件拆分为单独的 `mybatis-plus-jsqlparser` 依赖；本地讲义没有记录依赖版本，因此这里不把版本猜作课程环境。复制配置前应先对照项目的 `pom.xml` 或锁定版本文档确认 artifact 和插件包名。

## 四、列表查询的落地检查

使用合成文档数据完成分类、状态和分页筛选，分别检查空条件、越界页码以及排序字段被拒绝的情况。

## 五、遇到的问题

空字符串和 null 的语义要统一；条件遗漏可能扩大结果集。实体不宜直接暴露到响应。MyBatis-Plus 分页插件配置随版本变化，拦截器顺序和依赖版本要查官方文档，不能照搬过期配置。

## 六、优化方案

限制页大小和可排序字段，对过滤条件建立适当索引；大偏移量查询必要时评估基于游标的分页。

## 七、个人思考

分页接口要同时约束输入、查询条件、排序和响应模型。框架负责减少重复代码，不能代替 SQL 设计。

## 延伸：面试问答

### 排序字段为什么要白名单？

列名不能像普通值一样安全绑定，白名单可以把客户端可选项映射到固定列，降低注入与误排序风险。

### total 为什么可能很贵？

count 查询需要评估过滤条件、索引和数据规模；某些业务可以采用近似、延迟统计或游标分页。

### 什么时候写自定义 SQL？

复杂 join、聚合或特定执行计划需求下，自定义 SQL 更容易明确查询意图并便于分析。

## 延伸：项目追问

**追问：**如果把这项技术放进简历所述的文档管理、预约或审批场景，如何说明自己的工作？

**回答思路：**先限定本人实际负责范围，再讲接口边界、数据流、异常路径和验证方法。若内容来自独立 Demo，应直接说明是个人练习，不借用公司项目表述。

## 参考资料

- [MyBatis-Plus 分页插件](https://baomidou.com/plugins/pagination/)（配置与拆分依赖按当前文档标明版本核对）
- [MyBatis Dynamic SQL](https://mybatis.org/mybatis-3/dynamic-sql.html)
