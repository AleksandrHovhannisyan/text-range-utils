export type GetTextNodesOptions = {
  /** Any text node that is a descendant of one of these tags will be ignored. */
  disallowedAncestorTags?: (keyof HTMLElementTagNameMap)[];
};

export type WrapTextNodeOptions = {
  /** The character offset to start from (inclusive). If not specified, wraps from beginning of node. */
  startOffset?: number;
  /** The character to end at (exclusive). If not specified, wraps until end of node. */
  endOffset?: number;
};

export type WrapRangeTextNodesOptions = GetTextNodesOptions & {
  /** Optional callback to filter which text nodes are wrapped. If this function returns `true`, `node` will be wrapped; else, it will be ignored. */
  shouldWrapNode?: (node: Text) => boolean;
}

/** A callback that unwraps a node. */
export type UnwrapFn = () => void;

/** Returns all of the text nodes that intersect with the given range.
 * @param range The Range to search for text nodes.
 * @param options Customization options for node searching behavior.
 */
export function getTextNodesInRange(
  range: Range,
  options?: GetTextNodesOptions
): Text[] {
  const { disallowedAncestorTags } = {
    ...options,
  };
  const textNodes: Text[] = [];

  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    (node: Node) => {
      const immediateParent = node.parentElement;
      if (
        immediateParent &&
        disallowedAncestorTags?.some(
          (tag) => !!immediateParent.closest(tag.toLowerCase())
        )
      ) {
        return NodeFilter.FILTER_REJECT;
      }
      return range.intersectsNode(node)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    }
  );
  // commonAncestorContainer would be a text node only if the range encompasses pure text. Otherwise, if it spans element boundaries, get nextNode.
  let currentNode =
    walker.currentNode.nodeType === Node.TEXT_NODE
      ? walker.currentNode
      : walker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode as Text);
    currentNode = walker.nextNode();
  }
  return textNodes;
}

/** Returns all text nodes that are partially or fully selected.
 * @param selection A selection spanning the text nodes to return.
 * @param options Customization options.
 */
export function getSelectedTextNodes(
  selection: Selection,
  options?: GetTextNodesOptions
): Text[] {
  const allTextNodes: Text[] = [];
  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i);
    const textNodesInRange = getTextNodesInRange(range, options);
    allTextNodes.push(...textNodesInRange);
  }
  return allTextNodes;
}

/** Wraps the given node's contents in the range `[startOffset, endOffset)`. Returns a function to unwrap the text node.
 * @param node The text node to wrap.
 * @param wrapperElement Element with which to wrap the text node. The node will be cloned before wrapping.
 * @param options Customization options
 */
export function wrapTextNode(
  node: Text,
  wrapperElement: Node,
  options?: WrapTextNodeOptions
): UnwrapFn {
  // Ignore non-text nodes.
  if (node.nodeType !== Node.TEXT_NODE) {
    return () => {};
  }

  // Select appropriate portion of the text node
  const range = document.createRange();
  range.selectNodeContents(node);
  if (typeof options?.startOffset !== "undefined") {
    range.setStart(node, options.startOffset);
  }
  if (typeof options?.endOffset !== "undefined") {
    range.setEnd(node, options?.endOffset);
  }

  // Finally, wrap it
  const newParent = wrapperElement.cloneNode(true);
  range.surroundContents(newParent);

  return function unwrapTextNode() {
    const parent = newParent.parentNode;
    if (parent) {
      // First child is the node we wrapped
      parent.insertBefore(newParent.firstChild!, newParent);
      parent.removeChild(newParent);
    }
  };
}

/** Wraps each text node in a range with the given wrapper element. Returns a function to unwrap each wrapped text node.
 * @param range A Range spanning the text nodes to wrap.
 * @param wrapper An element with which to wrap each text node.
 * @param options Customization options.
 */
export function wrapRangeTextNodes(
  range: Range,
  wrapper: HTMLElement,
  options?: WrapRangeTextNodesOptions
): UnwrapFn {
  const { shouldWrapNode, ...getTextNodeOptions } = { ...options };
  const unwrapCallbacks: UnwrapFn[] = [];
  const selectedTextNodes = getTextNodesInRange(range, getTextNodeOptions);
  selectedTextNodes.forEach((node) => {
    if (typeof shouldWrapNode !== 'undefined' && !shouldWrapNode(node)) {
      return;
    }
    let startOffset =
      node === range.startContainer ? range.startOffset : undefined;
    let endOffset = node === range.endContainer ? range.endOffset : undefined;
    const unwrap = wrapTextNode(node, wrapper, { startOffset, endOffset });
    unwrapCallbacks.push(unwrap);
  });
  return function unwrapRangeTextNodes() {
    unwrapCallbacks.forEach((unwrap) => unwrap());
  };
}

/** Wraps each eligible text node in the selection with the given wrapper element. Returns a function to unwrap each wrapped text node.
 * @param selection A selection spanning the text nodes to wrap.
 * @param wrapper The HTML element with which to wrap each eligible text node.
 * @param options Customization options.
 */
export function wrapSelectedTextNodes(
  selection: Selection,
  wrapper: HTMLElement,
  options?: WrapRangeTextNodesOptions
): UnwrapFn {
  const unwrapCallbacks: UnwrapFn[] = [];
  // Firefox supports multiple ranges
  for (let rangeIndex = 0; rangeIndex < selection.rangeCount; rangeIndex++) {
    const range = selection.getRangeAt(rangeIndex);
    const unwrap = wrapRangeTextNodes(range, wrapper, options);
    unwrapCallbacks.push(unwrap);
  }
  return function unwrapSelectedTextNodes() {
    unwrapCallbacks.forEach((unwrap) => unwrap());
  };
}
