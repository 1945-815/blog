---
title: "Spring Boot 应用容器化发布：从可执行 JAR 到多阶段镜像"
date: "2027-05-04"
categories: ["开发运维"]
tags: ["Docker", "Spring Boot", "镜像构建", "部署"]
description: "使用多阶段 Dockerfile 构建 Spring Boot 镜像，并处理配置、数据库连接和容器排查。"
plan_date: "2026-06-10"
phase: "Java 后端实习与业务实践"
---

# Spring Boot 应用容器化发布：从可执行 JAR 到多阶段镜像

## 一、为什么学习这个技术

已有的 Docker 本地环境文章讨论的是如何用容器启动 MySQL、Redis 等依赖。把 Spring Boot 自身打成镜像解决的是另一个问题：如何把应用运行时、可执行 JAR、启动命令和端口约定交付给部署环境，减少“本地能运行、服务器缺少对应 JDK 或目录”的差异。

课程笔记中的发布链路是 Maven 打包、在本机用 java -jar 验证、编写 Dockerfile、构建镜像，再以端口映射运行。面向微服务时，还需要考虑镜像可重复构建、运行配置外置、数据库服务发现、日志输出和失败排查。容器化不会自动带来高可用，也不会替代应用的连接重试和数据备份。

## 二、核心概念

镜像是只读的分层模板，容器是镜像的运行实例。Dockerfile 的构建上下文决定 COPY 能访问哪些文件；镜像构建时写入的内容会形成镜像层。若把 Maven、完整源码和运行环境放在同一阶段，最终镜像可能携带不需要的构建工具。多阶段构建用一个阶段编译打包，再把 JAR 复制到只含运行时的最终阶段。

EXPOSE 是镜像端口的说明元数据，不会在宿主机自动开放端口；发布端口通常由 Compose ports 或 docker run -p 完成。容器中的 localhost 指容器自身，应用容器连接 Compose 中的 MySQL 时应使用服务名和容器端口，例如 db:3306，而不是宿主机映射端口。

数据库文件需要独立数据卷，应用容器通常应保持无状态。数据库地址、用户名、密码和外部 API key 应由部署环境注入，不要复制进镜像层或公开仓库。每次发布使用可追溯的版本标签，回滚时切回已知镜像版本。

构建上下文也影响效率和误打包风险。仓库中的 target、.git、日志、个人配置和本地密钥通常应写入 .dockerignore；否则即使 Dockerfile 没有 COPY 某个目录，构建上下文仍可能变大，并被发送给构建服务。多模块 Maven 工程要先复制父 POM、依赖模块描述文件和 Maven Wrapper，再下载依赖，最后复制源码；缓存是否命中取决于这些输入文件是否变化。

## 三、底层原理

构建器读取 Dockerfile 和构建上下文，按指令生成可缓存的镜像层。先复制 pom.xml 并下载 Maven 依赖，再复制源码，可以让源码变化时复用依赖层；多模块工程需要一并复制父 POM 和模块 POM。编译阶段结束后，最终阶段只复制可执行 JAR，运行时由 ENTRYPOINT 启动 Java 进程。

容器启动时，Docker 建立隔离的文件系统、网络和进程空间，并按镜像元数据启动 PID 1。Java 进程退出，容器就会停止；因此应用日志应写到标准输出，避免只写入容器内不可见的临时目录。容器重建会替换应用文件系统，但数据库数据卷应独立管理。

## 四、代码案例

下面是单模块 Spring Boot 项目的多阶段 Dockerfile。实际项目要按 Maven 多模块目录调整 COPY 路径，并确认最终只匹配一个可执行 JAR：

