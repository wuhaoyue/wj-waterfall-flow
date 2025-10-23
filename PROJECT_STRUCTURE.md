# 📁 项目结构说明

## 目录结构

```
WebComponents/
├── src/                          # 源代码目录
│   ├── components/               # 组件目录
│   │   ├── WaterfallFlow.ts     # 主组件类
│   │   └── styles.ts            # 组件样式
│   ├── types/                   # 类型定义
│   │   └── index.ts             # TypeScript 类型定义
│   ├── utils/                   # 工具函数
│   │   └── helpers.ts           # 辅助函数（防抖、节流等）
│   └── index.ts                 # 入口文件
│
├── example/                     # 示例目录
│   └── index.html              # 使用示例
│
├── dist/                        # 构建输出目录（自动生成）
│   ├── waterfall-flow.js       # ES Module 格式
│   ├── waterfall-flow.umd.js   # UMD 格式（浏览器直接引入）
│   ├── index.d.ts              # TypeScript 类型声明
│   └── ...                     # 其他类型文件和 sourcemap
│
├── package.json                 # 项目配置
├── tsconfig.json               # TypeScript 配置（开发用）
├── tsconfig.build.json         # TypeScript 配置（构建用）
├── vite.config.ts              # Vite 打包配置
├── .gitignore                  # Git 忽略文件
├── .npmignore                  # npm 发布忽略文件
├── LICENSE                     # 开源协议
├── README.md                   # 项目说明
└── PUBLISH.md                  # 发布指南
```

## 核心文件说明

### src/index.ts
- 包的入口文件
- 注册自定义元素 `<waterfall-flow>`
- 导出所有类型和类

### src/components/WaterfallFlow.ts
- 核心组件实现
- 包含瀑布流布局逻辑
- 无限滚动、响应式调整等功能

### src/components/styles.ts
- Shadow DOM 样式
- 使用字符串模板导出 CSS

### src/types/index.ts
- TypeScript 类型定义
- 导出接口、类型别名等
- 为使用者提供类型支持

### src/utils/helpers.ts
- 工具函数集合
- 包含防抖、节流、尺寸解析等

## 构建配置

### package.json 重要字段

```json
{
  "type": "module",                    // 使用 ES Module
  "main": "./dist/waterfall-flow.umd.js",  // CommonJS 入口
  "module": "./dist/waterfall-flow.js",    // ES Module 入口
  "types": "./dist/index.d.ts",            // TypeScript 类型入口
  "exports": {                         // 现代导出定义
    ".": {
      "import": "./dist/waterfall-flow.js",
      "require": "./dist/waterfall-flow.umd.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

### vite.config.ts

- 配置库模式构建
- 输出 ES 和 UMD 两种格式
- 生成 sourcemap 便于调试
- 使用 esbuild 压缩

### tsconfig.json

- 开发时的 TypeScript 配置
- 设置 `noEmit: true`，不输出文件
- 用于类型检查和 IDE 支持

### tsconfig.build.json

- 构建时的 TypeScript 配置
- 仅生成类型声明文件（.d.ts）
- Vite 负责生成 JavaScript 文件

## 开发工作流

### 1. 开发模式

```bash
npm run dev
```

- 启动 Vite 开发服务器
- 自动打开 `example/index.html`
- 支持热更新

### 2. 类型检查

```bash
npm run type-check
```

- 运行 TypeScript 编译器检查类型
- 不生成文件，仅验证类型正确性

### 3. 构建

```bash
npm run build
```

执行顺序：
1. `npm run type-check` - 类型检查
2. `vite build` - 构建 JavaScript 文件
3. `tsc -p tsconfig.build.json` - 生成类型声明

### 4. 预览构建结果

```bash
npm run preview
```

- 预览构建后的生产版本

## 使用方式

### 1. 作为 npm 包使用

```bash
npm install wj-waterfall-flow
```

```javascript
import 'wj-waterfall-flow';

// 现在可以使用 <waterfall-flow> 标签了
```

### 2. 通过 CDN 使用

```html
<!-- ES Module -->
<script type="module">
  import 'https://unpkg.com/wj-waterfall-flow';
</script>

<!-- 或使用 UMD -->
<script src="https://unpkg.com/wj-waterfall-flow/dist/waterfall-flow.umd.js"></script>
```

### 3. TypeScript 支持

包含完整的类型定义，支持 TypeScript 项目：

```typescript
import { WaterfallFlow, LoadMoreCallback } from 'wj-waterfall-flow';

const loadMore: LoadMoreCallback = (component) => {
  // ...
};
```

## 发布流程

1. **更新版本号**
   ```bash
   npm version patch|minor|major
   ```

2. **构建**
   ```bash
   npm run build
   ```

3. **发布**
   ```bash
   npm publish --access public
   ```

详细说明请参考 [PUBLISH.md](./PUBLISH.md)

## 代码组织原则

1. **关注点分离**: 样式、逻辑、类型分离
2. **模块化**: 每个文件职责单一
3. **类型安全**: 完整的 TypeScript 支持
4. **可维护性**: 清晰的目录结构和命名
5. **文档完善**: README、注释、类型定义

## 技术栈

- **TypeScript** - 类型安全
- **Vite** - 快速构建
- **Web Components** - 原生 API
- **Shadow DOM** - 样式隔离
- **IntersectionObserver** - 性能优化

## 性能优化特性

- ✅ 防抖（debounce）: 减少频繁的布局计算
- ✅ 节流（throttle）: 限制事件处理频率
- ✅ requestAnimationFrame: 优化 DOM 操作
- ✅ 批量处理: 图片加载调整批量执行
- ✅ IntersectionObserver: 高效的滚动监听
- ✅ 懒加载: 支持图片 lazy loading

## 浏览器兼容性

- Chrome/Edge: ✅ 最新版本
- Firefox: ✅ 最新版本
- Safari: ✅ 最新版本
- IE11: ❌ 不支持（需要 Web Components polyfill）

对于老旧浏览器，可能需要：
- Web Components polyfill
- IntersectionObserver polyfill
- 其他 ES6+ 特性的 polyfill

