# 🧪 快速测试

## 1️⃣ 安装依赖（首次）

```bash
npm run test:install
```

等待所有测试项目的依赖安装完成（Vue 2, Vue 3, React, Nuxt 3）。

---

## 2️⃣ 启动测试

在**4个不同的终端窗口**中运行：

### 终端 1 - Vue 2
```bash
npm run test:vue2
```
访问: http://localhost:5182

### 终端 2 - Vue 3 (TypeScript)
```bash
npm run test:vue3
```
访问: http://localhost:5180

### 终端 3 - React (TypeScript)
```bash
npm run test:react
```
访问: http://localhost:5181

### 终端 4 - Nuxt 3 SSR (TypeScript)
```bash
npm run test:nuxt3
```
访问: http://localhost:3003

---

## 3️⃣ 测试要点

### 在每个页面中测试：

✅ **基本功能**
- 瀑布流布局正常
- 图片正常加载

✅ **无限滚动**
- 滚动到底部自动加载
- 连续加载 5 页以上
- 查看控制台日志

✅ **动态配置**
- 修改行间距
- 修改列间距
- 修改最小列宽

✅ **方法调用**
- 点击"清空"按钮
- 点击"手动添加"按钮

✅ **SSR（仅 Nuxt 3）**
- 右键 -> 查看网页源代码
- 应该看到服务端渲染的 HTML
- 无 `HTMLElement is not defined` 错误

---

## 4️⃣ 常见问题

**Q: 加载 2 页后停止？**
A: 检查控制台日志，确保 `finishLoading(true)` 被正确调用

**Q: 事件不触发？**
A: Vue 使用 `@load-more`，React 检查 `useEffect` 清理函数

**Q: Nuxt 报 SSR 错误？**
A: 确保使用了 `<ClientOnly>` 包装组件

---

## 5️⃣ 测试通过标准

- [x] 所有测试项目正常运行
- [x] 无控制台错误
- [x] 无限滚动持续工作
- [x] SSR 测试正常（Nuxt）
- [x] 性能流畅（60+ 项目）

全部通过后即可发布！🚀

---

详细测试指南: [测试指南.md](./测试指南.md)

