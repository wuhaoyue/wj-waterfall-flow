/**
 * Waterfall Flow Web Component
 * @package wj-waterfall-flow
 */

import { WaterfallFlow } from './components/WaterfallFlow';

// Check if running in browser environment
const isBrowser = typeof window !== 'undefined' && typeof customElements !== 'undefined';

// Register the custom element only in browser
if (isBrowser && !customElements.get('waterfall-flow')) {
  customElements.define('waterfall-flow', WaterfallFlow);
}

// Export types and component
export { WaterfallFlow } from './components/WaterfallFlow';
export type {
  WaterfallFlowOptions,
  ItemMetadata,
  LoadMoreDetail,
  LoadMoreCallback,
  WaterfallFlowElement,
} from './types';

// Default export
export default WaterfallFlow;

