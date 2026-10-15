---
title: "Spring Boot 练习项目：从表结构到分页 CRUD 接口"
date: "2027-01-05"
categories: ["Spring Boot"]
tags: [
  "Java",
  "Spring Boot",
  "MySQL",
  "MyBatis"
]
description: "以练习用员工表串起建表、Mapper、Service、Controller 和分页边界。"
plan_date: "2024-08-30"
phase: "数据库与 Spring 基础"
---

# Spring Boot 练习项目：从表结构到分页 CRUD 接口

### 文章定位

这篇文章把 Spring Boot、MySQL 和 MyBatis 的基础内容连成一个练习项目。示例以课程 CRUD 练习中的员工信息为参照，不代表企业系统或真实员工数据。

### 学习目标

- 从表结构确定实体字段和主键。
- 通过 Mapper、Service 和 Controller 组织 CRUD 请求。
- 使用稳定排序和受控分页返回列表结果。

## 一、为什么学习这个技术

掌握单个注解或 SQL 语句还不足以完成一个后端功能。一次列表查询通常会经过 HTTP 参数、业务校验、SQL 绑定、数据库执行和响应序列化。把这些环节放在同一个小项目里，能看到各层之间的数据如何流动。

这个练习聚焦最小闭环：表结构、查询和更新语句、接口边界、分页参数及错误结果。它不追求复杂架构，也不需要把课程 Demo 包装成生产经验。

## 二、技术原理

Controller 接收并校验 HTTP 请求，Service 放业务规则，Mapper 负责数据访问。MyBatis 把 Java 参数绑定到 SQL，再把查询结果映射为对象。数据库仍是数据约束的最终边界：主键、非空、唯一性等规则应由 schema 和应用校验共同表达。

分页查询通常需要排序条件保持稳定，否则相邻页面可能重复或漏数据。page 从 1 开始，size 设最大值，offset 使用 long 计算可避免 page 与 size 相乘时的整数溢出。列表总数可用单独 COUNT 查询获得。

## 三、核心代码实现

练习表结构：

