/* Tooltip Svelte Action */

export interface TooltipConfig {
  text?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  offset?: number;
}

type TooltipOptions = TooltipConfig | string;

interface TooltipState {
  element: HTMLElement;
  tooltipEl: HTMLElement | null;
  config: TooltipConfig;
  showTimeout: number | null;
  hideTimeout: number | null;
  isVisible: boolean;
}

const defaultConfig: Required<TooltipConfig> = {
  text: '',
  position: 'top',
  delay: 500,
  offset: 8,
};

const tooltipStates = new WeakMap<HTMLElement, TooltipState>();

function createTooltip(text: string): HTMLElement {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip-popup';
  tooltip.textContent = text;
  tooltip.style.cssText = `
    position: absolute;
    z-index: 9999;
    background-color: var(--bg-tooltip, #1a1a1a);
    color: var(--text-tooltip, white);
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    pointer-events: none;
    opacity: 0;
    transform: scale(0.95);
    transition: opacity 0.2s ease-out, transform 0.2s ease-out;
    max-width: 300px;
    white-space: normal;
    line-height: 1.4;
  `;

  // Add arrow
  const arrow = document.createElement('div');
  arrow.className = 'tooltip-arrow';
  arrow.style.cssText = `
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: var(--bg-tooltip, #1a1a1a);
    transform: rotate(45deg);
  `;
  tooltip.appendChild(arrow);

  return tooltip;
}

function positionTooltip(
  element: HTMLElement,
  tooltip: HTMLElement,
  position: TooltipConfig['position'],
  offset: number,
) {
  const elementRect = element.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const arrow = tooltip.querySelector('.tooltip-arrow') as HTMLElement;

  let top = 0;
  let left = 0;

  switch (position) {
    case 'top':
      top = elementRect.top - tooltipRect.height - offset;
      left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
      arrow.style.top = 'calc(100% - 4px)';
      arrow.style.left = '50%';
      arrow.style.transform = 'translateX(-50%) rotate(45deg)';
      break;
    case 'bottom':
      top = elementRect.bottom + offset;
      left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
      arrow.style.top = '-4px';
      arrow.style.left = '50%';
      arrow.style.transform = 'translateX(-50%) rotate(45deg)';
      break;
    case 'left':
      top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
      left = elementRect.left - tooltipRect.width - offset;
      arrow.style.top = '50%';
      arrow.style.left = 'calc(100% - 4px)';
      arrow.style.transform = 'translateY(-50%) rotate(45deg)';
      break;
    case 'right':
      top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
      left = elementRect.right + offset;
      arrow.style.top = '50%';
      arrow.style.left = '-4px';
      arrow.style.transform = 'translateY(-50%) rotate(45deg)';
      break;
  }

  // Keep tooltip within viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (left < 8) left = 8;
  if (left + tooltipRect.width > viewportWidth - 8) left = viewportWidth - tooltipRect.width - 8;
  if (top < 8) top = 8;
  if (top + tooltipRect.height > viewportHeight - 8) top = viewportHeight - tooltipRect.height - 8;

  tooltip.style.top = `${top + window.scrollY}px`;
  tooltip.style.left = `${left + window.scrollX}px`;
}

function showTooltip(state: TooltipState) {
  if (state.isVisible || !state.config.text) return;

  if (state.hideTimeout) {
    clearTimeout(state.hideTimeout);
    state.hideTimeout = null;
  }

  if (!state.tooltipEl) {
    state.tooltipEl = createTooltip(state.config.text);
    document.body.appendChild(state.tooltipEl);
  }

  // Position tooltip
  positionTooltip(state.element, state.tooltipEl, state.config.position!, state.config.offset!);

  // Show with animation
  state.isVisible = true;
  requestAnimationFrame(() => {
    if (state.tooltipEl) {
      state.tooltipEl.style.opacity = '1';
      state.tooltipEl.style.transform = 'scale(1)';
    }
  });
}

function hideTooltip(state: TooltipState) {
  if (!state.isVisible || !state.tooltipEl) return;

  if (state.showTimeout) {
    clearTimeout(state.showTimeout);
    state.showTimeout = null;
  }

  state.isVisible = false;
  state.tooltipEl.style.opacity = '0';
  state.tooltipEl.style.transform = 'scale(0.95)';

  state.hideTimeout = window.setTimeout(() => {
    if (state.tooltipEl) {
      document.body.removeChild(state.tooltipEl);
      state.tooltipEl = null;
    }
    state.hideTimeout = null;
  }, 200);
}

function handleMouseEnter(state: TooltipState) {
  if (state.showTimeout) return;

  state.showTimeout = window.setTimeout(() => {
    showTooltip(state);
    state.showTimeout = null;
  }, state.config.delay);
}

function handleMouseLeave(state: TooltipState) {
  if (state.showTimeout) {
    clearTimeout(state.showTimeout);
    state.showTimeout = null;
  }
  hideTooltip(state);
}

function normalizeOptions(options: TooltipOptions): TooltipConfig {
  if (typeof options === 'string') {
    return { ...defaultConfig, text: options };
  }
  return { ...defaultConfig, ...options };
}

export function tooltip(element: HTMLElement, options: TooltipOptions = {}) {
  let config = normalizeOptions(options);

  // Check for data-tooltip attribute
  if (!config.text && element.hasAttribute('data-tooltip')) {
    config.text = element.getAttribute('data-tooltip') || '';
  }

  const state: TooltipState = {
    element,
    tooltipEl: null,
    config,
    showTimeout: null,
    hideTimeout: null,
    isVisible: false,
  };

  tooltipStates.set(element, state);

  const mouseEnterHandler = () => handleMouseEnter(state);
  const mouseLeaveHandler = () => handleMouseLeave(state);

  element.addEventListener('mouseenter', mouseEnterHandler);
  element.addEventListener('mouseleave', mouseLeaveHandler);

  return {
    update(newOptions: TooltipOptions) {
      config = normalizeOptions(newOptions);

      // Check for data-tooltip attribute
      if (!config.text && element.hasAttribute('data-tooltip')) {
        config.text = element.getAttribute('data-tooltip') || '';
      }

      state.config = config;

      // Update tooltip text if currently visible
      if (state.tooltipEl && state.isVisible) {
        state.tooltipEl.textContent = config.text || '';
      }
    },

    destroy() {
      element.removeEventListener('mouseenter', mouseEnterHandler);
      element.removeEventListener('mouseleave', mouseLeaveHandler);

      if (state.showTimeout) {
        clearTimeout(state.showTimeout);
      }
      if (state.hideTimeout) {
        clearTimeout(state.hideTimeout);
      }

      if (state.tooltipEl) {
        document.body.removeChild(state.tooltipEl);
      }

      tooltipStates.delete(element);
    },
  };
}
