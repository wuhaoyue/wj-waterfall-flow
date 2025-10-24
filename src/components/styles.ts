/**
 * Waterfall Flow Component Styles
 */

export const styles = `
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
`;

