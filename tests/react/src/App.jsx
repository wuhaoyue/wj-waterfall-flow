import { useEffect, useRef, useState } from 'react';
import './App.css';

function App() {
  const waterfallRef = useRef(null);
  const [items, setItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // 配置
  const [rowGap, setRowGap] = useState(10);
  const [columnGap, setColumnGap] = useState(10);
  const [minColumnWidth, setMinColumnWidth] = useState(200);

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
      description: `这是第 ${index} 个瀑布流项目，高度为 ${height}px`,
      image: `https://picsum.photos/${width}/${height}?random=${index}`,
      aspectRatio: `${width}/${height}`
    };
  };

  // 处理加载更多
  useEffect(() => {
    const waterfall = waterfallRef.current;
    if (!waterfall) return;

    const handleLoadMore = (event) => {
      console.log('✅ React: load-more 事件触发', event.detail);
      
      setIsLoading(true);
      setCurrentPage(prev => prev + 1);
      
      const { currentCount, finishLoading } = event.detail;
      
      console.log(`📦 当前已有 ${currentCount} 个项目，正在加载...`);
      
      // 模拟异步加载
      setTimeout(() => {
        const itemsPerPage = 12;
        const startIndex = currentCount + 1;
        const endIndex = currentCount + itemsPerPage;
        
        const newItems = [];
        for (let i = startIndex; i <= endIndex; i++) {
          newItems.push(createItem(i));
        }
        
        setItems(prev => [...prev, ...newItems]);
        setIsLoading(false);
        
        console.log(`✅ 加载完成`);
        
        // 限制最多 5 页
        const hasMore = Math.ceil((currentCount + itemsPerPage) / itemsPerPage) < 5;
        finishLoading(hasMore);
        
        if (!hasMore) {
          console.log('⏹️ 已加载所有数据');
        }
      }, 800);
    };

    waterfall.addEventListener('load-more', handleLoadMore);

    return () => {
      waterfall.removeEventListener('load-more', handleLoadMore);
    };
  }, []);

  // 清空项目
  const clearItems = () => {
    setItems([]);
    setCurrentPage(0);
    if (waterfallRef.current) {
      waterfallRef.current.clear();
    }
  };

  // 手动添加项目
  const addItems = () => {
    const startIndex = items.length + 1;
    const newItems = [];
    for (let i = startIndex; i < startIndex + 12; i++) {
      newItems.push(createItem(i));
    }
    setItems(prev => [...prev, ...newItems]);
  };

  return (
    <div className="app">
      <h1>⚛️ React + Waterfall Flow 测试</h1>
      
      <div className="status">
        <p>✅ 组件已加载</p>
        <p>📦 当前项目数: {items.length}</p>
        <p>📄 当前页数: {currentPage}</p>
        {isLoading && <p>⏳ 加载中...</p>}
      </div>

      <div className="controls">
        <button onClick={clearItems}>清空</button>
        <button onClick={addItems}>手动添加 12 个</button>
        <label>
          行间距:
          <input
            type="number"
            min="0"
            max="50"
            value={rowGap}
            onChange={(e) => setRowGap(Number(e.target.value))}
          />
        </label>
        <label>
          列间距:
          <input
            type="number"
            min="0"
            max="50"
            value={columnGap}
            onChange={(e) => setColumnGap(Number(e.target.value))}
          />
        </label>
        <label>
          最小列宽:
          <input
            type="number"
            min="100"
            max="500"
            value={minColumnWidth}
            onChange={(e) => setMinColumnWidth(Number(e.target.value))}
          />
        </label>
      </div>

      <waterfall-flow
        ref={waterfallRef}
        row-gap={rowGap}
        column-gap={columnGap}
        min-column-width={minColumnWidth}
      >
        {items.map(item => (
          <div key={item.id} className="waterfall-item">
            <img
              src={item.image}
              alt={item.title}
              style={{ aspectRatio: item.aspectRatio }}
              loading="lazy"
            />
            <div className="content">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </div>
        ))}

        <div slot="loading" className="custom-loading">
          <div className="spinner"></div>
          <p>React 加载中...</p>
        </div>
      </waterfall-flow>
    </div>
  );
}

export default App;

