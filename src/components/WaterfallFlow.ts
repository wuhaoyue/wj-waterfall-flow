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
      <div class="loading-container">
        <slot name="loading">
          <div class="default-loading">加载中...</div>
        </slot>
      </div>
    `;
  }

  private setupIntersectionObserver(): void {
    if (!this.shadowRoot) return;
    
    const trigger = this.shadowRoot.querySelector('.loading-trigger') as HTMLElement;
    if (!trigger) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.loading && this.hasMore) {
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

    // Initial check
    setTimeout(() => {
      const rect = trigger.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight + 200;

      if (isInViewport && !this.loading && this.hasMore && this.items.length === 0) {
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
    if (this.loading || !this.hasMore) return;

    this.loading = true;
    this.showLoading();

    const callbackName = this.getAttribute('onLoadMore');
    if (callbackName && typeof (window as any)[callbackName] === 'function') {
      this.loadMoreCallback = (window as any)[callbackName];
    }

    const event = new CustomEvent<LoadMoreDetail>('load-more', {
      detail: {
        currentCount: this.items.length,
        finishLoading: this.finishLoading.bind(this),
      },
      bubbles: true,
      composed: true,
    });

    this.dispatchEvent(event);

    if (this.loadMoreCallback) {
      this.loadMoreCallback(this);
    } else {
      this.finishLoading(false);
    }
  }

  private showLoading(): void {
    const loading = this.shadowRoot?.querySelector('.loading-container') as HTMLElement;
    if (loading) {
      loading.classList.remove('hidden');
    }
  }

  private hideLoading(): void {
    const loading = this.shadowRoot?.querySelector('.loading-container') as HTMLElement;
    if (loading) {
      loading.classList.add('hidden');
    }
  }

  finishLoading(hasMore: boolean = true): void {
    this.loading = false;
    this.hasMore = hasMore;
    this.hideLoading();

    if (!hasMore) {
      if (this.observer) {
        this.observer.disconnect();
      }
    } else {
      setTimeout(() => {
        const trigger = this.shadowRoot?.querySelector('.loading-trigger');
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

    if (this.observer) {
      const trigger = this.shadowRoot?.querySelector('.loading-trigger');
      if (trigger) {
        this.observer.disconnect();
        this.observer.observe(trigger);

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
}

