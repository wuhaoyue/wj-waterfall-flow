/**
 * 瀑布流 Web Component
 * 支持自适应列数、row-gap/column-gap设置、IntersectionObserver无限滚动
 */
class WaterfallFlow extends HTMLElement {
  /**
   * 构造函数
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // 配置参数
    this.columns = []; // 每列的高度数组
    this.columnCount = 3; // 默认列数
    this.rowGap = 10; // 默认行间距
    this.columnGap = 10; // 默认列间距
    this.minColumnWidth = 200; // 最小列宽
    this.loading = false; // 是否正在加载
    this.hasMore = true; // 是否还有更多数据
    this.items = []; // 存储所有项目元素
    this.observer = null; // IntersectionObserver 实例
    this.loadMoreCallback = null; // 加载更多回调
    this.lastContentWidth = 0; // 上次内容宽度
    this.updateTimer = null; // 更新容器高度的防抖定时器
    this.adjustQueue = new Set(); // 待调整的项目队列
    this.isProcessingAdjustments = false; // 是否正在处理调整
    
    // 绑定方法
    this.handleResize = this.handleResize.bind(this);
    this.handleLoadMore = this.handleLoadMore.bind(this);
    this.debouncedUpdateContainerHeight = this.debounce(this.updateContainerHeight.bind(this), 16); // ~60fps
  }

  /**
   * 监听的属性
   */
  static get observedAttributes() {
    return ['row-gap', 'column-gap', 'min-column-width', 'columns'];
  }

  /**
   * 解析尺寸值（支持带单位）
   * @param {string} value - 尺寸值
   * @returns {number} 像素值
   */
  parseSizeValue(value) {
    if (!value) return 10;
    const num = parseFloat(value);
    return isNaN(num) ? 10 : num;
  }

