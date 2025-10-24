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
    id="waterfall"
    row-gap="10" 
    column-gap="10" 
    min-column-width="200">
    
    <div class="waterfall-item">
      <img src="image1.jpg" alt="Item 1">
      <div class="content">内容 1</div>
    </div>
  </waterfall-flow>

  <!-- 自定义 Loading（在外部控制） -->
  <div id="loading" style="display: none;">
    <div class="spinner">加载中...</div>
  </div>

  <script>
    // 方式一：使用事件监听（推荐）
    const waterfall = document.getElementById('waterfall');
    const loading = document.getElementById('loading');
    
    waterfall.addEventListener('load-more', (event) => {
      // 重要：阻止默认行为
      event.preventDefault();
      
      const { currentCount, finishLoading } = event.detail;
      
      // 显示 loading
      loading.style.display = 'block';
      
      // 模拟异步加载
      setTimeout(() => {
        // 添加新项目
        const item = document.createElement('div');
        item.className = 'waterfall-item';
        item.innerHTML = '<img src="new-image.jpg">';
        waterfall.appendChild(item);
        
        // 隐藏 loading
        loading.style.display = 'none';
        
        // 完成加载，true = 还有更多数据
        finishLoading(true);
      }, 1000);
    });
    
    // 方式二：全局函数（向后兼容，不推荐）
    // window.loadMore = function(component) { ... }
  </script>
</body>
</html>
```

### 在 Vue 3 中使用

```vue
<template>
  <waterfall-flow
    ref="waterfallRef"
    :row-gap="10"
    :column-gap="10"
    :min-column-width="200"
    @load-more="handleLoadMore"
  >
    <div 
      v-for="item in items" 
      :key="item.id" 
      class="waterfall-item"
    >
      <img :src="item.image" :alt="item.title">
      <div class="content">{{ item.title }}</div>
    </div>
  </waterfall-flow>

  <!-- 自定义 Loading（在外部控制） -->
  <div v-if="isLoading" class="loading">
    <div class="spinner">加载中...</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import 'wj-waterfall-flow';

const items = ref([]);
const isLoading = ref(false);
const waterfallRef = ref(null);

// 使用事件监听处理加载（推荐）
const handleLoadMore = (event) => {
  const { currentCount, finishLoading } = event.detail;
  
  console.log(`当前有 ${currentCount} 个项目，正在加载更多...`);
  
  isLoading.value = true;
  
  // 异步加载数据
  fetchMoreItems().then(newItems => {
    items.value.push(...newItems);
    isLoading.value = false;
    finishLoading(newItems.length > 0);
  });
};

const fetchMoreItems = async () => {
  // 你的数据加载逻辑
  return [];
};
</script>
```

### 在 React 中使用

```jsx
import { useEffect, useRef, useState } from 'react';
import 'wj-waterfall-flow';

function WaterfallDemo() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const waterfallRef = useRef(null);

  useEffect(() => {
    const waterfall = waterfallRef.current;
    if (!waterfall) return;

    // 使用事件监听处理加载（推荐）
    const handleLoadMore = (event) => {
      const { currentCount, finishLoading } = event.detail;
      
      console.log(`当前有 ${currentCount} 个项目，正在加载更多...`);
      
      setIsLoading(true);
      
      // 异步加载数据
      fetchMoreItems().then(newItems => {
        setItems(prev => [...prev, ...newItems]);
        setIsLoading(false);
        finishLoading(newItems.length > 0);
      });
    };

    waterfall.addEventListener('load-more', handleLoadMore);

    // 清理
    return () => {
      waterfall.removeEventListener('load-more', handleLoadMore);
    };
  }, []);

  const fetchMoreItems = async () => {
    // 你的数据加载逻辑
    return [];
  };

  return (
    <>
      <waterfall-flow
        ref={waterfallRef}
        row-gap="10"
        column-gap="10"
        min-column-width="200"
      >
        {items.map(item => (
          <div key={item.id} className="waterfall-item">
            <img src={item.image} alt={item.title} />
            <div className="content">{item.title}</div>
          </div>
        ))}
      </waterfall-flow>

      {/* 自定义 Loading（在外部控制） */}
      {isLoading && (
        <div className="loading">
          <div className="spinner">加载中...</div>
        </div>
      )}
    </>
  );
}
```

### 在 Nuxt 3/4 中使用

由于 Nuxt 使用 SSR，需要确保组件只在客户端加载：

**方法一：使用 `<ClientOnly>` 组件（推荐）**

```vue
<template>
  <ClientOnly>
    <waterfall-flow
      ref="waterfallRef"
      :row-gap="10"
      :column-gap="10"
      :min-column-width="200"
      @load-more="handleLoadMore"
    >
      <div 
        v-for="item in items" 
        :key="item.id" 
        class="waterfall-item"
      >
        <img :src="item.image" :alt="item.title">
        <div class="content">{{ item.title }}</div>
      </div>
    </waterfall-flow>
  </ClientOnly>

  <!-- 自定义 Loading（在外部控制） -->
  <div v-if="isLoading" class="loading">
    <div class="spinner">加载中...</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const items = ref([]);
const isLoading = ref(false);
const waterfallRef = ref(null);

// 只在客户端导入
if (process.client) {
  import('wj-waterfall-flow');
}

// 使用事件监听处理加载
const handleLoadMore = (event) => {
  const { currentCount, finishLoading } = event.detail;
  
  console.log(`当前有 ${currentCount} 个项目`);
  
  isLoading.value = true;
  
  // 加载逻辑
  fetchMoreItems().then(newItems => {
    items.value.push(...newItems);
    isLoading.value = false;
    finishLoading(newItems.length > 0);
  });
};

const fetchMoreItems = async () => {
  // 你的数据加载逻辑
  return [];
};
</script>
```

**方法二：创建插件**

创建 `plugins/waterfall.client.ts`：

```typescript
// plugins/waterfall.client.ts
import 'wj-waterfall-flow';

export default defineNuxtPlugin(() => {
  // 组件已自动注册
});
```

然后在组件中使用：

```vue
<template>
  <ClientOnly>
    <waterfall-flow row-gap="10" column-gap="10">
      <!-- 内容 -->
    </waterfall-flow>
  </ClientOnly>
</template>
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

### Loading 显示

组件本身不提供内置的 loading 插槽，loading 效果应该由调用方在外部实现。这样可以：

- ✅ 更灵活地控制 loading 的显示和样式
- ✅ 避免 Shadow DOM 样式隔离带来的问题
- ✅ 与你的应用 UI 保持一致

**示例：**

```html
<!-- 瀑布流组件 -->
<waterfall-flow @load-more="handleLoadMore">
  <div class="waterfall-item">...</div>
</waterfall-flow>

<!-- 在外部控制 Loading -->
<div v-if="isLoading" class="loading">
  <div class="spinner">加载中...</div>
</div>
```

在 `load-more` 事件处理函数中：

```javascript
const handleLoadMore = (event) => {
  isLoading.value = true; // 显示 loading
  
  fetchData().then(() => {
    isLoading.value = false; // 隐藏 loading
    event.detail.finishLoading(true);
  });
};
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

