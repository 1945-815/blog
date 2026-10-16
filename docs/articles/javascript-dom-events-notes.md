---
title: "JavaScript 基础与 DOM：用事件更新页面"
date: "2026-10-16"
categories: ["前端技术"]
tags: ["JavaScript", "DOM", "事件"]
description: "依据本地 JavaScript 课堂笔记，串联变量、数组、函数、DOM 查询和事件监听，并区分浏览器与 Node.js 环境。"
plan_date: "2026-10-16"
phase: "Web 基础"
---

# JavaScript 基础与 DOM：用事件更新页面

本篇依据 2026 年 3 月 25–27 日的 JavaScript 课堂笔记。笔记从变量、运算符、数组、函数走到 `document` 查找元素、修改内容以及点击/表单事件。下例只在浏览器中运行，是静态页面练习。

## 语言与运行环境

`let` 定义可重新赋值的块级变量，`const` 定义不可重新赋值的绑定；数组可用 `push` 添加元素，函数把重复操作封装起来。优先使用 `===` 避免隐式类型转换。JavaScript 语言可以运行在浏览器，也可以运行在 Node.js 等环境；`document`、DOM 和页面事件是浏览器提供的 API，普通 Node.js 进程没有浏览器 DOM。本地笔记中“JS 必须依附 HTML 才能运行”只适用于其中的浏览器页面练习，不是语言本身的限制。

## 一个完整的 DOM 与事件练习

保存为 `dom-practice.html` 后直接用浏览器打开。输入课程名、点击按钮，列表会更新；空白输入给出提示。示例只修改当前页面，刷新后数据消失。

~~~html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>课程列表练习</title>
</head>
<body>
  <main>
    <h1>课程列表</h1>
    <form id="course-form">
      <label for="course-name">课程名称</label>
      <input id="course-name" name="course" maxlength="40" required>
      <button type="submit">添加</button>
    </form>
    <p id="message" role="status"></p>
    <ul id="course-list"></ul>
  </main>
  <script>
    const courses = ["Java 基础", "MySQL 入门"];
    const form = document.querySelector("#course-form");
    const input = document.querySelector("#course-name");
    const list = document.querySelector("#course-list");
    const message = document.querySelector("#message");

    function render() {
      list.replaceChildren();
      for (const course of courses) {
        const item = document.createElement("li");
        item.textContent = course;
        list.appendChild(item);
      }
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = input.value.trim();
      if (name.length === 0) {
        message.textContent = "请输入课程名称";
        return;
      }
      courses.push(name);
      render();
      message.textContent = "已添加：" + name;
      form.reset();
      input.focus();
    });
    render();
  </script>
</body>
</html>
~~~

`querySelector` 按 CSS 选择器返回第一个匹配元素；这里脚本放在页面末尾，执行时目标元素已解析。`addEventListener` 将事件与处理函数关联，`event.preventDefault()` 阻止表单默认导航。课堂截图还练习了复选框、下拉框与普通属性读写；不同控件应使用其对应属性（如复选框的 `checked`），不能都按文本处理。

将用户输入显示为纯文本时用 `textContent`，避免把输入解释为 HTML。`innerHTML` 只应在内容可信且明确需要解析标签时使用。这个小程序没有持久化、服务器校验或登录；若接入后端，还需要请求失败提示、输入限制和授权机制。

## 自查问题

- 为什么 `const courses` 仍能调用 `push`？
- 脚本若移到 `<head>` 且不等待 DOM 完成，会出现什么问题？
- `textContent` 与 `innerHTML` 处理用户输入有何差异？

## 资料与参考

- 本地资料：`day19 Web开发 -- JavaScript基础.md`、`day20 Web开发 -- JavaScript进阶.md` 中的变量、数组、函数、DOM 和事件练习。
- [Node.js 官方入门](https://nodejs.org/learn/getting-started/introduction-to-nodejs)
- [MDN：EventTarget.addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
