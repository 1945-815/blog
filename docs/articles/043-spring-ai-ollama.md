---
title: "用 Spring AI 和 Ollama 完成第一次本地模型调用"
date: "2027-01-12"
categories: ["AI 应用"]
tags: [
  "Java",
  "Spring Boot",
  "大模型应用",
  "Ollama"
]
description: "复盘 Spring Boot 连接本地 Ollama 模型的配置、ChatClient 调用和首轮排查。"
plan_date: "2026-11-20"
phase: "AI 应用探索"
---

# 用 Spring AI 和 Ollama 完成第一次本地模型调用

### 文章定位

我的学习资料记录了 2026 年 10 月 12 日搭建 Spring AI 环境，以及 10 月 13 日使用 Ollama 和 Spring Boot 调用本地模型。本文把这次入门过程整理成一个小接口，使用 qwen3:1.7b 作为本地模型示例；它是学习环境，不是线上 AI 服务。

### 学习目标

- 区分 Spring Boot 服务地址与 Ollama 服务地址。
- 通过 Spring AI Ollama starter 自动配置聊天模型。
- 用 ChatClient 发起同步请求，并知道本地模型首轮调用可能较慢。

## 一、为什么学习这个技术

调用大模型 API 不只是写一段提示词。应用需要配置模型服务、选择实际存在的模型名、发送请求并处理响应。使用本地 Ollama 可以在学习阶段完成调用链路，而不把请求发往远程模型服务。

这一步帮助我把 Spring Boot Controller、依赖注入与模型调用连接起来。返回文本只是第一阶段，后续还要考虑超时、并发限制、输入安全、错误响应和日志脱敏。

## 二、技术原理

Ollama 在本机提供模型运行服务，默认地址为 localhost:11434。Spring AI starter 根据 application 配置自动装配 OllamaChatModel；ChatClient 同时提供同步调用和流式调用入口。`prompt().user(...).call().content()` 会等待模型完成并读取文本内容，`stream()` 则返回增量响应流。

模型本身不替应用保存完整会话状态。多轮对话要由应用明确维护消息历史或会话上下文。小参数模型适合本地流程验证，但回答质量和首轮耗时会受模型、硬件、上下文长度和资源占用影响。

## 三、核心代码实现

学习资料记录的环境使用 Spring Boot 3.5.15 与 Spring AI 1.0.9 BOM。BOM 用于统一 Spring AI 组件版本，具体版本应按项目依赖兼容关系选择。Ollama 模型需先在本机通过 ollama list 确认已安装。

application.yaml 示例：

~~~yaml
spring:
  application:
    name: local-ollama-demo
  ai:
    ollama:
      base-url: http://localhost:11434
      chat:
        options:
          model: qwen3:1.7b
          temperature: 0.7
~~~

starter 依赖使用 org.springframework.ai:spring-ai-starter-model-ollama，并由 spring-ai-bom 1.0.9 管理版本。以下配置固定一个可注入的 ChatClient：

~~~java
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiClientConfiguration {
    @Bean
    public ChatClient ollamaChatClient(OllamaChatModel chatModel) {
        return ChatClient.builder(chatModel).build();
    }
}
~~~

Controller 只接收一个有长度限制的练习提示词。真实对外接口应使用 POST、身份校验、限流和超时设置，不要把任意用户输入不加约束地暴露给模型：

~~~java
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class LocalChatController {
    private final ChatClient chatClient;

    public record ChatRequest(String prompt) {}

    public LocalChatController(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    @PostMapping("/ai/chat")
    public String chat(@RequestBody ChatRequest request) {
        String prompt = request.prompt();
        if (prompt == null || prompt.isBlank() || prompt.length() > 500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "prompt 长度必须在 1 到 500 个字符之间");
        }
        return chatClient.prompt()
                .user(prompt)
                .call()
                .content();
    }
}
~~~

启动前可以在终端运行 `ollama run qwen3:1.7b` 完成模型加载，再启动 Spring Boot。通过 POST 请求体调用接口，避免把提示词放在 URL 中：

~~~bash
curl -X POST http://localhost:8080/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"你好"}'
~~~

8080 是应用端口，11434 是 Ollama 服务端口；第一次推理可能需要等待模型载入。

## 四、实际应用

这次练习的链路是：本地模型准备、Spring Boot 依赖与配置、模型 Bean 注入、Controller 接收输入，再把模型文本返回。课程资料也记录了 deepseek-r1:1.5b；不同模型的参数支持不同，不能把 temperature 等选项默认套用到所有模型。

### 课程笔记中的部署选择

`10.12 SpringAI入门与环境搭建` 记录了本地 Ollama 安装和模型下载；`10.13 Ollama+SpringBoot大模型应用` 继续对照 Ollama 的 `/api/chat` 与应用自己的聊天接口，并介绍 OpenAI 兼容 API 的接入思路。`01 SpringAI部分/01–03` 思维导图还把本地模型、云端 API 和自建服务列为不同部署选择。

这些资料说明的是学习时讨论和验证的路线，不能据此声称已经部署了云端或企业模型服务。OpenAI 兼容通常只表示一组接口形状相近，模型名、鉴权、流式事件、工具调用支持和参数语义仍需逐项核对；API key 应由环境变量或密钥管理系统注入。Apifox 集合中的本地示例地址仅供课堂调试，不应照抄到公开文章或生产配置。

学习阶段先验证本地服务状态和模型名，再检查配置属性与启动日志。若模型加载慢，先确认硬件资源和 Ollama 状态；不要把等待页面误判为 Controller 路由没有生效。

## 五、问题记录

- **模型名与本地列表不一致：**配置中的模型名必须和 Ollama 已安装模型对应。
- **端口混淆：**应用通常在 8080 提供 HTTP 接口，Ollama 默认使用 11434。
- **没有提前加载模型：**首个 HTTP 请求可能包含模型加载耗时。
- **把同步调用当成轻量操作：**本地推理也会占用 CPU、内存或显存，应设置超时和并发上限。
- **把模型输出当成事实：**回答可能不完整或错误，需要基于具体应用做校验与回退。

## 六、改进方向

对外提供接口时改用 POST 请求体，避免提示词进入 URL 日志；限制请求体、并发和执行时长；对模型服务不可用返回稳定错误格式。多轮对话要明确会话隔离、历史长度和数据保留规则。切换 Spring AI 版本时重新核对 starter、属性命名和 API 自动装配行为。

## 七、个人思考

第一次本地调用让我看到，大模型功能仍然是一条普通服务调用链：依赖、配置、连接、输入、响应和失败处理都要逐项验证。先把最小请求跑通，再讨论 RAG 或 Agent，问题会更容易定位。

## 延伸：面试问答

### Ollama 和 Spring AI 分别承担什么角色？

Ollama 在本地运行模型并提供服务端点；Spring AI 提供 Java 侧的模型抽象、配置和调用 API。

### 为什么第一次调用可能更慢？

模型可能尚未驻留内存，需要加载权重和初始化运行环境；硬件资源与模型大小也会影响推理时间。

### 多轮对话状态由谁管理？

通常由应用维护消息历史或会话上下文，不能假定一次无状态请求自动记住之前的内容。

## 参考资料

- [Spring AI 1.0.9：Ollama Chat](https://docs.spring.io/spring-ai/reference/1.0/api/chat/ollama-chat.html)
- [Spring AI 1.0.9 API：ChatClient](https://docs.spring.io/spring-ai/docs/1.0.x/api/org/springframework/ai/chat/client/ChatClient.html)
- [Spring AI：Chat Client API](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
