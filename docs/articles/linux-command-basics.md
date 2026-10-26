---
title: "Linux 常用命令：文件、权限与网络排查"
date: "2026-10-16"
categories: ["工程实践"]
tags: ["Linux", "命令行", "权限", "网络排查"]
description: "整理文件操作、权限、进程和网络排查命令，并说明发行版与安全配置的边界。"
plan_date: "2026-10-16"
phase: "后端工程实践"
---

# Linux 常用命令：文件、权限与网络排查

Linux 路径区分大小写。执行文件操作前先用 `pwd` 确认当前位置，并检查命令影响范围；不同发行版的服务名、网络配置工具和软件包管理方式可能不同。

## 文件与目录

~~~bash
pwd
ls -lah
mkdir -p ~/lab/logs
touch ~/lab/notes.txt
cp ~/lab/notes.txt ~/lab/notes.bak
mv ~/lab/notes.bak ~/lab/notes-old.txt
rm ~/lab/notes-old.txt
~~~

阅读和查找日志时，可先确认文件路径与权限：

~~~bash
find /var/log -type f -name "*.log"
grep -n "ERROR" app.log
tail -n 100 app.log
tail -f app.log
~~~

压缩包先查看文件清单，再解压到明确目录：

~~~bash
tar -czf logs.tar.gz ./logs
tar -tzf logs.tar.gz
tar -xzf logs.tar.gz -C /tmp
~~~

## 进程、服务与权限

~~~bash
ps -ef | grep '[j]ava'
top
sudo systemctl status sshd
sudo journalctl -u sshd --since "30 minutes ago"
ls -l app.yml
chmod 640 app.yml
sudo chown app:app app.yml
~~~

服务宜使用权限受限的专用账号。`chmod 777` 会向所有用户开放读写执行权限，不是通用的权限修复方式。实际服务单元名称也可能因发行版或软件包而异，可先用 `systemctl list-unit-files` 查询。

## 网络排查

先查看接口、路由、名称解析和监听端口，再检查防火墙及上游网络：

~~~bash
ip addr
ip route
getent hosts example.com
ss -lntp
curl -v http://127.0.0.1:8080/actuator/health
~~~

`curl` 示例要求目标应用提供该健康检查路径。若服务部署在容器或虚拟机中，还要核对端口映射、虚拟网络、来宾地址和默认路由；容器 IP 通常不应作为固定地址，容器网络内优先使用服务名。

较旧的 CentOS 7 环境可能通过 `/etc/sysconfig/network-scripts/ifcfg-*` 配置网卡。CentOS Linux 7 已于 2024 年 6 月 30 日结束维护，因此这类路径只适用于相应旧环境；新系统应查阅当前发行版文档并使用受支持的网络管理工具。[CentOS Linux 生命周期说明](https://www.centos.org/centos-linux/)

## SSH 与变更恢复

修改网络或 SSH 配置前应备份文件，并确认有可用的带外或本地控制台访问方式，以便在远程连接中断时恢复。可访问的主机应按组织安全要求配置密钥认证、账号权限、来源限制和审计，不使用弱口令。

博客中的 [Linux 上使用 systemd 管理 Spring Boot JAR](./065-linux-springboot-jar-systemd.md) 进一步讨论应用进程管理。
