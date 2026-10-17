---
title: "Java 基础语法练习：变量、输入与流程控制"
date: "2026-10-16"
categories: ["Java 基础"]
tags: ["Java", "基础语法", "流程控制"]
description: "用变量、类型转换、Scanner、分支和循环组成可运行练习，并校正易混淆的语言规则。"
plan_date: "2026-10-16"
phase: "Java 基础与数据结构"
---

# Java 基础语法练习：变量、输入与流程控制

课堂日期是资料时间，本文日期是写作时间。示例是独立练习，不涉及真实业务系统。

## 从源文件运行

JDK 提供 `javac` 编译器和 `java` 启动命令。把下方代码保存为 `ScoreLevelDemo.java`，在该目录执行 `javac ScoreLevelDemo.java`，再执行 `java ScoreLevelDemo`。文件名需与 `public class` 名称一致。这里使用 JDK 8 及以上的基本语法；也可在 JDK 17 编译。

变量由类型、名称和值组成。`int` 适合整数分数，`double` 是二进制浮点数，不宜直接表示需要精确舍入的金额。局部变量**可以先声明**，但沿任意可达执行路径，在读取之前必须确定已赋值。字段和数组元素有默认值；`char` 的默认值是 `\u0000`，不是空格。

## 把输入、条件和循环放在一个流程里

下面把它们放进一个“输入三次分数并求等级”的小程序：

~~~java
import java.util.Scanner;

public class ScoreLevelDemo {
    public static void main(String[] args) {
        int sum = 0;
        int accepted = 0;
        try (Scanner scanner = new Scanner(System.in)) {
            for (int attempt = 0; attempt < 3; attempt++) {
                System.out.print("请输入 0–100 的整数分数：");
                if (!scanner.hasNextInt()) {
                    System.out.println("输入不是整数，结束练习");
                    break;
                }
                int score = scanner.nextInt();
                if (score < 0 || score > 100) {
                    System.out.println("分数超出范围，本次不计入");
                    continue;
                }
                sum += score;
                accepted++;
                int level = score / 10;
                switch (level) {
                    case 10:
                    case 9:
                        System.out.println("优秀");
                        break;
                    case 8:
                    case 7:
                    case 6:
                        System.out.println("及格");
                        break;
                    default:
                        System.out.println("需继续练习");
                }
            }
        }
        if (accepted > 0) {
            System.out.println("平均分：" + (double) sum / accepted);
        }
    }
}
~~~

`score / 10` 是整数除法；`(double) sum / accepted` 先转换再相除，避免截断小数。`&&`、`||` 具有短路求值；仅当确实需要同时计算两边时才使用非短路运算。`break` 结束当前 `switch` 或循环，`continue` 跳过当前循环余下语句。`Scanner` 从标准输入读取；关闭它也会关闭 `System.in`，所以这个独立命令行程序只创建一次扫描器。

`for` 适合次数已知、计数变量作用域只在循环内的场景；`while` 适合结束条件随输入变化的场景。两者没有“for 一定更省内存”的语言保证。课堂中的随机数练习可用 `Random`；随机值不能替代密码学用途的 `SecureRandom`。

## 容易混淆的边界

- 基本类型扩大转换可能自动发生，缩小转换需要显式强制转换，而且可能丢失精度；例如 `(int) 3.9` 得到 `3`。
- `==` 对基本类型比较值，对引用类型比较是否指向同一对象。比较字符串内容使用 `equals`，调用方可能为 `null` 时可将常量放左边。
- `switch` 的旧式 `case` 通常需要 `break` 防止继续执行后续分支；上面的多个 `case` 合并是有意的。
- 初学 JVM 时只需先分清方法调用、局部变量和对象创建的概念；“变量都在栈里、对象都在堆里”不足以描述所有实现和优化，细节见 [JVM 故障分析文章](./052-jvm-memory-oom-diagnosis.md)。

## 自查

输入 `90、101、60` 时，为什么只计算两次平均分？若把 `sum / accepted` 的强制转换去掉会怎样？若读入一个非整数后仍要继续，应该先消费哪个错误 token？这些问题都要顺着实际控制流回答，而不是只背语法。

下一步可沿 [类与对象](./002-java-class-object.md) 理解状态和方法，再用 [数组练习](./004-data-structures-basics.md) 处理一组数据。

## 资料与规范

- [Java 语言规范：变量](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html)
- [Java 语言规范：语句](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html)
