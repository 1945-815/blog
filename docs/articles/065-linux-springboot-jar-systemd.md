---
title: "Linux 上运行 Spring Boot JAR：systemd 管理与故障排查"
date: "2027-06-15"
categories: ["开发运维"]
tags: ["Linux", "systemd", "Spring Boot", "故障排查"]
description: "从进程、端口、日志和数据库连通性入手，整理 Linux 虚拟机上运行 JAR 的故障排查方法。"
plan_date: "2026-08-16"
phase: "后端工程实践"
---

# Linux 上运行 Spring Boot JAR：systemd 管理与故障排查

## 问题背景

运行 Java 后端服务时，需要确认进程、权限、文件、端口和 systemd 状态：JAR 是否启动、进程是否退出、端口是否监听、日志里是否有启动异常、应用用户能否读取配置。

如果每次都在终端执行 java -jar，SSH 断开后进程管理和重启策略容易变得不清楚。systemd 能把应用进程作为服务管理，统一查看状态、配置重启和读取标准输出日志。故障排查仍要按证据逐步定位，而不是先重启或关闭防火墙。

## 核心概念

进程是操作系统正在运行的程序实例；PID 用于定位进程。端口监听表示某进程在本机接受连接，但不代表应用业务接口一定可用。防火墙规则控制网络访问，也不能修复进程未启动或服务只绑定到回环地址的问题。

systemd service unit 描述服务的启动命令、工作目录、运行用户、环境文件和失败后的动作。systemctl status 查看当前状态和最近日志摘要，journalctl 查询更完整的服务日志。Restart=on-failure 只处理符合策略的异常退出，不代表应用初始化失败后一定能恢复。

常用定位顺序是：服务状态与日志、Java 进程和启动参数、端口监听、应用健康接口、数据库连通性、主机网络与防火墙。每一步都需要对应证据，避免把“连接失败”直接等同于“防火墙问题”。

## 底层原理

systemd 根据 unit 文件创建服务进程，并跟踪主进程生命周期。配置 User 和 Group 后，进程以指定普通用户运行；WorkingDirectory 决定相对路径的解释位置；EnvironmentFile 可以将环境配置与 JAR 分开。日志写到标准输出和标准错误时，可由 systemd journal 收集，再通过 journalctl 按 unit 和时间筛选。

Java 进程启动成功只说明 JVM 开始执行。Spring Boot 还要创建容器、绑定端口、连接必要组件；任一步异常都可能导致进程退出。端口监听、/actuator/health 返回和数据库查询是不同层次的检查，不能互相替代。

权限问题也经常被误判：JAR 可执行权限不是通过 java -jar 启动的必要条件，但运行用户必须能读取 JAR 和环境文件，并能写入日志目录、临时目录或业务文件目录。不要用 root 身份长期运行服务来绕过文件权限设计。

## 代码案例

下面给出 Spring Boot 健康接口示例；生产环境可以由 Actuator 管理健康端点，不应把详细依赖状态暴露给未授权用户。

~~~java
@RestController
public class HealthController {
    @GetMapping("/health")
    public Map<String, String> health() {
        return Collections.singletonMap("status", "UP");
    }
}
~~~

在 Linux 中建立普通运行账户、应用目录和 unit 文件。路径和 Java 安装位置需按主机环境调整。

~~~ini
[Unit]
Description=Spring Boot example service
After=network.target

[Service]
User=app
Group=app
WorkingDirectory=/opt/blog-api
EnvironmentFile=-/etc/blog-api/app.env
ExecStart=/usr/bin/java -Xms256m -Xmx512m -jar /opt/blog-api/app.jar
Restart=on-failure
RestartSec=5
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target
~~~

环境文件只放非敏感演示配置；密钥要由受控的密钥管理方式提供，不能提交到 Git。

~~~yaml
server:
  port: 8080
spring:
  application:
    name: blog-api
management:
  endpoints:
    web:
      exposure:
        include: health
~~~

数据库连接异常时，先确认应用配置和数据库用户，再在数据库侧做最小连通性验证。SELECT 1 只证明当前连接能执行简单 SQL，不代表业务表权限和完整查询均正确。

~~~sql
SELECT 1;
~~~

配置文件保存后，用 systemctl daemon-reload 让 systemd 重新读取 unit，再启动服务。实际调用示例：curl -i http://127.0.0.1:8080/health。常用排查命令包括 systemctl status blog-api、journalctl -u blog-api -n 100 --no-pager、ps -ef | grep java、ss -lntp | grep 8080。

## 运行验证与适用范围

在隔离 Linux 环境中，先确认 unit 指向的 JAR 和工作目录存在、文件权限允许 app 用户读取；再检查服务状态、启动日志、监听端口和健康接口。若本机请求正常但远端访问失败，再核对绑定地址、安全组和防火墙规则。

遇到启动失败，应保留异常堆栈并区分配置文件缺失、端口冲突、JDK 版本不兼容、数据库连接失败等原因。不要使用 kill -9 作为日常重启方式，也不要直接关闭整台机器防火墙。修改配置后先做最小范围验证，再使用 systemctl restart；确认成功后检查服务是否开机启动。

这套流程适用于理解传统虚拟机上的单体 JAR 托管。容器编排、负载均衡和高可用部署需要额外设计，本文不把一台虚拟机的运行状态描述成生产级保障。

## 设计取舍与结论

服务故障可按 systemd 状态、服务日志、进程、监听端口和应用依赖逐层排查。JAR 能启动不代表数据库连接或业务端点已经就绪，部署检查应验证完整请求链路。

## 参考资料

- [systemd.service 手册](https://man7.org/linux/man-pages/man5/systemd.service.5.html)
- [journalctl 手册](https://man7.org/linux/man-pages/man1/journalctl.1.html)
- [Spring Boot Actuator Endpoints](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html)