~~~dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY pom.xml ./
RUN mvn -B -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /workspace/target/*.jar /app/app.jar
ENV TZ=Asia/Shanghai
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
~~~

Spring Boot 本地配置示例，部署环境可通过环境变量覆盖连接地址和凭据：

~~~yaml
server:
  port: 8080
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/blog_demo?useUnicode=true&characterEncoding=utf8
    username: blog_app
    password: "此处写数据库密码"
~~~

Compose 中应用连接数据库容器时要改用服务名 db：

~~~yaml
services:
  api:
    build: .
    image: strategy-api:1.0.0
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://db:3306/blog_demo?useUnicode=true&characterEncoding=utf8
      SPRING_DATASOURCE_USERNAME: blog_app
      SPRING_DATASOURCE_PASSWORD: "此处写数据库密码"
    depends_on:
      - db
  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: blog_demo
      MYSQL_USER: blog_app
      MYSQL_PASSWORD: "此处写数据库密码"
      MYSQL_ROOT_PASSWORD: "此处写MySQL管理员密码"
    volumes:
      - mysql-data:/var/lib/mysql
volumes:
  mysql-data:
~~~

上述密码值均为占位文字，不是可用凭据。运行前应在本机提供实际密码；真实部署应从密钥管理系统注入，并将本地 Compose 凭据文件排除在 Git 外。数据库表与查询示例：

~~~sql
CREATE TABLE ta_strategy (
  id BIGINT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  status TINYINT NOT NULL,
  viewnum BIGINT NOT NULL DEFAULT 0
);

SELECT id, title, viewnum
FROM ta_strategy
WHERE id = ? AND status = 1;
~~~

发布调用示例：先在 CI 生成 JAR 和镜像，再在目标环境执行 `docker compose up -d`；用 `curl -i http://localhost:8080/api/strategies/42` 确认接口能够访问。排查时依次查看 `docker compose ps`、`docker compose logs api`、容器内环境变量和数据库连接日志，确认端口映射、服务名和凭据一致。

## 五、项目真实落地

在企业项目中，我们通常把镜像构建放在发布流水线：代码版本产生唯一镜像标签，镜像推送到受控仓库，部署环境只拉取镜像并注入环境配置。多阶段构建减少最终运行镜像中的构建工具；非 root 用户、基础镜像补丁、镜像扫描、资源限制和回滚策略也应纳入发布设计。

数据库容器的启动顺序不等于数据库已准备好。Compose 的 depends_on 基础形式只管理启动依赖，应用还需配置连接池重试和启动失败处理，或使用健康检查表达就绪条件。生产环境通常由平台负责数据库服务和编排，不能把教学 Compose 文件直接当作生产部署方案。日志、文件上传和用户生成内容要存到合适的外部存储，不能依赖容器可写层长期保留。

上线检查还可以覆盖镜像来源、架构兼容和进程退出行为：确认构建产物是可执行 Spring Boot JAR；确认镜像 CPU 架构与目标主机匹配；确认应用收到 SIGTERM 后能在平台的停止宽限期内完成请求和连接清理。端口映射只是网络入口，防火墙和安全组仍要限制外部可达范围。出现容器反复重启时，先看退出码和启动日志，再检查 JVM 参数、配置注入与数据库可用性。

## 六、常见面试问题

**初级：EXPOSE 和端口映射有什么区别？** EXPOSE 是镜像中的端口说明；宿主机是否能访问要看运行时发布端口和网络策略。

**中级：多阶段构建解决什么问题？** 编译依赖留在构建阶段，最终镜像只复制运行所需文件，可以减少体积和运行环境中的工具数量。它不自动保证镜像安全，还要维护基础镜像和依赖。

**项目：容器能启动但接口访问数据库失败，如何排查？** 检查应用日志、容器网络、数据库服务名与端口、账号权限、连接 URL 和数据库就绪状态；不要在应用容器里使用 localhost 指向另一个容器。

## 七、个人总结

作为 2027 届 Java 后端实习生，我通过把本地运行的 Spring Boot JAR 做成镜像，理解了构建阶段和运行阶段的边界。镜像负责交付一致的应用文件，部署平台负责运行配置和实例管理；数据库数据、密钥和运行日志也要有各自明确的生命周期。

## 参考资料

- [Docker 多阶段构建](https://docs.docker.com/get-started/docker-concepts/building-images/multi-stage-builds/)
- [Docker 构建上下文](https://docs.docker.com/build/concepts/context/)
