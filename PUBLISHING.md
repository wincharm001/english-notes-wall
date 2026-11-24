# 发布方案（English Notes Wall）

当前仓库仍是本地开发形态：包名 `dsh-english-notes-wall`、`private: true`、通过 `link:` 装进 desktop profile。下面是把它发布为公开 DSH 插件的完整方案。

> 结论先说：DSH 没有“官方插件市场”的提交入口，官方 catalog 编译在发行版里。第三方发布 = **npm 包 + 自己生成市场索引 `index.json` + HTTPS 静态托管**；用户把索引 URL 加到 Discover 后即可安装。因此发布分成“npm 发布”和“索引发布”两条独立流水线。

## 1. 发布前要做的改名

包名必须换成自己的 npm 作用域或未被占用的无作用域名。建议先查：

```bash
npm view dsh-english-notes-wall version   # 404 表示可用
```

确认后，**四处必须同步改**：

| 文件 | 位置 | 说明 |
| --- | --- | --- |
| `english-notes-wall/package.json` | `name` | 新包名 |
| `english-notes-wall/index.js` | `const PACKAGE` | Host typert 注册使用的包名 |
| `english-notes-wall/client.js` | `window.__ModuleLoader__.load({ id })` | **必须等于包名**，否则 Client 不激活 |
| `english-notes-wall/cordis.patch.yml` | `name` | Loader 安装的包名 |

改完执行 `grep -R "dsh-english-notes-wall" .` 确认无残留。数据目录 `%DSH_HOME%/english-notes-wall/` 不需要迁移。

## 2. package.json 发布字段

在现有基础上补齐：

```jsonc
{
  "name": "dsh-english-notes-wall",          // 或 @your-scope/english-notes-wall
  "version": "1.11.0",
  "description": "English learning sticky-note wall ...",
  "type": "module",
  "license": "MIT",                          // 需先确定许可证
  "author": "your name",
  "homepage": "https://github.com/you/english-notes-wall#readme",
  "repository": { "type": "git", "url": "git+https://github.com/you/english-notes-wall.git" },
  "bugs": { "url": "https://github.com/you/english-notes-wall/issues" },
  "keywords": ["dsh-plugin", "dsh", "english", "notes"],
  "exports": {
    ".": "./index.js",
    "./client": "./client.js",
    "./locale/*.json": "./locale/*.json",
    "./icon": "./icon.svg",
    "./package.json": "./package.json"
  },
  "files": [
    "index.js", "client.js", "cordis.patch.yml",
    "locale/*.json", "icon.svg", "README.md"
  ],
  "engines": {
    "node": ">=24.9.0",
    "dsh": ">=0.2.2-rc.1 <0.3.0-0"
  },
  "peerDependencies": { "@deepseek-ai/cordis": "~4.1.0" },
  "publishConfig": { "access": "public" },
  "dsh": {
    "manifestVersion": 1,
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "platform": "web",
      "immediately": true,
      "inject": [
        "@deepseek-ai/dsh-client-connection",
        "@deepseek-ai/dsh-client-locale",
        "@deepseek-ai/dsh-client-ui-renderer"
      ]
    }
  }
}
```

要点：

- 删除 `private: true`，否则 `npm publish` 和索引生成器都会跳过。
- `engines.dsh` 一旦声明，DSH 会忽略 peer 里的 dsh 范围；范围要保守，升级 DSH 后重新验证。
- 保留 `files` 白名单，`link:` 安装不会帮你发现漏文件，只有 registry 安装才会。
- 版本号遵循 SemVer；每次发布同步 `CHANGELOG.md` 和 git tag。

## 3. npm 发布

```bash
cd english-notes-wall
npm pack --dry-run          # 核对 tarball 包含 index.js/client.js/patch/locale/icon/README
npm publish --access public # scoped 包需要；无作用域包也可加
npm view dsh-english-notes-wall@1.11.0 dist.tarball
```

发布前跑完整测试：

```bash
node --check index.js
node --check client.js
for f in ../check-*.mjs ../test-*.mjs; do node "$f" || break; done
```

`npm pack --dry-run` 之后建议用 `tar -tzf` 再核对一次文件列表。

## 4. 市场索引

索引是一个 JSON 文件（format 1）。最小示例：

```json
{
  "format": 1,
  "title": { "en": "English Notes Wall", "zh": "英语便利贴墙" },
  "description": { "en": "English learning sticky-note wall.", "zh": "英语学习便利贴墙。" },
  "plugins": [
    {
      "name": "dsh-english-notes-wall",
      "title": { "en": "English Notes Wall", "zh": "英语便利贴墙" },
      "description": { "en": "English learning sticky-note wall.", "zh": "英语学习便利贴墙。" },
      "versions": [
        {
          "version": "1.11.0",
          "publishTimestamp": 1762500000,
          "source": { "type": "npm" },
          "engines": { "dsh": ">=0.2.2-rc.1 <0.3.0-0" }
        }
      ]
    }
  ]
}
```

