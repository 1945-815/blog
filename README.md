# Cyzee 的 Java 后端与 AI 应用技术博客

个人技术博客｜Java 后端、分布式系统、数据基础设施与 AI 应用。

基于 VitePress 的中文个人技术博客源码，整理 Java、Spring、数据库、中间件与 AI 应用的技术原理、实现示例和问题分析。

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
- `docs/articles/`：99 篇技术文章
- `content-plan.json`：文章路径、标题与内容编排参考信息
- `docs/.vitepress/`：站点和主题配置
- `.github/workflows/deploy.yml`：GitHub Pages 自动部署

文章 frontmatter 中的 `date` 与 `plan_date` 均保留原值和原始含义。页面分别标注源记录日期与内容编排参考日期；这两个字段不自动等同于首次公开时间。全部文章会正常展示，不会按日期隐藏。

## 部署

当前配置按 `blog` 仓库的 GitHub Pages 路径设置 `base: '/blog/'`。GitHub Actions 会在推送到 `main` 后构建并部署站点。
