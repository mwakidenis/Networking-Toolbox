import { iconMap } from '$lib/constants/icon-map';

/**
 * Get SVG content for the given icon name
 * @param iconName - The name of the icon to retrieve
 * @returns The SVG content string or undefined if not found
 */
export function getSvgContent(iconName: string): string | undefined {
  return iconMap[iconName];
}

/**
 * Process SVG content for use as favicon
 * @param svgContent - Raw SVG content
 * @param color - Fill color for the SVG (defaults to current theme primary color)
 * @param accentColor - Fill color for elements with "accent-part" class
 * @returns Processed SVG with proper fill color
 */
function processSvgForFavicon(svgContent: string, color: string, accentColor: string = '#6fcdff'): string {
  // Remove existing fill and currentColor attributes, set colors
  let processedSvg = svgContent
    .replace(/fill="currentColor"/g, `fill="${color}"`)
    .replace(/fill="[^"]*"/g, `fill="${color}`)
    .replace(/<path[^>]*>/g, (match) => {
      // Handle accent-part class specially
      if (match.includes('class="accent-part"')) {
        // For accent parts, use the accent color
        if (!match.includes('fill=')) {
          return match.replace('<path', `<path fill="${accentColor}"`);
        } else {
          return match.replace(/fill="[^"]*"/, `fill="${accentColor}"`);
        }
      } else {
        // For regular path elements, use the main color
        if (!match.includes('fill=')) {
          return match.replace('<path', `<path fill="${color}"`);
        }
        return match;
      }
    });

  // Add explicit fill to svg element if it doesn't exist
  if (!processedSvg.includes('<svg') || !processedSvg.includes('fill=')) {
    processedSvg = processedSvg.replace('<svg', `<svg fill="${color}"`);
  }

  return processedSvg;
}

/**
 * Get the current CSS --color-primary variable value
 * @returns The CSS variable value or fallback color
 */
export function getPrimaryColor(): string {
  const fallbackColor = '#e3ed70';
  if (typeof window === 'undefined') return fallbackColor;
  const computedStyle = getComputedStyle(document.documentElement);
  const colorValue = computedStyle.getPropertyValue('--color-primary').trim();
  return colorValue || fallbackColor;
}

/**
 * Generate a favicon data URI from an icon name
 * @param iconName - The name of the icon to use
 * @param color - Fill color for the icon (defaults to current CSS primary color)
 * @param accentColor - Fill color for elements with "accent-part" class (defaults to red)
 * @returns Data URI string for use in link[rel="icon"] or null if icon not found
 */
export function generateFaviconDataUri(iconName: string, color?: string, accentColor?: string): string | null {
  const svgContent = getSvgContent(iconName);
  if (!svgContent) {
    return null;
  }
  const faviconColor = color || getPrimaryColor();
  const processedSvg = processSvgForFavicon(svgContent, faviconColor, accentColor);
  const encodedSvg = encodeURIComponent(processedSvg);
  return `data:image/svg+xml,${encodedSvg}`;
}
