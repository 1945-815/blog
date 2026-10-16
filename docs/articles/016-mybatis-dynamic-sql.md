---
title: "MyBatis 参数映射与动态 SQL：完成条件查询"
date: "2026-12-22"
categories: ["持久层"]
tags: [
  "Java",
  "MyBatis-Plus",
  "MySQL"
]
description: "用查询 DTO、参数绑定和动态标签实现条件查询，并控制排序字段来源。"
plan_date: "2024-06-10"
phase: "数据库与 Spring 基础"
---

# MyBatis 参数映射与动态 SQL：完成条件查询

### 文章定位

这篇文章用 MyBatis XML 说明参数对象映射、可选过滤条件和动态更新。代码是可移植到本地练习项目的示例，不对应未经核实的企业数据库。

### 学习目标

- 用查询对象封装多个可选条件。
- 用 #{} 绑定值参数，并用 where、if、set 处理动态片段。
- 识别文本替换占位符在动态标识符场景中的注入风险。

## 一、为什么学习这个技术

列表查询通常既有必选条件，也有可选关键词、状态或时间范围。手工拼接 SQL 字符串容易产生多余的 AND、遗漏空格和错误的参数顺序。MyBatis 动态 SQL 能把条件组合写在 Mapper 映射中，同时保留参数绑定的优点。

查询参数多时，使用一个明确的查询 DTO 比给 Mapper 方法塞很多位置参数更容易维护，也方便接口层做输入校验。

## 二、技术原理

MyBatis 将 #{} 参数绑定到预编译语句参数中。动态 SQL 中的 if 根据参数判断是否输出片段；where 会在有内容时添加 WHERE，并处理开头的 AND 或 OR；set 会生成 SET 并清理末尾逗号。

MyBatis 的文本替换占位符是字符串替换，不是值参数绑定。动态表名、列名或排序方向不能依赖用户原始输入；如果确实需要动态标识符，应先映射到服务端允许的固定选项。

## 三、核心代码实现

查询对象与 Mapper 接口示例：

~~~java
package demo.user;

public class UserSearch {
    private String keyword;
    private Integer status;

    public String getKeyword() {
        return keyword;
    }

    public void setKeyword(String keyword) {
        this.keyword = keyword;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }
}
~~~

~~~java
package demo.user;

import java.util.List;

public interface UserMapper {
    List<UserRow> search(UserSearch query);
}
~~~

查询结果对象可使用普通 JavaBean，MyBatis 按列名写入对应属性：

~~~java
package demo.user;

public class UserRow {
    private Long id;
    private String username;
    private Integer status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
}
~~~

对应的 Mapper XML：

