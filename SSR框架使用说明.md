# 🌐 SSR 框架使用说明

## 问题说明

Web Components 依赖浏览器的 DOM API（如 `HTMLElement`、`customElements`），在服务端渲染（SSR）时，Node.js 环境中没有这些 API，会导致错误：

```
HTMLElement is not defined
```

## ✅ 已解决

**v1.0.1+ 版本已内置 SSR 支持！**

组件会自动检测运行环境：
- ✅ 浏览器环境：正常注册和使用
- ✅ SSR 环境：跳过注册，避免错误

---

## 🚀 在 Nuxt 3/4 中使用

### 方法一：使用 `<ClientOnly>`（推荐）

```vue
<template>
  <ClientOnly>
    <waterfall-flow
      :row-gap="10"
      :column-gap="10"
      :min-column-width="200"
      onLoadMore="loadMore"
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
  </ClientOnly>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const items = ref([]);

// 只在客户端导入
if (process.client) {
  import('wj-waterfall-flow');
}

onMounted(() => {
  window.loadMore = (component) => {
    fetchMoreItems().then(newItems => {
      items.value.push(...newItems);
      component.finishLoading(newItems.length > 0);
    });
  };
});

const fetchMoreItems = async () => {
  // 你的数据加载逻辑
  return [];
};
</script>
```

### 方法二：创建客户端插件

**1. 创建插件文件**

`plugins/waterfall.client.ts`:

```typescript
import 'wj-waterfall-flow';

export default defineNuxtPlugin(() => {
  // Web Component 自动注册
  console.log('Waterfall Flow 组件已加载');
});
```

**注意：** 文件名必须以 `.client.ts` 结尾，这样 Nuxt 只会在客户端执行

**2. 在组件中使用**

```vue
<template>
  <ClientOnly>
    <waterfall-flow row-gap="10" column-gap="10">
      <div 
        v-for="item in items" 
        :key="item.id" 
        class="waterfall-item"
      >
        <img :src="item.image" :alt="item.title">
      </div>
    </waterfall-flow>
  </ClientOnly>
</template>

<script setup>
const items = ref([]);
</script>
```

### 方法三：动态导入

```vue
<template>
  <ClientOnly>
    <div ref="waterfallContainer">
      <!-- 内容 -->
    </div>
  </ClientOnly>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const waterfallContainer = ref(null);

onMounted(async () => {
  // 动态导入组件
  await import('wj-waterfall-flow');
  
  // 组件已注册，可以使用了
  console.log('Waterfall Flow ready');
});
</script>
```

---

## 🎯 Next.js (App Router) 中使用

### 创建客户端组件

```tsx
'use client'; // 声明为客户端组件

import { useEffect, useState } from 'react';

export default function WaterfallFlow() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // 动态导入
    import('wj-waterfall-flow');

    // 设置加载回调
    window.loadMore = (component) => {
      // 加载更多数据
      component.finishLoading(true);
    };
  }, []);

  return (
    <waterfall-flow row-gap="10" column-gap="10" onLoadMore="loadMore">
      {items.map(item => (
        <div key={item.id} className="waterfall-item">
          <img src={item.image} alt={item.title} />
        </div>
      ))}
    </waterfall-flow>
  );
}
```

---

## 🔧 其他 SSR 框架

### SvelteKit

```svelte
<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  let items = [];

  onMount(async () => {
    if (browser) {
      await import('wj-waterfall-flow');
    }
  });
</script>

{#if browser}
  <waterfall-flow row-gap="10" column-gap="10">
    {#each items as item (item.id)}
      <div class="waterfall-item">
        <img src={item.image} alt={item.title} />
      </div>
    {/each}
  </waterfall-flow>
{/if}
```

### Astro

```astro
---
// 组件会自动在客户端加载
---

<waterfall-flow 
  row-gap="10" 
  column-gap="10"
  client:load
>
  <!-- 内容 -->
</waterfall-flow>

<script>
  import 'wj-waterfall-flow';
</script>
```

---

## 💡 最佳实践

### 1. 始终使用 `<ClientOnly>` 或类似包装

即使组件已支持 SSR，仍建议使用客户端包装：

```vue
<ClientOnly>
  <waterfall-flow>
    <!-- 内容 -->
  </waterfall-flow>
</ClientOnly>
```

### 2. 动态导入组件

```javascript
// ✅ 推荐
if (process.client) {
  import('wj-waterfall-flow');
}

// ❌ 避免
import 'wj-waterfall-flow'; // 在 SSR 时也会执行
```

### 3. 提供加载占位符

```vue
<ClientOnly>
  <template #fallback>
    <div class="skeleton">加载中...</div>
  </template>
  
  <waterfall-flow>
    <!-- 内容 -->
  </waterfall-flow>
</ClientOnly>
```

---

## 🐛 常见问题

### Q1: 仍然报 `HTMLElement is not defined`？

**A**: 检查组件版本：

```bash
npm list wj-waterfall-flow
```

确保版本 >= 1.0.1

### Q2: 组件在 Nuxt 中不显示？

**A**: 确保：
1. 使用了 `<ClientOnly>` 包装
2. 在 `process.client` 条件下导入
3. 检查浏览器控制台是否有错误

### Q3: 如何调试？

**A**: 添加日志：

```vue
<script setup>
onMounted(() => {
  console.log('Component mounted');
  console.log('customElements:', typeof customElements);
  console.log('waterfall-flow registered:', customElements.get('waterfall-flow'));
});
</script>
```

---

## 📚 相关文档

- [Nuxt ClientOnly](https://nuxt.com/docs/api/components/client-only)
- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [SvelteKit Browser Check](https://kit.svelte.dev/docs/modules#$app-environment)

---

## 🎉 总结

使用 `wj-waterfall-flow` v1.0.1+ 在 SSR 框架中：

1. ✅ 组件自动处理 SSR 环境
2. ✅ 使用 `<ClientOnly>` 包装
3. ✅ 在客户端条件下导入
4. ✅ 正常使用所有功能

问题已解决！🚀

