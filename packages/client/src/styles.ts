// packages/client/src/styles.ts
const STYLES = `
.sa-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 99998;
  pointer-events: none;
  transition: opacity 0.3s;
}

.sa-highlight {
  position: relative;
  z-index: 99999;
  box-shadow: 0 0 0 4px #4f96ff, 0 0 20px rgba(79, 150, 255, 0.5);
  border-radius: 4px;
  transition: box-shadow 0.3s;
}

.sa-tooltip {
  position: absolute;
  z-index: 100000;
  background: #1a1a2e;
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  max-width: 250px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  animation: sa-fade-in 0.2s ease;
}

.sa-step-indicator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100000;
  background: #1a1a2e;
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

@keyframes sa-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
`

export function injectStyles(): void {
  if (document.querySelector('style[data-sa]')) return
  const style = document.createElement('style')
  style.setAttribute('data-sa', '')
  style.textContent = STYLES
  document.head.appendChild(style)
}
