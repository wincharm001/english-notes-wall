# DSH 插件开发指南

这份指南把一次完整的 DSH 插件开发过程压缩成可复用的步骤：怎么选扩展点、怎么搭骨架、Host 与 Client 各负责什么、怎么测试、怎么发版、以及哪些坑几乎每个插件都会踩。示例取自本仓库的 `english-notes-wall`，但规则对任何 DSH 插件都成立。

DSH 指 DeepSeek Harness；下文出现的 `ctx` 都是 Cordis 插件上下文。

## 1. 插件由什么组成

一个 DSH 插件 = **一个 npm 包 + 一份 Loader patch**。`package.json` 用 `dsh.bundle.patch` 指向 YAML，patch 往 profile 的插件表插入一行；Cordis 加载这一行，插件才真正运行。

| 组成 | 文件 | 职责 |
| --- | --- | --- |
| 清单 | `package.json` | `dsh.bundle.patch`、可选 `dsh.client`、`exports`、`files` |
| 装配 | `cordis.patch.yml` | `insert` 一行 `{ id, name, config }` |
| Host | `index.js` | 服务、Agent 工具、定时任务、文件读写、模型调用 |
| Client | `client.js` | React 组件，注册到 slot |
| 显示元数据 | `locale/*.json`、`icon.svg` | 插件管理里的标题、描述、图标、详情页 |
| 数据 | `%DSH_HOME%/<plugin>/` | 用户数据，不进包、不进 git |

只有 Host 的插件可以完全没有 Client；纯装饰插件可以 `export function apply() {}`。

## 2. 先定落点，再写代码

**落点选错，后面所有 UI 细节都救不回来。** 先回答“用户在哪里看到它、Agent 怎么用到它”，再决定扩展点：

| 目标 | 扩展点 | 说明 |
| --- | --- | --- |
| Agent 获得新能力 | Host 服务 + `ctx.tools.register()` | 页面与工具调用同一个服务方法 |
| 给模型加固定规则 | `ctx.systemPrompt.section()` | 不要监听 prompt 组装事件去改文本 |
| 限制/拦截工具 | `ctx.tools.restrict()` / `guard()` | 从最弱的机制开始用 |
| 主区域整页 | Client slot `main` | 本插件用法 |
| 侧栏入口 | `sidebar.panellist` | |
| 输入框旁小控件 | `conversation.composer.dock` | 装饰类首选，slot 自带布局空间 |
| 覆盖整个应用 | `shell.overlay` | 仅当确实需要，且落点已知 |
| 会话里的自定义行 | `conversation.chat.node` + 事件定义 | 先读 practices 再动手 |

不确定 slot 名、props、主题变量或服务方法时，先查而不是猜：

- `cordis_inspect_query`：`Slots.listSubTree`、`Theme`、`Service`、`Config.listConfigs`
- 没有 inspect 工具时，读对应包的 README 与源码，并明确说明“未校验实时注册”

**原则：用最弱的机制满足需求。** 能用 `restrict` 就不写 guard，能用 guard 就不写 waterfall；越强的钩子，越要替其他插件保留贡献。

## 3. 最小骨架

Host + Client 的完整最小清单：

```json
{
  "name": "@local/my-plugin",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./client": "./client.js",
    "./locale/*.json": "./locale/*.json",
    "./icon": "./icon.svg"
  },
  "files": ["index.js", "client.js", "cordis.patch.yml", "locale/*.json", "docs", "icon.svg"],
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "platform": "web",
      "immediately": true,
      "inject": ["@deepseek-ai/dsh-client-connection", "@deepseek-ai/dsh-client-locale"]
    }
  }
}
```

```yaml
# cordis.patch.yml
- insert:
    - id: my-plugin
      name: '@local/my-plugin'
```

```js
// index.js —— Host 侧
export function apply(ctx, config) {
  // 所有注册都放这里，并用 ctx.effect 持有清理函数
}

export const inject = ['tools']            // 可选：缺失时插件保持 inactive
export const Config = { /* schema */ }     // 可选：校验 patch 里的 config
```

```js
// client.js —— 浏览器侧
window.__ModuleLoader__.load({
  id: '@local/my-plugin',                  // 必须等于包名
  factory(require) {
    const React = require('react')
    const h = React.createElement
    function Panel() { return h('div', null, 'hello') }
    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main', id: 'my-plugin', order: 10,
        }, Panel))
      },
    }
  },
})
```

目录约定：

```text
my-plugin/
  package.json
  cordis.patch.yml
  index.js
  client.js
  locale/en.json
  locale/zh.json
  icon.svg
  docs/DETAIL.md
```

