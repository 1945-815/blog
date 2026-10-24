export const profile = {
  name: '张耘璨',
  nickname: 'Cyzee',
  headline: 'Java 后端开发 · AI 应用探索',
  introduction: '我关注 Java 服务端开发、数据与检索问题，也在持续探索 Spring AI、RAG 与 Agent 的应用方式。',
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
  }
} as const
