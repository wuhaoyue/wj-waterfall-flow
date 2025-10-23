<template>
  <div class="app">
    <h1>⚡ Nuxt 3 + Waterfall Flow 测试 (SSR)</h1>
    
    <div class="status">
      <p>✅ SSR 渲染正常</p>
      <p>✅ 组件仅在客户端加载</p>
      <p>📦 当前项目数: {{ items.length }}</p>
      <p>📄 当前页数: {{ currentPage }}</p>
      <p v-if="isLoading">⏳ 加载中...</p>
    </div>

    <div class="controls">
      <button @click="clearItems">清空</button>
      <button @click="addItems">手动添加 12 个</button>
      <label>
        行间距:
        <input v-model.number="rowGap" type="number" min="0" max="50">
      </label>
      <label>
        列间距:
        <input v-model.number="columnGap" type="number" min="0" max="50">
      </label>
      <label>
        最小列宽:
        <input v-model.number="minColumnWidth" type="number" min="100" max="500">
      </label>
    </div>

    <ClientOnly>
      <waterfall-flow
        ref="waterfallRef"
        :row-gap="rowGap"
        :column-gap="columnGap"
        :min-column-width="minColumnWidth"
        @load-more="handleLoadMore"
      >
        <div
          v-for="item in items"
          :key="item.id"
          class="waterfall-item"
        >
          <img
            :src="item.image"
            :alt="item.title"
            :style="{ aspectRatio: item.aspectRatio }"
            loading="lazy"
          >
          <div class="content">
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </div>
        </div>

        <template #loading>
          <div class="custom-loading">
            <div class="spinner"></div>
            <p>Nuxt 3 加载中...</p>
          </div>
        </template>
      </waterfall-flow>

      <template #fallback>
        <div class="skeleton">
          <p>⏳ 组件加载中...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup>
const waterfallRef = ref(null);
const items = ref([]);
const currentPage = ref(0);
const isLoading = ref(false);

// 配置
const rowGap = ref(10);
const columnGap = ref(10);
const minColumnWidth = ref(200);

// 生成随机高度
const getRandomHeight = () => {
  return Math.floor(Math.random() * 200) + 150;
};

// 创建项目
const createItem = (index) => {
  const height = getRandomHeight();
  const width = 300;
  return {
    id: `item-${index}-${Date.now()}`,
    title: `项目 #${index}`,
    description: `这是第 ${index} 个瀑布流项目 (Nuxt 3)，高度为 ${height}px`,
    image: `https://picsum.photos/${width}/${height}?random=${index}`,
    aspectRatio: `${width}/${height}`
  };
};

// 处理加载更多
const handleLoadMore = (event) => {
  console.log('✅ Nuxt 3: load-more 事件触发', event.detail);
  
  isLoading.value = true;
  currentPage.value++;
  
  const { currentCount, finishLoading } = event.detail;
  
  console.log(`📦 当前已有 ${currentCount} 个项目，正在加载第 ${currentPage.value} 页...`);
  
  // 模拟异步加载
  setTimeout(() => {
    const itemsPerPage = 12;
    const startIndex = (currentPage.value - 1) * itemsPerPage + 1;
    const endIndex = currentPage.value * itemsPerPage;
    
    for (let i = startIndex; i <= endIndex; i++) {
      items.value.push(createItem(i));
    }
    
    console.log(`✅ 第 ${currentPage.value} 页加载完成`);
    
    isLoading.value = false;
    
    // 限制最多 5 页
    const hasMore = currentPage.value < 5;
    finishLoading(hasMore);
    
    if (!hasMore) {
      console.log('⏹️ 已加载所有数据');
    }
  }, 800);
};

// 清空项目
const clearItems = () => {
  items.value = [];
  currentPage.value = 0;
  if (waterfallRef.value) {
    waterfallRef.value.clear();
  }
};

// 手动添加项目
const addItems = () => {
  const startIndex = items.value.length + 1;
  for (let i = startIndex; i < startIndex + 12; i++) {
    items.value.push(createItem(i));
  }
};
</script>

<style scoped>
.app {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.status {
  background: #ecfdf5;
  border: 1px solid #10b981;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.status p {
  margin: 5px 0;
  color: #047857;
}

.controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.controls button {
  padding: 8px 16px;
  background: #00dc82;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.controls button:hover {
  background: #00c16a;
  transform: translateY(-1px);
}

.controls label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #555;
}

.controls input {
  width: 80px;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.waterfall-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  transition: all 0.3s;
  cursor: pointer;
}

.waterfall-item:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.waterfall-item img {
  width: 100%;
  display: block;
  object-fit: cover;
}

.waterfall-item .content {
  padding: 15px;
}

.waterfall-item h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.waterfall-item p {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.custom-loading {
  text-align: center;
  padding: 30px;
}

.spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #00dc82;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.custom-loading p {
  color: #00dc82;
  font-weight: 500;
}

.skeleton {
  text-align: center;
  padding: 40px;
  background: #f9fafb;
  border-radius: 8px;
}

.skeleton p {
  color: #6b7280;
  font-size: 14px;
}
</style>

