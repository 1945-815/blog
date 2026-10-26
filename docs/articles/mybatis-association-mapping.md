---
title: "MyBatis 关联映射：分类文档的一对多与文档标签的多对多"
date: "2026-10-16"
categories: ["持久层"]
tags: ["MyBatis", "MySQL", "关联映射"]
description: "说明 resultMap、collection 和关系表的用法，并从 SQL 结果粒度设计对象映射。"
plan_date: "2026-10-16"
phase: "Spring 与数据持久化"
---

# MyBatis 关联映射：分类文档的一对多与文档标签的多对多

设计关联映射前，先确认 SQL 结果的一行代表什么。MyBatis 可以把重复的父记录聚合为对象及其集合，但不能替代对连接条件、结果粒度和重复数据的判断。

## 一对多：分类与文档

一个分类可以关联多篇文档；文档表通过外键指向分类。`LEFT JOIN` 使没有文档的分类也能出现在结果中：

```sql
CREATE TABLE category (
  id BIGINT PRIMARY KEY,
  name VARCHAR(80) NOT NULL
);
CREATE TABLE document (
  id BIGINT PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  category_id BIGINT NOT NULL,
  CONSTRAINT fk_document_category
    FOREIGN KEY (category_id) REFERENCES category(id)
);
```

模型类将文档列表初始化为空，避免无子记录时调用方处理 `null`：

```java
package demo;

import java.util.ArrayList;
import java.util.List;

public class Category {
    private Long id;
    private String name;
    private List<Document> documents = new ArrayList<>();
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public List<Document> getDocuments() { return documents; }
    public void setDocuments(List<Document> documents) { this.documents = documents; }
}
```

```java
package demo;

public class Document {
    private Long id;
    private String title;
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
}
```

Mapper 方法 `Category findWithDocuments(Long id)` 对应的 XML 如下。列别名区分两张表的同名字段；父子两层 `<id>` 让 MyBatis 识别重复的分类行和不同文档。`notNullColumn` 可避免没有匹配文档时创建字段全空的子对象。

```xml
<mapper namespace="demo.CategoryMapper">
  <resultMap id="categoryWithDocuments" type="demo.Category">
    <id property="id" column="c_id"/>
    <result property="name" column="c_name"/>
    <collection property="documents" ofType="demo.Document" notNullColumn="d_id">
      <id property="id" column="d_id"/>
      <result property="title" column="d_title"/>
    </collection>
  </resultMap>

  <select id="findWithDocuments" resultMap="categoryWithDocuments">
    SELECT c.id AS c_id, c.name AS c_name,
           d.id AS d_id, d.title AS d_title
    FROM category AS c
    LEFT JOIN document AS d ON d.category_id = c.id
    WHERE c.id = #{id}
    ORDER BY d.id
  </select>
</mapper>
```

```java
package demo;

public interface CategoryMapper {
    Category findWithDocuments(Long id);
}
```

将 XML 放到 classpath 并在 MyBatis 配置中登记 Mapper 后，可以分别查询空分类和包含多个文档的分类，核对空集合与子对象数量。

## 多对多：文档与标签

多对多关系由中间表表达。联合主键可阻止同一文档与标签的关联重复写入：

```sql
CREATE TABLE tag (
  id BIGINT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE
);
CREATE TABLE document_tag (
  document_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  PRIMARY KEY (document_id, tag_id),
  FOREIGN KEY (document_id) REFERENCES document(id),
  FOREIGN KEY (tag_id) REFERENCES tag(id)
);

SELECT t.id, t.name
FROM tag AS t
JOIN document_tag AS dt ON dt.tag_id = t.id
WHERE dt.document_id = ?
ORDER BY t.id;
```

删除文档时，需要在事务中删除关联行，再删除文档；也可以通过明确的外键 `ON DELETE` 策略让数据库处理。标签本身是否删除是另一项数据生命周期决策，不能为了让关联行消失就级联删除仍被其他文档使用的标签。

一对一关系可用唯一外键表示，再用 `<association>` 映射单个对象；它与 `<collection>` 的区别是属性基数。选择嵌套连接结果还是分步查询时，应注意列表查询的 N+1 风险。相关性能边界见 [MyBatis 查询与批量写入性能](/articles/047-mybatis-query-batch-performance)。

XML 映射行为参考 [MyBatis Mapper XML 官方文档](https://mybatis.org/mybatis-3/sqlmap-xml.html)。
