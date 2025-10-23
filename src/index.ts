/**
 * Waterfall Flow Web Component
 * @package wj-waterfall-flow
 */

import { WaterfallFlow } from './components/WaterfallFlow';

// Register the custom element
if (!customElements.get('waterfall-flow')) {
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

