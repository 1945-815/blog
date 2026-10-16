---
title: "Spring Boot 文件上传：大小校验、隔离存储与失败补偿"
date: "2027-08-10"
categories: ["项目实践"]
tags: ["Spring Boot", "MultipartFile", "文件上传", "权限控制", "补偿"]
description: "把课程中的 MultipartFile 上传扩展为有大小限制、隔离状态、数据库登记与下载授权的后端实现。"
plan_date: "2026-05-12"
phase: "Java 后端实习与业务实践"
---

# Spring Boot 文件上传：大小校验、隔离存储与失败补偿

## 一、为什么学习这个技术

本地 Spring MVC 和 Spring Boot 案例已经演示接收 MultipartFile、生成文件名并保存文件。博客里的文档检索接口文章也定义了上传和索引状态，但还缺少实际流读取、文件隔离以及数据库登记失败时的处理代码。

上传功能的难点往往出现在成功路径之外：客户端声明大小很小，实际内容却超限；文件已经落盘，数据库暂时不可用；用户拿到文件编号以后，直接请求其他人的附件。本文围绕这些失败路径实现一个有限功能的接收端，并明确后续扫描、发布与下载分别负责什么。

## 二、核心概念

multipart/form-data 请求由多个 part 构成。Spring MVC 可以把文件 part 绑定为 MultipartFile，文本字段则按普通参数或结构化 part 处理。客户端声明的文件名和 Content-Type 都是输入数据，不能充当存储路径或真实格式的证明。[Spring MVC Multipart 文档](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/multipart-forms.html)

我将文件状态拆为 QUARANTINED、READY 和 REJECTED。接收成功只表示隔离区已保存字节并登记元数据；扫描、格式解析等后续检查通过以后才能进入 READY。上传接口返回文件 ID 与状态，不返回未经检查文件的公开 URL。

隔离目录应位于 Web 静态目录之外，由服务账户独占写权限。服务端生成 UUID 作为存储键，原始文件名最多用于经过编码的展示。只检查后缀或 PDF 头部无法确认文件安全，还需要解析限制、扫描策略和授权下载等措施。[OWASP 文件上传建议](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)

## 三、底层原理

`0722SpringBoot案例02/笔记/02.md` 先练习本地保存图片，再比较对象存储上传。对象存储的 endpoint、bucket 和访问凭据属于运行配置；访问密钥不能作为 Java 字段常量、示例代码或提交到仓库。课堂代码演示的是上传流程，不构成可直接上线的存储策略：还需校验文件类型与大小、关闭输入流和客户端、处理上传成功但数据库写入失败的补偿，并决定返回受控访问链接还是公开 URL。下文隔离存储示例主要展示本地接收文件的边界，不能直接宣称已经覆盖云存储的全部失败路径。

Servlet 容器先解析 multipart 请求，可能将文件写入临时目录，然后控制器获取 MultipartFile。应用层的读取循环不能代替容器和代理层的请求限制，因为控制器执行前，解析过程就可能消耗磁盘和内存。三层限制要协调，并把临时磁盘容量纳入观察范围。

文件系统和 MySQL 不共享一个普通 Spring 本地事务。即使方法加上 Transactional，数据库回滚也不会自动删除文件。示例采用“先完成隔离文件，再登记元数据”的顺序，把数据库超时后的文件保留下来，由对账任务判断归属。超时可能发生在数据库已提交但响应丢失之后，此时直接删文件会造成记录存在、内容缺失。

正常读取使用固定大小缓冲区，并累计实际字节数，避免把整个文件读成 byte 数组。中途超限或 IO 失败时删除本次未完成的文件；数据库登记失败则交给补偿流程。两类失败处于不同阶段，处理策略也不同。

## 四、代码案例

