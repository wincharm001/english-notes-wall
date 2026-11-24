# 提交到 awesome-dsh-plugin

目标仓库：<https://github.com/awesome-dsh-plugin/awesome-dsh-plugin>（`awesome-dsh-plugin/awesome-dsh-plugin`）。

它是列表类仓库：**两个 README 由脚本生成，不能手改**；每个插件是 `data/plugins/` 下的**一个 YAML 文件**，一次 PR 只加这一个文件。

## 我们的条目

已按仓库格式写好，提交时原样复制：

`docs/awesome-submission/wincharm001__english-notes-wall--english-notes-wall.yml`

```yaml
url: https://github.com/wincharm001/english-notes-wall/tree/main/english-notes-wall
name: wincharm001/english-notes-wall#english-notes-wall
category: tools
description:
  en: An English-learning sticky-note wall with categorized notes, model expansion, spaced repetition, a daily quiz, and a reader for twelve bundled IELTS essays with selection-to-note capture.
  zh: 英语学习便利贴墙：分类记录、模型拓展、间隔复习、每日测验，以及内置十二篇雅思范文的阅读器与划词建卡。
```

- 插件包在子目录 `english-notes-wall/`，所以 `url` 指向该子目录、`name` 用 `owner/repo#subname` 形式、文件名用 `owner__repo--sub-path.yml`。
- `category: tools`：插件自带 `english_notes` 工具与整页界面，不属于主题或纯装饰。

## 门槛与当前状态

| 门槛 | 说明 | 我们的状态 |
| --- | --- | --- |
| `dsh.bundle` manifest | CI 读取条目 URL 对应的 `package.json`，必须有 `dsh.bundle` | ✅ `english-notes-wall/package.json` 已有 |
| 仓库满 1 天 | CI 自动检查，年龄不够时每 6 小时自动重跑 | ⏳ 2026-11-24T12:42Z 创建，**2026-11-25T12:42Z（北京时间 20:42）后自动通过** |
| `dsh-plugin` topic | 仓库设置里加 topic | ❌ 待加 |
| 描述属实、无营销词 | 评审会对着代码核对每句声明 | ✅ 描述只写已实现功能 |
| 一个 PR 最多 3 条 | 我们只加 1 条 | ✅ |
| README 不手改 | 合并后由脚本重新生成 | ✅ 只提交 YAML |
| npm 包 `repository` 指回本仓库 | 用于自动关联下载量 | ✅ 已声明 |
| 图标（可选） | 必须是 GitHub 托管的 PNG/JPG/WebP，不接受 SVG | ⏳ 目前只有 `icon.svg`；不写则回退作者头像 |
| 截图（可选） | 在插件目录放 `screenshots.json`，列 1–8 张相对路径图片 | ⏳ 暂无 |

## 具体步骤

### 1. 给仓库加 topic（你操作）

仓库首页 **About 右侧齿轮 → Topics**，添加 `dsh-plugin`，保存。

### 2. Fork 目标仓库（你操作）

打开 <https://github.com/awesome-dsh-plugin/awesome-dsh-plugin>，点 **Fork**，创建 `wincharm001/awesome-dsh-plugin`。

### 3. 克隆自己的 fork（可交给我）

仓库很大（约 560 MB，主要是站点资源），用稀疏检出只取条目目录：

```bash
git clone --depth 1 --filter=blob:none --sparse git@github.com:wincharm001/awesome-dsh-plugin.git
cd awesome-dsh-plugin
git sparse-checkout set data/plugins
git checkout -b add-english-notes-wall
```

### 4. 添加条目文件

```bash
cp <本仓库>/docs/awesome-submission/wincharm001__english-notes-wall--english-notes-wall.yml \
   data/plugins/wincharm001__english-notes-wall--english-notes-wall.yml
```

然后：

```bash
git add data/plugins/wincharm001__english-notes-wall--english-notes-wall.yml
git commit -m "Add English Notes Wall"
git push -u origin add-english-notes-wall
```

### 5. 打开 PR

推送后点 GitHub 给出的 “Compare & pull request”，或直接访问：

```text
https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/compare/main...wincharm001:awesome-dsh-plugin:add-english-notes-wall?expand=1
```

PR 正文用 `docs/awesome-submission/pr-body.md` 的内容。

### 6. 等 CI 与评审

- CI 会依次检查：条目数量 → `dsh.bundle` → 仓库年龄 → `awesome-lint` 与站点构建。
- 现在提交时“仓库年龄”这一项会红，提示 `repository is X days old (needs 1)`。**这是唯一会被时间自动清掉的失败项**，`regate.yml` 每 6 小时重跑一次，通常明天 20:42（北京时间）之后自己变绿。不要关 PR、不要推空提交、不要重开。
- 如果维护者要改描述或分类，会给 PR 打 `held: author`；把修改推到同一分支，再留一条评论说明改了什么即可。

## 合并后

- 两个 README 与站点会在 `main` 上自动重新生成，不需要再提 PR。
- npm 下载量会通过包的 `repository` 字段自动关联，不需要在 YAML 里写任何 npm 字段。
- 想换描述或分类，只改自己那一个 YAML 再提 PR，不要动生成的 README。