`locale/*.json` 里的 `meta.title` / `meta.description` 决定插件管理里显示什么；`icon.svg` 决定图标长什么样。**这两样不是可选项**——插件列表里不能只有一个裸包名和默认图。

## 4. Host 侧规则

- **导出形式二选一**：`apply(ctx, config)` 函数，或默认导出一个服务类；不要混用。
- **注册即 effect**：定时器、监听、工具、服务提供都用 `ctx.effect(() => ..., 'label')` 包起来并返回清理函数。卸载插件时 DSH 才能干净回收。
- **可选依赖放 `inject`**：`export const inject = ['tools']` 或 `ctx.inject(['typert', 'tools'], inner => {...})`。服务不存在时插件应该不激活，而不是抛异常。
- **服务与 RPC**：服务用 `ctx.provide(key, instance)` 暴露；Typert 描述符声明参数与返回结构，Client 通过 `/api` 调用。服务键是全局的，起名带前缀，别用 `notes`、`data` 这种通用词。
- **与 Agent 共用实现**：工具和 UI 都调用同一个服务方法。不要为工具另写一份逻辑，否则两边行为很快分叉。
- **配置进 Config**：可调参数放 `Config` schema，用户在 `cordis.patch.yml` 里改。不要读写 profile 的配置文件。
- **长任务要能收尾**：分块、超时、重试、部分成功落盘，并提供取消入口。一次 5 分钟的请求失败后什么都不该留下。
- **模型输出一律当数据**：JSON 解析失败要能降级；字段做白名单与长度限制；不要让模型文本拼进路径、命令或 HTML。

## 5. Client 侧规则

- **工厂无副作用**：`factory()` 里只定义组件和常量，不请求数据、不改 DOM。数据请求放 `apply` 或组件 `useEffect`。
- **样式要在卸载时消失**：用 `ctx.effect` 注入 `<style>` 并在清理函数里 `remove()`，或把局部样式渲染成 React 元素。
- **只用主题变量**：`--dsw-alias-*`。字面色在深色主题下必然出问题，只有插件自绘的插画/图标可以用固定颜色。
- **文案走 locale**：`ctx.locale.register(ns, { en, zh })` + `ctx.locale.bind(ns)`；中英 key 数量保持一致（本仓库用 `check-locale.mjs` 卡这条）。
- **不要 require 其他 DSH Client 包**：它们没有稳定契约。需要按钮、开关、弹窗时，抄宿主组件的 markup 与行为（焦点、Escape、`role="switch"`），并把自己的 class 加前缀。
- **组件抛错会让整个 slot 空白**：console 里是 `slot entry crashed in '<slot>'`。给关键子树加错误边界，或至少让失败可解释。
- **不要替换应用根、不要往 `document.body` 追加第二个应用**；一切通过 slot 和 `ctx.effect`。

### 整页浮层的定位

`position: fixed; inset: 0` 会盖住 DSH 顶栏和侧栏。正确做法是把浮层锚定到插件页面自己的矩形：

```js
const rect = pageRef.current.getBoundingClientRect()
// 浮层 root：position fixed，top/left/width/height 取 rect
// 监听 window.resize + ResizeObserver 重算
```

这样顶栏、侧栏、主题都保持可见，用户不会觉得你的页面“接管了应用”。

### 关闭控件只留一个

同一个浮层里同时放“返回”和“小叉”，用户会犹豫点哪个。留一个带文字的关闭入口（外加 Escape），删掉重复的图标按钮，连对应的 CSS 一起删。

## 6. UI ↔ Host 契约（最容易出错的地方）

Client 通过认证连接调用 Host：

```js
const envelope = await connection.rpc.call('/api', 'svc/method', { args })
// envelope.ok ? envelope.value : envelope.error
```

三条硬规则，本仓库都踩过：

1. **参数逐字段匹配**：Typert 描述符声明的字段必须与 `args` 完全一致，多一个少一个都会报 `args fields do not match the descriptor`。
2. **零参方法不要声明参数**：描述符里写 `parameters: []`，Client 传 `{}`，Host 侧方法自己取默认值。不要“声明一个 date 但调用时不传”。
3. **`undefined` 会被丢弃**：`{ date: undefined }` 到 Host 就变成缺字段。要么给默认值，要么拆成两个方法。

其它约定：

- 所有 RPC 调用集中到一个 `api` 包装对象里，不要散落在组件中。
- Host 返回 `{ ok, value }` / `{ ok: false, error }`，Client 把 `error.message` 和 `error.code` 分开处理：可重试的错误给重试按钮，参数错误直接显示文案。
- 改字段名时同时改三处：Host 方法、描述符、Client 包装；用一条 smoke 测试固定住。

## 7. 数据与持久化

