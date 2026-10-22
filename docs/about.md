---
title: 关于我
description: 张耘璨的教育背景、Java 后端实习经历与技术方向。
---

<script setup lang="ts">
import { profile } from './.vitepress/theme/data/profile'
import ContactCard from './.vitepress/theme/components/ContactCard.vue'
</script>

# 关于我

你好，我是**张耘璨（Cyzee）**，沈阳理工大学计算机科学与技术专业本科生，求职方向是 Java 后端开发，兼顾 AI 应用开发。

我关注 Java 服务端开发、数据访问与检索，也在探索 RAG、Embedding、MCP 等 AI 应用能力。本站保留真实文章与项目复盘，职业信息以当前公开的简历摘要为准。

## 教育背景

| 学校 | 专业 | 学历 | 时间 |
| --- | --- | --- | --- |
| 沈阳理工大学 | 计算机科学与技术 | 本科（一本） | 2023.09—2027.07 |

## 实习经历

**辽宁若水科技有限公司｜Java 后端开发**　`2026.01—2026.09`

- 参与业务系统熟悉及历史代码维护。
- 独立负责两个核心模块，累计完成 20 余项 RESTful API。
- 参与系统联调，与前端协作定位并修复测试阶段业务问题 10 余项。

## 技术方向

<div class="skill-groups about-skill-groups">
  <div v-for="group in profile.skillGroups" :key="group.title" class="skill-group">
    <h3>{{ group.title }}</h3>
    <div class="skill-pills"><span v-for="skill in group.skills" :key="skill">{{ skill }}</span></div>
  </div>
</div>

## 项目经历

- [智文知识管理平台](/projects/knowledge-management-platform)：文档管理、全文检索与 RAG 智能问答。
- [牙管家](/projects/dental-clinic-manager)：预约、诊疗订单、项目管理与 Activiti 7 审批。

## 联系我

<ContactCard />

手机号和私人邮箱默认不在公开页面展示。QQ、BiliBili 与网易云音乐地址尚待补充；公开入口只会在地址核实后启用。

## 内容说明

文章 frontmatter 中的 `date` 保留原始字段含义；`plan_date` 用于阶段参考或内容规划。页面会明确标出这两个字段，不将它们统一解释为真实公开发布日期。企业经历只做经许可的脱敏表达，个人练习也不会写成企业项目成果。
