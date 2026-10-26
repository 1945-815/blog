---
title: "Spring AI 流式响应：用 WebFlux 与 SSE 逐段返回模型内容"
date: "2027-07-13"
categories: ["AI 应用"]
tags: ["Spring AI", "Ollama", "WebFlux", "SSE", "LLM"]
description: "从 ChatClient Flux 到浏览器 Server-Sent Events，梳理流式调用、客户端断开、错误处理和请求观测。"
plan_date: "2026-10-20"
phase: "AI 应用开发"
---

# Spring AI 流式响应：用 WebFlux 与 SSE 逐段返回模型内容

## 问题背景

同步接口通常等模型生成完整答案后才返回。对长回答来说，用户会在一段时间内看不到任何反馈；网关和客户端也可能因为等待时间过长而超时。流式输出能够更早显示首批内容，改善交互感，但不会让模型本身推理更快，也不一定降低总生成时间。

实现流式接口需要贯通多个边界：模型是否支持 streaming、服务端是否采用响应式调用栈、HTTP 代理是否缓冲数据、客户端是否按流解析事件、用户取消请求时下游订阅能否取消。任何一层把数据聚合到最后，界面仍会呈现为“等完整结果”。

## 核心概念

Spring AI 的 `ChatClient.stream().content()` 返回 `Flux<String>`，即异步到达的文本片段流。片段大小并不等于一个汉字或一个完整句子，不能把每个元素当作语言学意义上的 token，也不应依赖模型每次刚好按标点切分。

SSE（Server-Sent Events）是服务端通过一个 HTTP 响应持续向客户端发送事件的格式。响应通常使用 `text/event-stream`，每个事件由 `data:` 行和空行边界组成。SSE 适合服务端向客户端单向推送；若需要客户端实时双向发送消息，可以另行评估 WebSocket 等方案。

`Flux<String>` 描述的是 Java 侧的数据流，不会自动决定 HTTP 使用 SSE。若接口声明 `text/plain` 或 `text/html` 并直接写出字符串片段，客户端收到的是普通响应体流；若声明 `text/event-stream` 并输出 `ServerSentEvent` 或遵循 SSE 事件帧格式，才是 SSE。前后端必须按同一协议解析。

Spring AI 1.0.x 的流式模型调用依赖响应式栈。对于现有 Servlet 项目，接入流式调用时可在该接口边界使用 Spring WebFlux；在同一个应用混合 imperative 和 reactive 编程时，应明确阻塞调用所在的线程，避免在事件循环线程上执行 JDBC 或阻塞式服务调用。代理层还需关闭响应缓冲或配置适当的超时策略。

## 底层原理

请求到达 Controller 后，方法返回 Publisher，而不是等待最终字符串。HTTP 响应订阅 Flux 后，数据才逐段向下游传递；模型适配器收到服务端的流式响应，再把其中的内容增量映射为 `Flux<String>`。WebFlux 将每个片段编码成 SSE 文本并写入响应。响应头发送后，HTTP 状态码和响应头通常已经固定，所以后续模型异常不能再像普通 Controller 那样返回一个新的 JSON 错误码。

响应式流也提供取消信号。用户关闭页面或主动取消请求时，订阅可能被取消，应用应尽可能停止继续消费模型响应，节省连接和推理资源；具体取消是否能传递到提供商要看模型客户端实现。若服务端使用 `.collectList().block()` 把 Flux 聚合为字符串，便会失去流式输出，并可能阻塞请求线程。

增量流的可观测性要区分首字延迟、完整响应耗时、片段数量、调用错误和客户端取消。记录问题时用请求 id 关联日志，避免默认把完整 prompt 和输出写入日志；其中可能包含个人信息、业务数据或密钥。

## 代码案例

下面示例将 Spring AI 的 `Flux<String>` 流包装为 SSE 事件，参考环境为 Java 17、Spring Boot 3.5.x 和 Spring AI 1.0.9。运行前需启动 Ollama 并拉取配置的模型。客户端应按原顺序拼接文本片段，而不能依赖片段边界。

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


Controller 返回 `Flux<String>` 可以按顺序发送文本片段，但仅凭 `Flux` 无法确认 HTTP 响应采用了标准 SSE 帧编码。客户端应根据实际 `Content-Type` 解析响应；若要提供标准 SSE，应显式返回事件对象并验证事件格式。

本例显式将文本片段包装为标准 SSE 事件，以便客户端通过事件类型区分增量内容。

## 异常、取消与部署

长耗时模型回答、代码分析或文档问答可以设计为可取消的流式交互，并限制单用户并发、输入长度、模型上下文和最大生成时间。若模型服务不可用，应在尚未写出响应头时返回明确错误；流开始后发生故障，只能发送约定的错误事件（若客户端协议支持）或结束连接，并通过 requestId 供定位。

部署链路要逐层确认：模型端开启流式模式，Java 端不聚合，Nginx 或网关不缓冲响应，压缩配置不会造成长时间攒包，负载均衡超时高于合理请求预算。还需检查客户端断开、模型超时、空流、连接中断和并发限额。对事件数据格式做契约约定，避免把原始模型异常、内部地址或堆栈透传给浏览器。

流式展示也有安全边界：模型输出仍是非可信文本，不能因为逐段显示就直接解释为 HTML；应该进行安全渲染。记录提示词和回答需考虑数据最小化、用户授权与保留策略。实际延迟、吞吐和断连恢复行为应在目标模型服务与网络条件下测量。

## 设计取舍与结论

流式响应要求模型客户端、响应式服务、HTTP 代理和浏览器都能持续传递数据。取消、超时、错误事件与日志策略应贯穿整条链路。

## 参考资料

- [Spring AI 1.0.9：ChatClient API 与流式响应](https://docs.spring.io/spring-ai/reference/1.0/api/chatclient.html)
- [Spring AI 1.0.9：Ollama Chat](https://docs.spring.io/spring-ai/reference/1.0/api/chat/ollama-chat.html)
- [Spring Framework：WebFlux](https://docs.spring.io/spring-framework/reference/web/webflux.html)
