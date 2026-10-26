---
title: "REST 接口设计：资源路径、HTTP 方法与状态码"
date: "2026-10-16"
categories: ["Spring MVC"]
tags: ["Spring Boot", "REST", "HTTP", "接口设计"]
description: "用内存数据示例说明资源 URL、HTTP 方法与 400、404、405 状态码的边界。"
plan_date: "2026-10-16"
phase: "Spring 与数据持久化"
---

# REST 接口设计：资源路径、HTTP 方法与状态码

REST 风格是接口设计约束，不能只把路径改成复数就称为完整 REST 接口。下面以文档目录为例，用内存数据说明资源路由和 HTTP 状态语义。

| 操作 | 方法与路径 | 成功时的典型状态 |
| --- | --- | --- |
| 查询列表 | `GET /api/documents` | 200 |
| 查询一项 | `GET /api/documents/{id}` | 200；不存在为 404 |
| 创建 | `POST /api/documents` | 201，`Location` 指向新资源 |
| 整体替换 | `PUT /api/documents/{id}` | 200 或 204 |
| 删除 | `DELETE /api/documents/{id}` | 204 |

`PATCH` 适合部分更新，但需要单独定义“字段未传”“传 null”“清空字段”的区别，不能简单地把 `PUT` 方法名改成 `PATCH`。下面的代码只实现整体替换。

## 最小 Controller 示例

环境为 Java 17、Spring Boot 3.3.x，依赖 `spring-boot-starter-web`。将类放在启动类的组件扫描范围内。示例用 `ConcurrentHashMap` 保存进程内数据，重启后会丢失，也没有数据库事务；持久层边界见 [Spring Boot CRUD 数据访问](/articles/021-springboot-crud-project)。

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
@RequestMapping("/api/documents")
public class DocumentController {
    public record Document(long id, String title) {}
    public record DocumentInput(String title) {}

    private final Map<Long, Document> documents = new ConcurrentHashMap<>();
    private final AtomicLong nextId = new AtomicLong();

    private static String validTitle(DocumentInput input) {
        if (input == null || input.title() == null || input.title().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title is required");
        }
        return input.title().trim();
    }

    @GetMapping
    public Collection<Document> list() {
        return documents.values();
    }

    @GetMapping("/{id}")
    public Document get(@PathVariable long id) {
        Document document = documents.get(id);
        if (document == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return document;
    }

    @PostMapping
    public ResponseEntity<Document> create(@RequestBody DocumentInput input) {
        String title = validTitle(input);
        long id = nextId.incrementAndGet();
        Document document = new Document(id, title);
        documents.put(id, document);
        return ResponseEntity.created(URI.create("/api/documents/" + id)).body(document);
    }

    @PutMapping("/{id}")
    public Document replace(@PathVariable long id, @RequestBody DocumentInput input) {
        String title = validTitle(input);
        if (!documents.containsKey(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        Document document = new Document(id, title);
        documents.put(id, document);
        return document;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        if (documents.remove(id) == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return ResponseEntity.noContent().build();
    }
}
```

`PUT` 示例为突出接口语义而简化了并发控制。真实服务更新时应由数据库保证“仅更新存在的行”，必要时使用版本号或条件更新；`containsKey` 与 `put` 两步之间可能有并发变化。列表返回顺序也未承诺，实际分页接口应定义排序和页大小上限。

本地启动后可用 `curl -i -X POST http://localhost:8080/api/documents -H "Content-Type: application/json" -d "{\"title\":\"小林\"}"` 创建，再请求返回的 `Location`。同一路径使用未映射的 HTTP 方法通常得到 405；资源 ID 不存在得到 404；缺少标题得到 400。具体错误 JSON 格式仍由项目异常处理配置决定，不能把所有错误都包装成 HTTP 200。

请求进入 Controller 的机制可看 [Spring MVC 请求流程](/articles/spring-mvc-request-flow)。
