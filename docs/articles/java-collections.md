# Java 集合的选择：List、Set、Map 分别解决什么问题

<div class="meta-line"><span class="status-tag">文章草稿</span><span>Java 基础回顾 · 无历史发布日期</span></div>

在业务代码里，集合选择通常从三个问题开始：数据是否要按加入顺序访问、是否需要去重、是否需要通过键快速查值。先回答这些问题，再选具体实现，比记一串类名更实用。

## 先看数据关系

| 需求 | 常见接口 | 需要考虑的点 |
|---|---|---|
| 保存一组元素，允许重复 | `List` | 是否关心顺序、是否经常按下标读取 |
| 保存唯一元素 | `Set` | 如何判断两个对象相等 |
| 通过键查值 | `Map` | 键是否稳定、是否需要特定迭代顺序 |

接口表达需求，实现类再表达性能和顺序取舍。变量类型优先写接口，只有确实依赖实现特性时才暴露具体类。

## List：顺序与重复

`ArrayList` 适合常见的内存列表：按下标读取方便，尾部追加通常成本较低。中间插入和删除需要移动后续元素，因此频繁在头部或中间改动时应重新评估数据结构。

```java
List<String> modules = new ArrayList<>();
modules.add("document");
modules.add("workflow");
modules.add("document"); // List 允许重复

String first = modules.get(0);
```

如果只是顺序遍历，不需要构造复杂集合；如果需要按下标频繁访问，`ArrayList` 通常比链表更直接。

## Set：唯一性由 equals 与 hashCode 决定

`HashSet` 常用于去重。对象放入集合后，如果参与 `equals` 或 `hashCode` 的字段发生变化，集合的查找行为可能变得难以理解。适合做键或集合元素的对象，最好保持相等性相关字段稳定。

```java
Set<String> categories = new HashSet<>();
categories.add("backend");
categories.add("backend");

System.out.println(categories.size()); // 1
```

不要依赖 `HashSet` 的迭代顺序。如果展示顺序是需求的一部分，显式选择有顺序语义的实现，或者在返回前排序。

## Map：键值关系

`HashMap` 适合内存里的键值查找。键应当有稳定的相等性和哈希值；查询缺失键时也要明确处理 `null`，避免把“没有数据”和“数据本身为空”混为一谈。

```java
Map<String, Integer> articleCounts = new HashMap<>();
articleCounts.put("java", 12);

int count = articleCounts.getOrDefault("redis", 0);
```

如果业务依赖插入顺序，可以考虑 `LinkedHashMap`；如果需要按键排序，可以选择有序映射实现。先确认顺序是否属于业务语义，再决定是否付出相应成本。

## 遍历时修改集合

通过增强 `for` 遍历时直接结构性修改集合，可能触发 `ConcurrentModificationException`。需要删除元素时使用迭代器的删除方法，或建立一个新的过滤结果。这个异常是快速暴露部分错误用法的机制，不是并发安全保证。

```java
List<String> active = new ArrayList<>(List.of("java", "draft", "redis"));
active.removeIf(item -> item.equals("draft"));
```

## 选择清单

1. 保留重复且需要顺序：从 `List` 开始。
2. 只关心唯一元素：从 `Set` 开始，并定义清楚相等性。
3. 需要键值映射：从 `Map` 开始，检查键的稳定性。
4. 迭代顺序是否可观察：若是，明确选择有顺序语义的实现。
5. 删除或并发访问是否频繁：结合真实操作模式再选实现。

集合不是孤立的八股知识。接口选择会影响数据去重、返回顺序和后续维护成本。写业务代码前把这些语义说清楚，通常就能排除大部分不合适的实现。

> 发布前可以补充一段自己的接口或练习代码，说明当时为什么使用该集合；不要将这个通用示例描述成某个企业项目的实际实现。
