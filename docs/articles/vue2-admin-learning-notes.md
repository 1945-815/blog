---
title: "Vue 2 管理后台学习记录：组件、路由与请求拦截"
date: "2026-10-16"
categories: ["前端技术"]
tags: ["Vue 2", "Vue Router", "Vuex", "Element UI", "Axios"]
description: "梳理 Vue 2 组件响应式、动态路由与 Axios 请求链路。"
plan_date: "2026-10-16"
phase: "Web 基础"
---

# Vue 2 管理后台学习记录：组件、路由与请求拦截

项目 `package.json` 固定使用 Vue 2.6.12、Vue Router 3.4.9、Vuex 3.6.0、Element UI 2.15.14、Axios 0.30.3。

## 1. 页面更新从响应式数据开始

Vue 2 的常用页面写法把状态声明在 `data`，模板通过插值和指令显示状态。事件更新数据后，Vue 负责刷新视图；开发者通常不需要直接查找 DOM 并手动改文本。

```vue
<template>
  <section>
    <el-input v-model="keyword" placeholder="按名称筛选" />
    <ul>
      <li v-for="item in visibleItems" :key="item.id">
        {{ item.name }}
        <button @click="remove(item.id)">移除</button>
      </li>
    </ul>
  </section>
</template>

<script>
export default {
  data() {
    return {
      keyword: '',
      items: []
    }
  },
  computed: {
    visibleItems() {
      const key = this.keyword.trim()
      return key
        ? this.items.filter(item => item.name.includes(key))
        : this.items
    }
  },
  methods: {
    remove(id) {
      this.items = this.items.filter(item => item.id !== id)
    }
  }
}
</script>
```

组件中的 `data` 要返回一个对象，让每个组件实例各自拥有状态。父子组件之间通过 props 和事件传递数据；生命周期钩子可按阶段组织工作：`created` 适合处理实例已建立后的数据逻辑，`mounted` 才能访问已经挂载的 DOM，`beforeDestroy` 可用于清理资源，`destroyed` 在实例销毁后触发。

Vue 2 使用 `Object.defineProperty` 跟踪对象属性变化，因此有两类常见响应式边界：对象初始化后新增属性要用 `this.$set(object, key, value)`；按数组下标直接赋值不触发更新时，可使用 `this.$set(array, index, value)` 或 `splice`。把顶层状态预先声明在 `data` 中，也更方便看清组件的数据结构。

## 2. 单页应用由路由组织页面

Vue Router 可以把通用路由与动态路由区分开，并通过 `() => import(...)` 延后载入页面。History 模式地址不带 `#`，但部署服务器需要把前端路由回退到应用入口，否则刷新某个深层路径可能得到 404。

项目 `src/permission.js` 中的全局守卫大致按以下顺序处理：有令牌时检查用户信息并按权限拉取路由；无令牌时只放行登录白名单，其它路由跳到登录页；动态路由注册完成后重新进入原目标路由。下面是说明这个顺序的简化示例：

```javascript
router.beforeEach((to, from, next) => {
  if (!getToken()) {
    return whiteList.includes(to.path)
      ? next()
      : next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  if (store.getters.roles.length === 0) {
    store.dispatch('GetInfo')
      .then(() => store.dispatch('GenerateRoutes'))
      .then(routes => {
        router.addRoutes(routes)
        next({ ...to, replace: true })
      })
      .catch(() => store.dispatch('LogOut').then(() => next('/login')))
    return
  }

  next()
})
```

真实源码还处理锁屏、页面标题、进度条、错误提示和重复登录等细节。Vue Router 3 的守卫回调必须保证每条控制路径只调用一次 `next`，否则导航可能卡住或被重复确认。

## 3. Vuex 和请求层分别解决什么问题

组件内部状态适合由组件自己维护；多个页面共享的用户信息、角色和权限路由可以放进 Vuex 模块。Vuex 权限模块可以保存常量路由、动态路由、侧边栏路由和顶部路由，并在 `GenerateRoutes` action 中请求后端的 `/getRouters` 数据后转为前端路由。

请求封装创建 Axios 实例时设置基础 URL 和超时，并在请求拦截器中按请求标记决定是否附加 Bearer token。

```javascript
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 10000
})

service.interceptors.request.use(config => {
  config.headers = config.headers || {}
  const token = getToken()
  if (token && config.headers.isToken !== false) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => Promise.reject(error))
```

响应拦截器再统一处理业务状态码、登录过期、错误提示和文件流响应。不要把所有 HTTP 200 都当作业务成功；应按后端响应协议判断。请求封装中的 `baseURL` 也依赖环境配置，开发代理地址需与后端端口匹配。

## 4. 读代码时优先跟踪的链路

请求封装创建 Axios 实例时设置基础 URL 和超时，并在请求拦截器中按请求标记决定是否附加 Bearer token。

前端路由和按钮权限只决定界面如何呈现，用户可以直接构造 HTTP 请求；真正的接口权限必须由后端重新校验。这个边界和博客已有的 [RuoYi RBAC 权限模型](/articles/050-ruoyi-rbac-permission-model) 是同一条认证后授权链路。

## 5. 学习时容易踩的坑

- `v-html` 会把字符串按 HTML 插入页面，不应直接渲染不可信输入。
- `v-for` 使用稳定的字符串或数字 `key`，避免以数组下标代替真实标识而造成组件复用问题。
- 改了 `data` 但页面没刷新时，先检查 Vue 2 对新增对象属性和数组下标赋值的限制。
- History 模式必须与服务器的 SPA fallback 配置配套；否则客户端跳转正常、刷新深层 URL 却 404。
- 登录成功但菜单为空时，沿着用户信息接口、角色/权限数据、`/getRouters` 响应和路由转换逐段检查。
- Vue 3 的 Composition API、Vue Router 4 配置和 Element Plus 不能直接当作本项目的 Vue 2 代码使用。

## 6. 练习顺序

先用 Vue 指令和组件完成一个本地筛选列表；再用 Vue Router 拆分页面；接着通过 Vuex 管理跨页面状态；最后读请求拦截器、路由守卫和后端菜单接口。练习时可记录请求 URL、请求头、响应状态和路由变化，不需要声称已在生产环境应用。

## 7. 面试常见问题

### Vue 2 响应式数据如何触发视图更新？

Vue 2 初始化时遍历 `data` 对象的属性并转成 getter/setter，渲染过程读取属性时建立依赖，属性变化后通知 watcher 更新视图。动态新增属性和数组索引赋值存在限制。

### 路由守卫和后端权限校验分别负责什么？

路由守卫可在前端拦截导航、生成可见页面；它不能阻止绕开浏览器的 HTTP 请求。后端仍须按当前身份验证每个受保护接口。

### Vue 2 History 路由刷新为什么可能 404？

浏览器刷新时会把当前路径发给服务器。服务器若没有将未命中的前端路由重写到 SPA 入口，就会按普通文件路径查找并返回 404。

## 参考资料

- [Vue 2 官方指南：组件](https://v2.vuejs.org/v2/guide/components)
- [Vue 2 官方指南：响应式与变更检测限制](https://v2.vuejs.org/v2/guide/reactivity)
- [Vue Router 3 官方指南：导航守卫](https://v3.router.vuejs.org/guide/advanced/navigation-guards)
- [Vuex 官方指南](https://vuex.vuejs.org/)
