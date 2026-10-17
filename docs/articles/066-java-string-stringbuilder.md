---
title: "Java 字符串实践：String 不可变性与 StringBuilder"
date: "2027-06-22"
categories: ["Java 基础"]
tags: ["Java", "String", "StringBuilder", "字符串"]
description: "从对象不可变、循环拼接和 Unicode 边界理解 Java 字符串，并用后端摘要生成示例落地。"
plan_date: "2023-11-05"
phase: "Java 基础与数据结构"
---

# Java 字符串实践：String 不可变性与 StringBuilder

## 一、为什么学习这个技术

后端经常需要拼接日志摘要、导出文本、SQL 条件片段或模型提示词。单次 `a + b` 通常可读且没有问题；如果循环执行很多次，代码看起来仍然简单，实际可能不断创建新的字符串对象，复制已有内容。输入规模扩大后，CPU 分配和垃圾回收也会跟着增加。

另一个容易忽略的点是“字符数”不总等于用户看到的字符数。`String.length()` 返回 UTF-16 code unit 数量；对于某些补充平面字符，一个 Unicode code point 由两个 `char` 组成。做长度限制、截断和分页时，如果直接按 `char` 截开，可能破坏代理项。字符串技术因此同时关系到性能、正确性和接口体验。

## 二、核心概念

`String` 是不可变对象。调用 `toUpperCase`、`replace` 或 `concat` 不会修改当前对象，而是返回结果字符串。不可变使字符串可以安全共享，适合做配置值、键和请求中的只读数据；也意味着重复构造结果有实际分配成本。字符串字面量和 `intern` 涉及字符串池，但业务代码通常不需要手动 `intern` 用户输入。

`StringBuilder` 提供可变字符序列，适合单线程方法内逐段构造内容。`StringBuffer` 的方法带同步语义，历史上用于多线程共享缓冲区；在现代后端更常见的做法是让每个请求持有自己的局部 `StringBuilder`，而不是把一个共享 builder 暴露给多个线程。若拼接对象跨线程传递，正确性比“换成同步类”更重要，通常应传递最终不可变字符串。

`+` 的适用性要按语境判断。固定模板插值通常清楚易读，现代 Java 编译器对特定拼接表达式也会做优化；但不能据此推断循环中反复累加没有代价。判断性能应结合拼接次数、输入大小和运行时测量，而不是看到加号就机械替换。

## 三、底层原理

不可变的关键在于对象创建完成后，外部没有可以修改其字符内容的公开操作。引用变量重新赋值只是让变量指向另一个对象，不会改变原来对象。多个线程读取同一个 String 时，没有“某个线程追加内容、另一个线程突然读到半截”的共享可变状态问题。

循环内用 `result = result + part` 时，每轮都要形成一个新结果。若第 `i` 轮前已有约 `i × L` 个字符，单轮复制成本随着已有内容增长；循环执行 `n` 次的总复制量在等长片段场景下近似与 `n²` 成正比。`StringBuilder.append` 则把片段写入可扩容的内部缓冲区，容量不足时才扩容并复制。预估容量可以减少扩容，但过度预估也会浪费内存。

Java 的 `char` 是 16 位 UTF-16 code unit，不是“任意一个人类可见字符”。`codePointCount` 能统计 Unicode code point 数；但一个视觉字形也可能由多个 code point 组合形成，例如字母加组合音标或 emoji 序列。按 code point 截取能避免拆开代理对，却不一定能按屏幕显示的字形边界截断。产品若要求展示长度，应先明确计数规则。

## 四、代码案例

下面是独立可运行的小例子。示例限制输出长度时选择 code point，而不是直接截取 `char`；真实业务还需进一步确认是否需要按字素簇（grapheme cluster）截断。

~~~java
import java.util.List;

public class StringSummaryDemo {
    static String joinTitles(List<String> titles, int maxCodePoints) {
        StringBuilder out = new StringBuilder(128);
        for (int i = 0; i < titles.size(); i++) {
            if (i > 0) out.append(" | ");
            out.append(titles.get(i));
        }

        String text = out.toString();
        int count = text.codePointCount(0, text.length());
        if (count <= maxCodePoints) return text;
        int end = text.offsetByCodePoints(0, maxCodePoints);
        return text.substring(0, end) + "…";
    }

    public static void main(String[] args) {
        System.out.println(joinTitles(List.of("Java", "后端", "😀 搜索"), 16));
    }
}
~~~

若应用需要把摘要写入数据库，表结构可以显式规定字符集与容量。字符容量、接口限制和 UI 展示规则要统一讨论；不要用数据库字段长度代替接口校验。