~~~sql
CREATE TABLE demo_employee (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(80) NOT NULL,
    department VARCHAR(80) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
~~~

实体和分页结果：

以下每个 public 类或 record 分别保存为同名 Java 文件，代码按同一 package 组织，省略重复的 package 声明。

~~~java
public class Employee {
    private Long id;
    private String name;
    private String department;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
}

public record PageResult<T>(long total, int page, int size, java.util.List<T> items) {}
public record EmployeeWriteRequest(String name, String department) {}
~~~

MyBatis Mapper 用注解表达核心 CRUD 和分页 SQL。把它放在 Spring Boot 扫描到的包中，并通过 @MapperScan 或 @Mapper 注册：

~~~java
import java.util.List;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

public interface EmployeeMapper {
    @Insert("INSERT INTO demo_employee(name, department) VALUES(#{name}, #{department})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Employee employee);

    @Select("SELECT id, name, department FROM demo_employee WHERE id = #{id}")
    Employee findById(@Param("id") long id);

    @Update("UPDATE demo_employee SET name = #{name}, department = #{department} WHERE id = #{id}")
    int update(Employee employee);

    @Delete("DELETE FROM demo_employee WHERE id = #{id}")
    int deleteById(@Param("id") long id);

    @Select("SELECT id, name, department FROM demo_employee " +
            "ORDER BY id DESC LIMIT #{size} OFFSET #{offset}")
    List<Employee> selectPage(@Param("offset") long offset, @Param("size") int size);

    @Select("SELECT COUNT(*) FROM demo_employee")
    long count();
}
~~~

Service 对页码和 pageSize 做边界处理，避免把任意大列表直接交给数据库：

~~~java
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class EmployeeService {
    private final EmployeeMapper mapper;

    public EmployeeService(EmployeeMapper mapper) {
        this.mapper = mapper;
    }

    public PageResult<Employee> page(int page, int requestedSize) {
        if (page < 1 || requestedSize < 1) {
            throw new IllegalArgumentException("page 和 size 必须为正数");
        }
        int size = Math.min(requestedSize, 100);
        long offset = (long) (page - 1) * size;
        List<Employee> items = mapper.selectPage(offset, size);
        return new PageResult<>(mapper.count(), page, size, items);
    }

    public Employee create(Employee employee) {
        validate(employee);
        mapper.insert(employee);
        return employee;
    }

    public Employee findById(long id) {
        return mapper.findById(id);
    }

    public boolean update(Employee employee) {
        validate(employee);
        return mapper.update(employee) > 0;
    }

    public boolean delete(long id) {
        return mapper.deleteById(id) > 0;
    }

    private void validate(Employee employee) {
        if (employee == null || employee.getName() == null || employee.getName().isBlank()
                || employee.getDepartment() == null || employee.getDepartment().isBlank()) {
            throw new IllegalArgumentException("姓名和部门不能为空");
        }
    }
}
~~~

Controller 暴露分页和 CRUD 接口；更新和删除根据 Mapper 影响行数返回 404 或成功结果：

~~~java
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    private final EmployeeService service;

    public EmployeeController(EmployeeService service) {
        this.service = service;
    }

    @GetMapping
    public PageResult<Employee> page(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return service.page(page, size);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Employee> findById(@PathVariable long id) {
        Employee employee = service.findById(id);
        return employee == null ? ResponseEntity.notFound().build()
                : ResponseEntity.ok(employee);
    }

    @PostMapping
    public Employee create(@RequestBody EmployeeWriteRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("请求体不能为空");
        }
        Employee employee = new Employee();
        employee.setName(request.name());
        employee.setDepartment(request.department());
        return service.create(employee);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(
            @PathVariable long id, @RequestBody EmployeeWriteRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("请求体不能为空");
        }
        Employee employee = new Employee();
        employee.setId(id);
        employee.setName(request.name());
        employee.setDepartment(request.department());
        return service.update(employee) ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        return service.delete(id) ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
~~~

这些片段放入同一个 Spring Boot 工程即可组成基本的分页和 CRUD 链路。完整运行还需要 Web、MySQL Driver、MyBatis Starter、数据源配置和 Mapper 扫描；示例用了 IllegalArgumentException 表达输入问题，真实接口应补充 Jakarta Validation 并统一映射业务错误。不要让数据库异常堆栈直接返回给客户端。

## 四、实际应用

课程项目中通常先运行建表 SQL，再从一条查询开始验证连接和字段映射，然后补充创建、详情、修改、删除和分页。每个接口都可以用同一张练习表验证正常请求、缺失参数、无对应记录和边界页码。

真实业务通常还需要鉴权、字段脱敏、审计信息、事务边界、并发更新策略和统一错误结构。上述示例没有这些能力，不应当被表述成完整企业项目。

## 五、问题记录

- **分页大小不设上限：**客户端可能请求过大的结果集；服务端需要限制 size。
- **排序不稳定：**没有确定顺序时，分页边界可能变化；示例按唯一主键 id 倒序。
- **offset 溢出：**用 int 相乘可能溢出；将计算提升为 long。
- **把 0 行更新当成功：**要明确记录不存在时的 HTTP 语义。
- **直接返回数据库实体：**小 Demo 可以展示映射，实际 API 应根据数据暴露边界设计响应 DTO。

## 六、改进方向

把新增与更新请求分别建模为 DTO，添加 Jakarta Validation 校验；对列表查询增加可选筛选条件并检查索引和执行计划。数据量变大后再评估游标分页、Count 优化和读写性能，避免先引入没有验证必要性的复杂组件。

## 七、个人思考

从一张表到一个接口，看起来是 CRUD，但真正需要解释的是请求如何经过各层、参数如何进入 SQL、失败如何表达，以及分页如何控制成本。能把这条链路讲清楚，才算形成了后端开发的基本闭环。

## 延伸：面试问答

### 为什么分页需要稳定排序？

数据库不保证没有 ORDER BY 时的返回顺序。稳定排序能让不同页面的边界更可预测。

### 为什么限制 pageSize？

防止单次请求读取和序列化过多数据，保护数据库、应用内存和网络带宽。

### MyBatis 如何把数据库主键回填到对象？

可以使用生成主键选项并指定 keyProperty，具体数据库和驱动行为需在当前配置中验证。

## 参考资料

- [Spring Boot：Developing Your First Spring Boot Application](https://docs.spring.io/spring-boot/reference/using/index.html)
- [MyBatis：Java API](https://mybatis.org/mybatis-3/java-api.html)
- [MyBatis：SQL Map XML Files](https://mybatis.org/mybatis-3/sqlmap-xml.html)
