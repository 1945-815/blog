---
title: "Spring AI 会话记忆：会话隔离、窗口裁剪与 JDBC 持久化"
date: "2027-07-20"
categories: ["AI 应用"]
tags: ["Spring AI", "ChatMemory", "会话管理", "JDBC", "LLM"]
description: "用 Spring AI ChatMemory 为无状态模型补上按会话检索的上下文，并处理身份归属、窗口预算和历史数据边界。"
plan_date: "2026-10-27"
phase: "AI 应用探索"
---

# Spring AI 会话记忆：会话隔离、窗口裁剪与 JDBC 持久化

> **计划公开日期：**2027-07-20　·　**学习阶段参考日期：**2026-10-27　·　**阶段：**AI 应用探索。参考日期表示学习路线顺序，不代表历史发文。

### 文章定位

学习资料中已经解释了模型 API 的 `messages` 数组如何承载多轮对话，现有博客也介绍了 Spring AI、Ollama 和 RAG。本文进一步把“历史消息”落到服务端工程设计：如何按会话查找上下文、限制窗口大小、让多实例共享记忆，并避免一个用户读到另一个用户的对话。这里的代码是可复现练习，不代表真实线上聊天系统。

## 一、为什么学习这个技术

大模型的调用通常是无状态的。用户第一轮说“我在准备 Java 面试”，第二轮只问“那线程池怎么回答？”，如果服务端只提交第二句话，模型并不知道“那”指什么。要获得多轮上下文，应用需要为同一会话保存并再次提交相关消息。

把整个历史永远附加到每次请求也不可行：上下文越长，推理成本和延迟越高，最终还会超过模型上下文窗口。只在内存里保存又会在重启、负载均衡切换和多实例部署时丢失。因此需要区分会话身份、短期记忆窗口和完整聊天历史，并选择合适的持久化策略。

## 二、核心概念

Spring AI `ChatMemory` 管理“本次生成需要参考哪些消息”，底层 `ChatMemoryRepository` 负责存取。`MessageWindowChatMemory` 会保留有限数量的消息，超出窗口时移除更早的内容，同时保留 system 指令。Spring AI 1.0.x 默认是有限消息窗口和内存仓库；重启后内存仓库内容会消失。需要持久化时可使用 JDBC repository starter。

会话 ID 是检索分区键，不是用户授权凭证。客户端传来的 conversationId 必须与当前登录身份绑定并校验所有权；否则攻击者可以猜测或替换 ID 读取他人上下文。多租户系统还需把租户身份纳入授权范围。身份信息应来自服务端认证上下文，而不是信任请求体中的 `userId`。

短期 ChatMemory 与完整历史也不是同一份数据。聊天记忆只保存当前模型调用需要的窗口；若产品需要查看历史、审计、导出或删除，应由独立的业务表保存完整记录并建立权限、保留期限和脱敏规则。消息条数限制也不等于 token 限额：不同消息长度差异很大，工程上可按 token 预算或字符上限再裁剪。

## 三、底层原理

每次调用带上会话 ID 后，`MessageChatMemoryAdvisor` 在 ChatClient 请求链中按该 ID 从仓库读取消息，将上下文作为消息对象加入 prompt；模型响应产生后，advisor 把本轮用户与助手消息写回同一会话。模型本身仍不保存状态；“记住上一轮”是应用每次检索、组装和再次发送历史的效果。

使用内存仓库时，同一 JVM 内的调用可找到历史，但重启后清空，多个实例之间也不共享。JDBC 仓库把消息持久化到关系数据库，能够支持重启和水平扩展，不过仍要设计会话授权、过期清理、表容量、索引、备份与敏感数据策略。数据库保存完整记录还是只保存窗口，需要按业务要求选择。

并发调用同一会话时，两条请求可能同时读取相同旧窗口，然后以不同顺序写入响应，导致对话顺序混乱。需要限制同一会话并发，或为消息添加单调序号并在写入时校验版本。模型调用耗时较长，不宜用数据库行锁贯穿整个 HTTP 推理过程；可使用会话级队列、短时分布式互斥或乐观并发控制。

## 四、代码案例

示例以 Spring AI 1.0.9、Spring Boot 3.5.x 和 MySQL 为参考。使用 BOM 统一 Spring AI 依赖版本，并添加 `spring-ai-starter-model-chat-memory-repository-jdbc`。Spring AI 的 JDBC repository 自动维护自己的消息表；下面的 SQL 是应用侧会话和所有权元数据表，不冒充框架内部表结构。

~~~yaml
spring:
  application:
    name: chat-memory-demo
  datasource:
    url: jdbc:mysql://localhost:3306/study?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: ${DB_USER:root}
    password: ${DB_PASSWORD}
  ai:
    ollama:
      base-url: http://localhost:11434
      chat:
        options:
          model: qwen3:1.7b
          temperature: 0.2
    chat:
      memory:
        repository:
          jdbc:
            initialize-schema: never
~~~

`initialize-schema: never` 表示由迁移工具管理 schema；如果练习环境使用 Spring AI 自带初始化，也应先确认 MySQL 支持并使用对应版本脚本，不要在生产库随意自动建表。Spring AI BOM 负责依赖版本对齐。

