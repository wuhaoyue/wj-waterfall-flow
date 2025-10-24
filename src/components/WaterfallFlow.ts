/**
 * Waterfall Flow Web Component
 * High-performance waterfall layout with infinite scroll
 */

import { debounce, parseSizeValue } from '../utils/helpers';
import type { LoadMoreCallback, LoadMoreDetail } from '../types';
import { styles } from './styles';

interface AdjustmentTask {
  item: HTMLElement;
  columnIndex: number;
  itemTop: number;
  estimatedHeight: number;
}

export class WaterfallFlow extends HTMLElement {
  // Configuration
  columns: number[] = [];
  columnCount: number = 3;
  rowGap: number = 10;
  columnGap: number = 10;
  minColumnWidth: number = 200;
  loading: boolean = false;
  hasMore: boolean = true;
  items: HTMLElement[] = [];
  observer: IntersectionObserver | null = null;
  loadMoreCallback: LoadMoreCallback | null = null;
  lastContentWidth: number = 0;
  updateTimer: number | null = null;
  adjustQueue: Set<AdjustmentTask> = new Set();
  isProcessingAdjustments: boolean = false;
  resizeTimer: number | null = null;
  lastLoadTime: number = 0;
  lastItemCount: number = 0;

  // Bound methods
  private handleResize: () => void;
  private handleLoadMore: () => void;
  private debouncedUpdateContainerHeight: () => void;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Bind methods
    this.handleResize = this._handleResize.bind(this);
    this.handleLoadMore = this._handleLoadMore.bind(this);
    this.debouncedUpdateContainerHeight = debounce(
      this.updateContainerHeight.bind(this),
      16
    );
  }

  static get observedAttributes(): string[] {
    return ['row-gap', 'column-gap', 'min-column-width', 'columns'];
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (oldValue === newValue) return;

    switch (name) {
      case 'row-gap':
        this.rowGap = parseSizeValue(newValue);
        if (this.items.length > 0) {
          requestAnimationFrame(() => this.relayout());
        }
        break;
      case 'column-gap':
        this.columnGap = parseSizeValue(newValue);
        if (this.items.length > 0) {
          requestAnimationFrame(() => this.relayout());
        }
        break;
      case 'min-column-width':
        this.minColumnWidth = parseSizeValue(newValue);
        this.calculateColumns();
        if (this.items.length > 0) {
          requestAnimationFrame(() => this.relayout());
        }
        break;
      case 'columns':
        this.columnCount = parseInt(newValue || '3') || 3;
        if (this.items.length > 0) {
          requestAnimationFrame(() => this.relayout());
        }
        break;
    }
  }

  connectedCallback(): void {
    this.render();
    this.setupEventListeners();
    this.setupIntersectionObserver();
  }

  disconnectedCallback(): void {
    this.removeEventListeners();
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    if (this.updateTimer) clearTimeout(this.updateTimer);
    this.adjustQueue.clear();
  }

  private render(): void {
    if (!this.shadowRoot) return;
    
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="waterfall-container">
        <slot></slot>
      </div>
      <div class="loading-trigger"></div>
    `;
  }

  private setupIntersectionObserver(): void {
    if (!this.shadowRoot) return;
    
    const trigger = this.shadowRoot.querySelector('.loading-trigger') as HTMLElement;
    if (!trigger) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          console.log('👀 IntersectionObserver 触发:', {
            isIntersecting: entry.isIntersecting,
            loading: this.loading,
            hasMore: this.hasMore
          });
          
          if (entry.isIntersecting && !this.loading && this.hasMore) {
            console.log('✅ 条件满足，触发加载');
            this.handleLoadMore();
          }
        });
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0,
      }
    );

    this.observer.observe(trigger);

    // Initial check - 只在初始化时检查一次
    setTimeout(() => {
      const rect = trigger.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight + 200;

      if (isInViewport && !this.loading && this.hasMore && this.items.length === 0) {
        console.log('🚀 初始化：触发首次加载');
        this.handleLoadMore();
      }
    }, 100);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize);

    const slot = this.shadowRoot?.querySelector('slot:not([name])');
    if (slot) {
      slot.addEventListener('slotchange', () => {
        this.onItemsChange();
      });
    }
  }

  private removeEventListeners(): void {
    window.removeEventListener('resize', this.handleResize);
  }

  private getContentWidth(): number {
    const container = this.shadowRoot?.querySelector('.waterfall-container') as HTMLElement;
    if (!container) return this.offsetWidth;
    return container.clientWidth || this.clientWidth || this.offsetWidth;
  }

  private calculateColumns(): void {
    const containerWidth = this.getContentWidth();
    if (!containerWidth) return;

    if (this.hasAttribute('columns')) {
      this.columnCount = parseInt(this.getAttribute('columns') || '3') || 3;
      return;
    }

    const possibleColumns = Math.floor(
      (containerWidth + this.columnGap) / (this.minColumnWidth + this.columnGap)
    );
    this.columnCount = Math.max(1, possibleColumns);
  }


  private layoutItems(): void {
    const containerWidth = this.getContentWidth();
    if (!this.items.length || !containerWidth) return;

    const columnWidths = this.calculateColumnWidths(containerWidth);

    this.items.forEach((item) => {
      this.layoutItem(item, columnWidths);
    });
  }

  private calculateColumnWidths(containerWidth: number): number[] {
    const totalGap = this.columnGap * (this.columnCount - 1);
    const availableWidth = containerWidth - totalGap;
    const baseColumnWidth = Math.floor(availableWidth / this.columnCount);

    const remainder = availableWidth - baseColumnWidth * this.columnCount;

    const columnWidths: number[] = [];
    for (let i = 0; i < this.columnCount; i++) {
      columnWidths.push(baseColumnWidth + (i < remainder ? 1 : 0));
    }

    return columnWidths;
  }

  private layoutItem(item: HTMLElement, columnWidths: number[] | number): void {
    const minHeight = Math.min(...this.columns);
    const columnIndex = this.columns.indexOf(minHeight);

    const itemWidth = Array.isArray(columnWidths)
      ? columnWidths[columnIndex]
      : columnWidths;

    let left = 0;
    if (Array.isArray(columnWidths)) {
      for (let i = 0; i < columnIndex; i++) {
        left += columnWidths[i] + this.columnGap;
      }
    } else {
      left = columnIndex * (columnWidths + this.columnGap);
    }

    const top = this.columns[columnIndex];

    item.style.width = `${itemWidth}px`;
    item.style.maxWidth = `${itemWidth}px`;
    item.style.minWidth = `${itemWidth}px`;
    item.style.left = `${left}px`;
    item.style.top = `${top}px`;
    item.style.position = 'absolute';
    item.style.boxSizing = 'border-box';
    item.style.overflow = 'hidden';

    item.dataset.columnIndex = String(columnIndex);
    item.dataset.itemTop = String(top);

    // Force reflow
    void item.offsetHeight;

    const initialHeight = item.offsetHeight;
    const images = item.querySelectorAll('img');
    const hasUnloadedImages = Array.from(images).some((img) => !img.complete);

    if (hasUnloadedImages) {
      const estimatedHeight = initialHeight > 0 ? initialHeight : 200;
      this.columns[columnIndex] += estimatedHeight + this.rowGap;
      this.debouncedUpdateContainerHeight();

      this.adjustItemAfterImageLoad(item, columnIndex, top, estimatedHeight);
    } else {
      if (initialHeight > 0) {
        this.columns[columnIndex] += initialHeight + this.rowGap;
        this.debouncedUpdateContainerHeight();
      }
    }
  }

  private adjustItemAfterImageLoad(
    item: HTMLElement,
    columnIndex: number,
    itemTop: number,
    estimatedHeight: number
  ): void {
    const images = item.querySelectorAll('img');
    if (images.length === 0) return;

    const imagePromises = Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(resolve, 5000);
      });
    });

    Promise.all(imagePromises).then(() => {
      this.adjustQueue.add({
        item,
        columnIndex,
        itemTop,
        estimatedHeight,
      });
      this.processBatchAdjustments();
    });
  }

  private processBatchAdjustments(): void {
    if (this.isProcessingAdjustments) return;

    this.isProcessingAdjustments = true;

    requestAnimationFrame(() => {
      const adjustments = Array.from(this.adjustQueue);
      this.adjustQueue.clear();

      const columnGroups: Record<number, AdjustmentTask[]> = {};
      adjustments.forEach((adj) => {
        if (!columnGroups[adj.columnIndex]) {
          columnGroups[adj.columnIndex] = [];
        }
        columnGroups[adj.columnIndex].push(adj);
      });

      Object.keys(columnGroups).forEach((colIdx) => {
        const columnIndex = parseInt(colIdx);
        const colAdjustments = columnGroups[columnIndex];

        colAdjustments.sort((a, b) => a.itemTop - b.itemTop);

        colAdjustments.forEach((adj) => {
          const actualHeight = adj.item.offsetHeight;
          const heightDiff = actualHeight - adj.estimatedHeight;

          if (Math.abs(heightDiff) > 1) {
            this.columns[columnIndex] += heightDiff;
            this.adjustItemsAfter(adj.item, heightDiff, columnIndex);
          }
        });
      });

      if (adjustments.length > 0) {
        this.updateContainerHeight();
      }

      this.isProcessingAdjustments = false;

      if (this.adjustQueue.size > 0) {
        this.processBatchAdjustments();
      }
    });
  }

  private adjustItemsAfter(
    changedItem: HTMLElement,
    heightDiff: number,
    columnIndex: number
  ): void {
    const changedTop = parseFloat(changedItem.dataset.itemTop || '0');

    this.items.forEach((item) => {
      if (item === changedItem) return;

      const itemColumn = parseInt(item.dataset.columnIndex || '0');
      const itemTop = parseFloat(item.dataset.itemTop || '0');

      if (itemColumn === columnIndex && itemTop > changedTop) {
        const newTop = itemTop + heightDiff;
        item.style.top = `${newTop}px`;
        item.dataset.itemTop = String(newTop);
      }
    });
  }

  private updateContainerHeight(): void {
    const maxHeight = Math.max(...this.columns, 0);
    const container = this.shadowRoot?.querySelector('.waterfall-container') as HTMLElement;
    if (container) {
      container.style.height = `${maxHeight}px`;
    }
  }

  relayout(): void {
    const containerWidth = this.getContentWidth();
    if (!containerWidth || !this.items.length) return;

    this.lastContentWidth = containerWidth;
    this.calculateColumns();
    this.columns = new Array(this.columnCount).fill(0);

    const columnWidths = this.calculateColumnWidths(containerWidth);

    this.items.forEach((item) => {
      this.layoutItem(item, columnWidths);
    });
  }

  private _handleResize(): void {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      const oldColumnCount = this.columnCount;
      const oldWidth = this.lastContentWidth || 0;
      const newWidth = this.getContentWidth();

      this.calculateColumns();

      if (oldColumnCount !== this.columnCount || Math.abs(oldWidth - newWidth) > 1) {
        this.lastContentWidth = newWidth;
        this.relayout();
      }
    }, 150);
  }

  private _handleLoadMore(): void {
    if (this.loading || !this.hasMore) {
      if (this.loading) {
        console.log('⏸️ 已在加载中，跳过此次请求');
      }
      if (!this.hasMore) {
        console.log('⏹️ 没有更多数据，停止加载');
      }
      return;
    }

    // 防抖：避免短时间内重复触发（500ms 内只能触发一次）
    const now = Date.now();
    const timeSinceLastLoad = now - this.lastLoadTime;
    if (this.lastLoadTime > 0 && timeSinceLastLoad < 500) {
      console.log('⏸️ 距离上次加载太近，跳过此次请求', {
        timeSinceLastLoad: `${timeSinceLastLoad}ms`,
        itemCount: this.items.length
      });
      return;
    }

    console.log('🚀 触发 load-more 事件...', {
      currentItems: this.items.length,
      timeSinceLastLoad: this.lastLoadTime > 0 ? `${timeSinceLastLoad}ms` : '首次加载'
    });
    this.loading = true;
    this.lastLoadTime = now;

    // 触发自定义事件，让外部通过事件监听处理
    const event = new CustomEvent<LoadMoreDetail>('load-more', {
      detail: {
        currentCount: this.items.length,
        finishLoading: this.finishLoading.bind(this),
      },
      bubbles: true,
      composed: true,
    });

    this.dispatchEvent(event);
    
    // 如果事件被阻止了默认行为，说明外部正在处理
    // 否则，尝试调用全局函数作为向后兼容
    if (!event.defaultPrevented) {
      const callbackName = this.getAttribute('onLoadMore');
      if (callbackName && typeof (window as any)[callbackName] === 'function') {
        this.loadMoreCallback = (window as any)[callbackName];
        if (this.loadMoreCallback) {
          this.loadMoreCallback(this);
        }
      } else {
        // 如果没有监听器也没有全局函数，标记加载完成
        console.warn(
          'waterfall-flow: 没有找到 load-more 事件监听器或 onLoadMore 回调函数。' +
          '请使用 @load-more 或 addEventListener("load-more", handler) 来处理加载。'
        );
        this.finishLoading(false);
      }
    }
  }

  finishLoading(hasMore: boolean = true): void {
    this.loading = false;
    this.hasMore = hasMore;

    if (!hasMore) {
      // 没有更多数据时，断开观察器
      if (this.observer) {
        this.observer.disconnect();
      }
    } else {
      // 有更多数据时，等待布局稳定后检查是否需要继续加载
      // 使用多个 requestAnimationFrame 确保 DOM 完全更新
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const trigger = this.shadowRoot?.querySelector('.loading-trigger');
            if (trigger && this.observer) {
              // 重新观察 trigger 以确保 IntersectionObserver 能够再次触发
              this.observer.unobserve(trigger);
              this.observer.observe(trigger);
              
              // 检查是否有新的项目被添加（确保 DOM 已更新）
              const currentItemCount = this.items.length;
              const itemsAdded = currentItemCount - this.lastItemCount;
              
              console.log('📊 finishLoading 检查', {
                currentItemCount,
                lastItemCount: this.lastItemCount,
                itemsAdded
              });
              
              // 如果没有新项目被添加到 items 数组，说明可能出了问题，不继续加载
              if (itemsAdded <= 0) {
                console.warn('⚠️ 没有检测到新项目，跳过自动加载');
                this.lastItemCount = currentItemCount;
                return;
              }
              
              // 更新记录
              this.lastItemCount = currentItemCount;
              
              // 检查容器高度是否足够，只有在内容不足时才主动触发加载
              const container = this.shadowRoot?.querySelector('.waterfall-container') as HTMLElement;
              if (container) {
                const containerHeight = container.offsetHeight;
                const viewportHeight = window.innerHeight;
                
                // 只有当容器高度小于视口高度的 1.5 倍时，才主动检查是否需要继续加载
                if (containerHeight < viewportHeight * 1.5) {
                  const rect = trigger.getBoundingClientRect();
                  const isInViewport = rect.top < window.innerHeight + 200;

                  if (isInViewport && !this.loading && this.hasMore) {
                    console.log('🔄 内容不足，继续加载...', {
                      containerHeight,
                      viewportHeight,
                      ratio: (containerHeight / viewportHeight).toFixed(2),
                      itemsAdded
                    });
                    this.handleLoadMore();
                  }
                } else {
                  console.log('✅ 内容充足，依赖滚动触发', {
                    containerHeight,
                    viewportHeight,
                    ratio: (containerHeight / viewportHeight).toFixed(2)
                  });
                }
              }
            }
          }, 800); // 进一步增加延迟，确保 Vue/React 的异步渲染完成
        });
      });
    }
  }

  private onItemsChange(): void {
    const slot = this.shadowRoot?.querySelector('slot:not([name])');
    if (!slot) return;

    const newItems = Array.from((slot as HTMLSlotElement).assignedElements()).filter(
      (el) => el.classList.contains('waterfall-item')
    ) as HTMLElement[];

    const oldItemsCount = this.items.length;

    if (oldItemsCount === 0 && newItems.length > 0) {
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

    if (newItems.length > oldItemsCount) {
      const containerWidth = this.getContentWidth();
      if (!containerWidth) return;

      const columnWidths = this.calculateColumnWidths(containerWidth);

      for (let i = oldItemsCount; i < newItems.length; i++) {
        const item = newItems[i];
        this.layoutItem(item, columnWidths);
      }

      this.items = newItems;
    }
  }

  clear(): void {
    this.innerHTML = '';
    this.items = [];
    this.columns = new Array(this.columnCount).fill(0);
    this.updateContainerHeight();
    this.hasMore = true;
    this.loading = false;
    this.lastLoadTime = 0; // 重置加载时间
    this.lastItemCount = 0; // 重置项目计数

    if (this.observer) {
      const trigger = this.shadowRoot?.querySelector('.loading-trigger');
      if (trigger) {
        this.observer.disconnect();
        this.observer.observe(trigger);

        // 清空后等待一段时间再检查，只触发一次初始加载
        setTimeout(() => {
          // 确保没有正在加载，且 items 为空（真的是清空状态）
          if (!this.loading && this.hasMore && this.items.length === 0) {
            const rect = trigger.getBoundingClientRect();
            const isInViewport = rect.top < window.innerHeight + 200;

            if (isInViewport) {
              console.log('🔄 清空后触发初始加载');
              this.handleLoadMore();
            }
          }
        }, 300); // 增加延迟时间，与 finishLoading 保持一致
      }
    }
  }
}

