# English Notes Wall

一个 DeepSeek Harness 插件，提供英语学习便利贴墙：单词、短语、搭配、句型、长难句分析、间隔复习、朗读和每日测验。

- 插件源码与使用说明：[`english-notes-wall/README.md`](english-notes-wall/README.md)
- 版本历史：[`CHANGELOG.md`](CHANGELOG.md)
- 发布方案（npm + DSH 市场索引）：[`PUBLISHING.md`](PUBLISHING.md)
- 通用 DSH 插件开发指南：[`docs/dsh-plugin-development-guide.md`](docs/dsh-plugin-development-guide.md)

## 目录结构

```text
english-notes-wall/   可安装的 bundle（Host index.js、Client client.js、范文库、patch、locale、图标）
check-*.mjs           结构与 locale 检查
test-*.mjs            Host 服务、Client 组件、测验、SRS、导出/备份测试
```

## 开发

```bash
node --check english-notes-wall/index.js
node --check english-notes-wall/client.js
for file in check-*.mjs test-*.mjs; do node "$file"; done
```

开发期间插件通过本地 `link:` 安装进 `desktop` profile。Host 改动需要完整重启 DeepSeek Harness；Client 改动还需要插件 bundle 重新加载。

## 状态

1.18.0 为测验填空加上作答前可见的限定提示与词库，让有歧义的空格只有一个可判定的答案。1.17.3 移除范文阅读器里重复的关闭按钮，只保留带文字的返回按钮和 Escape。1.17.2 把范文阅读器锚定到插件页面区域，不再遮挡 DSH 顶栏和侧栏。1.17.1 修复“今日范文”的 RPC 参数不匹配，并删除多余的新建提示。1.17.0 新增每日雅思范文阅读器，内置十二篇范文，支持句子解析、翻译、词汇、理解题、划词建卡，以及可选的 AI 范文生成。1.16.0 为墙面新增悬浮返回顶部按钮，支持 `Home` 快捷键，并在系统要求减少动态效果时立即跳转。1.15.1 用便签的分类色为全文弹窗及其遮罩着色，让弹窗与正在阅读的便签一致。1.15.0 为全文弹窗加上“上一篇/下一篇”箭头，不必关闭弹窗就能按墙面顺序浏览。1.14.0 新增全文弹窗，无需展开卡片即可阅读全部词条与拓展。1.13.1 修复模型评分把未作答题目判为正确的问题。1.13.0 把每日测验移入由顶栏打开的弹窗，带焦点管理与草稿答案保留。1.12.0 把长难句分析放到分类层级：“长难句分析”便签分析已保存的句子，单词、短语、搭配和句型便签保留普通例句。
