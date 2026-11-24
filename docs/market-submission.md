# 提交到第三方 DSH 插件市场

DSH 官方没有插件提交入口，但社区维护了两个可用的市场。两个都接受第三方插件，提交方式都是 **GitHub Issue 表单**；索引与商城由维护者/机器人审核后更新。

## 两个市场

| 市场 | 索引地址 | 提交入口 | 审核方式 |
| --- | --- | --- | --- |
| 开放插件市场 dshopen.org | `https://dshopen.org/index.json` | [插件收录表单](https://github.com/polang233/dsh-plugin-index/issues/new?template=plugin-add.yml) | 维护者人工审核，偏好有 Logo、完整描述和截图的插件 |
| DSH STORE dsh-store.cn | `https://dsh-store.cn/plugin-market.json` | [提交表单](https://github.com/AI-Scarlett/DSH-Store/issues/new?template=plugin-submission.yml) | 机器人静态预检 + 每 8 小时 Catalog 门禁，固定 Git Commit |

## 当前插件是否满足条件

| 条件 | 状态 |
| --- | --- |
| 公开源码仓库 | ✅ <https://github.com/wincharm001/english-notes-wall> |
| npm 可安装版本 | ✅ `dsh-english-notes-wall@1.18.1` |
| 明确的许可证 | ✅ MIT（仓库根与包内各一份） |
| 标准 DSH Bundle | ✅ `dsh.bundle.patch` + `dsh.client` |
| 无生命周期脚本 | ✅ 没有 `preinstall`/`postinstall` 等 |
| 无运行时依赖 | ✅ `dependencies` 为空 |
| 自带 Logo | ✅ `icon.svg` |
| 完整描述 | ✅ README 已中文化，`meta.title`/`meta.description` 双语 |
| 实机截图 | ❌ 还没有（可选，但 dshopen 优先审核有截图的） |

## 提交内容

### 开放插件市场（dshopen.org）

表单字段较少，直接填写：

- **插件地址**：`dsh-english-notes-wall`（或 `https://github.com/wincharm001/english-notes-wall`）
- **简短说明**（一句话，中英文均可）：

  > 英语学习便利贴墙：单词/短语/搭配/句型分类记录，模型拓展、间隔复习、每日测验，以及内置十二篇雅思范文的阅读器与划词建卡。
  >
  > An English-learning sticky-note wall with model expansion, spaced repetition, daily quizzes, and a reader for twelve bundled IELTS essays with selection-to-note capture.

- **插件实际效果**：可选，建议拖入 1–3 张真实截图（墙面、范文阅读器、测验弹窗），每张一句话说明；不要只放 Logo。
- **补充信息**：

  > 已在 DSH 0.2.2-rc.5 / Windows x64 验证；索引固定使用 npm 版本 `1.18.1`；MIT 许可证。
  >
  > Verified with DSH 0.2.2-rc.5 on Windows x64; index pins the npm release 1.18.1; MIT licensed.

### DSH STORE（dsh-store.cn）

机器人只读仓库，不需要填元数据：

- **GitHub repository**：`https://github.com/wincharm001/english-notes-wall`
- **Plugin path**：`english-notes-wall`（仓库根不是插件包，必须填子目录）
- **Notes**（可选）：

  > 单包 Bundle，无运行时依赖与生命周期脚本；Host 负责便签存储、模型拓展、测验与范文，Client 渲染墙面与阅读器；MIT 许可证。

## 提交后

- dshopen：审核并入索引大约需要一次维护者处理周期，索引每 6 小时构建一次；收录后可加点赞徽章：

  ```md
  [![开放插件市场](https://img.shields.io/endpoint?url=https%3A%2F%2Fdshopen.org%2Fbadge%2Fdsh-english-notes-wall.json)](https://dshopen.org/zh/plugins/dsh-english-notes-wall/)
  ```

- dsh-store：机器人先做静态预检，通过后由 8 小时 Catalog 策略固定 Commit 并执行许可证、依赖、生命周期、Bundle 与权限门禁，全部通过才自动上架；版本升级后会自动重新固定并更新。
- 两个市场都声明“收录不等于安全审计”，因此描述里要写清数据落点（`%DSH_HOME%/english-notes-wall/`）和网络行为（只在配置模型后调用模型 API）。

## 版本升级时

- npm 发版后无需改动 dshopen 的申请，索引会跟随 npm 最新版本；
- dsh-store 会自己扫描新版本并重新固定 Commit；如果停更较久，重新提一个 Issue 即可。
