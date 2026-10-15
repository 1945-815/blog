---
title: "Spring AI 流式响应：用 WebFlux 与 SSE 逐段返回模型内容"
date: "2027-07-13"
categories: ["AI 应用"]
tags: ["Spring AI", "Ollama", "WebFlux", "SSE", "LLM"]
description: "从 ChatClient Flux 到浏览器 Server-Sent Events，梳理流式调用、客户端断开、错误处理和请求观测。"
plan_date: "2026-10-20"
phase: "AI 应用探索"
---

# Spring AI 流式响应：用 WebFlux 与 SSE 逐段返回模型内容

### 文章定位

现有 Spring AI 文章演示了通过 Ollama 同步调用模型，RAG 文章讲的是检索与上下文。本文补足从模型增量输出到后端 HTTP 流的工程链路：`ChatClient.stream()` 返回响应片段，WebFlux 将片段编码为 SSE 事件，调用方通过 `curl -N` 逐条读取。示例是个人练习，不代表已部署的在线 AI 服务。

## 一、为什么学习这个技术

同步接口通常等模型生成完整答案后才返回。对长回答来说，用户会在一段时间内看不到任何反馈；网关和客户端也可能因为等待时间过长而超时。流式输出能够更早显示首批内容，改善交互感，但不会让模型本身推理更快，也不一定降低总生成时间。

实现流式接口需要贯通多个边界：模型是否支持 streaming、服务端是否采用响应式调用栈、HTTP 代理是否缓冲数据、客户端是否按流解析事件、用户取消请求时下游订阅能否取消。任何一层把数据聚合到最后，界面仍会呈现为“等完整结果”。

## 二、核心概念

Spring AI 的 `ChatClient.stream().content()` 返回 `Flux<String>`，即异步到达的文本片段流。片段大小并不等于一个汉字或一个完整句子，不能把每个元素当作语言学意义上的 token，也不应依赖模型每次刚好按标点切分。

SSE（Server-Sent Events）是服务端通过一个 HTTP 响应持续向客户端发送事件的格式。响应通常使用 `text/event-stream`，每个事件由 `data:` 行和空行边界组成。SSE 适合服务端向客户端单向推送；若需要客户端实时双向发送消息，可以另行评估 WebSocket 等方案。

Spring AI 1.0.x 的流式模型调用依赖响应式栈。对于现有 Servlet 项目，接入流式调用时可在该接口边界使用 Spring WebFlux；在同一个应用混合 imperative 和 reactive 编程时，应明确阻塞调用所在的线程，避免在事件循环线程上执行 JDBC 或阻塞式服务调用。代理层还需关闭响应缓冲或配置适当的超时策略。

## 三、底层原理

请求到达 Controller 后，方法返回 Publisher，而不是等待最终字符串。HTTP 响应订阅 Flux 后，数据才逐段向下游传递；模型适配器收到服务端的流式响应，再把其中的内容增量映射为 `Flux<String>`。WebFlux 将每个片段编码成 SSE 文本并写入响应。响应头发送后，HTTP 状态码和响应头通常已经固定，所以后续模型异常不能再像普通 Controller 那样返回一个新的 JSON 错误码。

响应式流也提供取消信号。用户关闭页面或主动取消请求时，订阅可能被取消，应用应尽可能停止继续消费模型响应，节省连接和推理资源；具体取消是否能传递到提供商要看模型客户端实现。若服务端使用 `.collectList().block()` 把 Flux 聚合为字符串，便会失去流式输出，并可能阻塞请求线程。

增量流的可观测性要区分首字延迟、完整响应耗时、片段数量、调用错误和客户端取消。记录问题时用请求 id 关联日志，避免默认把完整 prompt 和输出写入日志；其中可能包含个人信息、业务数据或密钥。

## 四、代码案例

本地练习以 Java 17、Spring Boot 3.5.x 和 Spring AI 1.0.9 为参考，Ollama 需要已经启动并拉取对应模型。示例通过 `Flux<ServerSentEvent<String>>` 输出 `delta` 事件；客户端接收到的文本片段应按原顺序拼接，而不是依赖片段边界。

~~~yaml
spring:
  application:
    name: spring-ai-stream-demo
  ai:
    ollama:
      base-url: http://localhost:11434
      chat:
        options:
          model: qwen3:1.7b
          temperature: 0.2
server:
  port: 8080
~~~

`spring-ai-starter-model-ollama` 由 Spring AI BOM 管理版本；流式端点应使用 `spring-boot-starter-webflux`。以下 Controller 不聚合 Flux，且在流中出错时记录带 requestId 的错误，不尝试在响应开始后改写成另一个 HTTP 状态。

~~~java
@RestController
@RequestMapping("/api/ai")
public class StreamingChatController {
    private final ChatClient chatClient;

    public record StreamRequest(String prompt) {}

