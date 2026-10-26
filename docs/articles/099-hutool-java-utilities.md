---
title: "Hutool 常用工具类：字符串、标识符与 JSON"
date: "2026-10-17"
categories: ["Java 基础"]
tags: ["Java", "Hutool", "工具类", "JSON"]
description: "整理 Hutool 常用 API、依赖版本和不应交给工具类的业务判断。"
plan_date: "2026-10-17"
phase: "Java 与并发"
---

# Hutool 常用工具类：字符串、标识符与 JSON

## 引入依赖


~~~xml
<dependency>
    <groupId>cn.hutool</groupId>
    <artifactId>hutool-all</artifactId>
    <version>5.8.34</version>
</dependency>
~~~

示例使用 Hutool 5.8.34。新项目应使用项目统一管理的版本，并核对对应 API 文档、Java 版本要求和安全更新；不要因为示例中出现某个版本就直接复制到所有工程。

## 把常见工具放到一次输入处理中

下面的例子把表单名称做空白处理和校验，生成一个请求关联标识，再序列化为 JSON。它展示工具类 API 的组合，不构成业务校验或授权：

~~~java
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;

import java.util.LinkedHashMap;
import java.util.Map;

public class HutoolLogExample {
    public static String toEventJson(String rawName) {
        String name = StrUtil.trim(rawName);
        if (StrUtil.isBlank(name)) {
            throw new IllegalArgumentException("名称不能为空");
        }

        Map<String, Object> event = new LinkedHashMap<>();
        event.put("requestId", IdUtil.simpleUUID());
        event.put("name", name);
        return JSONUtil.toJsonStr(event);
    }
}
~~~

`StrUtil.isBlank` 适合判断空字符串和空白字符；`IdUtil.simpleUUID` 生成不带连字符的 UUID 文本；`JSONUtil.toJsonStr` 负责 JSON 序列化。这个 `requestId` 只用于关联一次请求的日志，不能作为登录凭证、授权令牌或数据库唯一约束的替代品。

## 思维导图中的工具分类

| 工具类 | 常见用途 | 使用边界 |
| --- | --- | --- |
| `IdUtil` | UUID、ObjectId、Snowflake 等 ID 生成 | Snowflake 需要稳定且不冲突的 worker/data-center 配置；安全令牌使用密码学安全随机数 |
| `StrUtil` | 空白检查、前后缀、模板和字符串处理 | 清理字符串不等于业务校验；保留原始输入时要另存审计字段并做脱敏 |
| `EnumUtil` | 枚举查询和转换 | 外部字符串映射枚举时要处理未知值，不要依赖枚举声明顺序 |
| `RandomUtil`、`NumberUtil` | 随机值与数值运算 | 普通随机数不适用于密钥；金额运算需明确精度、舍入模式和币种 |
| `CollUtil`、`CollStreamUtil` | 集合判空、创建与 Stream 操作 | 空集合、重复项、可变集合和顺序都要按业务语义处理 |
| `DateUtil` | 日期解析、格式化与时间计算 | 业务时区、夏令时和 `java.time` 类型要明确；不要依赖服务器默认时区 |
| `BeanUtil`、`Convert` | Bean 复制与类型转换 | DTO 到实体的批量复制可能覆盖敏感字段；转换失败和溢出要显式处理 |
| `MapUtil`、`JSONUtil` | Map 操作与 JSON 转换 | JSON 格式正确不代表字段可信；反序列化后仍需 schema 和业务校验 |
| `SpringUtil` | 从 Spring 容器取 Bean | 常规业务优先构造器注入；静态全局取 Bean 会隐藏依赖关系 |

## 在 Spring AI 辅助代码中的位置

天气查询工具可以用 `HttpUtil` 请求外部服务，再用 `JSONUtil` 读取响应并组装 `WeatherDTO`。工具类减少重复的 HTTP/JSON 操作，但不会替代超时、状态码检查、响应字段校验、异常映射和密钥保护。对外服务调用仍应使用连接超时和读取超时，并且只把必要字段返回给模型。

当工具由 `@Tool` 暴露给模型时，调用参数仍然不可信：先校验城市 id，再访问服务端；结果应脱敏并限制大小。工具类的便捷 API 不能把这个安全边界自动补上。

## 小结

Hutool 把字符串、集合、日期、ID、Bean 和 JSON 的常见操作放进统一工具库，适合减少样板代码。使用时仍要理解 API 的边界：序列化不做业务验证，Bean 复制不做字段授权，随机数不等于安全令牌，日期格式化也不会自动决定正确时区。

## 参考资料

- [Hutool StrUtil 文档](https://doc.hutool.cn/pages/StrUtil/)
- [Hutool IdUtil 文档](https://doc.hutool.cn/pages/IdUtil/)
- [Hutool JSONUtil API](https://plus.hutool.cn/apidocs/cn/hutool/json/JSONUtil.html)
