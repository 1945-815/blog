---
title: "Activiti 7 审批流程：从流程定义到任务处理"
date: "2026-10-13"
categories: ["工作流"]
tags: ["Activiti 7","BPMN","审批流程"]
description: "通过流程定义、实例启动、待办查询和任务完成理解审批工作流。"
plan_date: "2026-04-15"
phase: "后端工程实践"
---

# Activiti 7 审批流程：从流程定义到任务处理

## 问题背景

多步骤审核常需要当前处理人、待办任务、处理意见和状态变化。将流程编排从业务代码中的大量条件分支中抽出，可让流转路径更直观，但业务数据仍需明确维护。

## 核心原理

BPMN 定义流程节点、连线和网关；部署后形成可启动的流程定义；启动业务流程实例后，根据变量计算路径并创建用户任务；任务完成后引擎继续推进。业务主表应保存稳定业务状态和关联流程实例标识。

## 实现示例

最小流程包含部署 BPMN、按业务 id 启动流程、查询当前用户任务、提交处理意见并完成任务。流程变量只放路由所需且规模合适的数据，完整业务对象仍放业务表。记录业务 id、流程实例 id、操作人、意见和时间。

```java
// 示意伪代码：业务校验和引擎操作需按项目事务策略组织
ProcessInstance instance = runtimeService
    .startProcessInstanceByKey("review", businessKey, variables);
List<Task> tasks = taskService.createTaskQuery()
    .processInstanceId(instance.getId()).list();
```

### 源码与机制观察

从 BPMN XML 看流程节点和 sequenceFlow，再沿 RuntimeService.startProcessInstanceByKey 与 TaskService.complete 等 API 理解引擎入口。Activiti 7 与旧版、Spring Boot 版本组合存在差异，示例需锁定依赖版本。

运行时服务负责启动实例、查询活动任务和完成任务；历史服务可用于回顾已结束实例和活动。调用 API 前核对用户任务候选人、办理人和流程变量语义。引擎状态与业务状态更新若分属不同操作，要设计事务边界与失败补偿。

### 补充：BusinessKey、变量与任务领取

把这些点连起来看，业务侧通常先保存业务记录，再以稳定业务主键启动流程；BusinessKey 只是引擎实例上的关联值，业务服务仍需负责校验记录存在、控制重复发起，并维护自己的业务状态。

下面片段使用 Activiti Java Service API。Activiti 7 与 Spring Boot 的集成方式因依赖组合而异，复制到应用前应先核对实际依赖和对应 Javadoc：

```java
Map<String, Object> variables = new HashMap<>();
variables.put("leaveDays", 3);

ProcessInstance instance = runtimeService.startProcessInstanceByKey(
    "leaveProcess",
    String.valueOf(leaveId), // 业务表主键作为 businessKey
    variables
);
```

流程定义中的排他网关可以按 `leaveDays` 这样的流程变量选择后续路径。变量只放流程路由或节点表达式需要的数据；业务单据的完整字段仍从业务表读取，避免把引擎变量当作业务数据的唯一存储。

候选任务和已分配任务也有区别。候选组成员可查询组待办；具体办理人领取后，任务成为该办理人的待办：

```java
Task task = taskService.createTaskQuery()
    .taskCandidateGroup("manager")
    .taskId(taskId) // taskId 来自当前待办请求
    .singleResult();

if (task == null) {
    throw new IllegalStateException("待办不存在或当前用户不在候选组");
}
taskService.claim(task.getId(), reviewerId);
taskService.addComment(task.getId(), task.getProcessInstanceId(), "同意");
taskService.complete(task.getId());
```

这个片段仅演示 API 顺序；实际页面还要处理无待办、已被他人领取、重复提交、当前用户是否有权办理及业务状态并发更新。审批意见可使用任务评论或单独的业务审计表，需按保留与查询需求选择。流程运行数据和历史数据用途不同；不要绕过引擎直接更新 `ACT_*` 表，也不要在保留历史/运行实例的场景随意级联删除整个部署。

同一个流程 Key 再次部署会产生新的流程定义版本。新实例使用可用的新定义，已运行实例仍关联启动时的定义；发布模型时应记录部署版本，不能只凭流程名称判断实例使用哪一份定义。

## 状态一致性边界

## 边界与常见问题

不能把流程引擎任务状态直接当作业务状态的唯一来源。重复启动和重复完成要有幂等约束；并行网关、撤回、转办和驳回会增加状态分支，需先明确需求再建模。

## 改进思路

流程实例与业务记录以业务键关联，重复启动、重复完成和状态同步都要有明确处理策略。

## 设计取舍与结论

Activiti 负责流程编排与任务生命周期，业务服务负责领域规则、数据校验和可追溯记录。两者之间的状态映射是设计重点。

## 常见问题

### 流程定义和流程实例的区别？

定义是可复用的流程模型版本，实例是某笔业务按某个定义启动后的运行过程。

### 审批意见放在哪里？

可作为任务评论或业务审计记录保存；需明确查询、保留和权限要求，不要只依赖临时变量。

### 业务状态与流程状态如何同步？

建立明确映射，在一致性边界中更新，或采用可恢复事件/补偿；失败时要能识别并修复不一致。




## 参考资料

- [Activiti User Guide](https://www.activiti.org/userguide/)（不同发行版的 API/集成版本应与项目依赖核对）
- [BPMN 2.0 规范入口](https://www.omg.org/spec/BPMN/2.0/)
