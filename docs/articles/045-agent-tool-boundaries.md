---
title: "Agent 工具调用：输入校验、权限边界与失败处理"
date: "2027-01-26"
categories: ["AI 应用"]
tags: [
  "Java",
  "Agent",
  "大模型应用",
  "安全"
]
description: "用纯 Java 白名单路由示例说明模型建议不等于执行授权。"
plan_date: "2027-01-10"
phase: "AI 应用探索"
---

# Agent 工具调用：输入校验、权限边界与失败处理

### 学习目标

- 把模型产生的工具名和参数当成不可信输入。
- 用固定白名单限制可调用能力。
- 在执行前校验参数，在执行后限制结果并记录可追踪信息。

## 一、为什么学习这个技术

如果模型只能返回文本，应用仍然决定如何解释和展示它；如果模型可以调用工具，应用还要决定它能读取或修改什么。模型可能生成拼错的工具名、缺少参数或超出预期的内容，检索到的文本也可能包含误导指令。

因此“模型想做什么”和“应用允许做什么”必须分开。工具调用请求只是一条建议，最终授权应由确定性的应用代码执行。

## 二、技术原理

一个简化的 Agent 循环包含模型请求、工具调用提议、应用校验和执行、工具结果回填及下一轮模型响应。权限不应依赖模型自我约束；工具接口越窄，越容易验证和审计。

它不会访问任意 URL、执行 shell 命令、运行 SQL 或修改文件。完整应用还需考虑身份鉴权、速率限制、超时、幂等性、输出脱敏和审计。

## 三、核心代码实现

保存为 SafeToolRouterDemo.java，可用 JDK 17 编译运行。传入的 ToolRequest 可以代表模型产生的函数调用提议，但只有白名单中的名称和精确参数集合会被执行：

~~~java
import java.time.LocalDate;
import java.util.Map;
import java.util.Set;

public class SafeToolRouterDemo {
    record ToolRequest(String name, Map<String, String> arguments) {}

    private static final Set<String> ALLOWED_TOOLS =
            Set.of("search_notes", "get_date");
    private static final int MAX_QUERY_LENGTH = 120;

    static String dispatch(ToolRequest request) {
        if (request == null || !ALLOWED_TOOLS.contains(request.name())) {
            throw new IllegalArgumentException("工具不在允许列表中");
        }
        if (request.arguments() == null) {
            throw new IllegalArgumentException("参数不能为空");
        }

        return switch (request.name()) {
            case "search_notes" -> searchNotes(request.arguments());
            case "get_date" -> currentDate(request.arguments());
            default -> throw new IllegalArgumentException("工具不在允许列表中");
        };
    }

    private static String searchNotes(Map<String, String> arguments) {
        if (!arguments.keySet().equals(Set.of("query"))) {
            throw new IllegalArgumentException("search_notes 只接受 query 参数");
        }
        String query = arguments.get("query");
        if (query == null || query.isBlank() || query.length() > MAX_QUERY_LENGTH) {
            throw new IllegalArgumentException("query 为空或超出长度限制");
        }

        // 示例只查询固定内存条目，不接受模型给出的文件路径或 SQL。
        if (query.toLowerCase().contains("redis")) {
            return "资料摘要：Redis TTL 以 key 为单位；-1 表示无过期时间，-2 表示 key 不存在。";
        }
        return "没有找到匹配的公开学习摘要。";
    }

    private static String currentDate(Map<String, String> arguments) {
        if (!arguments.isEmpty()) {
            throw new IllegalArgumentException("get_date 不接受参数");
        }
        return LocalDate.now().toString();
    }

    public static void main(String[] args) {
        ToolRequest allowed =
                new ToolRequest("search_notes", Map.of("query", "Redis TTL"));
        System.out.println(dispatch(allowed));

        ToolRequest rejected =
                new ToolRequest("run_shell", Map.of("command", "whoami"));
        try {
            System.out.println(dispatch(rejected));
        } catch (IllegalArgumentException ex) {
            System.out.println("拒绝执行：" + ex.getMessage());
        }
    }
}
~~~

运行示例只会返回固定摘要，并拒绝未登记的 run_shell 工具。真实工具应按业务需要定义独立 DTO，检查用户身份、参数范围和资源归属，再调用具备最小权限的服务。不要通过反射按模型生成的字符串查找类或方法。

## 四、实际应用

### Function Calling 示例

客服类应用可以通过 Spring AI 将模型提出的工具调用交给 Java 方法执行：MyBatis-Plus 查询课程与校区，预约服务创建预约记录。

| 工具 | 职责 | 副作用 |
| --- | --- | --- |
| `queryCourse` | 按课程类型、学历要求和排序条件查询可选课程 | 只读 |
| `queryAllSchools` | 查询校区信息 | 只读 |
| `createCourseReservation` | 生成课程预约 | 写入预约数据，需额外授权与确认 |

