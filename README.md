# 🌊 Waterfall Flow Web Component

一个高性能、响应式的瀑布流布局 Web Component，支持无限滚动、自适应列数、灵活配置间距等特性。

## ✨ 特性

- 🎨 **纯 Web Components** - 无框架依赖，可在任何项目中使用
- 📱 **响应式布局** - 自动根据容器宽度调整列数
- ♾️ **无限滚动** - 基于 IntersectionObserver 的性能优化加载
- 🎯 **灵活配置** - 支持自定义行间距、列间距、最小列宽等
- 🚀 **高性能** - 防抖、节流优化，批量处理布局更新
- 📦 **TypeScript 支持** - 完整的类型定义
- 🎭 **自定义样式** - 支持自定义 loading 状态
- 🖼️ **图片优化** - 智能处理图片加载，支持已知/未知尺寸场景

## 📦 安装

```bash
npm install wj-waterfall-flow
```

或使用 yarn:

```bash
yarn add wj-waterfall-flow
```

或使用 pnpm:

```bash
pnpm add wj-waterfall-flow
```

## 🚀 快速开始

### 在原生 HTML 中使用

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import 'wj-waterfall-flow';
  </script>
</head>
<body>
  <waterfall-flow 
    row-gap="10" 
    column-gap="10" 
    min-column-width="200"
    onLoadMore="loadMore">
    
    <div class="waterfall-item">
      <img src="image1.jpg" alt="Item 1">
      <div class="content">内容 1</div>
    </div>
    
    <!-- 自定义 loading -->
    <div slot="loading">
      <div class="spinner">Loading...</div>
    </div>
  </waterfall-flow>

  <script>
    // 加载更多回调
    function loadMore(component) {
      // 模拟异步加载
      setTimeout(() => {
        // 添加新项目
        const item = document.createElement('div');
        item.className = 'waterfall-item';
        item.innerHTML = '<img src="new-image.jpg">';
        component.appendChild(item);
        
        // 完成加载，hasMore = true 表示还有更多数据
        component.finishLoading(true);
      }, 1000);
    }
  </script>
</body>
</html>
```

### 在 Vue 3 中使用

```vue
<template>
  <waterfall-flow
    :row-gap="10"
    :column-gap="10"
    :min-column-width="200"
    onLoadMore="loadMore"
    ref="waterfallRef"
  >
    <div 
      v-for="item in items" 
      :key="item.id" 
      class="waterfall-item"
    >
      <img :src="item.image" :alt="item.title">
      <div class="content">{{ item.title }}</div>
    </div>

    <template #loading>
      <div class="loading">加载中...</div>
    </template>
  </waterfall-flow>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import 'wj-waterfall-flow';

const items = ref([]);
const waterfallRef = ref(null);

// 挂载全局回调
onMounted(() => {
  window.loadMore = (component) => {
    fetchMoreItems().then(newItems => {
      items.value.push(...newItems);
      component.finishLoading(newItems.length > 0);
    });
  };
});
</script>
```

### 在 React 中使用

```jsx
import { useEffect, useRef, useState } from 'react';
import 'wj-waterfall-flow';

function WaterfallDemo() {
  const [items, setItems] = useState([]);
  const waterfallRef = useRef(null);

  useEffect(() => {
    // 定义全局加载回调
    window.loadMore = (component) => {
      fetchMoreItems().then(newItems => {
        setItems(prev => [...prev, ...newItems]);
        component.finishLoading(newItems.length > 0);
      });
    };
  }, []);

  return (
    <waterfall-flow
      ref={waterfallRef}
      row-gap="10"
      column-gap="10"
      min-column-width="200"
      onLoadMore="loadMore"
    >
      {items.map(item => (
        <div key={item.id} className="waterfall-item">
          <img src={item.image} alt={item.title} />
          <div className="content">{item.title}</div>
        </div>
      ))}

      <div slot="loading">
        <div className="spinner">Loading...</div>
      </div>
    </waterfall-flow>
  );
}
```

## 📖 API

### 属性 (Attributes)

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `row-gap` | `number` | `10` | 行间距（px） |
| `column-gap` | `number` | `10` | 列间距（px） |
| `min-column-width` | `number` | `200` | 最小列宽（px） |
| `columns` | `number` | `auto` | 固定列数，不设置则自动计算 |
| `onLoadMore` | `string` | - | 加载更多回调函数名（全局函数） |

### 方法 (Methods)

#### `finishLoading(hasMore: boolean): void`

完成加载，更新加载状态。

- **参数:**
  - `hasMore`: 是否还有更多数据

```javascript
const waterfall = document.querySelector('waterfall-flow');
waterfall.finishLoading(true); // 还有更多数据
waterfall.finishLoading(false); // 没有更多数据了
```

#### `clear(): void`

清空所有项目，重置组件状态。

```javascript
const waterfall = document.querySelector('waterfall-flow');
waterfall.clear();
```

#### `relayout(): void`

手动触发重新布局。

```javascript
const waterfall = document.querySelector('waterfall-flow');
waterfall.relayout();
```

### 事件 (Events)

#### `load-more`

当需要加载更多内容时触发。

```javascript
waterfall.addEventListener('load-more', (event) => {
  const { currentCount, finishLoading } = event.detail;
  console.log('当前项目数:', currentCount);
  
  // 加载完成后调用
  finishLoading(true);
});
```

### 插槽 (Slots)

#### 默认插槽

放置瀑布流项目，每个项目需要添加 `waterfall-item` class。

```html
<waterfall-flow>
  <div class="waterfall-item">项目 1</div>
  <div class="waterfall-item">项目 2</div>
</waterfall-flow>
```

#### `loading` 插槽

自定义加载状态显示。

```html
<waterfall-flow>
  <div slot="loading">
    <div class="custom-loader">加载中...</div>
  </div>
</waterfall-flow>
```

## 🎨 样式自定义

组件使用 Shadow DOM，你可以为瀑布流项目添加自定义样式：

```css
.waterfall-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.waterfall-item:hover {
  transform: translateY(-5px);
}

.waterfall-item img {
  width: 100%;
  display: block;
}
```

## 🖼️ 图片处理最佳实践

### 已知图片尺寸

当后端返回图片宽高信息时，使用 `aspect-ratio` 预设比例：

```html
<div class="waterfall-item">
  <img 
    src="image.jpg" 
    style="aspect-ratio: 16/9; object-fit: cover;"
    loading="lazy"
  >
</div>
```

### 未知图片尺寸

组件会自动监听图片加载，并在加载完成后调整布局：

```html
<div class="waterfall-item">
  <img 
    src="image.jpg" 
    style="width: 100%; height: auto;"
    loading="lazy"
  >
</div>
```

## 🔧 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 类型检查
npm run type-check
```

## 📄 License

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📝 更新日志

### 1.0.0

- 🎉 初始版本发布
- ✨ 支持响应式瀑布流布局
- ✨ 支持无限滚动
- ✨ 支持 TypeScript