~~~sql
CREATE TABLE article_summary (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  article_id BIGINT NOT NULL,
  summary_text VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_article_summary (article_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

SELECT article_id, summary_text
FROM article_summary
WHERE article_id = ?;
~~~

配置可以把接口输入上限从代码常量移到配置层，再由 `@ConfigurationProperties` 绑定并在服务入口校验。生产环境应给上限设合理范围，避免配置错误导致模型提示或导出内容无限增长。

~~~yaml
app:
  summary:
    max-input-items: 100
    max-output-code-points: 500
~~~

调用示例：

~~~bash
curl -G "http://localhost:8080/api/articles/42/summary" \
  --data-urlencode "limit=500"
~~~

若摘要由服务端基于多条标题生成，应先限制记录条数和每条字段长度，再使用一个局部 `StringBuilder`，最后统一保存。这样性能优化来自控制输入规模和减少中间字符串，而不是盲目改写所有 `+`。

## 五、项目真实落地

在企业项目中，我们通常会在导出、批量报表、日志聚合等“结果长度随记录数增长”的位置关注字符串构造。先确定最大行数和最大单字段长度，再对循环拼接做基准或压测；如果最终结果很大，还需要考虑流式写入响应或文件，而不是把整份内容一直留在堆内存中。

容易遇到的问题包括：循环读取数据时无上限导致导出结果过大；用共享可变 builder 产生并发串扰；按 `substring(0, n)` 截开代理对；把未校验的用户内容直接拼进 SQL。对应做法是分页查询、单请求局部缓冲区、明确长度语义，并使用 PreparedStatement 参数而非手工拼接 SQL。表结构中的文本字段用于保存最终内容，并不意味着 SQL 语句应该通过字符串拼接生成。

个人学习示例只演示可复现的文本摘要，不把它描述成已经上线的企业优化结果。要声称性能改善，需要记录 JDK、数据规模、基线实现和测量结果；没有对照实验时，只能说明复杂度上的预期。

## 六、常见面试问题

### 初级：String 为什么不可变？

对象构造后字符内容不能通过公开 API 修改。不可变对象可共享、适合做键，并减少并发下共享状态变化的问题；修改操作会产生新结果。

### 中级：StringBuilder 和 StringBuffer 如何选择？

方法内局部构造通常选 StringBuilder。StringBuffer 对方法调用提供同步，但同步不一定等于整个业务操作线程安全，也可能带来额外开销。优先避免共享可变对象。

### 项目：字符串截断为什么不能简单用 length 后 substring？

length 统计 UTF-16 code unit。若边界正好切开代理对，结果会含有不完整代理项；还要区分 code point 数量和用户看到的字形数量。

### 项目：所有 `+` 都应换成 StringBuilder 吗？

不应该。少量固定拼接通常更易读，现代编译器会处理常见表达式。只有循环累加或大规模动态构造等已识别场景，才应结合基准测试改写。

## 七、个人总结

作为一名 2027 届 Java 后端实习生，我从这部分基础知识里学到的不是“加号慢、Builder 快”这句口诀，而是先看字符串是否被重复构造、输入是否有上限、并发边界在哪里，以及字符长度如何定义。先把规则讲清楚，再优化可测量的热点，代码会比机械套用技巧更可靠。

## 补充：正则校验与 `StringBuffer` 边界

正则适合校验**语法形状**，不能代替业务规则。例如下面只接受 6–12 个 ASCII 字母或数字，不声称它就是安全密码策略；真实账户还需要长度、泄漏口令检查和服务端策略。

~~~java
import java.util.regex.Pattern;

public class RegexDemo {
    private static final Pattern ACCOUNT = Pattern.compile("[A-Za-z0-9]{6,12}");

    public static void main(String[] args) {
        System.out.println(ACCOUNT.matcher("User123").matches()); // true
        System.out.println(ACCOUNT.matcher("张三123").matches());   // false
        StringBuilder local = new StringBuilder();
        local.append("User").append(123);
        System.out.println(local.toString());
    }
}
~~~

`matches()` 要求整个输入符合表达式，查找局部片段才考虑 `find()`。`Pattern` 可以复用，但不要把用户随意输入的复杂正则直接用于大文本匹配，避免难以控制的匹配成本。`StringBuffer` 的单个方法有同步措施，却不能自动保证“检查后追加”等多个调用组成的操作整体原子；方法内部局部拼接仍通常用 `StringBuilder`。

## 参考资料

- [Java SE 17：String API](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/String.html)
- [Java SE 17：StringBuilder API](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/StringBuilder.html)
- [Java SE 17：Character API](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Character.html)
