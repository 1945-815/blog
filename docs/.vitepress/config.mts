import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '张耘璨 · Java 后端与 AI 应用',
  description: '记录 Java 后端工程实践、业务工作流与 RAG 应用探索。',
  base: '/blog/',
  cleanUrls: true,
  themeConfig: {
    logo: undefined,
    siteTitle: '张耘璨 / 技术手记',
    nav: [
      { text: '首页', link: '/' },
      { text: '文章', link: '/articles/' },
      { text: '路线图', link: '/roadmap' },
      { text: '项目复盘', link: '/projects' },
      { text: '关于', link: '/about' }
    ],
    search: { provider: 'local' },
    sidebar: {
      '/articles/': [
        {
          text: '文章草稿',
          items: [
            { text: 'Java 集合的选择', link: '/articles/java-collections' },
            { text: 'Redis TTL 与缓存边界', link: '/articles/redis-ttl' },
            { text: 'RAG 文档问答链路', link: '/articles/rag-document-qa' }
          ]
        }
      ]
    },
    footer: {
      message: '内容以个人学习与项目复盘为主，企业经历只做经许可的脱敏表达。',
      copyright: '© 2026 张耘璨 · 用 Markdown 记录工程实践'
    },
    outline: { label: '本页目录', level: [2, 3] },
    docFooter: { prev: '上一篇', next: '下一篇' }
  },
  markdown: {
    lineNumbers: true
  },
  head: [
    ['meta', { name: 'theme-color', content: '#f7f8f5' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: '张耘璨 · Java 后端与 AI 应用' }],
    ['meta', { property: 'og:description', content: 'Java 后端工程实践、业务工作流与 RAG 应用探索。' }]
  ]
})
