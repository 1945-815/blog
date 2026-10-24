---
title: 关于我
description: 张耘璨（Cyzee）的技术方向、学习记录与联系方式。
---

<script setup lang="ts">
import { profile } from './.vitepress/theme/data/profile'
import ContactCard from './.vitepress/theme/components/ContactCard.vue'
</script>

<div class="about-page">

# 关于我

<p class="about-lead">你好，我是 <strong>张耘璨（Cyzee）</strong>。这里记录我对 Java 后端、Spring 生态和 AI 应用开发的学习，也留一些日常思考。</p>

## 关注的技术

<div class="about-topics">
  <section><h3>Java 与 Spring</h3><p>Java 语言、Spring Boot、Spring Cloud、MyBatis 与服务端开发。</p></section>
  <section><h3>数据与中间件</h3><p>MySQL、Redis、RabbitMQ、Elasticsearch，以及数据一致性和检索问题。</p></section>
  <section><h3>AI 应用</h3><p>Spring AI、RAG、Embedding、Agent 与 MCP 的应用实践。</p></section>
  <section><h3>工程习惯</h3><p>Linux、Docker、Git 和可维护的开发流程。</p></section>
</div>

## 学习与工作背景

<dl class="about-facts">
  <div><dt>教育</dt><dd>{{ profile.education.school }} · {{ profile.education.major }} · {{ profile.education.degree }}（{{ profile.education.period }}）</dd></div>
  <div><dt>实习</dt><dd>{{ profile.internship.company }} · {{ profile.internship.role }}（{{ profile.internship.period }}）</dd></div>
</dl>

## 联系

<p>如果你想交流技术文章或网站内容，可以通过以下方式联系我。</p>

<ContactCard />

</div>
