---
title: "Linux 基础操作笔记：命令、权限与网络排查"
date: "2026-10-16"
categories: ["工程实践"]
tags: ["Linux", "命令行", "权限", "网络排查"]
description: "整理 CentOS 7 课堂资料中的文件操作、权限、服务与网络排查，并标注旧环境边界。"
plan_date: "2026-10-16"
phase: "企业开发技术学习"
---

# Linux 基础操作笔记：命令、权限与网络排查

本文依据本地 Linux 基础学习笔记、练习题和进阶网络配置笔记整理。课堂环境是 VMware NAT 网络中的 CentOS 7 Minimal，通过 SecureCRT 使用 SSH 连接。示例命令是学习用例，不代表在生产服务器上执行过。

CentOS Linux 7 已于 2024 年 6 月 30 日结束维护。复现旧课程时可以使用隔离的虚拟机；新环境应选择仍受维护的发行版，并按对应版本确认网络和软件包管理方式。[CentOS Linux 生命周期说明](https://www.centos.org/centos-linux/)

## 一、文件与目录操作

Linux 路径区分大小写。先用 `pwd` 确认当前目录，再执行文件操作。删除前核对路径，课堂资料中出现的递归删除命令不适合作为日常清理习惯。

~~~bash
pwd
ls -lah
mkdir -p ~/lab/logs
touch ~/lab/notes.txt
cp ~/lab/notes.txt ~/lab/notes.bak
mv ~/lab/notes.bak ~/lab/notes-old.txt
rm ~/lab/notes-old.txt
~~~

查找和阅读日志：

~~~bash
find /var/log -type f -name "*.log"
grep -n "ERROR" app.log
tail -n 100 app.log
tail -f app.log
~~~

压缩包先查看清单，再解压到明确目录：

~~~bash
tar -czf logs.tar.gz ./logs
tar -tzf logs.tar.gz
tar -xzf logs.tar.gz -C /tmp
~~~

## 二、进程、服务和权限

~~~bash
ps -ef | grep '[j]ava'
top
sudo systemctl status sshd
sudo journalctl -u sshd --since "30 minutes ago"
ls -l app.yml
chmod 640 app.yml
sudo chown app:app app.yml
~~~

课堂资料介绍了用户、用户组、`chmod`、`chown` 和 `sudo`。服务应使用低权限专用账号；`chmod 777` 不是权限问题的通用修复。课程虚拟机使用的弱口令只适合隔离练习，不能沿用到可访问的主机。

## 三、网络排查

VMware NAT、虚拟网卡、来宾系统地址和默认路由都可能影响连接。先核对网络信息，不要直接关闭防火墙：

~~~bash
ip addr
ip route
getent hosts example.com
ss -lntp
curl -v http://127.0.0.1:8080/actuator/health
~~~

课堂中的 CentOS 7 静态网络配置使用 `/etc/sysconfig/network-scripts/ifcfg-ens...`；该路径不能直接套用到所有新版本发行版。只开放所需网络端口，并按系统版本核对配置工具。

## 四、vi 和 SSH 连接

课堂笔记覆盖 vi 命令模式、输入模式和末行模式：`i` 输入，`Esc` 返回，`dd` 删除行，`yy` 复制，`p` 粘贴，`:wq` 保存退出，`:q!` 放弃修改退出。改系统配置前先备份；影响网络或 SSH 的改动要确保能从虚拟机控制台恢复。

课程用 SSH 连接虚拟机的 22 端口。生产环境应按组织规范配置密钥、账号权限、来源限制和审计。

## 与已有部署文章的关系

本文依据本地 827、0828 笔记整理基础命令、权限和网络排查；博客已有 [Linux 上运行 Spring Boot JAR 的 systemd 管理笔记](/articles/065-linux-springboot-jar-systemd)，侧重应用服务部署。CentOS 7 的具体命令保留为旧课堂环境记录，不是新服务器部署建议。

## 资料来源

- Linux 基础学习笔记
- Linux 基础练习题
- Linux 进阶网络配置笔记
