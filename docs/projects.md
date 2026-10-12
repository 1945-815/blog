# 项目复盘

以下内容根据简历里的项目描述整理为脱敏介绍，使用泛化项目名称，不包含企业源代码、内部数据、真实接口地址或客户资料。

<div class="project-grid">
  <article class="project-card">
    <p class="stack">Spring Boot · Spring Cloud Alibaba · MyBatis-Plus · MySQL · Redis · Elasticsearch · Activiti 7 · RAG</p>
    <h3>文档管理与知识检索平台</h3>
    <p>简历描述的项目包含文档发布、分类、分页筛选、评论与举报审批、用户认证，以及文档搜索和知识问答能力。系统使用微服务组件组织服务，并结合 Redis、Elasticsearch 和模型 API 支持相应场景。</p>
    <ul>
      <li>参与文档管理与搜索接口开发，覆盖发布、分类、分页和条件筛选。</li>
      <li>参与评论、举报业务和 Activiti 审批流程的接口开发。</li>
      <li>参与认证授权、Redis 验证码与检索问答相关模块。</li>
    </ul>
    <p><strong>可公开的复盘方向：</strong>文档查询接口、索引字段设计、审批状态与业务状态关系、RAG 请求链路。任何项目指标只在有记录且获准公开时补充。</p>
  </article>
  <article class="project-card">
    <p class="stack">Spring Boot · Spring Security · MyBatis · MySQL · Redis · JWT · Activiti 7</p>
    <h3>预约与内部审批平台</h3>
    <p>简历描述的场景包括患者预约、诊疗服务订单、口腔诊疗项目管理与内部审批流程，使用 Spring Boot 提供业务接口，并通过 Activiti 处理审批任务。</p>
    <ul>
      <li>参与预约创建、取消、状态查询和预约状态校验。</li>
      <li>参与订单状态更新与重复提交场景的校验。</li>
      <li>参与诊疗项目管理接口和基于 Activiti 的审批接口开发。</li>
    </ul>
    <p><strong>可公开的复盘方向：</strong>预约状态图、重复提交保护、事务边界、流程任务与业务数据如何关联。</p>
  </article>
</div>

## 个人实践仓库建议

企业项目用于脱敏复盘；可运行代码应放在独立个人 Demo 中。建议后续建立 `workflow-approval-demo` 与 `rag-doc-search-demo`，用自造数据和独立实现演示设计思路。
