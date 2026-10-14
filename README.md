# 张耘璨的 Java 后端与 AI 应用技术博客

个人技术博客｜Java 后端、微服务、Redis 与 RAG 应用探索。

基于 VitePress 的中文个人技术博客源码，记录 Java 后端学习、业务工程实践与 RAG 应用探索。

## 本地运行

```bash
npm install
npm run docs:dev
```

## 构建与预览

```bash
npm run docs:build
npm run docs:preview
```

## 目录

- `docs/`：网站页面与 Markdown 内容
- `docs/articles/`：75 篇文章（原有 30 篇，按成长路线补充 45 篇）
- `content-plan.json`：75 篇文章的阶段、参考日期与页面路径
- `docs/.vitepress/`：站点和主题配置
- `.github/workflows/deploy.yml`：GitHub Pages 自动部署

## 时间线说明

学习阶段参考日期按 Java 基础学习、后端实习、AI 应用探索编排，路线起点为 2023-10-11。原有 30 篇文章于 2026-10-13 公开；补充文章保留各批次的计划公开日期，当前规划延伸至 2027-08-24。阶段参考日期与计划公开日期都不是历史发文记录。

当前站点会展示所有已合并文章，计划公开日期只是编辑排期，不会自动隐藏未来日期的内容。企业项目只做脱敏复盘，练习代码和设计方案明确说明适用范围。

## 部署

当前配置按 `blog` 仓库的 GitHub Pages 项目路径设置 `base: '/blog/'`。GitHub Actions 会在推送到 `main` 后构建并部署站点。
