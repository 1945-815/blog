---
title: 关于我
description: 张耘璨（Cyzee）的技术方向、教育背景与联系方式。
---

<script setup lang="ts">
import { profile } from './.vitepress/theme/data/profile'
import ContactCard from './.vitepress/theme/components/ContactCard.vue'
</script>

<div class="about-page">

# 关于我

<p class="about-lead">你好，我是 <strong>张耘璨（Cyzee）</strong>。这里整理 Java 后端、分布式系统与 AI 应用开发中的原理、代码实践和问题分析。</p>

## 关注的技术

<div class="about-topics">
  <section><h3>Java 与 Spring</h3><p>Java 语言、Spring Boot、Spring Cloud、MyBatis 与服务端开发。</p></section>
  <section><h3>数据与中间件</h3><p>MySQL、Redis、RabbitMQ、Elasticsearch，以及数据一致性和检索问题。</p></section>
  <section><h3>AI 应用</h3><p>Spring AI、RAG、Embedding、Agent 与 MCP 的应用实践。</p></section>
  <section><h3>工程习惯</h3><p>Linux、Docker、Git 和可维护的开发流程。</p></section>
</div>

## 教育背景

<dl class="about-facts">
  <div><dt>教育</dt><dd>{{ profile.education.school }} · {{ profile.education.major }} · {{ profile.education.degree }}（{{ profile.education.period }}）</dd></div>
</dl>

## 联系

<p>如果你想交流技术文章或网站内容，可以通过以下方式联系我。</p>

<ContactCard />

</div>
