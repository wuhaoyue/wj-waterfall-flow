# 🚀 快速开始

## 5 分钟上手瀑布流组件

### 步骤 1: 安装

```bash
npm install wj-waterfall-flow
```

### 步骤 2: 引入

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import 'wj-waterfall-flow';
  </script>
</head>
<body>
  <!-- 步骤 3 的代码放这里 -->
</body>
</html>
```

### 步骤 3: 使用

```html
<waterfall-flow 
  row-gap="10" 
  column-gap="10" 
  min-column-width="200"
  onLoadMore="handleLoadMore">
  
  <!-- 你的内容项 -->
  <div class="waterfall-item">
    <img src="image1.jpg" alt="图片1">
    <div class="content">内容 1</div>
  </div>
  
  <div class="waterfall-item">
    <img src="image2.jpg" alt="图片2">
    <div class="content">内容 2</div>
  </div>
  
</waterfall-flow>

<script>
  // 加载更多回调
  function handleLoadMore(component) {
    // 模拟异步加载
    setTimeout(() => {
      // 创建新项目
      const item = document.createElement('div');
      item.className = 'waterfall-item';
      item.innerHTML = `
        <img src="new-image.jpg" alt="新图片">
        <div class="content">新内容</div>
      `;
      
      // 添加到组件
      component.appendChild(item);
      
      // 告诉组件加载完成
      component.finishLoading(true); // true = 还有更多数据
    }, 1000);
  }
</script>
```

### 步骤 4: 添加样式（可选）

```css
<style>
  .waterfall-item {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .waterfall-item img {
    width: 100%;
    display: block;
  }
  
  .waterfall-item .content {
    padding: 15px;
  }
</style>
```

## ✅ 完成！

打开浏览器，你应该能看到一个响应式的瀑布流布局了。

---

## 💡 常见场景

### 1. 图片墙

```javascript
function createImageItem(url, index) {
  const item = document.createElement('div');
  item.className = 'waterfall-item';
  item.innerHTML = `<img src="${url}" loading="lazy" alt="Image ${index}">`;
  return item;
}

function handleLoadMore(component) {
  // 加载 12 张新图片
  for (let i = 0; i < 12; i++) {
    const item = createImageItem(`https://picsum.photos/300/400?random=${Date.now()}-${i}`, i);
    component.appendChild(item);
  }
  component.finishLoading(true);
}
```

### 2. 商品列表

```javascript
function createProductItem(product) {
  const item = document.createElement('div');
  item.className = 'waterfall-item';
  item.innerHTML = `
    <img src="${product.image}" alt="${product.name}">
    <div class="content">
      <h3>${product.name}</h3>
      <p class="price">¥${product.price}</p>
      <button>加入购物车</button>
    </div>
  `;
  return item;
}

function handleLoadMore(component) {
  fetchProducts().then(products => {
    products.forEach(product => {
      component.appendChild(createProductItem(product));
    });
    component.finishLoading(products.length > 0);
  });
}
```

### 3. 文章卡片

```javascript
function createArticleItem(article) {
  const item = document.createElement('div');
  item.className = 'waterfall-item';
  item.innerHTML = `
    <img src="${article.cover}" alt="${article.title}">
    <div class="content">
      <h3>${article.title}</h3>
      <p>${article.excerpt}</p>
      <div class="meta">
        <span>${article.author}</span>
        <span>${article.date}</span>
      </div>
    </div>
  `;
  return item;
}
```

---

## 🎛️ 配置选项

| 属性 | 说明 | 默认值 |
|------|------|--------|
| `row-gap` | 行间距 | 10 |
| `column-gap` | 列间距 | 10 |
| `min-column-width` | 最小列宽 | 200 |
| `columns` | 固定列数（可选） | 自动 |
| `onLoadMore` | 加载回调函数名 | - |

---

## 📱 响应式示例

组件会自动根据容器宽度调整列数：

```html
<!-- 宽度 < 600px: 1列 -->
<!-- 600px ≤ 宽度 < 900px: 2列 -->
<!-- 900px ≤ 宽度 < 1200px: 3列 -->
<!-- 宽度 ≥ 1200px: 4列+ -->
```

可以通过 `min-column-width` 控制这个行为：

```html
<!-- 最小列宽 300px，容器越宽，列数越多 -->
<waterfall-flow min-column-width="300">
```

或者固定列数：

```html
<!-- 始终显示 3 列 -->
<waterfall-flow columns="3">
```

---

## 🎨 自定义 Loading

```html
<waterfall-flow onLoadMore="handleLoadMore">
  <!-- 你的内容 -->
  
  <!-- 自定义加载状态 -->
  <div slot="loading">
    <div class="my-spinner"></div>
    <p>拼命加载中...</p>
  </div>
</waterfall-flow>
```

---

## 🔧 API 方法

### finishLoading(hasMore)

完成加载，更新状态：

```javascript
component.finishLoading(true);  // 还有更多
component.finishLoading(false); // 没有更多了
```

### clear()

清空所有内容：

```javascript
component.clear();
```

### relayout()

手动触发重新布局：

```javascript
component.relayout();
```

---

## 🎯 在框架中使用

### Vue 3

```vue
<template>
  <waterfall-flow ref="waterfall" onLoadMore="loadMore">
    <div v-for="item in items" :key="item.id" class="waterfall-item">
      <img :src="item.image" :alt="item.title">
    </div>
  </waterfall-flow>
</template>

<script setup>
import 'wj-waterfall-flow';
import { ref, onMounted } from 'vue';

const items = ref([]);

onMounted(() => {
  window.loadMore = (component) => {
    // 加载逻辑
    component.finishLoading(true);
  };
});
</script>
```

### React

```jsx
import { useEffect, useRef } from 'react';
import 'wj-waterfall-flow';

function App() {
  const waterfallRef = useRef(null);

  useEffect(() => {
    window.loadMore = (component) => {
      // 加载逻辑
      component.finishLoading(true);
    };
  }, []);

  return (
    <waterfall-flow ref={waterfallRef} onLoadMore="loadMore">
      {/* 你的内容 */}
    </waterfall-flow>
  );
}
```

---

## 📖 更多文档

- [完整 API 文档](./README.md)
- [项目结构说明](./PROJECT_STRUCTURE.md)
- [发布指南](./PUBLISH.md)

## 🐛 遇到问题？

- 查看 [GitHub Issues](https://github.com/yourusername/waterfall-flow/issues)
- 提交新问题
- 参考示例代码 `example/index.html`

---

**享受使用瀑布流组件吧！** 🎉

