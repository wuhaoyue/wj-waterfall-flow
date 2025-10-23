/**
 * Waterfall Flow Component Types
 */

export interface WaterfallFlowOptions {
  rowGap?: number;
  columnGap?: number;
  minColumnWidth?: number;
  columns?: number;
}

export interface ItemMetadata {
  index: number;
  element: HTMLElement;
  left: number;
  top: number;
  width: number;
  height: number;
  columnIndex: number;
}

export interface LoadMoreDetail {
  currentCount: number;
  finishLoading: (hasMore: boolean) => void;
}

export type LoadMoreCallback = (component: HTMLElement) => void;

export interface WaterfallFlowElement extends HTMLElement {
  finishLoading(hasMore: boolean): void;
  clear(): void;
  relayout(): void;
}

// 声明自定义元素到全局
declare global {
  interface HTMLElementTagNameMap {
    'waterfall-flow': WaterfallFlowElement;
  }
}

