# 博客内容维护

本项目继续使用 VitePress 与 GitHub Pages，发布基础路径为 `/blog/`。本地运行：

```bash
npm ci
npm run docs:dev
```

构建静态站点：

```bash
npm run docs:build
```

## 个人资料与项目

- 主页职业摘要、教育经历、实习经历与技能分组：`docs/.vitepress/theme/data/profile.ts`
- 主页项目卡片：`docs/.vitepress/theme/data/projects.ts`
- 项目介绍和详情：`docs/projects.md`、`docs/projects/`
- 关于页：`docs/about.md`

修改职业事实前，请与最新简历核对。页面当前只写入本次任务明确提供的内容；手机号和私人邮箱没有在公开页展示。

## 文章、分类与日期

- 文章正文与 Front Matter：`docs/articles/*.md`
- 学习阶段和原有路线参考数据：`content-plan.json`
- 文章列表全文索引由 `docs/article-search.data.ts` 从现有 Markdown 自动生成；搜索时才加载正文索引，首页不会下载它。

文章的 `date` 字段保留原有含义；`plan_date` 用作阶段参考或内容规划。新增文章时依照原文来源填写，不能把写作日、规划日和真实公开日互相替换。

文章分类页根据标题、原有分类、标签和阶段信息汇总；筛选条件同步至 URL。不要为了填充分类而新增没有对应文章的标签。

## 友情链接

编辑 `docs/.vitepress/theme/data/friends.ts` 的 `friends` 数组。每项包含真实网站名称、HTTPS 地址、简介和分类；Logo 可选。本站不会定时验证外站是否正常，发现失效后将 `unavailable` 设为 `true` 并更新链接。

申请入口使用 `.github/ISSUE_TEMPLATE/friend-link.yml`。提交 Issue 只会进入人工审核流程，不会自动发布。

## 说说

在 `docs/.vitepress/theme/data/moments.ts` 添加真实内容。`publishedAt` 使用实际发布时间；图片放入 `docs/public/moments/`，填写替代文本和可选说明。图片地址填写 `/moments/文件名.jpg`，页面会自动加上 `/blog/` 基础路径。没有内容时页面会显示空状态。

## 公开相册

在 `docs/.vitepress/theme/data/albums.ts` 添加相册和照片。照片放入 `docs/public/albums/`，配置 `alt`、可选说明与真实拍摄日期；封面可用公开照片。页面自适应排列照片，点击后可灯箱预览，并支持键盘方向键与手机左右滑动。

没有得到主人提供和确认的照片时，不要使用示例照片填充。

## 音乐

在 `docs/.vitepress/theme/data/music.ts` 添加曲目。优先使用获准公开的本地音频，例如放在 `docs/public/music/`，并把路径写成 `/music/文件名.mp3`；也可使用稳定且有权使用的公开源。播放器首次加载时尝试自动播放并恢复上次曲目；浏览器可能阻止有声自动播放，此时用户可点击播放键开始。播放器在站内路由切换时保留实例。

浏览器只在 `localStorage` 中保存曲目序号、播放位置、音量、随机和循环偏好；不会保存私人相册密码。不要添加未经授权的音源或盗链。

## 私人恋爱记录：本地加密流程

私密原图和明文记录必须留在本地忽略目录 `private-data/`。该目录已加入 `.gitignore`。站点只需要发布 AES-GCM 加密后的 `docs/public/private/memories.enc.json`；请检查 Git 变更，确认没有把 `private-data/`、原图或未加密 JSON 加入版本控制。

1. 在 `private-data/memories.json` 编写自己的真实记录。可选字段为 `milestones`、`notes` 和 `photos`。照片使用相对文件名，例如 `photos/真实照片.jpg`，并放在同一 `private-data/` 目录树中。
2. 在仓库根目录运行 `node tools/encrypt-memories.mjs`。脚本会遮挡输入内容、要求输入两次至少 12 位密码，并将照片转成 data URI 后与其余记录一起加密。
3. 密码只用于本地派生加密密钥，不进入输出文件、命令参数或浏览器存储。发布文件包含随机盐、随机 IV、PBKDF2-SHA-256 参数和 AES-256-GCM 密文。
4. 将生成的加密文件随站点部署。照片、日期、文字和故事都在认证加密边界内；静态网站只会先下载密文，输入密码后才在当前浏览器内解密。
5. 退出私人空间会清除页面持有的明文数据引用。关闭页面也不会恢复解锁状态。

重新加密时，脚本会先把旧密文移入 `private-data/encrypted-backups/`（同样被忽略），再生成新版本。保留本地备份，按需要另行加密归档。站点没有默认密码；务必选择唯一、足够长的口令并自行安全保管，忘记密码后无法从密文恢复内容。

若要恢复备份，停止发布后在本地将选定密文复制回 `docs/public/private/memories.enc.json`。不要把明文备份复制到站点目录。

## 联系入口

编辑 `docs/.vitepress/theme/data/contacts.ts`。`href` 是电脑和手机的网页回退地址，`appHref` 是移动端尝试唤起的应用链接。QQ 和微信账号不会直接渲染到页面文字中；微信卡片会复制账号并尝试打开微信，用户需在微信中搜索添加。不要在可见文案或无障碍标签里输出 `copyValue`。