- 路径：`%DSH_HOME%/<plugin-id>/`（`DSH_HOME` 未设置时是 `~/.dsh`）。
- **原子写**：写临时文件再 `rename`，中途崩溃不会留下半个 JSON。
- **损坏可恢复**：解析失败时把原文件备份成 `*.corrupt-<时间>`，用空状态继续，而不是让插件起不来。
- **版本字段 + 迁移**：`storeVersion` 写进文件，读旧版本时逐级升级；不要假设用户永远用最新版。
- **自动备份**：每次写保留一份按天的快照，轮转清理旧文件。
- **导出/导入**：用户换机器时这是唯一退路，导出要包含全部状态，导入要能去重。
- 大文件、内置素材放包里（`files` 里声明），用户数据放 `%DSH_HOME%`。

## 8. 测试：不启动 DSH 也能测大半

本仓库的测试全部是普通 Node 脚本，跑 `node test-*.mjs` 即可：

- **Host 纯函数单测**：`index.js` 末尾 `export const __internals = { ... }` 导出解析、归一化、调度、SRS 等纯函数，测试直接 import。
- **组件渲染测试**：`client.js` 在非浏览器环境导出 `__Component`，测试用一个极小的假 React（`h()` 返回树、`useState` 返回初值、`useEffect` 收集回调）把它渲染成字符串或树再断言。
- **结构检查**：描述符数量与参数、locale key 对齐、CSS 是否出现字面色、布局常量、`package.json` 的 `files` 是否漏文件。
- **回归**：每个 bug 先写一条会失败的断言，再修；发布前跑全套。

真实环境仍需人工验证：新会话里打开页面、点击主路径、重启一次确认 Host 状态恢复。**没看到的不要写成已验证。**

## 9. 安装、刷新与验证

- 开发期用 `link:` 装进 profile，或 **Plugins → Add plugin** 选择本地目录。
- 走 `plugin_manager install_bundle` 时，以返回的 `application` 为准，不要靠日志或进程列表推断。
- **Host 改动必须完整重启 DSH**；Client 改动需要插件 bundle 重新加载。只刷新页面不一定够。
- 安装后检查：插件行是否 enabled、`skippedBundles` 是否为空、标题/图标是否为自己的、页面能否打开。
- 改完记得恢复测试时改动的用户状态。

## 10. 版本与发布

- 语义化版本：修 bug 打 patch，新功能打 minor，破坏数据结构打 major。
- 每次发版同步：`package.json` 版本、`CHANGELOG.md`、git tag、README 的状态段落。
- 发布到 npm 与自建市场索引的完整流程见 [`PUBLISHING.md`](../PUBLISHING.md)。

## 11. 故障速查

| 现象 | 常见原因 | 处理 |
| --- | --- | --- |
| slot 一片空白 | 组件抛错、依赖服务缺失 | 看 console 的 `slot entry crashed`，加错误边界 |
| `args fields do not match the descriptor` | 描述符与调用参数不一致 | 对齐字段；零参方法不声明参数 |
| 页面盖住 DSH 顶栏/侧栏 | 浮层用了 `inset: 0` | 锚定到插件页面矩形 |
| 深色主题下颜色错乱 | 写了字面色 | 换 `--dsw-alias-*` 变量 |
| 插件行 disabled | patch 未被选中、config 校验失败、inject 的服务不存在 | 查 bundle 状态与安装返回 |
| 改完代码没生效 | Host 未重启 / HMR 只覆盖 Client | 完整重启 DSH |
| 数据变成空 | 非原子写、无备份、迁移缺失 | 原子写 + 每日备份 + 版本字段 |
| 模型输出解析失败 | 没做 JSON 校验与降级 | 解析失败回退本地逻辑，保留原始响应便于排查 |

## 12. 上线前检查清单

- [ ] 落点正确：用户在哪里看到、Agent 怎么用到
- [ ] `package.json` 的 `dsh.bundle.patch`、`exports`、`files` 齐全
- [ ] Host 所有注册都有 `ctx.effect` 清理
- [ ] 可选服务放 `inject`，缺失时插件不崩
- [ ] RPC 描述符与 Client 调用逐字段一致，零参方法无参数
- [ ] 数据原子写、有备份、有版本号与迁移
- [ ] Client 只用主题变量与 locale 文案，中英 key 对齐
- [ ] 浮层不遮挡 DSH chrome，关闭入口只有一个
- [ ] `node --check` 通过，全部测试脚本通过
- [ ] 插件标题、描述、图标、详情页都是自己的内容
- [ ] 安装后在新会话里人工走一遍主路径，并重启验证
- [ ] 版本号、CHANGELOG、tag 同步
