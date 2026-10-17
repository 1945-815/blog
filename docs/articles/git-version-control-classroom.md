---
title: "Git 课堂笔记整理：暂存、提交、分支与冲突处理"
date: "2026-10-16"
categories: ["工程协作"]
tags: ["Git", "版本控制", "工程基础"]
description: "按本地 Git 课堂练习梳理工作区、暂存区、提交、分支合并，并区分 restore、revert 与 reset 的风险。"
plan_date: "2026-10-16"
phase: "数据库与 Spring 基础"
---

# Git 课堂笔记整理：暂存、提交、分支与冲突处理

本地 `笔记.md` 从初始化仓库讲到暂存、日志、版本回退、分支和合并冲突。这里把截图中的命令整理成一条可在空目录练习的流程，不复制课堂人物故事，也不表示曾在某个企业仓库执行过这些操作。

## 从一个文件看三种状态

工作区是正在编辑的文件；`git add` 把当前内容放入暂存区；`git commit` 把暂存内容写成一次提交。修改同一个文件两次、只在第一次后 `git add`，提交包含的是第一次暂存的版本，第二次仍留在工作区。提交前同时查看两种差异：

```bash
git init
git status
git add README.md
git diff                 # 工作区相对暂存区的变化
git diff --staged        # 暂存区相对当前提交的变化
git commit -m "docs: add README"
git log --oneline --decorate -5
```

如果没有 README，先创建并写入一行说明再执行 `git add`。首次提交前需按自己的身份配置 `user.name` 与 `user.email`；课堂截图中的个人信息不应照搬进别人的仓库。

## 在分支上练习，再合并

`git switch` 需要 Git 2.23 或更新版本；旧版 Git 可使用 `git checkout`。以下流程假设当前主分支名为 `main`，若 `git branch --show-current` 显示不同名称，应以实际名称为准。

```bash
git branch --show-current
git switch -c feature/notes
# 修改 README.md，再检查和提交
git status
git add README.md
git commit -m "docs: expand notes"
git switch main
git merge feature/notes
git branch -d feature/notes
```

`git merge` 将指定分支的修改并入当前分支，因此合并前先确认自己站在哪个分支。`git branch -d` 只在分支已合并时删除；课堂资料中出现的 `-D` 是强制删除，不能当作日常收尾命令。

若两个分支改了同一段内容，Git 可能暂停合并并在文件中标出冲突。应逐处读懂两边意图，编辑为最终内容，运行检查，再 `git add` 冲突文件并完成 `git commit`。不要只把 `<<<<<<<`、`=======`、`>>>>>>>` 标记删掉而不核对语义。`git status` 会指出仍需处理的文件；不想继续这次合并时可以在未提交前用 `git merge --abort` 回到合并前状态。

## 撤销时先分清目标

| 目标 | 常用操作 | 影响 |
| --- | --- | --- |
| 只撤出暂存，保留工作区修改 | `git restore --staged README.md` | 不删除当前文件修改 |
| 丢弃一个文件未提交的工作区修改 | `git restore README.md` | 当前未提交改动会丢失 |
| 撤销已共享的某次提交 | `git revert <commit>` | 新建一个反向提交，保留历史 |
| 把本地分支指针和文件退回旧提交 | `git reset --hard <commit>` | 丢弃未提交改动并改写本地分支历史 |

本地笔记直接使用 `git reset --hard HEAD^` 回到上一版本。执行前先用 `git status`、`git log --oneline` 和必要的备份确认范围；已推送给协作者的提交通常优先考虑 `revert`，避免用强制推送覆盖他人历史。误操作后可以检查本机 `git reflog` 寻找旧的 HEAD，但不能把 reflog 当作可靠备份。

## 和后端项目结合

在 Java 项目里，提交前检查 `git diff --staged`，确认只包含源码、测试、文档和安全的配置样例；`target/`、IDE 临时文件和本地密钥应由 `.gitignore` 或项目规范排除。合并冲突后不仅要让 Git 显示“已解决”，还要运行项目已有的构建与测试，特别是同时修改了 POM、Mapper XML 或配置文件时。

资料依据：本地 `笔记.md` 的初始化、暂存、日志、回退、分支、合并和冲突操作。命令语义参考 [Git reset](https://git-scm.com/docs/git-reset)、[Git restore](https://git-scm.com/docs/git-restore) 与 [Git revert](https://git-scm.com/docs/git-revert)。
