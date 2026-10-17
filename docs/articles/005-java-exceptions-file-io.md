---
title: "Java 异常与文件 IO：把失败路径写清楚"
date: "2026-11-24"
categories: ["Java 基础"]
tags: [
  "Java",
  "Java 后端",
  "后端基础"
]
description: "用可运行的文件复制示例理解异常边界、UTF-8 和 try-with-resources。"
plan_date: "2023-12-10"
phase: "Java 基础与数据结构"
---

# Java 异常与文件 IO：把失败路径写清楚

### 学习目标

- 区分可检查异常与运行时异常的处理责任。
- 用 try-with-resources 管理文件资源。
- 让输入校验、文件读取和异常传播各有清楚边界。

## 一、为什么学习这个技术

程序不只会沿着“输入正确、文件存在、读写成功”的路径运行。文件可能不存在，目录可能没有写权限，磁盘也可能出错。若把异常全部吞掉，表面上程序结束了，实际结果却可能不完整。

异常处理的目标不是让程序永远不报错，而是决定哪里可以恢复、哪里应该向上层说明失败，以及失败时要释放哪些资源。

## 二、技术原理

Java 异常按继承关系区分。受检异常需要方法捕获或声明，例如许多 IO 操作会抛出 IOException；运行时异常通常表示参数或程序状态不满足约定，例如传入非法路径。异常应该在具备恢复信息的边界处理；如果当前层不知道如何恢复，就保留原因并向调用方传播。

文件流属于需要关闭的资源。try-with-resources 会在代码块退出时关闭已打开的资源，包括发生异常的情况。使用字符流时还要明确字符集，避免同一文件在不同默认系统编码下被解读成不同文本。

## 三、核心代码实现

下面保存为 FileCopyDemo.java，可用 JDK 17 编译运行。命令格式为 java FileCopyDemo 输入文件 输出文件。这是按行处理的 UTF-8 文本复制，会统一换行符；如果需要逐字节复制二进制文件，应改用 Files.copy。示例会拒绝相同的规范化路径；读取或写入失败时，IOException 会继续交给命令行调用方处理。

~~~java
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public class FileCopyDemo {
    public static void main(String[] args) throws IOException {
        if (args.length != 2) {
            throw new IllegalArgumentException(
                    "用法：java FileCopyDemo <输入文件> <输出文件>");
        }

        Path source = Path.of(args[0]).toAbsolutePath().normalize();
        Path target = Path.of(args[1]).toAbsolutePath().normalize();
        if (source.equals(target)) {
            throw new IllegalArgumentException("输入文件和输出文件不能相同");
        }

        // UTF-8 是显式选择的编码；两个资源都由 try-with-resources 关闭。
        try (BufferedReader reader =
                     Files.newBufferedReader(source, StandardCharsets.UTF_8);
             BufferedWriter writer =
                     Files.newBufferedWriter(target, StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                writer.write(line);
                writer.newLine();
            }
        }

        System.out.println("复制完成：" + target);
    }
}
~~~

这里把 IOException 声明在 main 上，是因为命令行示例没有更高层的界面可展示错误。实际调用方可以在边界处记录路径、返回清楚的错误状态，或者提示用户重新选择文件。不要在循环里对每一行单独捕获异常，否则容易掩盖“整个文件没有复制完成”这一事实。

## 四、实际应用

学习阶段可以用文本文件练习读取、转换和写回，并分别验证文件不存在、输出目录只读、空文件和中文内容。进入服务端后，同类原则适用于上传文件、导入数据和生成报表：限制文件大小与格式，校验路径来源，清楚说明部分失败如何处理，并确保连接、流等资源按生命周期关闭。

这些是通用工程做法，不代表我在实习中负责过文件服务。

## 五、问题记录

- **依赖默认字符集：**同一文本在不同机器上可能出现乱码，因此在文本协议中应明确编码。
- **捕获后不处理：**只打印“失败”仍然无法让调用方决定是否重试；应保留异常类型、上下文和失败结果。
- **手动关闭遗漏：**异常发生时容易跳过 close；try-with-resources 能覆盖正常和异常退出路径。
- **覆盖原文件：**写入前检查输入输出是否相同，避免练习程序把源文件清空。

## 六、改进方向

较大的文件应考虑缓冲、编码和磁盘空间等边界；对业务输入还要验证文件类型与大小。日志中可以记录操作标识和安全的文件信息，但不要记录文件内容、口令或访问令牌。处理异常时保留原始 cause，避免只剩下一条无法定位来源的提示。

## 七、个人思考

异常不是“报错后补一段 catch”这么简单。更重要的是先画出方法边界：谁能恢复，谁能提供用户可读反馈，谁负责资源释放。边界清楚后，异常类型才真正有用。

## 延伸：面试问答

### try-with-resources 解决了什么问题？

它会在作用域结束时关闭实现 AutoCloseable 的资源，即使代码块因异常退出也会执行关闭逻辑。

### 为什么不要捕获 Exception 后什么都不做？

这样会丢失失败信号，调用方可能把不完整结果误当成成功。只有在当前层可以恢复或转换成明确结果时才应捕获。

### 受检异常和运行时异常有什么区别？

受检异常要求调用方捕获或声明；运行时异常不受这项编译期检查。选择异常类型时还要看调用方是否有合理恢复动作。

## 补充：自定义异常与二进制文件复制

异常类型应传达调用方可以采取的动作，不能为了“自定义”而给每个错误都造一个类。下面的课堂练习用一个受检异常区分源文件不合法，并让实际读写失败继续以 `IOException` 传播。`Files.copy` 按字节复制，适用于图片等二进制内容；与上文逐行文本复制的换行处理不同。

~~~java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class BinaryCopyDemo {
    static class InvalidSourceFileException extends IOException {
        InvalidSourceFileException(String message) { super(message); }
    }

    public static void main(String[] args) throws IOException {
        if (args.length != 2) {
            throw new IllegalArgumentException("用法：java BinaryCopyDemo <源文件> <目标文件>");
        }
        Path source = Paths.get(args[0]).toAbsolutePath().normalize();
        Path target = Paths.get(args[1]).toAbsolutePath().normalize();
        if (!Files.isRegularFile(source)) {
            throw new InvalidSourceFileException("源文件不存在或不是普通文件：" + source);
        }
        if (source.equals(target)) {
            throw new IllegalArgumentException("源文件与目标文件不能相同");
        }
        Files.copy(source, target); // 目标已存在时抛 FileAlreadyExistsException
        System.out.println("已复制到：" + target);
    }
}
~~~

保存为 `BinaryCopyDemo.java`，JDK 8+ 可编译。若程序要处理符号链接、并发改名、覆盖已有文件或跨文件系统复制，还需要明确这些策略；路径规范化检查只解决普通示例的明显同路径情况，不应作为强安全边界。异常捕获处不要吞掉原始原因。

## 参考资料

- [Oracle Java Tutorial：Exceptions](https://docs.oracle.com/javase/tutorial/essential/exceptions/)
- [Java SE API：Files](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/nio/file/Files.html)
- [Java SE API：StandardCharsets](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/nio/charset/StandardCharsets.html)