在 Spring AI 1.0.x 中，工具方法可用 `@Tool` 暴露，`@ToolParam` 为模型可见的参数提供说明。下面是工具层的结构示意；`CourseQuery`、`Course`、`CourseService` 和 `validate` 表示应用自己的 DTO、服务与校验边界，方法名仅作示意。具体 MyBatis-Plus 查询仍由课程业务代码负责：

~~~java
// 结构示意：CourseQuery / Course / CourseService / validate 由业务工程提供。
@Service
public class CourseTools {
    private final CourseService courseService;

    public CourseTools(CourseService courseService) {
        this.courseService = courseService;
    }

    @Tool(description = "按课程类型和学历要求查询可选课程")
    public List<Course> queryCourse(
            @ToolParam(description = "课程筛选条件；缺省时查询可选课程", required = false)
            CourseQuery query) {
        return courseService.findAvailable(validate(query));
    }

    @Tool(description = "查询可供用户选择的校区")
    public List<String> queryAllSchools() {
        return courseService.findSchoolNames();
    }

    private CourseQuery validate(CourseQuery query) {
        return CourseQueryValidator.validate(query);
    }
}
~~~

在实际代码中要先把字段映射到固定列名，再执行排序；不要将模型提供的任意字符串拼进 SQL：

~~~java
private static final Map<String, String> SORT_COLUMNS = Map.of(
    "price", "price",
    "duration", "duration"
);

static String requireSortColumn(String requestedField) {
    String column = SORT_COLUMNS.get(requestedField);
    if (column == null) {
        throw new IllegalArgumentException("不支持的课程排序字段");
    }
    return column;
}
~~~

预约属于写操作。推荐流程是先查询并展示课程、校区和用户将要提交的信息，等待用户明确确认，再由服务端校验登录身份、课程状态、输入长度和重复提交标识，最后调用预约服务。聊天中的“帮我预约”只能形成工具调用建议，不能替代用户确认。真实预约还应最小化收集联系方式并设置访问与保留规则。

常见威胁包括提示词注入、越狱、数据提取及提示词拒绝服务。系统提示词可以约束模型行为，却不能替代鉴权、工具白名单、字段校验、配额和超时；检索到的网页或文档内容也必须当作不可信数据。

当前纯 Java 示例是独立的输入校验练习，没有连接真实模型。若把课程工具接入 Spring AI，仍需按请求或用户显式注册可用工具，并由应用代码决定权限。只读检索可以先做资源范围过滤；写操作还要有用户确认、幂等键、审计记录和失败补偿策略。

工具结果也不能直接视为可信指令。网页、文档和用户输入可能包含 prompt injection 内容；检索结果要作为数据处理，不能让它覆盖系统权限规则。

## 五、问题记录

- **任意方法调用：**把模型返回的字符串映射为反射方法会扩张攻击面；改用固定路由表。
- **参数未校验：**即使工具名正确，超长查询、未知字段或错误资源 ID 仍可能产生风险。
- **过度授权：**给模型一个万能数据库或 shell 工具，会让提示词失误变成真实副作用。
- **没有超时和限流：**慢工具或重复工具请求会拖垮服务，需设置预算和取消策略。
- **把异常原文返回模型或用户：**内部路径、SQL 和凭证可能泄露；对外转换为受控错误。
- **没有审计：**至少记录调用者、工具名、结果状态和关联请求 ID，敏感参数要脱敏。

## 六、改进方向

先从无副作用、低敏感度的只读工具开始，逐步增加能力。为每个工具定义明确 schema、权限检查、超时与结果大小上限；修改类工具要有确认或补偿机制。测试时覆盖未知工具、缺字段、多字段、越权资源和服务超时等拒绝路径。

## 七、个人思考

Agent 的智能部分可以提出计划，但执行权仍属于应用。真正可靠的工具调用不靠模型“听话”，而靠窄接口、显式授权、参数校验和可追踪的失败处理。

## 延伸：面试问答

### 模型返回了工具名就应该执行吗？

不应该。工具名和参数是外部输入，服务端要检查白名单、用户权限、参数 schema 和资源范围。

### 为什么先从只读工具开始？

只读操作通常没有直接修改副作用，较适合验证请求、授权和结果回填链路；写操作还需要幂等、确认、审计和补偿。

### 如何防止模型调用任意命令？

不提供通用 shell 工具；将可用能力固定为有限路由，不做动态反射或任意命令拼接，并用最小权限运行。

## 参考资料

- [Spring AI 1.0：Tool Calling](https://docs.spring.io/spring-ai/reference/1.0/api/tools.html)
- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
