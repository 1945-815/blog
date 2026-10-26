---
title: "HTML 与 CSS 入门：表格、表单和提交方式"
date: "2026-10-16"
categories: ["前端技术"]
tags: ["HTML", "CSS", "表单"]
description: "梳理语义标签、表格、表单控件与 GET/POST 的真实边界。"
plan_date: "2026-10-16"
phase: "Web 基础"
---

# HTML 与 CSS 入门：表格、表单和提交方式

示例可直接用浏览器打开；表单通过 GET 参数展示提交行为，服务端接收与校验需要另行实现。

## 从结构到展示

HTML 表达文档结构和控件语义，CSS 控制展示。标题、列表、链接、图片、表格和表单各有用途：数据表格用 `table`，不要把表格当页面布局工具；输入项配 `label`，让点击文字也能聚焦控件；图片需要有意义的替代文字，纯装饰图可用空 `alt`。CSS 选择器匹配元素后设置颜色、间距和布局，不能替代服务端输入校验。

把下面内容保存为 `search-form.html`，用浏览器打开即可。它显示一张记录表和一个 GET 表单；提交后参数出现在当前页面 URL 中。示例不会保存数据。

~~~html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>记录查询示例</title>
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
    <h1>记录查询</h1>
    <p>先看示例数据，再输入关键词。这里没有真实后端查询。</p>
    <table>
      <caption>示例记录</caption>
      <thead><tr><th scope="col">编号</th><th scope="col">主题</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>索引设计</td></tr>
        <tr><td>2</td><td>事务隔离</td></tr>
      </tbody>
    </table>
    <form method="get" action="">
      <label for="keyword">查询关键词</label>
      <input id="keyword" name="keyword" type="search" required maxlength="30">
      <button type="submit">提交查询参数</button>
    </form>
  </main>
</body>
</html>
~~~

`name` 决定控件提交时的参数名。`required` 和 `maxlength` 可改善浏览器交互，不能作为唯一校验：请求可以绕过页面直接发到服务端。`action=""` 使本示例提交到当前页面，看到查询串只是为了观察协议，并没有执行数据查询。

## GET 与 POST 的实际区别

GET 通常把表单数据编码到 URL 查询串，适合可分享的无副作用查询；敏感信息不应出现在查询串。POST 把数据放在请求体中，适合提交会改变状态的数据，但**POST 自身不提供加密**，传输保密依赖 HTTPS；请求体大小也受客户端、服务器和配置限制。无论哪种方法，后端都必须验证输入并控制授权。

表单提交会产生 HTTP 请求；静态文件示例只是演示浏览器行为。保存数据还需要服务端接口、错误处理和防重复提交设计，不能仅把 `method` 改成 POST 就称为安全系统。DOM 和事件处理的前端交互另见 [JavaScript 与 DOM 事件](./javascript-dom-events.md)。

## 资料与参考

- [MDN：表单发送数据](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Sending_and_retrieving_form_data)
- [MDN：label 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label)
