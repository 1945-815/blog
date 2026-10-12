# 张耘璨的 Java 后端与 AI 应用技术博客

个人技术博客｜Java 后端、微服务、Redis、RAG 与 AI Agent 技术实践。

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
- `docs/articles/`：文章草稿
- `docs/.vitepress/`：站点和主题配置
- `.github/workflows/deploy.yml`：GitHub Pages 自动部署

## 时间线说明

文章规划从 2026-09-25 开始，日期表示内容回顾与整理顺序，不代表文章曾在该日期公开发布。未完成的项目复盘保持脱敏，并且只描述简历能够支撑的职责与技术内容。

## 部署

当前配置按 `blog` 仓库的 GitHub Pages 项目路径设置 `base: '/blog/'`。GitHub Actions 会在推送到 `main` 后构建并部署站点。
