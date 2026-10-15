---
title: "BigDecimal 金额计算：从舍入规则到分摊尾差"
date: "2027-08-03"
categories: ["Java 基础"]
tags: ["BigDecimal", "金额计算", "MySQL", "结算", "Java"]
description: "用十元三份的练习解释十进制精度、金额比较、舍入时点和尾差分配，让接口、Java 与数据库使用一致口径。"
plan_date: "2025-03-18"
phase: "Java 基础与数据结构"
---

# BigDecimal 金额计算：从舍入规则到分摊尾差

## 一、为什么学习这个技术

本地常用类笔记介绍了 BigDecimal 的加减乘除，结算单资料又涉及单价、数量、优惠和实付金额。已有类与对象文章用它表示价格，但还没有回答业务上更难的问题：十元优惠分给三个明细，为什么每份都是 3.33 元，合计却少了一分钱？

金额问题不仅是把 double 换成 BigDecimal。计算顺序、舍入时点、数据库字段、前端传参和退款依据如果不统一，仍会出现总额与明细不一致。本文用人民币两位小数的简化练习，把这些约束落到一段能够核对的代码上。

## 二、核心概念

BigDecimal 由未缩放整数和 scale 表示十进制数，例如 12345 与 scale 为 2 共同表示 123.45。precision 表示有效数字位数；scale 为 2 与 precision 为 2 的含义不同，后者不能用来直接表达“保留两位小数”。BigDecimal 不可变，运算结果要用返回值接住。[JDK 17 BigDecimal API](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/math/BigDecimal.html)

金额输入优先来自十进制字符串。`new BigDecimal(0.1)` 会精确保留 double 所表示的二进制近似值，不能恢复输入者原本想表达的十进制金额。`valueOf(double)` 可以避免部分构造上的意外，但如果前面已经发生浮点计算误差，也不能把误差修好。

比较业务数值时常用 compareTo；equals 还关心 scale，所以 2.0 与 2.00 在两种比较方式下可能得到不同结果。如果把金额放进 HashMap 的键或 Set，应先约定规范形式，同时保留币种，不能仅凭数值相同就认定业务对象相同。

## 三、底层原理

十进制运算可以精确表示很多日常金额，但除法仍可能产生无限循环小数。十除以三无法用有限位数表达，调用没有指定舍入策略的精确除法会失败。指定 scale 与舍入方式，是明确允许多少结果误差，而不是让所有计算天然正确。

本练习采用先转换为最小货币单位，再做整数分配的方案。1000 分除以 3 得到商 333、余数 1，三个明细先各分配 333 分，再按稳定的明细顺序把剩余 1 分分配出去，最终为 3.34、3.33、3.33。这个算法保持总和不变，但只适用于等额分配。

按商品金额比例分摊时，需要先确定权重、精度、余数排序与并列规则，不能套用等额分配结果。原始分摊记录也要保存下来，退款应依照原分摊份额处理，避免每次重新计算造成累计尾差。

## 四、代码案例

保存为 `MoneySplitDemo.java`，使用 JDK 17。输入限制为非负、至多两位小数，总额限定在示例数据库的范围内；多出的零允许规范化，有效的第三位小数则被拒绝。数量设置上限，避免不受限地创建列表。

~~~java
import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class MoneySplitDemo {
    static List<BigDecimal> split(BigDecimal amount, int parts) {
        Objects.requireNonNull(amount);
        if (parts < 1 || parts > 1000 || amount.signum() < 0) {
            throw new IllegalArgumentException("金额或份数不合法");
        }
        BigDecimal normalized = amount.setScale(2, RoundingMode.UNNECESSARY);
        if (normalized.compareTo(new BigDecimal("9999999999.99")) > 0) {
            throw new IllegalArgumentException("金额超出范围");
        }
        BigInteger cents = normalized.unscaledValue();
        BigInteger[] qr = cents.divideAndRemainder(BigInteger.valueOf(parts));
        int extra = qr[1].intValueExact();
        List<BigDecimal> result = new ArrayList<>(parts);
        for (int i = 0; i < parts; i++) {
            BigInteger item = qr[0].add(i < extra ? BigInteger.ONE : BigInteger.ZERO);
            result.add(new BigDecimal(item, 2));
        }
        return List.copyOf(result);
    }

    public static void main(String[] args) {
        List<BigDecimal> items = split(new BigDecimal("10.00"), 3);
        BigDecimal sum = items.stream().reduce(new BigDecimal("0.00"), BigDecimal::add);
        System.out.println(items);
        if (sum.compareTo(new BigDecimal("10.00")) != 0) {
            throw new AssertionError("分摊总和错误");
        }
        System.out.println(sum.toPlainString());
    }
}
~~~

