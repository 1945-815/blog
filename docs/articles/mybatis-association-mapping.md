---
title: "MyBatis 关联映射：部门员工的一对多与学生教师的多对多"
date: "2026-10-16"
categories: ["持久层"]
tags: ["MyBatis", "MySQL", "关联映射"]
description: "用本地课堂关系练习 resultMap、collection 和关系表，先确认查询结果的粒度再映射对象。"
plan_date: "2026-10-16"
phase: "数据库与 Spring 基础"
---

# MyBatis 关联映射：部门员工的一对多与学生教师的多对多

本地 `0717MyBatis加强` 从对象关联讲到一对一、一对多和多对多，课堂案例分别用了部门/员工与学生/教师。关系映射前先问：SQL 的一行表示一个员工，还是一个部门？MyBatis 不能替我们纠正错误的连接关系或重复数据。

## 一对多：一个部门和它的员工

练习表使用 `dept` 和 `emp`。员工表的 `dept_id` 指向部门，一个部门可以没有员工；查询时使用 `LEFT JOIN`，让空部门仍能返回。

```sql
CREATE TABLE dept (
  id BIGINT PRIMARY KEY,
  name VARCHAR(80) NOT NULL
);
CREATE TABLE emp (
  id BIGINT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  dept_id BIGINT NOT NULL,
  CONSTRAINT fk_emp_dept FOREIGN KEY (dept_id) REFERENCES dept(id)
);
```

模型类需要普通 getter/setter。这里将员工列表初始化为空，避免查询没有员工时直接处理 `null`：

```java
package demo;

import java.util.ArrayList;
import java.util.List;

public class Department {
    private Long id;
    private String name;
    private List<Employee> employees = new ArrayList<>();
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public List<Employee> getEmployees() { return employees; }
    public void setEmployees(List<Employee> employees) { this.employees = employees; }
}
```

```java
package demo;

public class Employee {
    private Long id;
    private String name;
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
```

Mapper 接口 `Department findWithEmployees(Long id)` 对应的 XML 如下。列别名区分两张表的 `id/name`；父子两层 `<id>` 让 MyBatis 识别同一个部门和不同员工，避免连接结果重复创建父对象。`notNullColumn` 使未匹配员工时不产生一个字段全空的员工对象。

```xml
<mapper namespace="demo.DepartmentMapper">
  <resultMap id="departmentWithEmployees" type="demo.Department">
    <id property="id" column="d_id"/>
    <result property="name" column="d_name"/>
    <collection property="employees" ofType="demo.Employee" notNullColumn="e_id">
      <id property="id" column="e_id"/>
      <result property="name" column="e_name"/>
    </collection>
  </resultMap>

  <select id="findWithEmployees" resultMap="departmentWithEmployees">
    SELECT d.id AS d_id, d.name AS d_name,
           e.id AS e_id, e.name AS e_name
    FROM dept AS d
    LEFT JOIN emp AS e ON e.dept_id = d.id
    WHERE d.id = #{id}
    ORDER BY e.id
  </select>
</mapper>
```

```java
package demo;

public interface DepartmentMapper {
    Department findWithEmployees(Long id);
}
```

把 XML 放在 classpath 并在 MyBatis 配置中登记 Mapper，运行方式与 [MyBatis 入门与会话管理](/articles/mybatis-session-mapper-basics) 相同。插入一个没有员工的部门、一个有两名员工的部门，再分别按 ID 查询，可检查空集合与两个子对象是否正确。

## 多对多：关系属于中间表

课堂笔记中两个学生都听过两位老师的课。关系不适合塞进 `student` 或 `teacher` 的单个外键字段，应由 `student_teacher(student_id, teacher_id)` 承载，并以联合主键阻止同一关系重复写入。查询某学生的老师时先连接关系表，再连接老师表；删除学生前需要按外键规则处理关系行。

```sql
CREATE TABLE student (
  id BIGINT PRIMARY KEY,
  name VARCHAR(80) NOT NULL
);
CREATE TABLE teacher (
  id BIGINT PRIMARY KEY,
  name VARCHAR(80) NOT NULL
);
CREATE TABLE student_teacher (
  student_id BIGINT NOT NULL,
  teacher_id BIGINT NOT NULL,
  PRIMARY KEY (student_id, teacher_id),
  FOREIGN KEY (student_id) REFERENCES student(id),
  FOREIGN KEY (teacher_id) REFERENCES teacher(id)
);

SELECT t.id, t.name
FROM teacher AS t
JOIN student_teacher AS st ON st.teacher_id = t.id
WHERE st.student_id = ?
ORDER BY t.id;
```

如果要删除学生并清理关系，先在一个事务中删除 `student_teacher` 的相关行，再删除 `student`。也可以根据明确的外键 `ON DELETE` 策略让数据库处理，但策略需与业务一致，不能只为“删得掉”而随意开启级联删除。学生和教师各自的资料是否删除，是不同的业务决策。

一对一可以用唯一外键表示，再用 `<association>` 映射单个对象；它与 `<collection>` 的区别是属性基数。选择嵌套连接结果还是分步查询时，要注意列表查询的 N+1 风险，不因对象模型方便而忽略 SQL 次数。相关性能边界见 [MyBatis 查询与批量写入性能](/articles/047-mybatis-query-batch-performance)。

资料依据：本地 `MyBatis加强.md` 的部门/员工及学生/教师课堂关系、关联查询和删除顺序。XML 映射行为参考 [MyBatis Mapper XML 官方文档](https://mybatis.org/mybatis-3/sqlmap-xml.html)。
