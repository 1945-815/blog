<script setup lang="ts">
import { withBase } from 'vitepress'
import { profile } from '../data/profile'
import { projects } from '../data/projects'
</script>

<template>
  <section class="career-overview blog-shell" aria-labelledby="career-title">
    <div class="career-intro">
      <p class="section-eyebrow">JAVA BACKEND · AI APPLICATIONS</p>
      <h2 id="career-title">你好，我是{{ profile.name }}。</h2>
      <p class="career-summary">{{ profile.introduction }}</p>
      <div class="career-facts">
        <span>{{ profile.education.school }} · {{ profile.education.major }}</span>
        <span>{{ profile.education.degree }} · {{ profile.education.period }}</span>
        <span>求职方向：Java 后端开发，兼顾 AI 应用开发</span>
      </div>
    </div>

    <div class="career-columns">
      <section class="career-card" aria-labelledby="internship-title">
        <p class="section-eyebrow">EXPERIENCE</p>
        <h3 id="internship-title">实习经历</h3>
        <div class="career-timeline">
          <div class="career-timeline-marker" aria-hidden="true"></div>
          <div>
            <p class="career-period">{{ profile.internship.period }}</p>
            <h4>{{ profile.internship.company }}</h4>
            <p class="career-role">{{ profile.internship.role }}</p>
            <ul><li v-for="item in profile.internship.responsibilities" :key="item">{{ item }}</li></ul>
          </div>
        </div>
      </section>

      <section class="career-card skills-card" aria-labelledby="skills-title">
        <p class="section-eyebrow">TECH STACK</p>
        <h3 id="skills-title">技术方向</h3>
        <div class="skill-groups">
          <div v-for="group in profile.skillGroups" :key="group.title" class="skill-group">
            <h4>{{ group.title }}</h4>
            <div class="skill-pills"><span v-for="skill in group.skills" :key="skill">{{ skill }}</span></div>
          </div>
        </div>
      </section>
    </div>

    <section class="career-projects" aria-labelledby="featured-projects-title">
      <div class="section-heading">
        <div><p class="section-eyebrow">SELECTED WORK</p><h3 id="featured-projects-title">项目经历</h3><p>以下内容依据可公开的项目经历整理。</p></div>
        <a :href="withBase('/projects')">查看项目详情 <span aria-hidden="true">↗</span></a>
      </div>
      <div class="project-preview-grid">
        <article v-for="project in projects" :key="project.slug" class="project-preview-card">
          <p class="project-index">{{ project.slug === 'knowledge-management-platform' ? '01' : '02' }}</p>
          <h4><a :href="withBase(project.href)">{{ project.title }}</a></h4>
          <p>{{ project.summary }}</p>
          <div class="skill-pills"><span v-for="tech in project.stack.slice(0, 5)" :key="tech">{{ tech }}</span></div>
          <a class="project-open-link" :href="withBase(project.href)">查看项目复盘 <span aria-hidden="true">→</span></a>
        </article>
      </div>
    </section>
  </section>
</template>
