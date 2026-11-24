# 发布与维护手册

本仓库通过 **npm 包 + 自托管市场索引** 分发。DSH 没有第三方插件的官方提交入口，`Discover` 读取的就是这样一个 HTTPS 上的 `index.json`。

## 当前状态

| 项目 | 值 |
| --- | --- |
| npm 包 | [`dsh-english-notes-wall`](https://www.npmjs.com/package/dsh-english-notes-wall) |
| 最新版本 | `1.18.1`（2026-11-24 发布） |
| 仓库 | <https://github.com/wincharm001/english-notes-wall> |
| 市场索引 | `https://wincharm001.github.io/english-notes-wall/index.json`（GitHub Pages，源为 `main` 的 `/docs`） |
| 许可证 | MIT |

发布时 npm 另外留下了一个 `0.0.0-stage` 占位版本，它不是安装目标，索引生成器会跳过；72 小时内可以用 `npm unpublish dsh-english-notes-wall@0.0.0-stage` 清掉。

## 发版流程

1. **改版本**：更新 `english-notes-wall/package.json` 的 `version`。
2. **写记录**：在 `CHANGELOG.md` 顶部加一段，说明本次改动。
3. **跑测试**：

   ```bash
   node --check english-notes-wall/index.js
   node --check english-notes-wall/client.js
   for f in check-*.mjs test-*.mjs; do node "$f" || break; done
   ```

4. **核对打包内容**：

   ```bash
   cd english-notes-wall
   npm pack --dry-run --json --cache ../.npm-cache
   ```

   `files` 白名单里的文件必须齐全（`index.js`、`client.js`、`cordis.patch.yml`、`essays`、`locale`、`icon.svg`、`README.md`、`LICENSE`）。

5. **提交并打 tag**：

   ```bash
   git commit -am "chore(release): <version>"
   git tag -a v<version> -m "<version>"
   git push origin main --tags
   ```

6. **发布到 npm**：

   ```bash
   cd english-notes-wall
   npm publish --registry https://registry.npmjs.org
   ```

   终端会要 2FA 验证码。发布前确认 npm 上还没有这个版本号，已发布的版本不能被覆盖。

7. **重建市场索引**：

   ```bash
   node scripts/make-market-index.mjs
   git add docs/index.json docs/icon.svg
   git commit -m "chore: update the market index"
   git push
   ```

   脚本从 npm registry 读取**已发布**的版本和真实发布时间，所以必须在发布之后运行；它会跳过 `0.0.0-*` 占位版本。

8. **验证**：`npm view dsh-english-notes-wall version` 与仓库 tag 一致；索引地址返回 200 且没有重定向。

## npm 认证与 2FA

npm 现在要求发布操作使用 2FA 或带 “bypass 2FA” 的 granular access token。三种可行方式：

- **交互式 OTP**：`npm publish` 时按提示输入认证器验证码。最简单，但每次发版都要手动输入。
- **带 bypass 2FA 的 granular token**：在 npmjs.com 的 Access Tokens 里生成，勾选 bypass 2FA，然后写进 `~/.npmrc`：

  ```ini
  //registry.npmjs.org/:_authToken=<token>
  ```

  适合本地频繁发布，token 不要提交进仓库。

- **GitHub Actions**：把 token 存成仓库 secret `NPM_TOKEN`，在 CI 里 `npm publish`。无需本地登录，但要在仓库设置里配置 secret。

本机的 npm registry 默认是 npmmirror 镜像，**发布时始终显式传 `--registry https://registry.npmjs.org`**；镜像只用于安装加速，不能接收发布。

## 市场索引

索引格式为 format 1，由 `scripts/make-market-index.mjs` 生成。校验规则（DSH `@deepseek-ai/dsh-plugin-market-index`）：

- 顶层必须有 `format: 1` 和 `title`；`title`/`description` 可以是字符串，或按语言 id 的对象，且必须包含 `en`。
- 每个插件需要合法的 npm 包名和**非空**的 `versions`；版本号必须是精确 SemVer，不能重复。
- `publishTimestamp` 是 **Unix 秒**（不是毫秒），要求是小于 `10^11` 的整数。
- `source` 只能是 `{ "type": "npm", "registry"?: "..." }` 或 `{ "type": "git", "url", "commit", "path"? }`。
- `engines.dsh` 是可选的 SemVer 范围；声明后 DSH 安装时会做版本检查。
- `icon` 可以是同源的相对路径、任意 https URL，或不超过 32 KiB 的 `data:` URL。
- 索引必须能直接返回 200，**不能有 301/302 重定向**；GitHub Pages、Cloudflare Pages、对象存储都可以。

GitHub Pages 设置：仓库 **Settings → Pages → Deploy from a branch → main → `/docs`**。推送后通常一两分钟内生效。

## 用户如何安装

1. **Discover**：设置 → 插件 → Discover → 添加索引源 `https://wincharm001.github.io/english-notes-wall/index.json`，找到条目后 Install。
2. **按包名安装**：在插件页面安装 `dsh-english-notes-wall@<version>`。

安装完成后需要完整重启一次 DSH。索引有缓存（约十分钟），新版本可能延迟出现，重启可强制刷新。

## 从本地 link 迁移到 registry

开发期 desktop profile 里是：

```json
"@local/english-notes-wall": "link:E:/DSH_WorkSpace/English_Notes_Wall/english-notes-wall"
```

包名已改为 `dsh-english-notes-wall`，旧 link 条目不再对应任何包。迁移顺序：

1. 在插件管理里移除 link 版本（或从 profile 的 `package.json` 与 bundle 列表里删掉 `@local/english-notes-wall`）；
2. 完整重启 DSH，避免残留的 `package-moved`；
3. 安装 `dsh-english-notes-wall@1.18.1`；
4. 确认插件行启用、没有 `skippedBundles`；
5. 数据目录不变，`%DSH_HOME%/english-notes-wall/` 里的笔记和范文进度继续可用。

## 撤包与回滚

- npm 只允许在发布后 **72 小时**内 unpublish；超过之后用 `npm deprecate` 标记，而不是删除。
- 回滚版本时：发布一个更高的补丁版本，或在索引里只保留正常版本（生成器按 npm 实际版本生成，不会造出不存在的版本）。
- 索引写错时整份索引会被 DSH 拒绝，错误信息会带 JSON 路径，按路径修即可。

## 发布检查清单

- [ ] `package.json` 版本、`CHANGELOG.md`、git tag 三者一致
- [ ] `node --check` 与全部测试通过
- [ ] `npm pack --dry-run` 的文件列表包含 Host、Client、patch、范文、locale、图标、README、LICENSE
- [ ] `npm publish --registry https://registry.npmjs.org` 成功，`npm view` 能查到
- [ ] `node scripts/make-market-index.mjs` 重建索引并推送
- [ ] 索引 URL 返回 200、无重定向，`icon` 能访问
- [ ] 干净 profile 从索引安装后能打开页面、完成一次核心操作
