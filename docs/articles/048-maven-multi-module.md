---
title: "Maven 多模块项目：聚合、依赖管理与团队构建边界"
date: "2027-02-16"
categories: ["工程基础"]
tags: ["Maven", "多模块", "工程实践"]
description: "说明 Maven Reactor 聚合与依赖继承的区别，并用后端服务模块展示版本管理、私服配置和构建命令。"
plan_date: "2026-02-24"
phase: "Java 后端实习与业务实践"
---

# Maven 多模块项目：聚合、依赖管理与团队构建边界

> **计划公开日期：**2027-02-16　·　**学习阶段参考日期：**2026-02-24　·　**阶段：**Java 后端实习与业务实践。参考日期表示学习路线顺序，不代表历史发文。

### 文章定位

博客已有 Maven 多环境配置文章。本文讨论多模块工程结构和 Reactor 构建，不重复解释 profile。下文的模块名、表结构和命令是教学示例，不对应某个未核实的公司仓库。

## 一、为什么学习这个技术

小项目只有一个应用模块时，目录结构和依赖关系一目了然。随着接口契约、业务逻辑、基础设施和 Web 入口逐渐增多，把所有代码放在同一模块会让依赖方向模糊，公共代码也容易出现复制粘贴。Maven 多模块可以将构建边界与职责边界映射起来，让团队单独构建、测试和复用模块。

拆模块并非越多越好。模块之间有真实稳定的职责差异、需要被其他服务复用，或需要隔离依赖时才值得拆分。若每个包都建成一个模块，版本协同和发布成本可能超过收益。

## 二、核心概念

Maven 多模块常涉及聚合和继承。父 POM 的 modules 列表告诉 Maven Reactor 本次构建有哪些子项目，以及模块间依赖的构建顺序；子 POM 通过 parent 继承父级属性、插件配置等。一个 POM 可以只聚合，也可以只被继承，两种用途概念不同，只是项目中经常由根 POM 同时承担。

dependencyManagement 统一声明依赖版本，但不会自动把该依赖加入每个子模块。子模块仍要在 dependencies 中显式声明自己需要的依赖。pluginManagement 也只是管理插件版本和默认配置，是否执行通常由插件声明和生命周期绑定决定。把这几种边界讲清楚，是排查“为什么这个模块没有依赖”问题的基础。

## 三、底层原理

执行 Maven 命令时，Maven 先读取 POM 并构建项目模型，解析依赖图和插件执行计划。Reactor 根据项目间依赖关系排序，再按所选生命周期阶段逐个构建相关项目。命令中的 -pl 指定项目列表，-am 会同时构建这些项目依赖的模块。因此，在根目录只构建 web 模块时，可以让依赖模块一起进入构建，而不是依赖本机仓库中恰好已有的旧 SNAPSHOT。

依赖坐标由 groupId、artifactId 和 version 等信息确定。install 只把构件安装到本机仓库；deploy 才发布到配置的远程仓库。团队私服凭证放在开发者或 CI 的 settings.xml / 密钥管理中，不应提交到项目 POM 或仓库。

## 四、代码案例

假设项目采用接口、业务服务和 Web 入口三个模块：

~~~text
shop-parent/
├── pom.xml
├── shop-api/
├── shop-service/
└── shop-web/
~~~

根 POM 聚合模块并集中管理版本：

~~~xml
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example.shop</groupId>
  <artifactId>shop-parent</artifactId>
  <version>1.0.0-SNAPSHOT</version>
  <packaging>pom</packaging>
  <modules>
    <module>shop-api</module>
    <module>shop-service</module>
    <module>shop-web</module>
  </modules>
  <properties>
    <maven.compiler.release>17</maven.compiler.release>
    <spring-boot.version>3.4.0</spring-boot.version>
  </properties>
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-dependencies</artifactId>
        <version>${spring-boot.version}</version>
        <type>pom</type><scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>
</project>
~~~

示例版本只用于解释结构，实际项目应选用经过验证且相互兼容的版本。shop-web 的 POM 可显式依赖业务和接口模块；shop-service 依赖 shop-api。不要让 api 反向依赖 web，否则层次方向就被破坏。

子模块可以这样声明父 POM 和实际依赖。版本由根 POM 的 dependencyManagement 提供，但依赖仍要在本模块显式列出。若需要覆盖版本，应先说明兼容性理由，避免子模块悄悄偏离团队基线：