注意：

- `publishTimestamp` 是 **Unix 秒**，毫秒会被校验器拒绝。
- `title` 是本地化对象，必须含 `en`。
- 每个 version 必须带精确 `version` 和 `engines.dsh`。
- 索引里任何一条不合法，整份索引都会被拒绝；错误会带 JSON 路径。
- 托管必须直接返回 200，**不能 301/302 重定向**；GitHub Pages、Cloudflare Pages、对象存储静态站点都可以。
- 图标如需索引级图标，放在 `index.json` 同级的 `icons/` 下并使用相对路径；包内 `icon.svg` 必须 ≤ 256 KiB。

生成方式二选一：

1. 官方生成器（如果本地 checkout 带 `apps/plugin-market-generator`）：

```bash
printf 'dsh-english-notes-wall\n' > plugins.txt
pnpm --filter @deepseek-ai/dsh-plugin-market-generator start \
  --input plugins.txt --output site/index.json \
  --title "English Notes Wall"
```

2. 手写上例的 `index.json`，放到 `site/` 后部署。

## 5. 用户如何安装

用户侧有两种方式：

1. **Discover**：设置 → 插件 → Discover → 添加索引源，填入 `https://your.site/index.json`，找到条目后 Install。
2. **直接安装**：`plugin_manager install_bundle(target="dsh-english-notes-wall@1.11.0")`（Desktop profile 用桌面 UI 或 `plugin_manager`，CLI 可能拒绝管理 desktop profile）。

索引有缓存（约 10 分钟），发布后用户可能短时间看不到新版本；重启 DSH 可强制刷新。

## 6. 从 link 迁移到 registry

当前 desktop profile 里是：

```json
"dsh-english-notes-wall": "link:E:/DSH_WorkSpace/English_Notes_Wall/english-notes-wall"
```

发布后不要直接覆盖安装，HMR 会报 `already-installed`。正确顺序：

1. 在插件管理里移除 link 版本；
2. 重启 DSH（避免 `package-moved`）；
3. 安装 `dsh-english-notes-wall@1.11.0`；
4. 确认 `skippedBundles` 为空、面板正常、`english_notes` 工具可用；
5. 数据目录不变，历史便利贴继续可用。

## 7. CI 与版本管理

建议仓库根放一个最小 CI：

```yaml
name: ci
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: node --check english-notes-wall/index.js
      - run: node --check english-notes-wall/client.js
      - run: for f in check-*.mjs test-*.mjs; do node "$f"; done
```

发布流程：

1. 更新 `package.json` 版本与 `CHANGELOG.md`；
2. 全量测试通过；
3. `git tag v1.11.0 && git push --tags`；
4. `npm publish`；
5. 重新生成并部署 `index.json`；
6. 用一个干净 profile 从索引安装并做 UI 冒烟（添加、拓展、测验、导出、重启）。

## 8. 风险与待定项

- **包名/许可证/仓库地址**需要你先定：用无作用域 `dsh-english-notes-wall` 还是自有 scope；许可证建议 MIT，但需你确认。
- **内部 API 依赖**：Host 使用 `ctx.inject(['typert','tools'])` 和 `typert.register`，属于较内部的契约；DSH 升级可能破坏，`engines.dsh` 要保守。
- **服务键**：`englishNotes` 是全局 Cordis 服务键，公开前可考虑加前缀（会牵动客户端 RPC 与工具，改动较大，可留到正式发布前）。
- **安全**：索引没有签名，安装的代码以用户权限运行；不要在校验/构建脚本里做网络请求或写用户目录之外的文件。
- **体积**：长难句分析会让 `store.json` 变大；已有每日备份与导出，后续可考虑 `MAX_DAILY_QUIZZES` 和旧 quiz 的清理策略。
- **隐私**：JSON 导出包含设置和全部笔记，分享前提醒用户检查内容。

## 9. 发布检查清单

- [ ] 确定包名、许可证、仓库地址
- [ ] 四处包名同步，`grep @local` 无残留
- [ ] 补齐 manifest：去 `private`、`engines`、`peerDependencies`、`files`、`exports`
- [ ] `node --check` + 全部测试通过
- [ ] `npm pack --dry-run` 与 `tar -tzf` 核对文件
- [ ] `npm publish --access public`，`npm view` 验证
- [ ] 生成 `index.json`，HTTPS 托管无重定向，`curl -I` 200
- [ ] 干净 profile 从索引安装，确认 bundle 启用、无 `skippedBundles`
- [ ] UI 冒烟：添加、拓展、长难句练习、朗读、测验、SRS、导出/导入、备份、重启
- [ ] 写 release notes，打 tag，更新 README 安装说明
