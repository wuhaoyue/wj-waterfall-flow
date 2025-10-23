# 📦 发布到 npm 指南

## 准备工作

### 1. 更新包名称

在 `package.json` 中修改包名称：

```json
{
  "name": "@your-npm-username/waterfall-flow"
}
```

或者使用非 scoped 名称：

```json
{
  "name": "waterfall-flow-component"
}
```

### 2. 更新作者信息

```json
{
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/waterfall-flow.git"
  }
}
```

### 3. 更新 README.md

将 README.md 中所有的 `@yourname/waterfall-flow` 替换为你的实际包名。

## 发布步骤

### 1. 登录 npm

```bash
npm login
```

### 2. 构建项目

```bash
npm run build
```

### 3. 测试构建产物

```bash
# 本地测试打包
npm pack

# 这会生成一个 .tgz 文件，你可以在其他项目中测试安装：
# npm install /path/to/your-package-1.0.0.tgz
```

### 4. 发布

```bash
# 首次发布
npm publish --access public

# 如果是 scoped package (@username/package-name)
npm publish --access public
```

### 5. 后续版本更新

```bash
# 更新补丁版本 (1.0.0 -> 1.0.1)
npm version patch

# 更新次要版本 (1.0.0 -> 1.1.0)
npm version minor

# 更新主要版本 (1.0.0 -> 2.0.0)
npm version major

# 发布新版本
npm publish
```

## 版本管理建议

遵循语义化版本 (Semantic Versioning):

- **MAJOR** (主版本): 不兼容的 API 变更
- **MINOR** (次版本): 向后兼容的功能新增
- **PATCH** (补丁版本): 向后兼容的问题修复

## 发布前检查清单

- [ ] 更新了 `package.json` 中的包名和作者信息
- [ ] 更新了 `README.md` 中的包名
- [ ] 更新了 `LICENSE` 中的版权信息
- [ ] 运行 `npm run type-check` 无错误
- [ ] 运行 `npm run build` 成功
- [ ] 测试了示例页面 (`npm run dev`)
- [ ] 更新了版本号
- [ ] 添加了 git tag (如果使用 git)

## 撤销发布

如果发布后 24 小时内发现问题，可以撤销：

```bash
npm unpublish <package-name>@<version>
```

**注意**: 撤销发布会影响已经使用该版本的用户，谨慎使用。

## 发布到 GitHub Packages

如果想发布到 GitHub Packages：

1. 在 `package.json` 中添加：

```json
{
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

2. 创建 `.npmrc` 文件：

```
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
@your-username:registry=https://npm.pkg.github.com
```

3. 发布：

```bash
npm publish
```

## 持续集成 (CI/CD)

可以使用 GitHub Actions 自动发布：

创建 `.github/workflows/publish.yml`:

```yaml
name: Publish Package

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm install
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 常见问题

### Q: 包名已被占用？

**A**: 尝试使用 scoped package (`@username/package-name`) 或更改包名。

### Q: 发布失败提示权限错误？

**A**: 确保已登录 npm (`npm login`) 并且账户有发布权限。

### Q: 如何测试包是否正常工作？

**A**: 
1. 使用 `npm pack` 生成本地包
2. 在测试项目中 `npm install ./your-package-1.0.0.tgz`
3. 测试所有功能

### Q: 如何让包支持 CDN 引入？

**A**: 发布后，用户可以通过以下 CDN 使用：
- unpkg: `https://unpkg.com/wj-waterfall-flow`
- jsdelivr: `https://cdn.jsdelivr.net/npm/wj-waterfall-flow`

