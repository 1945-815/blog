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
phase: "Spring 与数据持久化"
---

# 用 MyBatis-Plus 实现条件筛选和分页查询

## 问题背景

文档和管理列表通常按分类、关键词、状态过滤并分页返回。把所有条件拼成动态 SQL 容易漏掉空值处理，也可能开放不安全的排序参数。

## 核心原理

请求 DTO 只承载查询条件；服务层校验分页范围并组装查询；Mapper 执行数据库查询；响应 DTO 隔离持久化模型。分页插件帮助生成分页 SQL，但总数查询与排序规则仍要按数据库和插件版本验证。

## 实现示例

对可选分类和状态使用条件构造器，仅在值有效时添加 where 条件。页码、页大小设上限；排序字段通过白名单映射为预定义列，不把客户端字符串直接交给 SQL。接口返回 records、total、page、size 等明确信息。

查询条件从 Controller DTO 进入服务层，再被映射成 QueryWrapper 或自定义 SQL。分页拦截器在执行阶段改写查询并可能生成 count 查询。大偏移量分页会增加扫描成本，可根据场景评估基于游标或时间/id 的 seek pagination。

### 源码与机制观察

**源码观察：**检查 MybatisPlusInterceptor 对 Executor 查询的拦截点和分页拦截器如何调整 SQL。插件版本和分页方言会影响配置；分页插件应按官方版本文档设置，并验证 count SQL。

```java
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

Page<Document> page = new Page<>(safePage, safeSize);
LambdaQueryWrapper<Document> query = Wrappers.lambdaQuery();
query.eq(categoryId != null, Document::getCategoryId, categoryId)
     .eq(status != null, Document::getStatus, status)
     .orderByDesc(Document::getUpdatedAt);
IPage<Document> result = mapper.selectPage(page, query);
```

### 补充：BaseMapper CRUD 与分页插件

以下沿用文档目录模型，展示 `BaseMapper` 的单表操作；查询条件仍与前文的分类、状态和更新时间保持一致：

```sql
CREATE TABLE document (
  id BIGINT NOT NULL AUTO_INCREMENT,
  category_id BIGINT NOT NULL,
  title VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_category_status_updated (category_id, status, updated_at)
);
```

实体和 Mapper 声明表映射与主键策略后，可复用 `BaseMapper` 的单表方法。字段名按 MyBatis-Plus 的驼峰映射约定对应 `category_id` 与 `updated_at`：

```java
import java.time.LocalDateTime;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

@TableName("document")
public class Document {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long categoryId;
    private String title;
    private String status;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

@Mapper
public interface DocumentMapper extends BaseMapper<Document> {}
```

在由 Spring 管理的 Service 中注入 `DocumentMapper` 后，可以按主键读取或插入记录：

```java
Document document = mapper.selectById(1L);
Document added = new Document();
added.setCategoryId(10L);
added.setTitle("接口分页与排序");
added.setStatus("PUBLISHED");
added.setUpdatedAt(LocalDateTime.now());
mapper.insert(added);
```

“通用 CRUD 不用手写 SQL”只适用于框架已覆盖的单表操作；复杂联表、聚合、锁定或有特殊执行计划要求时，仍应编写并审查明确 SQL。`updateById` 的字段更新策略也要与“字段未传”和“清空字段”的语义匹配。

分页示例还需要注册分页拦截器；单靠 `Page` 参数不会自动启用分页。下面是官方文档中的 MySQL 配置形式：

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

使用多个内置拦截器时，分页拦截器按官方说明放在最后。MyBatis-Plus 3.5.9 起，分页插件拆分为单独的 `mybatis-plus-jsqlparser` 依赖；复制配置前应对照项目锁定版本确认依赖坐标和插件包名。
## 列表查询的落地检查

使用合成文档数据完成分类、状态和分页筛选，分别检查空条件、越界页码以及排序字段被拒绝的情况。

## 边界与常见问题

空字符串和 null 的语义要统一；条件遗漏可能扩大结果集。实体不宜直接暴露到响应。MyBatis-Plus 分页插件配置随版本变化，拦截器顺序和依赖版本要查官方文档，不能照搬过期配置。

## 改进思路

限制页大小和可排序字段，对过滤条件建立适当索引；大偏移量查询必要时评估基于游标的分页。

## 设计取舍与结论

分页接口要同时约束输入、查询条件、排序和响应模型。框架负责减少重复代码，不能代替 SQL 设计。

## 参考资料

- [MyBatis-Plus 分页插件](https://baomidou.com/plugins/pagination/)（配置与拆分依赖按当前文档标明版本核对）
- [MyBatis Dynamic SQL](https://mybatis.org/mybatis-3/dynamic-sql.html)
