---
title: "Java 泛型为什么不能随便强转：类型擦除、通配符与分页 DTO"
date: "2027-07-27"
categories: ["Java 基础"]
tags: ["Java", "泛型", "类型擦除", "PECS", "接口设计"]
description: "从集合强转问题理解泛型的编译期约束，并用分页结果转换说明类型参数、通配符和运行时类型边界。"
plan_date: "2024-01-08"
phase: "Java 与并发"
---

# Java 泛型为什么不能随便强转：类型擦除、通配符与分页 DTO

## 问题背景

已有集合文章讨论容器选择，本文进一步研究类型如何贯穿方法输入、转换逻辑与接口响应。

以分页结果转换为例：数据库返回用户实体，接口只展示用户摘要。若把结果全部改为 Object 再逐个强转，错误会推迟到接口运行时才出现。泛型能把一部分不合法的组合提前挡在编译阶段，也让调用者看见清晰的数据契约。

## 核心概念

类型参数为一组相关位置建立约束。`Page<T>` 表示列表元素使用同一个类型；泛型方法中的 `R` 则可以表达转换之后的类型。T、E、K、V 是命名惯例，Java 并没有“只能使用单个大写字母”的语法规定，类型参数也可以命名为 Result。

泛型具有不变性。虽然 Integer 是 Number 的子类，`List<Integer>` 并不是 `List<Number>` 的子类，否则通过后者写入 Double，就会破坏原列表约束。需要读取不同数字列表时，可以接收 `List<? extends Number>`；需要向列表添加 Integer 时，可以考虑 `List<? super Integer>`。

PECS 是根据数据流选择通配符的记忆方法：提供数据的参数使用 extends，接收数据的参数使用 super。这不是说 extends 列表绝对不可修改，例如清空操作仍可能被允许；关键是编译器无法确定其实际元素类型，不能随意添加一个 Number。[Oracle 通配符指南](https://docs.oracle.com/javase/tutorial/java/generics/wildcardGuidelines.html)

## 底层原理

编译器会检查参数化类型，再对类型变量执行擦除：没有上界时通常替换为 Object，有上界时使用相应边界，并在必要位置插入类型转换。覆写泛型方法时还可能生成桥接方法，保持多态调用正确。因此普通 ArrayList 对象不会为 String 和 Integer 分别生成一套运行时类。[Oracle 类型擦除说明](https://docs.oracle.com/javase/tutorial/java/generics/erasure.html)

这不等于所有泛型信息都彻底消失。字段、方法和父类声明可能保留 Signature 元数据，框架可以通过反射读取；但是仅拿到一个普通列表实例，不能可靠推断原先声明的元素类型。`new T()`、`T.class` 和检查 `instanceof List<String>` 都受到这一边界限制。

原始类型会绕开部分检查，例如把参数化列表赋给原始 List 再写入错误对象。读取端看似正常的赋值，可能因编译器插入的强转抛出 ClassCastException。定位时应追踪最早丢失类型信息的位置，而不是只在报错处增加一次强转。

## 代码案例

下面是 JDK 17 可独立运行的 `GenericPageDemo.java`。分页对象复制列表结构，避免外部后续增删影响响应；元素本身是否不可变仍由业务对象决定。转换函数消费 T 并产生 R，因此输入使用 super，输出使用 extends。

~~~java
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;

public class GenericPageDemo {
    record User(long id, String name, String passwordHash) {}
    record UserSummary(long id, String name) {}

    record Page<T>(List<T> items, long total) {
        Page {
            Objects.requireNonNull(items);
            if (total < items.size()) {
                throw new IllegalArgumentException("total 小于当前页数量");
            }
            items = List.copyOf(items);
        }

        <R> Page<R> map(Function<? super T, ? extends R> mapper) {
            Objects.requireNonNull(mapper);
            List<R> converted = new ArrayList<>(items.size());
            for (T item : items) {
                converted.add(Objects.requireNonNull(mapper.apply(item)));
            }
            return new Page<>(converted, total);
        }
    }

    public static void main(String[] args) {
        Page<User> page = new Page<>(
            List.of(new User(7, "小林", "demo-hash")), 1);
        Page<UserSummary> result = page.map(
            user -> new UserSummary(user.id(), user.name()));
        System.out.println(result.items());
        System.out.println(result.total());
    }
}
~~~

直接运行时开启原始类型和未检查转换警告：

~~~bash
javac -encoding UTF-8 -Xlint:rawtypes,unchecked GenericPageDemo.java
java GenericPageDemo
~~~

预期输出为用户摘要列表和总数 1，摘要里没有 passwordHash。接入已有 Maven 项目时，可在现有 compiler 插件中增加以下配置，插件版本沿用项目统一管理：

~~~xml
<configuration>
  <release>17</release>
  <compilerArgs>
    <arg>-Xlint:rawtypes,unchecked</arg>
  </compilerArgs>
</configuration>
~~~

数据库分页属于外围实现。下面 SQL 展示显式字段和稳定排序；占位参数由 MyBatis 或 JDBC 绑定。独立 Java 例子使用内存数据，不会执行这两条 SQL。

~~~sql
SELECT id, display_name
FROM app_user
WHERE enabled = ?
ORDER BY id
LIMIT ? OFFSET ?;

SELECT COUNT(*) FROM app_user WHERE enabled = ?;
~~~

如果页面还展示总数，两条 SQL 应使用相同筛选条件；严格一致快照和高并发更新下允许的短暂差异要单独约定。泛型只约束 Java 类型，无法保证 SQL 统计口径一致。

## 分页 DTO 的接口边界

后台列表接口可以让 Mapper 返回明确的投影对象，服务层负责业务校验，再用泛型分页对象承载响应。通用分页层只处理列表和总数，不承担所有实体转换、权限判断和数据库查询，否则会逐渐变成难维护的大工具类。

反序列化是另一个容易丢失类型的地方。只传入 `List.class` 不包含元素类型，JSON 库可能把对象读成 Map。应使用库提供的类型令牌，例如 Jackson 的 TypeReference，明确目标为用户摘要列表。即便类型成功解析，也仍要校验字段长度、合法值和访问权限。

检查警告是否来自第三方 API 边界。确实无法避免强转时，把它封装在很小的适配方法中，先验证输入，并写明类型成立的依据；不在整个类上关闭警告。若每一层都需要强转，更可能是接口建模出了问题。

## 设计取舍与结论

泛型签名应清楚表达输入、转换和返回值的类型约束。出现强转异常时，应沿着原始类型、容器边界和反序列化入口追查，而不是压制编译器警告。