~~~sql
CREATE TABLE app_chat_conversation (
  conversation_id CHAR(36) PRIMARY KEY,
  owner_user_id BIGINT NOT NULL,
  title VARCHAR(120) NOT NULL DEFAULT '新会话',
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_chat_owner_updated (owner_user_id, updated_at)
);

SELECT conversation_id
FROM app_chat_conversation
WHERE conversation_id = ?
  AND owner_user_id = ?
  AND status = 'ACTIVE';
~~~

服务端装配有界窗口和 JDBC repository。示例使用 `MessageChatMemoryAdvisor`，每次请求都显式附带经过归属校验的会话 ID。

~~~java
@Configuration
public class ChatMemoryConfiguration {
    @Bean
    ChatMemory chatMemory(JdbcChatMemoryRepository repository) {
        return MessageWindowChatMemory.builder()
            .chatMemoryRepository(repository)
            .maxMessages(12)
            .build();
    }

    @Bean
    ChatClient chatClient(ChatClient.Builder builder, ChatMemory memory) {
        return builder
            .defaultAdvisors(MessageChatMemoryAdvisor.builder(memory).build())
            .build();
    }
}

@Service
public class ConversationService {
    private final ChatClient chatClient;
    private final ConversationRepository conversations;

    public String ask(long authenticatedUserId, String conversationId, String text) {
        conversations.requireOwnedActiveConversation(
            authenticatedUserId, conversationId);
        if (text == null || text.isBlank() || text.length() > 2000) {
            throw new IllegalArgumentException("消息长度必须在 1 到 2000 之间");
        }
        return chatClient.prompt()
            .user(text)
            .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
            .call()
            .content();
    }
}
~~~

请求携带会话 id，但用户身份通过登录令牌解析，不从 JSON 中信任：

~~~bash
curl -X POST http://localhost:8080/api/conversations/3fcf7188-18a5-4a14-9b80-65f5b9c70361/messages \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{"text":"继续解释刚才提到的线程池隔离"}'
~~~

生产接口还应校验会话状态、限制并发与输入体积，并在客户端重试时使用请求幂等键。会话创建可以由独立 `POST /api/conversations` 返回 UUID；消息列表应走业务历史接口，不应直接暴露 ChatMemoryRepository 的内部实现。

## 五、项目真实落地

在企业项目中，我们通常先明确会话 ID 的生成与授权策略，再选择内存或 JDBC 等仓库。单实例练习可以用内存验证“上一轮对话如何重新进入 prompt”；多实例或需要重启恢复时则需要共享持久存储。业务还要决定消息留存期限、用户删除会话后的清理范围，以及历史是否允许被模型再次读取。

常见问题包括：所有用户共用一个默认会话导致串话；直接相信客户端提供的 conversationId 造成越权；窗口设置过大抬高 token 成本；只存 memory 导致审计历史缺失；多个请求同时更新同一会话导致顺序颠倒；把身份证、密钥等原文持久化到日志或提示词。对应解决方式是按用户与会话做服务端授权，设置 token 预算与清理策略，完整历史和工作记忆分层管理，并在同一会话设置请求串行化或乐观版本控制。

对 RAG 或 Agent 来说，会话记忆不应无条件覆盖系统规则，也不应被视为可信指令。历史消息可能包含用户注入的恶意内容；应采用类型化消息与明确的提示词层次，工具调用还要对权限和参数重新校验。记忆让上下文连续，但不会自动验证历史陈述的真实性。

上述内容是通用工程方案和本地学习示例，不声称已经在企业环境上线。实际选型需要用目标 Spring AI 版本、数据库方言和数据治理要求验证。

## 六、常见面试问题

### 初级：大模型为什么需要 ChatMemory？

模型调用通常无状态，ChatMemory 让应用按会话 ID 找回相关消息并重新提交给模型，从而形成多轮上下文。

### 中级：ChatMemory 和聊天历史有什么区别？

ChatMemory 是下一次推理使用的受限上下文；完整聊天历史用于查看、审计或导出，应由独立的持久化模型和访问规则管理。

### 项目：为什么 conversationId 不能作为授权依据？

它只是查找键。服务端还必须验证当前认证用户或租户确实拥有该会话，否则替换 ID 就可能越权访问他人消息。

### 项目：怎样控制记忆窗口和成本？

既限制消息窗口，也评估 token 总量、单条输入上限和模型上下文窗口；对长历史可做摘要或检索，但需验证摘要是否保留业务关键事实。

## 七、个人总结

作为一名 2027 届 Java 后端实习生，我通过会话记忆这部分学习认识到，“模型记得我”其实是后端在每次调用前后管理消息。要让它可用，除了引入 ChatMemory，还要处理会话归属、窗口大小、持久化、历史清理和并发顺序。之后做 AI 功能时，我会把模型能力和应用侧会话工程分开设计，再决定哪些历史值得送进上下文。

## 参考资料

- [Spring AI 1.0.9：Chat Memory](https://docs.spring.io/spring-ai/reference/1.0/api/chat-memory.html)
- [Spring AI 1.0.9：ChatClient 与 Advisors](https://docs.spring.io/spring-ai/reference/1.0/api/chatclient.html)
- [Spring AI 1.0.9：升级说明](https://docs.spring.io/spring-ai/reference/1.0/upgrade-notes.html)
