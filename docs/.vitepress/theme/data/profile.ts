export const profile = {
  name: '张耘璨',
  nickname: 'Cyzee',
  headline: 'Java 后端开发 · AI 应用探索',
  introduction: '专注 Java 后端开发与 AI 应用探索，具备九个月企业 Java 后端实习经历，参与业务系统的接口开发、功能联调与问题优化。',
  education: {
    school: '沈阳理工大学',
    major: '计算机科学与技术',
    degree: '本科（一本）',
    period: '2023.09—2027.07'
  },
  internship: {
    company: '辽宁若水科技有限公司',
    role: 'Java 后端开发',
    period: '2026.01—2026.09',
    responsibilities: [
      '参与业务系统熟悉及历史代码维护。',
      '独立负责两个核心模块，累计完成 20 余项 RESTful API。',
      '参与系统联调，与前端协作定位并修复测试阶段业务问题 10 余项。'
    ]
  },
  skillGroups: [
    { title: 'Java 核心与后端框架', skills: ['Java', 'Spring Boot', 'Spring Cloud Alibaba', 'MyBatis-Plus'] },
    { title: '数据与中间件', skills: ['MySQL', 'Redis', 'RabbitMQ', 'Elasticsearch', 'Canal'] },
    { title: '安全与流程', skills: ['Spring Security', 'JWT', 'Activiti 7'] },
    { title: 'AI 应用开发', skills: ['RAG', 'Embedding', 'MCP', 'LLM 应用'] },
    { title: '工程与开发工具', skills: ['Git', 'Linux', 'Docker', 'Quartz', 'Codex', 'Cursor'] }
  ]
} as const