~~~xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="demo.user.UserMapper">
  <select id="search" parameterType="demo.user.UserSearch"
          resultType="demo.user.UserRow">
    SELECT id, username, status
    FROM user_account
    <where>
      <if test="keyword != null and keyword != ''">
        AND username LIKE CONCAT('%', #{keyword}, '%')
      </if>
      <if test="status != null">
        AND status = #{status}
      </if>
    </where>
    ORDER BY id DESC
  </select>

  <update id="updateProfile" parameterType="demo.user.ProfileUpdate">
    UPDATE user_profile
    <set>
      <if test="displayName != null">
        display_name = #{displayName},
      </if>
      <if test="avatarUrl != null">
        avatar_url = #{avatarUrl},
      </if>
    </set>
    WHERE user_id = #{userId}
  </update>
</mapper>
~~~

更新参数对象至少要包含用户编号，并允许按需提供资料字段：

~~~java
package demo.user;

public class ProfileUpdate {
    private Long userId;
    private String displayName;
    private String avatarUrl;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
~~~

这里假定项目已经配置了 XML Mapper 扫描、数据源和对应实体类。调用前还应校验更新对象的 userId 有效且至少包含一个可更新字段，避免只剩 WHERE 而没有有效 SET 子句。真实项目的表名和字段名以自己的 schema 为准。

## 四、实际应用

课堂资料中的批量删除还需要 `<foreach>`，它与本文的 `if/where/set` 属于同一套动态 SQL。Mapper 方法明确给集合命名，避免依赖默认参数名：

~~~java
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface ProductMapper {
    int deleteByIds(@Param("ids") List<Long> ids);
}
~~~

~~~xml
<delete id="deleteByIds">
  DELETE FROM product WHERE id IN
  <foreach collection="ids" item="id" open="(" separator="," close=")">
    #{id}
  </foreach>
</delete>
~~~

调用前先拒绝 `null` 或空集合，否则生成的 `IN ()` 在数据库中可能报语法错误。`#{id}` 会绑定为预编译语句的值参数，而不是简单地给字符串加引号；表名、列名和排序方向不能通过它绑定。`${}` 会直接拼接文本，只有经过服务端白名单映射的标识符才可进入 SQL。

这个练习延续本地 `0717MyBatis加强/MyBatis加强.md` 的批量删除与参数处理主题。有关从配置文件创建 `SqlSessionFactory`、打开和关闭会话的基本流程，见 [MyBatis 入门与会话管理](/articles/mybatis-session-mapper-basics)；一对多和多对多映射见 [MyBatis 关联映射](/articles/mybatis-association-mapping)。

课程 CRUD 练习里可以把接口接收的筛选条件映射成 UserSearch，由 Service 校验空白关键词、状态范围和分页边界，再调用 Mapper。不要把任意排序字段直接拼入动态 SQL；可以用枚举把 API 的排序选项转换为有限的服务端字段，并对升降序做固定映射。

分页查询还需要控制最大 pageSize，避免一个请求要求返回整张大表。筛选字段是否需要索引，要结合查询计划和数据分布判断，不能仅因为 SQL 中出现某个字段就盲目加索引。

## 五、问题记录

- **把值参数和文本替换混为一谈：**前者使用预编译参数绑定值；后者进行字符串替换，可改变 SQL 结构，因此不能直接接收不可信输入。
- **where 子句为空：**所有条件都是可选时，需要考虑是否允许无条件查询；可在业务层要求至少一个条件或限制结果范围。
- **动态更新空集合：**若所有可更新字段都为空，更新 SQL 会不完整；在调用 Mapper 前拒绝空更新。
- **字段别名和映射不一致：**数据库下划线字段与 Java 属性名不匹配时，应配置映射或明确列别名。
- **把参数对象当成校验：**DTO 只承载数据，是否合法仍需要应用层验证。

## 六、改进方向

将输入校验、查询组合和 SQL 映射职责分开。对变更性较高的筛选条件，及时为 Mapper XML 补充典型输入组合的验证；遇到复杂动态条件时，优先保持生成 SQL 可读，并通过日志或调试工具检查最终 SQL 和绑定参数。

## 七、个人思考

动态 SQL 的价值不在于把任意 SQL 变成安全 SQL，而是把可选条件的组合规则写得更清楚。参数值和 SQL 结构是两类不同输入，分别用绑定参数和受控白名单管理。

## 延伸：面试问答

### MyBatis 的参数绑定和文本替换有何区别？

参数绑定用于 SQL 值并通常走预编译语句；文本替换会直接改变 SQL 字符串，因此需要把输入限制为服务端认可的结构选项。

### where 标签解决什么问题？

它在子标签产生内容时生成 WHERE，并移除开头多余的 AND 或 OR。

### 多个可选条件适合怎样传递？

可使用含有明确字段的查询 DTO，减少参数顺序耦合，并在调用 Mapper 前统一校验边界。

## 参考资料

- [MyBatis：Dynamic SQL](https://mybatis.org/mybatis-3/dynamic-sql.html)
- [MyBatis：SQL Map XML Files](https://mybatis.org/mybatis-3/sqlmap-xml.html)
- [MyBatis：Java API](https://mybatis.org/mybatis-3/java-api.html)