~~~xml
<parent>
  <groupId>com.example.shop</groupId>
  <artifactId>shop-parent</artifactId>
  <version>1.0.0-SNAPSHOT</version>
</parent>
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <dependency>
    <groupId>com.example.shop</groupId>
    <artifactId>shop-service</artifactId>
    <version>${project.version}</version>
  </dependency>
</dependencies>
~~~

业务模块拥有自己的数据库访问代码和 SQL 迁移文件。例如服务层创建订单时会写入订单表：

~~~sql
CREATE TABLE shop_order (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(40) NOT NULL UNIQUE,
  buyer_id BIGINT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
~~~

Maven 构建本身不会自动执行这段 SQL，数据库初始化应由迁移工具或明确的初始化流程负责。模块内的 Java 调用可以是 OrderController 调用 OrderService.create(command)，服务再调用 Mapper 并写入事务。

下面只展示业务模块的调用边界；CreateOrderCommand 可放在 API 契约模块，持久化实现留在 service 模块，Web 模块不直接拼 SQL：

~~~java
import java.math.BigDecimal;

record CreateOrderCommand(long buyerId, BigDecimal amount) {}

interface OrderRepository {
    long insert(CreateOrderCommand command);
}

final class OrderService {
    private final OrderRepository repository;
    OrderService(OrderRepository repository) { this.repository = repository; }
    long create(CreateOrderCommand command) { return repository.insert(command); }
}

long orderId = orderService.create(
    new CreateOrderCommand(1001L, new BigDecimal("39.90")));
~~~

团队从根目录构建 web 及其依赖模块：

~~~bash
mvn -pl shop-web -am clean package
~~~

私服发布地址可由 POM 的 distributionManagement 提供，认证 server id 与地址 id 匹配，用户名和令牌放在 settings.xml 的 server 配置或 CI 密钥中。发布命令例如 mvn -pl shop-service -am deploy；发布 SNAPSHOT 或正式版本前应先确认仓库策略、测试和版本号。

## 五、项目真实落地

在企业项目中，我们通常按依赖方向拆分 API、业务和接入层：API 放跨模块使用的契约，业务模块承载用例和持久层适配，Web 模块负责 HTTP 转换与启动。公共模块应保持小而稳定，不能因为“可能复用”就把业务规则提前塞进去。这里是工程结构的通用练习，不声称来自个人企业项目。

常见问题包括子模块缺少 parent 导致版本不一致、只配置 dependencyManagement 却没有声明依赖、模块循环依赖、CI 在本机能构建却找不到未发布的 SNAPSHOT。可用根目录 -am 重建依赖链，在 CI 使用干净仓库验证构建，并让模块依赖方向保持单向。若确实需要远程发布，再管理 deploy 权限和版本策略，不要让开发构建依赖个人本地仓库。

拆分前还可以画出模块依赖图：箭头从调用方指向被依赖方，若形成环路，通常表示职责边界不清或共享契约位置不合适。父级只集中管理真正需要统一的插件和版本，避免根 POM 膨胀成所有业务逻辑的配置中心。团队 README 应记录从仓库根目录执行的构建命令，以及首次构建需要的 JDK 和私服配置。

## 六、常见面试问题

### 初级：聚合和继承有什么区别？

聚合把多个项目加入一次 Reactor 构建；继承让子 POM 复用父级模型配置。它们解决的问题不同，可以由同一个根 POM 同时承担。

### 中级：dependencyManagement 会把依赖传给子模块吗？

它管理版本和默认依赖配置，不等于自动添加依赖。子模块应在 dependencies 中声明自己真正使用的库。

### 项目：只构建一个服务模块，如何同时构建其源码依赖？

在根项目执行 mvn -pl 模块路径 -am package 一类命令。-pl 选择目标，-am 将依赖的 reactor 模块纳入本次构建；还要确保 POM 中的依赖坐标和模块关系正确。

## 七、个人总结

作为 2027 届 Java 后端实习生，我认识到模块化不是目录整理，而是明确谁依赖谁、哪些版本由谁管理、CI 如何从干净环境得到同一构建结果。能解释 -pl、-am、dependencyManagement 和 settings.xml 的职责，比只会复制一份父 POM 更能体现工程理解。

## 参考资料

- [Maven Guide to Working with Multiple Modules](https://maven.apache.org/guides/mini/guide-multiple-modules.html)
- [Maven Settings Reference](https://maven.apache.org/settings.html)
