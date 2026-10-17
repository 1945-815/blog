---
title: "Spring AI MCP：用标准协议连接 Java 工具服务"
date: "2026-10-17"
categories: ["AI 应用"]
tags: ["Spring AI", "MCP", "JSON-RPC", "工具调用", "SSE"]
description: "基于 Spring AI 1.0.9 梳理 MCP 能力发现、工具注册、传输与安全边界。"
plan_date: "2026-10-17"
phase: "AI 应用探索"
---

# Spring AI MCP：用标准协议连接 Java 工具服务

## 一、MCP 解决什么问题

MCP（Model Context Protocol）为 AI 应用和外部能力之间提供标准交互方式。应用不必为每个工具服务重新设计一套发现和调用协议；MCP server 可以公开 tools、resources、prompts 等能力，client 负责连接、读取能力定义并转交调用。

MCP 不负责模型推理，也不是权限系统。模型可以提出工具调用，但由宿主应用决定是否让它看到该工具、如何执行和如何向用户呈现结果。server 暴露能力前仍要落实身份认证、业务授权、参数校验和审计。

## 二、角色与调用流程

在常见的 Spring AI 应用中，Host 是承载 ChatClient 和业务逻辑的应用；它为每个远程 MCP server 建立 client。server 独立提供能力。MCP 消息采用 JSON-RPC，传输层负责传递消息，不改变 tools、resources、prompts 的协议含义。

```text
用户请求
  -> Spring Boot Host / ChatClient
  -> MCP Client 读取已授权的工具定义
  -> 模型提出工具调用
  -> Host 将调用交给 MCP Client
  -> MCP Server 执行 Java 工具并返回结果
  -> Host 把结果交回模型，再生成用户回答
```

`WeatherService` 可把按城市 id 查询天气的方法标记为 `@Tool`，再由 `MethodToolCallbackProvider` 暴露给 MCP server。Client 与 server 应分别验证，不能把两个独立模块的代码片段当作已经验证的端到端链路。

## 三、Spring AI 1.0.9 代码结构

示例基于 Java 17、Spring Boot 3.3.5 和 Spring AI BOM 1.0.9。client 模块包含 OpenAI 模型 starter 和 `spring-ai-starter-mcp-client`；server 模块使用 `spring-ai-starter-mcp-server-webflux`。

server 可以从 Spring Bean 中注册 MCP 工具：

~~~java
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class McpConfig {
    @Bean
    public ToolCallbackProvider tools(WeatherService weatherService) {
        return MethodToolCallbackProvider.builder()
            .toolObjects(weatherService)
            .build();
    }
}
~~~

天气查询方法可用 `@Tool` 描述用途、用 `@ToolParam` 描述输入。下面只展示方法签名，省略 HTTP 调用、JSON 解析和 DTO 组装；部署时应从受控配置读取外部 API 地址和凭据：

~~~java
@Tool(description = "根据城市 id 查询天气信息")
public WeatherDTO getWeather(
        @ToolParam(description = "城市 id") String cityId) {
    // 方法体省略
}
~~~

client 侧则把远端 MCP 工具桥接为 Spring AI 的 `ToolCallbackProvider`，再显式提供给 ChatClient。不要把所有远程工具不加筛选地设为每次对话都可用。

~~~java
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.context.annotation.Bean;

@Bean
ChatClient chatClient(ChatClient.Builder builder,
                      ToolCallbackProvider mcpTools) {
    return builder.defaultTools(mcpTools).build();
}
~~~

当前片段展示依赖关系和注册边界；具体 DTO、WeatherService 业务代码、连接地址和鉴权值应从目标项目配置读取。示例不包含 endpoint 与凭据。

## 四、传输方式与版本边界

Spring AI 1.0.9 的 client 示例使用 HTTP/SSE transport。SSE 是该版本代码使用的传输方式，不是 MCP 本身的全部语义。协议与框架都在演进：当前 MCP 规范列出 STDIO 和 Streamable HTTP 等标准 transport；较早 revision 的兼容规则仍需在连接双方核对。当前 Spring AI 2.x 文档将旧 SSE server transport 标为弃用并建议新项目评估 Streamable HTTP。因此，迁移时不能只改 starter 名称，还要检查协议 revision、client/server 支持、反向代理、会话、鉴权和取消行为。

若使用 STDIO，通常由 Host 启动本地子进程并经标准输入输出交换消息；使用 HTTP transport 时，MCP server 通过网络独立运行。两种部署的进程管理、网络边界和安全审查方式不同。

## 五、常见问题与安全边界

- **把 MCP 当成授权机制：**协议负责能力交互；用户身份、租户范围和业务规则仍由 Host/server 验证。
- **默认公开所有工具：**只注册当前用户和当前请求需要的工具；写入、支付、预约或删除类能力应单独审批。
- **信任模型生成的参数：**server 端要再次校验 schema、范围、资源归属、超时和幂等键。
- **把远端返回当可信指令：**工具结果应作为数据交给模型，不能覆盖系统规则。
- **暴露 HTTP server：**MCP endpoint 需要访问控制和网络隔离。Spring AI 的 HTTP transport 自动配置本身不会替应用建立完整的认证与业务授权。
- **把密钥写进配置：**外部 API key、token 和 endpoint 凭据要从环境或密钥管理系统注入，日志也要脱敏。

排查时先确认依赖版本与 transport，再检查 MCP server 是否启动、工具是否能被发现、工具名是否冲突、参数 schema 是否匹配，最后跟踪工具返回和模型二次生成。将 client 连接日志、工具调用日志和模型响应分开观察，避免只看到最终回答却不知道是哪一步失败。

## 六、学习总结

MCP 解决的是能力如何被发现和调用的互操作问题。对 Java 应用来说，Spring AI client 能把 MCP 能力接入工具调用链，server 能把现有服务方法按受控接口公开；业务权限和安全责任依旧属于应用本身。1.0.9 的 SSE client 与 WebFlux server 组合仅适用于对应版本，新版本实现需要按当前协议和依赖重新核对。

## 参考资料

- [Model Context Protocol：传输层与消息格式](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)
- [Spring AI 1.0.9：MCP Client Boot Starter](https://docs.spring.io/spring-ai/reference/1.0/api/mcp/mcp-client-boot-starter-docs.html)
- [Spring AI 1.0.9：MCP Server Boot Starter](https://docs.spring.io/spring-ai/reference/1.0/api/mcp/mcp-server-boot-starter-docs.html)
- [Spring AI 当前文档：MCP Server transport 与安全配置](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-server-boot-starter-docs.html)
