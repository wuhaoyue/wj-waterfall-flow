# 🧪 Waterfall Flow 组件测试

这个目录包含了各个框架的测试项目，用于验证 `wj-waterfall-flow` 组件在不同环境下的兼容性。

## 📦 测试项目列表

### ✅ 已完成
- **Vue 2** - 端口 5182 (JavaScript)
- **Vue 3** - 端口 5180 (TypeScript)
- **React** - 端口 5181 (TypeScript)
- **Nuxt 3 (SSR)** - 端口 3003 (TypeScript)

### 📝 说明
- Vue 2 使用 JavaScript（无 TypeScript 支持）
- 其他框架均使用 TypeScript

---

## 🚀 快速开始

### 安装所有依赖

```bash
# 在项目根目录
npm run test:install
```

或手动安装：

```bash
cd tests/vue2 && npm install
cd ../vue3 && npm install
cd ../react && npm install
cd ../nuxt3 && npm install
```

### 启动测试

#### 方式一：启动单个测试项目

```bash
# Vue 2
cd tests/vue2 && npm run dev

# Vue 3
cd tests/vue3 && npm run dev

# React
cd tests/react && npm run dev

# Nuxt 3
cd tests/nuxt3 && npm run dev
```

#### 方式二：使用启动脚本（推荐）

```bash
# 在项目根目录
npm run test:vue2
npm run test:vue3
npm run test:react
npm run test:nuxt3
```

---

## 📋 测试清单

每个测试项目应验证以下功能：

### ✅ 基本功能
- [ ] 组件正确加载
- [ ] 瀑布流布局正确显示
- [ ] 响应式列数计算正确
- [ ] 图片懒加载生效

### ✅ 事件监听
- [ ] `@load-more` 事件正常触发
- [ ] `event.detail` 包含正确的数据
- [ ] `finishLoading()` 回调正常工作
- [ ] 无限滚动持续加载

### ✅ 配置属性
- [ ] `row-gap` 属性生效
- [ ] `column-gap` 属性生效
- [ ] `min-column-width` 属性生效
- [ ] 动态修改属性正常工作

### ✅ 方法调用
- [ ] `clear()` 方法清空项目
- [ ] `relayout()` 方法重新布局
- [ ] `finishLoading(false)` 停止加载

### ✅ SSR 支持（仅 Nuxt）
- [ ] 服务端渲染不报错
- [ ] 客户端激活正常
- [ ] `<ClientOnly>` 包装正常工作
- [ ] 无 `HTMLElement is not defined` 错误

### ✅ 性能
- [ ] 大量数据（100+ 项）流畅
- [ ] 快速滚动无卡顿
- [ ] 内存占用正常

---

## 🐛 常见问题

### Vue 3

**问题**: `@load-more` 不触发
```vue
<!-- ❌ 错误 -->
<waterfall-flow @loadMore="handler">

<!-- ✅ 正确 -->
<waterfall-flow @load-more="handler">
```

### React

**问题**: 事件监听器无效
```jsx
// ❌ 错误 - 未清理监听器
useEffect(() => {
  waterfall.addEventListener('load-more', handler);
}, []);

// ✅ 正确 - 清理监听器
useEffect(() => {
  waterfall.addEventListener('load-more', handler);
  return () => waterfall.removeEventListener('load-more', handler);
}, []);
```

### Nuxt 3/4

**问题**: `HTMLElement is not defined`
```vue
<!-- ❌ 错误 - 未使用 ClientOnly -->
<waterfall-flow>...</waterfall-flow>

<!-- ✅ 正确 - 使用 ClientOnly -->
<ClientOnly>
  <waterfall-flow>...</waterfall-flow>
</ClientOnly>
```

---

## 📊 测试结果

### Vue 3
- ✅ 基本功能
- ✅ 事件监听
- ✅ 配置属性
- ✅ 方法调用
- ✅ 性能

### React
- ✅ 基本功能
- ✅ 事件监听
- ✅ 配置属性
- ✅ 方法调用
- ✅ 性能

### Nuxt 3
- ✅ 基本功能
- ✅ 事件监听
- ✅ 配置属性
- ✅ 方法调用
- ✅ SSR 支持
- ✅ 性能

---

## 🎯 发布前检查

在发布新版本前，请确保：

1. ✅ 所有测试项目都能正常运行
2. ✅ 所有功能测试通过
3. ✅ 无控制台错误或警告
4. ✅ SSR 测试正常（Nuxt）
5. ✅ 文档已更新
6. ✅ 版本号已更新
7. ✅ CHANGELOG 已更新

---

## 📝 添加新测试

要添加新框架的测试：

1. 在 `tests/` 下创建新目录
2. 添加 `package.json` 和框架配置
3. 创建测试页面/组件
4. 在 `package.json` 添加快捷脚本
5. 更新此 README

---

## 💡 提示

- 使用浏览器控制台查看事件触发日志
- 测试时注意检查网络面板的图片加载
- SSR 测试建议查看页面源代码
- 性能测试可使用浏览器 Performance 工具

---

祝测试顺利！🎉