在已有 Spring Boot 3.5 MVC 项目中使用 web、jdbc、安全认证和 MySQL 驱动依赖。先配置容器限制，保证请求总上限大于单文件上限；正式项目应统一映射超限为 413 响应。[Spring Boot 配置项](https://docs.spring.io/spring-boot/3.5/appendix/application-properties/index.html)

~~~yaml
spring:
  servlet:
    multipart:
      max-file-size: 5MB
      max-request-size: 6MB
      file-size-threshold: 0B
app:
  upload:
    quarantine: ${UPLOAD_QUARANTINE:/srv/app/quarantine}
~~~

~~~sql
CREATE TABLE uploaded_file (
  id CHAR(36) PRIMARY KEY,
  owner_id VARCHAR(128) NOT NULL,
  storage_key VARCHAR(80) NOT NULL UNIQUE,
  byte_size BIGINT NOT NULL,
  state VARCHAR(16) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_owner_state (owner_id, state)
);
~~~

下面保存为 `UploadController.java`。它依赖项目已经配置的认证过滤链；Principal 来自认证结果，不能替换成客户端传来的 userId。控制器本身不包数据库事务，插入在 JdbcTemplate 的正常自动提交连接上完成。

~~~java
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.security.Principal;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class UploadController {
    private static final long LIMIT = 5L * 1024 * 1024;
    private final Path root;
    private final JdbcTemplate jdbc;

    public UploadController(@Value("${app.upload.quarantine}") String directory,
                            JdbcTemplate jdbc) throws IOException {
        this.root = Path.of(directory).toAbsolutePath().normalize();
        Files.createDirectories(root);
        this.jdbc = jdbc;
    }

    record Receipt(String id, String state) {}

    @PostMapping(value = "/files", consumes = "multipart/form-data")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Receipt upload(@RequestParam("file") MultipartFile file,
                          Principal principal) throws IOException {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String name = file.getOriginalFilename();
        if (file.isEmpty() || name == null || name.length() > 200 ||
            !name.toLowerCase(Locale.ROOT).endsWith(".pdf")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "需要 PDF 文件");
        }
        if (file.getSize() > LIMIT) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE);
        }
        String id = UUID.randomUUID().toString();
        String key = id + ".bin";
        Path target = root.resolve(key);
        long bytes = 0;
        // CREATE_NEW 保证不覆盖已有文件；只在成功创建后负责清理。
        OutputStream created = Files.newOutputStream(target, StandardOpenOption.CREATE_NEW);
        try (OutputStream out = created; InputStream in = file.getInputStream()) {
            byte[] buffer = new byte[8192];
            int n;
            while ((n = in.read(buffer)) != -1) {
                bytes += n;
                if (bytes > LIMIT) {
                    throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE);
                }
                out.write(buffer, 0, n);
            }
        } catch (IOException | RuntimeException ex) {
            try { Files.deleteIfExists(target); }
            catch (IOException cleanup) { ex.addSuppressed(cleanup); }
            throw ex;
        }
        // 文件已写完：登记失败时保留文件，后续对账处理提交状态不明的情况。
        jdbc.update("""
            INSERT INTO uploaded_file(id, owner_id, storage_key, byte_size, state)
            VALUES (?, ?, ?, ?, 'QUARANTINED')
            """, id, principal.getName(), key, bytes);
        return new Receipt(id, "QUARANTINED");
    }
}
~~~

在已配置 Bearer 认证的练习服务中调用；使用 cookie 会话时还需带上项目要求的 CSRF 令牌：

~~~bash
curl -H "Authorization: Bearer DEMO_TOKEN" -F "file=@lesson.pdf" http://localhost:8080/files
~~~

预期返回 202 与 QUARANTINED 状态。示例没有实现扫描器，因此这些文件不会自动成为可下载文件。目录权限必须防止其他账户替换目录或植入符号链接，文件名随机并不能抵消不可信的本地目录权限。

## 五、项目真实落地

在文档服务的练习设计中，后台任务只取隔离状态记录，进行限时、限内存的解析与扫描，再用带原状态条件的 UPDATE 推进状态。解析失败保存错误码并转为 REJECTED，不把解析异常原文和服务器路径直接返回客户端。对象存储版本也应使用私有桶和服务端生成的对象键。

补偿任务分别检查两种情况：隔离目录有文件但没有记录，且超过宽限期，可以进入待清理流程；记录存在但文件缺失，则标记失败并告警。不能只扫描一次就删除“孤儿”，因为正在上传的文件可能还没有完成数据库登记。大规模系统可进一步引入上传会话和租约来区分活跃请求。

下载时先按当前用户和文件 ID 查询归属，再检查 READY 状态，最后读取私有内容或生成短期下载凭证。重启后是否仍能读到文件，也取决于卷挂载与部署位置；容器可写层不适合作为持久附件仓库。以上是方案与练习边界，没有虚构线上处理规模。

## 六、常见面试问题

### 初级：为什么不直接使用原始文件名落盘？

它可能含路径片段、重名或不适合文件系统的字符。存储键由服务端生成，展示名与存储位置分开管理。

### 中级：限制 MultipartFile.getSize 就够了吗？

还需要代理与容器请求限制，以及实际流读取的累计上限。每一层都负责控制不同阶段的资源消耗。

### 项目：数据库超时后为什么不马上删除文件？

超时不一定表示提交失败。应按文件 ID 查询最终状态并补偿，避免删除已经被成功登记的内容。

## 七、个人总结

作为一名 2027 届 Java 后端实习生，我以前容易把上传成功理解为文件保存完成。现在我会分别检查接收、登记、审核和下载四个阶段，尤其关注中途失败留下什么状态。这些边界比再封装一个上传工具类更能帮助我解释项目设计。
