export const HYPERSOFT_INTERACTIVE_SELECTOR = [
  "button", "select", "textarea", "input", "a[href]", "summary",
  "[contenteditable='true']", "[role='button']", "[role='link']",
  "[role='menuitem']", "[role='option']", "[role='checkbox']", "[role='radio']",
  "[role='slider']", "[role='switch']", "[role='tab']"
].join(",");

export function hyperSoftShouldBypassTypingEvent(event, { allowedTargetSelector = "" } = {}) {
  if (!event || event.defaultPrevented) return true;
  if (typeof document !== "undefined" && document.querySelector("dialog[open]")) return true;
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return false;
  if (allowedTargetSelector && target.closest(allowedTargetSelector)) return false;
  return Boolean(target.closest(HYPERSOFT_INTERACTIVE_SELECTOR));
}

export function hyperSoftGetFocusableElements(container) {
  if (!container?.querySelectorAll) return [];
  const selector = [
    "button:not([disabled])", "a[href]", "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])", "textarea:not([disabled])", "summary", "[contenteditable='true']",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");
  return [...container.querySelectorAll(selector)].filter(element => {
    if (element.closest("[hidden], [aria-hidden='true']")) return false;
    const style = typeof getComputedStyle === "function" ? getComputedStyle(element) : null;
    return !style || (style.visibility !== "hidden" && style.display !== "none");
  });
}

export function hyperSoftElementCanReceiveFocus(element) {
  if (!(element instanceof HTMLElement) || !element.isConnected) return false;
  if (element.closest("[hidden], [aria-hidden='true']")) return false;
  const style = typeof getComputedStyle === "function" ? getComputedStyle(element) : null;
  return !style || (style.visibility !== "hidden" && style.display !== "none");
}
