---
title: "HTML 与 CSS 入门：表格、表单和提交方式"
date: "2026-10-16"
categories: ["前端技术"]
tags: ["HTML", "CSS", "表单"]
description: "根据本地 Web 基础笔记整理语义标签、表格、表单控件与 GET/POST 的真实边界。"
plan_date: "2026-10-16"
phase: "Web 基础"
---

# HTML 与 CSS 入门：表格、表单和提交方式

本篇依据 2026 年 3 月 24–25 日的 Web 课堂笔记。示例是可直接用浏览器打开的静态页面，用于理解标签、样式与表单提交，不代表已有后端接口。

## 从结构到展示

HTML 表达文档结构和控件语义，CSS 控制展示。标题、列表、链接、图片、表格和表单各有用途：数据表格用 `table`，不要把表格当页面布局工具；输入项配 `label`，让点击文字也能聚焦控件；图片需要有意义的替代文字，纯装饰图可用空 `alt`。CSS 选择器匹配元素后设置颜色、间距和布局，不能替代服务端输入校验。

把下面内容保存为 `form-practice.html`，用浏览器打开即可。它显示一张练习表和一个 GET 表单；提交后参数出现在当前页面 URL 中。示例不会保存数据。

~~~html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>课程查询练习</title>
  <style>
    body { max-width: 42rem; margin: 2rem auto; padding: 0 1rem;
           font: 1rem/1.6 system-ui, sans-serif; color: #243047; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #a8b2c2; padding: .5rem; text-align: left; }
    label { display: block; margin-top: 1rem; }
    input { padding: .4rem; max-width: 100%; }
    button { margin-top: 1rem; padding: .45rem .9rem; }
  </style>
</head>
<body>
  <main>
    <h1>课程查询练习</h1>
    <p>先看示例数据，再输入关键词。这里没有真实后端查询。</p>
    <table>
      <caption>示例课程</caption>
      <thead><tr><th scope="col">编号</th><th scope="col">课程</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>Java 基础</td></tr>
        <tr><td>2</td><td>MySQL 入门</td></tr>
      </tbody>
    </table>
    <form method="get" action="">
      <label for="keyword">课程关键词</label>
      <input id="keyword" name="keyword" type="search" required maxlength="30">
      <button type="submit">提交查询参数</button>
    </form>
  </main>
</body>
</html>
~~~

`name` 决定控件提交时的参数名。`required` 和 `maxlength` 可改善浏览器交互，不能作为唯一校验：请求可以绕过页面直接发到服务端。`action=""` 使本示例提交到当前页面，看到查询串只是为了观察协议，并没有执行数据查询。

## GET 与 POST 的实际区别

课堂笔记把 POST 描述成“隐式提交，所以安全且大小不受限制”，这需要修正。GET 通常把表单数据编码到 URL 查询串，适合可分享的无副作用查询；敏感信息不应出现在查询串。POST 把数据放在请求体中，适合提交会改变状态的数据，但**POST 自身不提供加密**，传输保密依赖 HTTPS；请求体大小也受客户端、服务器和配置限制。无论哪种方法，后端都必须验证输入并控制授权。

表单提交会产生 HTTP 请求；静态文件示例只是演示浏览器行为。真正保存记录时需要服务端接口、错误处理和防重复提交设计，不能仅把 `method` 改成 POST 就称为安全系统。DOM 和事件处理的前端交互另见 [JavaScript 与 DOM 笔记](./javascript-dom-events-notes.md)。

## 资料与参考

- 本地资料：`day18 Web开发 -- HTML + CSS.md`、`day19 Web开发 -- JavaScript基础.md` 中的标签、表格、表单和 GET/POST 章节。
- [MDN：表单发送数据](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Sending_and_retrieving_form_data)
- [MDN：label 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label)