  /**
   * 防抖函数
   * @param {Function} func - 要防抖的函数
   * @param {number} wait - 等待时间（毫秒）
   * @returns {Function} 防抖后的函数
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * 节流函数
   * @param {Function} func - 要节流的函数
   * @param {number} limit - 时间间隔（毫秒）
   * @returns {Function} 节流后的函数
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * 属性变化回调
   * @param {string} name - 属性名
   * @param {string} oldValue - 旧值
   * @param {string} newValue - 新值
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'row-gap':
        this.rowGap = this.parseSizeValue(newValue);
        if (this.items.length > 0) {
          // 使用 requestAnimationFrame 确保 DOM 更新后再布局
          requestAnimationFrame(() => this.relayout());
        }
        break;
      case 'column-gap':
        this.columnGap = this.parseSizeValue(newValue);
        if (this.items.length > 0) {
          requestAnimationFrame(() => this.relayout());
        }
        break;
      case 'min-column-width':
        this.minColumnWidth = this.parseSizeValue(newValue);
        this.calculateColumns();
        if (this.items.length > 0) {
          requestAnimationFrame(() => this.relayout());
        }
        break;
      case 'columns':
        this.columnCount = parseInt(newValue) || 3;
        if (this.items.length > 0) {
          requestAnimationFrame(() => this.relayout());
        }
        break;
    }
  }

  /**
   * 组件挂载到 DOM 时调用
   */
  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.setupIntersectionObserver();
  }

  /**
   * 组件从 DOM 移除时调用
   */
  disconnectedCallback() {
    this.removeEventListeners();
    if (this.observer) {
      this.observer.disconnect();
    }
    clearTimeout(this.resizeTimer);
    clearTimeout(this.updateTimer);
    this.adjustQueue.clear();
  }

  /**
   * 渲染组件结构
   */
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          position: relative;
        }
        
        .waterfall-container {
          position: relative;
          width: 100%;
          min-height: 100px;
        }
        
        ::slotted(.waterfall-item) {
          position: absolute !important;
          transition: all 0.3s ease;
          box-sizing: border-box !important;
          overflow: hidden !important;
          max-width: 100% !important;
        }
        
        ::slotted(.waterfall-item) * {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        
        .loading-trigger {
          width: 100%;
          height: 1px;
          pointer-events: none;
          clear: both;
        }
        
        .loading-container {
          width: 100%;
          padding: 20px 0;
          text-align: center;
          clear: both;
        }
        
        .loading-container.hidden {
          display: none;
        }
        
        .default-loading {
          color: #666;
          font-size: 14px;
        }
      </style>
      
      <div class="waterfall-container">
        <slot></slot>
      </div>
      <div class="loading-trigger"></div>
      <div class="loading-container">
        <slot name="loading">
          <div class="default-loading">加载中...</div>
        </slot>
      </div>
    `;
  }

  /**
   * 设置 IntersectionObserver
   */
  setupIntersectionObserver() {
    const trigger = this.shadowRoot.querySelector('.loading-trigger');
    
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.loading && this.hasMore) {
            this.handleLoadMore();
          }
        });
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0
      }
    );
    
    this.observer.observe(trigger);
    
    // 初始检查：如果触发器已经在视口内，立即触发加载
    setTimeout(() => {
      const rect = trigger.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight + 200;
      
      if (isInViewport && !this.loading && this.hasMore && this.items.length === 0) {
        this.handleLoadMore();
      }
    }, 100);
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    window.addEventListener('resize', this.handleResize);
    
    // 监听 slot 变化
    const slot = this.shadowRoot.querySelector('slot:not([name])');
    slot.addEventListener('slotchange', () => {
      this.onItemsChange();
    });
  }

  /**
   * 移除事件监听器
   */
  removeEventListeners() {
    window.removeEventListener('resize', this.handleResize);
  }

  /**
   * 获取内容区域宽度（不包含 padding）
   * @returns {number} 内容宽度
   */
  getContentWidth() {
    // 获取容器
    const container = this.shadowRoot.querySelector('.waterfall-container');
    if (!container) return this.offsetWidth;
    
    // 使用 clientWidth 获取不包含边框的宽度
    return container.clientWidth || this.clientWidth || this.offsetWidth;
  }

  /**
   * 计算列数
   */
  calculateColumns() {
    const containerWidth = this.getContentWidth();
    if (!containerWidth) return;
    
    // 如果明确设置了 columns 属性，优先使用
    if (this.hasAttribute('columns')) {
      this.columnCount = parseInt(this.getAttribute('columns')) || 3;
      return;
    }
    
    // 根据容器宽度和最小列宽计算列数
    const possibleColumns = Math.floor((containerWidth + this.columnGap) / (this.minColumnWidth + this.columnGap));
    this.columnCount = Math.max(1, possibleColumns);
  }

  /**
   * 初始化布局
   */
  initLayout() {
    // 保存当前宽度
    const containerWidth = this.getContentWidth();
    this.lastContentWidth = containerWidth;
    
    // 初始化列高度数组
    this.columns = new Array(this.columnCount).fill(0);
    
    // 获取所有子元素（不包括具名 slot）
    const slot = this.shadowRoot.querySelector('slot:not([name])');
    this.items = Array.from(slot.assignedElements()).filter(el => 
      el.classList.contains('waterfall-item')
    );
    
    // 布局所有项目
    if (this.items.length > 0) {
      this.layoutItems();
    }
  }

  /**
   * 布局所有项目
   */
  layoutItems() {
    const containerWidth = this.getContentWidth();
    if (!this.items.length || !containerWidth) return;
    
    // 计算列宽数组，将剩余空间分配到各列
    const columnWidths = this.calculateColumnWidths(containerWidth);
    
    this.items.forEach((item) => {
      this.layoutItem(item, columnWidths);
    });
  }
  
  /**
   * 计算每列的宽度，将剩余空间平均分配
   * @param {number} containerWidth - 容器宽度
   * @returns {number[]} 每列的宽度数组
   */
  calculateColumnWidths(containerWidth) {
    // 计算基础列宽
    const totalGap = this.columnGap * (this.columnCount - 1);
    const availableWidth = containerWidth - totalGap;
    const baseColumnWidth = Math.floor(availableWidth / this.columnCount);
    
    // 计算剩余空间
    const remainder = availableWidth - (baseColumnWidth * this.columnCount);
    
    // 创建列宽数组，将剩余空间分配给前几列
    const columnWidths = [];
    for (let i = 0; i < this.columnCount; i++) {
      // 如果还有剩余空间，给这一列多分配1px
      columnWidths.push(baseColumnWidth + (i < remainder ? 1 : 0));
    }
    
    return columnWidths;
  }

  /**
   * 布局单个项目
   * @param {HTMLElement} item - 项目元素
   * @param {number[]|number} columnWidths - 列宽数组或单个列宽
   */
  layoutItem(item, columnWidths) {
    // 找到最短的列
    const minHeight = Math.min(...this.columns);
    const columnIndex = this.columns.indexOf(minHeight);
    
    // 获取该列的宽度
    const itemWidth = Array.isArray(columnWidths) ? columnWidths[columnIndex] : columnWidths;
    
    // 计算位置（需要累加前面所有列的宽度和间距）
    let left = 0;
    if (Array.isArray(columnWidths)) {
      for (let i = 0; i < columnIndex; i++) {
        left += columnWidths[i] + this.columnGap;
      }
    } else {
      left = columnIndex * (columnWidths + this.columnGap);
    }
    
    const top = this.columns[columnIndex];
    
    // 设置项目样式
    item.style.width = `${itemWidth}px`;
    item.style.maxWidth = `${itemWidth}px`;
    item.style.minWidth = `${itemWidth}px`;
    item.style.left = `${left}px`;
    item.style.top = `${top}px`;
    item.style.position = 'absolute';
    item.style.boxSizing = 'border-box';
    item.style.overflow = 'hidden';
    
    // 保存列信息到元素上，方便后续调整
    item.dataset.columnIndex = columnIndex;
    item.dataset.itemTop = top;
    
    // 强制浏览器重新计算布局
    void item.offsetHeight;
    
    // 获取初始高度
    const initialHeight = item.offsetHeight;
    
    // 检查是否有图片需要加载
    const images = item.querySelectorAll('img');
    const hasUnloadedImages = Array.from(images).some(img => !img.complete);
    
    if (hasUnloadedImages) {
      // 如果有未加载的图片，先用初始高度占位
      const estimatedHeight = initialHeight > 0 ? initialHeight : 200; // 默认最小高度
      this.columns[columnIndex] += estimatedHeight + this.rowGap;
      this.debouncedUpdateContainerHeight();
      
      // 监听图片加载，加载完成后调整布局
      this.adjustItemAfterImageLoad(item, columnIndex, top, estimatedHeight, columnWidths);
    } else {
      // 没有图片或图片已加载完成，直接使用实际高度
      if (initialHeight > 0) {
        this.columns[columnIndex] += initialHeight + this.rowGap;
        this.debouncedUpdateContainerHeight();
      }
    }
  }
  
  /**
   * 图片加载后调整项目高度
   * @param {HTMLElement} item - 项目元素
   * @param {number} columnIndex - 列索引
   * @param {number} itemTop - 项目顶部位置
   * @param {number} estimatedHeight - 预估高度
   * @param {number[]|number} columnWidths - 列宽
   */
  adjustItemAfterImageLoad(item, columnIndex, itemTop, estimatedHeight, columnWidths) {
    const images = item.querySelectorAll('img');
    
    if (images.length === 0) return;
    
    // 等待所有图片加载完成
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // 即使加载失败也继续
        setTimeout(resolve, 5000); // 5秒超时
      });
    });
    
    Promise.all(imagePromises).then(() => {
      // 将调整任务加入队列，而不是立即执行
      this.adjustQueue.add({
        item,
        columnIndex,
        itemTop,
        estimatedHeight
      });
      
      // 批量处理调整
      this.processBatchAdjustments();
    });
  }
  
  /**
   * 批量处理项目调整（防抖）
   */
  processBatchAdjustments() {
    if (this.isProcessingAdjustments) return;
    
    this.isProcessingAdjustments = true;
    
    requestAnimationFrame(() => {
      const adjustments = Array.from(this.adjustQueue);
      this.adjustQueue.clear();
      
      // 按列分组
      const columnGroups = {};
      adjustments.forEach(adj => {
        if (!columnGroups[adj.columnIndex]) {
          columnGroups[adj.columnIndex] = [];
        }
        columnGroups[adj.columnIndex].push(adj);
      });
      
      // 处理每一列的调整
      Object.keys(columnGroups).forEach(colIdx => {
        const columnIndex = parseInt(colIdx);
        const colAdjustments = columnGroups[colIdx];
        
        // 按 top 位置排序
        colAdjustments.sort((a, b) => a.itemTop - b.itemTop);
        
        // 累计高度差
        let cumulativeDiff = 0;
        
        colAdjustments.forEach(adj => {
          const actualHeight = adj.item.offsetHeight;
          const heightDiff = actualHeight - adj.estimatedHeight;
          
          if (Math.abs(heightDiff) > 1) {
            // 更新列高度
            this.columns[columnIndex] += heightDiff;
            cumulativeDiff += heightDiff;
            
            // 调整后续项目
            this.adjustItemsAfter(adj.item, heightDiff, columnIndex);
          }
        });
      });
      
      // 更新容器高度（只调用一次）
      if (adjustments.length > 0) {
        this.updateContainerHeight();
      }
      
      this.isProcessingAdjustments = false;
      
      // 如果处理过程中又有新的调整任务，继续处理
      if (this.adjustQueue.size > 0) {
        this.processBatchAdjustments();
      }
    });
  }
  
  /**
   * 调整指定项目之后的所有项目位置
   * @param {HTMLElement} changedItem - 发生变化的项目
   * @param {number} heightDiff - 高度差值
   * @param {number} columnIndex - 列索引
   */
  adjustItemsAfter(changedItem, heightDiff, columnIndex) {
    const changedTop = parseFloat(changedItem.dataset.itemTop);
    
    // 找出所有在这个项目之后的、同一列的项目
    this.items.forEach(item => {
      if (item === changedItem) return;
      
      const itemColumn = parseInt(item.dataset.columnIndex);
      const itemTop = parseFloat(item.dataset.itemTop);
      
      // 如果是同一列且在改变项目之后，则向下移动
      if (itemColumn === columnIndex && itemTop > changedTop) {
        const newTop = itemTop + heightDiff;
        item.style.top = `${newTop}px`;
        item.dataset.itemTop = newTop;
      }
    });
  }

  /**
   * 更新容器高度
   */
  updateContainerHeight() {
    const maxHeight = Math.max(...this.columns, 0);
    const container = this.shadowRoot.querySelector('.waterfall-container');
    container.style.height = `${maxHeight}px`;
  }

  /**
   * 重新布局
   */
  relayout() {
    const containerWidth = this.getContentWidth();
    if (!containerWidth || !this.items.length) return;
    
    // 保存当前宽度
    this.lastContentWidth = containerWidth;
    
    // 重新计算列数
    this.calculateColumns();
    
    // 重置所有列高度
    this.columns = new Array(this.columnCount).fill(0);
    
    // 计算列宽数组
    const columnWidths = this.calculateColumnWidths(containerWidth);
    
    // 重新布局所有项目
    this.items.forEach((item) => {
      this.layoutItem(item, columnWidths);
    });
  }

  /**
   * 处理窗口大小变化
   */
  handleResize() {
    // 使用防抖处理
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      const oldColumnCount = this.columnCount;
      const oldWidth = this.lastContentWidth || 0;
      const newWidth = this.getContentWidth();
      
      this.calculateColumns();
      
      // 宽度变化或列数变化时都需要重新布局
      if (oldColumnCount !== this.columnCount || Math.abs(oldWidth - newWidth) > 1) {
        this.lastContentWidth = newWidth;
        this.relayout();
      }
    }, 150);
  }

  /**
   * 处理加载更多
   */
  handleLoadMore() {
    if (this.loading || !this.hasMore) return;
    
    this.loading = true;
    this.showLoading();
    
    // 重新获取回调函数（防止初始化时函数还未定义）
    const callbackName = this.getAttribute('onLoadMore');
    if (callbackName && typeof window[callbackName] === 'function') {
      this.loadMoreCallback = window[callbackName];
    }
    
    // 触发自定义事件
    const event = new CustomEvent('load-more', {
      detail: {
        currentCount: this.items.length,
        finishLoading: this.finishLoading.bind(this)
      },
      bubbles: true,
      composed: true
    });
    
    this.dispatchEvent(event);
    
    // 如果设置了回调函数，调用它
    if (this.loadMoreCallback) {
      this.loadMoreCallback(this);
    } else {
      // 如果没有回调函数，自动结束 loading 状态
      this.finishLoading(false);
    }
  }

  /**
   * 显示加载状态
   */
  showLoading() {
    const loading = this.shadowRoot.querySelector('.loading-container');
    loading.classList.remove('hidden');
  }

  /**
   * 隐藏加载状态
   */
  hideLoading() {
    const loading = this.shadowRoot.querySelector('.loading-container');
    loading.classList.add('hidden');
  }

  /**
   * 完成加载
   * @param {boolean} hasMore - 是否还有更多数据
   */
  finishLoading(hasMore = true) {
    this.loading = false;
    this.hasMore = hasMore;
    this.hideLoading();
    
    if (!hasMore) {
      // 断开 observer 连接
      if (this.observer) {
        this.observer.disconnect();
      }
    } else {
      // 检查是否需要继续加载（触发器可能还在视口内）
      setTimeout(() => {
        const trigger = this.shadowRoot.querySelector('.loading-trigger');
        if (trigger) {
          const rect = trigger.getBoundingClientRect();
          const isInViewport = rect.top < window.innerHeight + 200;
          
          if (isInViewport && !this.loading && this.hasMore) {
            this.handleLoadMore();
          }
        }
      }, 100);
    }
  }

  /**
   * 当 slot 内容变化时调用
   */
  onItemsChange() {
    // 获取新的项目列表
    const slot = this.shadowRoot.querySelector('slot:not([name])');
    const newItems = Array.from(slot.assignedElements()).filter(el => 
      el.classList.contains('waterfall-item')
    );
    
    const oldItemsCount = this.items.length;
    
    // 首次初始化
    if (oldItemsCount === 0 && newItems.length > 0) {
      // 等待容器有宽度
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const contentWidth = this.getContentWidth();
          if (contentWidth > 0) {
            this.calculateColumns();
            this.columns = new Array(this.columnCount).fill(0);
            this.items = newItems;
            this.layoutItems();
          }
        });
      });
      return;
    }
    
    // 只布局新增的项目
    if (newItems.length > oldItemsCount) {
      const containerWidth = this.getContentWidth();
      if (!containerWidth) return;
      
      // 计算列宽数组
      const columnWidths = this.calculateColumnWidths(containerWidth);
      
      // 布局新增的项目
      for (let i = oldItemsCount; i < newItems.length; i++) {
        const item = newItems[i];
        this.layoutItem(item, columnWidths);
      }
      
      this.items = newItems;
    }
  }

  /**
   * 清空所有项目
   */
  clear() {
    this.innerHTML = '';
    this.items = [];
    this.columns = new Array(this.columnCount).fill(0);
    this.updateContainerHeight();
    this.hasMore = true;
    this.loading = false;
    
    // 重新连接 observer（如果之前断开了）
    if (this.observer) {
      const trigger = this.shadowRoot.querySelector('.loading-trigger');
      this.observer.disconnect();
      this.observer.observe(trigger);
      
      // 检查是否需要立即加载
      setTimeout(() => {
        const rect = trigger.getBoundingClientRect();
        const isInViewport = rect.top < window.innerHeight + 200;
        
        if (isInViewport && !this.loading && this.hasMore) {
          this.handleLoadMore();
        }
      }, 100);
    }
  }
}

// 注册自定义元素
customElements.define('waterfall-flow', WaterfallFlow);