~~~bash
javac -encoding UTF-8 MoneySplitDemo.java
java MoneySplitDemo
~~~

预期依次输出 `[3.34, 3.33, 3.33]` 与 `10.00`。实际业务要先按明细主键排序，再把输出与明细对应，不能依赖 HashMap 的遍历顺序决定谁多分一分钱。

下面是 MySQL 8.0.16 及以上可执行 CHECK 约束的练习表。一个业务编号和明细编号只能出现一次；该约束不代替完整的业务幂等状态机。

~~~sql
CREATE TABLE money_allocation (
  order_no VARCHAR(64) NOT NULL,
  line_no INT NOT NULL,
  currency CHAR(3) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  rule_version VARCHAR(32) NOT NULL,
  PRIMARY KEY (order_no, line_no),
  CHECK (amount >= 0)
);

SELECT order_no, currency, SUM(amount) AS allocated_total
FROM money_allocation
WHERE order_no = ?
GROUP BY order_no, currency;
~~~

项目可以保存以下自定义业务配置；它需要由 ConfigurationProperties 显式绑定并校验，并非 Spring 自带属性。上面的独立 Java 示例固定两位小数，没有自动读取 YAML。

~~~yaml
app:
  money:
    currency: CNY
    scale: 2
    allocation-rule: EQUAL_CENTS_V1
    max-lines: 1000
~~~

接口契约示例为 `POST /demo/allocations`，请求体 `{"amount":"10.00","parts":3}`，返回金额字符串数组。业务服务应从商品价格和有效优惠规则重新计算应付额，不能直接把客户端提供的总额当作最终收款依据。此处仅展示接口约定，独立程序没有启动 HTTP 服务。

## 五、项目真实落地

在结算单练习中，我会把价格计算放在独立服务里：读取可信的单价与数量，计算行金额，应用优惠规则，再保存总额和分摊明细。请求、Java 运算、数据库字段与响应都使用同一套币种和精度约定。规则调整时记录版本，方便解释历史订单。

一个常见问题是“每行先四舍五入后求和”和“先求和后四舍五入”结果不同。解决办法是先与业务确定核算口径，再让前端展示与后端计算遵守同一规则。不能发现少一分钱就随意修改最后一行，而没有保存差额来源和分配依据。

练习验证至少应包含零金额、份数为一、金额小于份数、非法三位小数、负数以及金额上界。除了核对单个例子，还应检查总和守恒、每份非负、差额最多一分，以及重复输入能产生同样结果。这里没有声称接入过支付机构或通过生产财务对账。

## 六、常见面试问题

### 初级：为什么 setScale 调用后原值没有变化？

因为 BigDecimal 不可变。方法返回新的结果或可复用的实例，调用方必须使用返回值。

### 中级：HALF_UP 能用于所有金额运算吗？

不能。不同币种、税额、折扣和分摊规则可能不同，需要业务定义舍入方式与发生时点。输入校验也可以采用 UNNECESSARY，拒绝需要舍入的输入。

### 项目：如何解释一分钱的差异？

先复核币种与输入，再检查计算顺序、舍入时点及分摊算法，最后对照保存的规则版本和明细。只看最终总额无法还原差额产生的过程。

## 七、个人总结

通过这次学习，我开始把金额精度看成贯穿接口、计算与存储的约定。作为 2027 届 Java 后端实习生，我现在能用一个小程序解释尾差产生的原因，也知道练习算法适用的范围。之后做结算功能时，我会先写清规则和可核对的样例，再决定使用哪一个 API。
