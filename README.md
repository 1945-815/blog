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
- `docs/articles/`：45 篇文章（30 篇已公开，15 篇新增规划）
- `content-plan.json`：45 篇文章的阶段、参考日期与页面路径
- `docs/.vitepress/`：站点和主题配置
- `.github/workflows/deploy.yml`：GitHub Pages 自动部署

## 时间线说明

学习阶段参考日期从 2023-10-20 排列，路线起点为 2023-10-11。现有 30 篇文章于 2026-10-13 公开；新增 15 篇的计划公开日期为 2026-10-20 至 2027-01-26，阶段参考日期不是历史发文记录。企业项目只做脱敏复盘，未验证的代码和场景明确标为示例。

## 部署

当前配置按 `blog` 仓库的 GitHub Pages 项目路径设置 `base: '/blog/'`。GitHub Actions 会在推送到 `main` 后构建并部署站点。
