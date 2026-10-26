---
title: "Spring AI 与 Ollama：配置和本地模型调用"
date: "2027-01-12"
categories: ["AI 应用"]
tags: [
  "Java",
  "Spring Boot",
  "大模型应用",
  "Ollama"
]
description: "梳理 Spring Boot 连接 Ollama 模型的配置、ChatClient 调用和首轮排查。"
plan_date: "2026-11-20"
phase: "AI 应用开发"
---

# Spring AI 与 Ollama：配置和本地模型调用

## 问题背景

调用大模型 API 不只是写一段提示词。应用需要配置模型服务、选择实际存在的模型名、发送请求并处理响应。使用本地 Ollama 可以在隔离环境中验证调用链路，避免把请求发送给远程模型服务。

该链路连接了 Spring Boot Controller、依赖注入与模型调用。返回文本只是起点，服务还要考虑超时、并发限制、输入安全、错误响应和日志脱敏。

## 核心原理

Ollama 在本机提供模型运行服务，默认地址为 localhost:11434。Spring AI starter 根据 application 配置自动装配 OllamaChatModel；ChatClient 同时提供同步调用和流式调用入口。`prompt().user(...).call().content()` 会等待模型完成并读取文本内容，`stream()` 则返回增量响应流。

模型本身不替应用保存完整会话状态。多轮对话要由应用明确维护消息历史或会话上下文。小参数模型适合本地流程验证，但回答质量和首轮耗时会受模型、硬件、上下文长度和资源占用影响。

## 实现示例

示例使用 Spring Boot 3.5.15 与 Spring AI 1.0.9 BOM。BOM 用于统一 Spring AI 组件版本，具体版本应按项目依赖兼容关系选择。Ollama 模型需先在本机通过 `ollama list` 确认已安装。

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

Controller 只接收一个有长度限制的示例提示词。真实对外接口应使用 POST、身份校验、限流和超时设置，不要把任意用户输入不加约束地暴露给模型：

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

## 实际应用

该示例链路包括：本地模型准备、Spring Boot 依赖与配置、模型 Bean 注入、Controller 接收输入，再把模型文本返回。不同模型的参数支持不同，不能把 temperature 等选项默认套用到所有模型。


### 部署选择与接口兼容

Ollama 的 `/api/chat` 与应用自身的聊天接口属于不同边界；使用 OpenAI 兼容 API 时，也要确认服务端实际支持的模型名、鉴权方式、流式事件和参数语义。部署方式可以是本地模型、云端 API 或自建服务，接入前应逐项验证接口能力。

OpenAI 兼容通常只表示接口形状相近，不代表模型名、鉴权、流式事件、工具调用支持和参数语义完全一致；API key 应由环境变量或密钥管理系统注入。

本地验证时先确认服务状态和模型名，再检查配置属性与启动日志。若模型加载慢，先确认硬件资源和 Ollama 状态；不要把等待页面误判为 Controller 路由没有生效。

## 本地模型调用边界

- **模型名与本地列表不一致：**配置中的模型名必须和 Ollama 已安装模型对应。
- **端口混淆：**应用通常在 8080 提供 HTTP 接口，Ollama 默认使用 11434。
- **没有提前加载模型：**首个 HTTP 请求可能包含模型加载耗时。
- **把同步调用当成轻量操作：**本地推理也会占用 CPU、内存或显存，应设置超时和并发上限。
- **把模型输出当成事实：**回答可能不完整或错误，需要基于具体应用做校验与回退。

## 改进思路

对外提供接口时改用 POST 请求体，避免提示词进入 URL 日志；限制请求体、并发和执行时长；对模型服务不可用返回稳定错误格式。多轮对话要明确会话隔离、历史长度和数据保留规则。切换 Spring AI 版本时重新核对 starter、属性命名和 API 自动装配行为。

## 设计取舍与结论

本地调用仍是一条普通服务调用链：依赖、配置、连接、输入、响应和失败处理都要逐项验证。先让最小请求可复现，再扩展到 RAG 或 Agent，更容易定位问题。

## 参考资料

- [Spring AI 1.0.9：Ollama Chat](https://docs.spring.io/spring-ai/reference/1.0/api/chat/ollama-chat.html)
- [Spring AI 1.0.9 API：ChatClient](https://docs.spring.io/spring-ai/docs/1.0.x/api/org/springframework/ai/chat/client/ChatClient.html)
- [Spring AI：Chat Client API](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