    public StreamingChatController(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> stream(
            @RequestBody StreamRequest request,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId) {
        String prompt = request.prompt();
        if (prompt == null || prompt.isBlank() || prompt.length() > 1000) {
            return Flux.error(new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "prompt 长度必须在 1 到 1000 之间"));
        }
        String id = requestId != null && requestId.matches("[A-Za-z0-9._-]{1,64}")
            ? requestId : UUID.randomUUID().toString();
        return chatClient.prompt().user(prompt).stream().content()
            .map(chunk -> ServerSentEvent.builder(chunk).event("delta").build())
            .doOnError(error -> log.warn("AI stream failed, requestId={}", id, error));
    }
}
~~~

为了追踪调用链，可以只保留脱敏后的状态和耗时，不把原文永久写入数据库。`prompt_hash` 可用于有限范围内的重复问题分析，但哈希不等同于匿名化：低熵内容仍可能被猜测，因此需要访问控制和保留期限。

~~~sql
CREATE TABLE ai_request_trace (
  request_id CHAR(36) PRIMARY KEY,
  user_id BIGINT NULL,
  prompt_hash CHAR(64) NOT NULL,
  status VARCHAR(24) NOT NULL,
  first_chunk_ms INT NULL,
  total_duration_ms INT NULL,
  chunk_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ai_trace_created (created_at),
  KEY idx_ai_trace_status_created (status, created_at)
);

SELECT status, COUNT(*)
FROM ai_request_trace
WHERE created_at >= NOW() - INTERVAL 1 DAY
GROUP BY status;
~~~

调用示例使用 `curl -N` 禁用客户端缓冲：

~~~bash
curl -N -X POST "http://localhost:8080/api/ai/stream" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: demo-123" \
  -d '{"prompt":"请用三句话解释Java集合"}'
~~~

浏览器端也可以通过 `fetch` 的 `ReadableStream` 读取响应体并按空行解析 SSE 事件。若使用原生 `EventSource`，需注意它默认使用 GET 且不便携带自定义 Authorization 请求头；认证方式和 prompt 长度应按项目安全模型设计。

如果需要接收客户端提供的 X-Request-Id，应先限制为 1 到 64 位的安全字符；不符合规则时由服务端生成 UUID。prompt 使用 POST 请求体传输，避免出现在 URL、代理访问日志和浏览器历史记录中。

## 五、项目真实落地

在企业项目中，我们通常会将长耗时模型回答、代码分析或文档问答设计为可取消的流式交互，并限制单用户并发、输入长度、模型上下文和最大生成时间。若模型服务不可用，应在尚未写出响应头时返回明确错误；流开始后发生故障，只能发送约定的错误事件（若客户端协议支持）或结束连接，并通过 requestId 供用户定位。

部署链路要逐层确认：模型端开启流式模式，Java 端不聚合，Nginx 或网关不缓冲响应，压缩配置不会造成长时间攒包，负载均衡超时高于合理请求预算。还需检查客户端断开、模型超时、空流、连接中断和并发限额。对事件数据格式做契约约定，避免把原始模型异常、内部地址或堆栈透传给浏览器。

流式展示也有安全边界：模型输出仍是非可信文本，不能因为逐段显示就直接解释为 HTML；应该进行安全渲染。记录提示词和回答需考虑数据最小化、用户授权与保留策略。以上属于常见实现思路，不代表我已在生产环境部署或测得具体延迟收益。

## 六、常见面试问题

### 初级：SSE 和普通 JSON 响应有什么区别？

普通 JSON 通常在完整响应体准备好后发送；SSE 保持一个 HTTP 响应打开并持续发送有边界的事件，适用于单向服务端推送。

### 中级：`Flux<String>` 中的每一项是不是一个 token 或汉字？

不一定。它是适配器输出的文本片段，分块方式由提供商与客户端实现决定。客户端应按顺序拼接并接受任意片段边界。

### 项目：为什么响应式流开始后不能直接返回统一 JSON 错误？

响应头和状态码可能已经发送，之后的异常只能终止流或发送约定格式的错误事件。需要提前校验输入并设计流式错误协议。

### 项目：如何定位流式接口“看起来不流式”？

确认模型开启 stream、代码没有聚合/阻塞，再检查代理缓存、压缩、客户端解析与超时设置，并通过首片段时间和抓包验证每一层。

## 七、个人总结

作为一名 2027 届 Java 后端实习生，我把流式生成理解成一条端到端的数据管道，而不只是把 `.call()` 改成 `.stream()`。模型、Spring 响应式栈、HTTP 代理和浏览器都必须按流工作。后续写 AI 接口时，我会先定义取消、超时、错误事件和日志边界，再考虑如何把内容实时显示出来。

## 参考资料

- [Spring AI 1.0.9：ChatClient API 与流式响应](https://docs.spring.io/spring-ai/reference/1.0/api/chatclient.html)
- [Spring AI 1.0.9：Ollama Chat](https://docs.spring.io/spring-ai/reference/1.0/api/chat/ollama-chat.html)
- [Spring Framework：WebFlux](https://docs.spring.io/spring-framework/reference/web/webflux.html)
