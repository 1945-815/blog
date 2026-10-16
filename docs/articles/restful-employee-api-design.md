---
title: "用员工资源练习 REST 接口：路径、方法与状态码"
date: "2026-10-16"
categories: ["Spring MVC"]
tags: ["Spring Boot", "REST", "HTTP", "接口设计"]
description: "依据课堂员工接口练习，用资源 URL 和 HTTP 方法组织 CRUD，并区分 400、404、405 与业务失败。"
plan_date: "2026-10-16"
phase: "数据库与 Spring 基础"
---

# 用员工资源练习 REST 接口：路径、方法与状态码

本地 `0720Restful/笔记/笔记.md` 比较了 `/employee/add`、`/employee/save` 等动词式路径，再用 `/employees` 与 HTTP 方法表达资源操作。REST 风格是接口设计约束，不能只把路径改成复数就称为完整 REST 接口。下面沿用员工课堂例子，用内存数据演示路由语义，不声称有数据库或企业员工系统。

| 操作 | 方法与路径 | 成功时的典型状态 |
| --- | --- | --- |
| 查询列表 | `GET /api/employees` | 200 |
| 查询一项 | `GET /api/employees/{id}` | 200；不存在为 404 |
| 创建 | `POST /api/employees` | 201，`Location` 指向新资源 |
| 整体替换 | `PUT /api/employees/{id}` | 200 或 204 |
| 删除 | `DELETE /api/employees/{id}` | 204 |

`PATCH` 适合部分更新，但需要单独定义“字段未传”“传 null”“清空字段”的区别，不能简单地把 `PUT` 方法名改成 `PATCH`。下面的代码只实现整体替换。

## 一个可运行的控制器练习

环境为 Java 17、Spring Boot 3.3.x，依赖 `spring-boot-starter-web`。将类放在启动类的组件扫描范围内。示例用 `ConcurrentHashMap` 保存进程内练习数据，重启会丢失，也没有数据库事务；真实 CRUD 分层可看 [Spring Boot CRUD 练习项目](/articles/021-springboot-crud-project)。

```java
package demo;

import java.net.URI;
import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    public record Employee(long id, String name) {}
    public record EmployeeInput(String name) {}

    private final Map<Long, Employee> employees = new ConcurrentHashMap<>();
    private final AtomicLong nextId = new AtomicLong();

    private static String validName(EmployeeInput input) {
        if (input == null || input.name() == null || input.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }
        return input.name().trim();
    }

    @GetMapping
    public Collection<Employee> list() {
        return employees.values();
    }

    @GetMapping("/{id}")
    public Employee get(@PathVariable long id) {
        Employee employee = employees.get(id);
        if (employee == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return employee;
    }

    @PostMapping
    public ResponseEntity<Employee> create(@RequestBody EmployeeInput input) {
        String name = validName(input);
        long id = nextId.incrementAndGet();
        Employee employee = new Employee(id, name);
        employees.put(id, employee);
        return ResponseEntity.created(URI.create("/api/employees/" + id)).body(employee);
    }

    @PutMapping("/{id}")
    public Employee replace(@PathVariable long id, @RequestBody EmployeeInput input) {
        String name = validName(input);
        if (!employees.containsKey(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        Employee employee = new Employee(id, name);
        employees.put(id, employee);
        return employee;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        if (employees.remove(id) == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return ResponseEntity.noContent().build();
    }
}
```

`PUT` 示例为教学而简化了并发控制。真实服务更新时应由数据库保证“仅更新存在的行”，必要时使用版本号或条件更新；`containsKey` 与 `put` 两步之间可能有并发变化。列表返回顺序也未承诺，实际分页接口应定义排序和页大小上限。

本地启动后可用 `curl -i -X POST http://localhost:8080/api/employees -H "Content-Type: application/json" -d "{\"name\":\"小林\"}"` 创建，再请求返回的 `Location`。同一路径使用未映射的 HTTP 方法通常得到 405；资源 ID 不存在得到 404；缺少名称得到 400。具体错误 JSON 格式仍由项目异常处理配置决定，不能把所有错误都包装成 HTTP 200。

资料依据：本地 `0720Restful/笔记/笔记.md` 的员工资源路径、GET/POST/PUT/PATCH/DELETE 和 405 课堂练习。请求进入 Controller 的机制可看 [Spring MVC 请求流程](/articles/spring-mvc-request-flow)。
