type TextNodeWalkerOptions = {
  /** If any given text node is a descendant of one of these tags, it will be ignored. */
  disallowedAncestorTags?: string[];
};

/** Returns all of the text nodes that intersect with the given range. 
 * @param range The Range to search for text nodes.
 * @param options Customization options for node searching behavior.
*/
export function getTextNodesInRange(
  range: Range,
  options?: TextNodeWalkerOptions
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
        disallowedAncestorTags?.some((tag) => !!immediateParent.closest(tag))
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
};

/** Wraps the given node's contents in the range `[startOffset, endOffset)`.
 * @param node The text node to wrap.
 * @param wrapperElement Element with which to wrap the text node. The node will be cloned before wrapping.
 * @param options Customization options
 */
export function wrapTextNode(
  node: Text,
  wrapperElement: Node,
  options?: {
    /** The character offset to start from (inclusive). If not specified, wraps from beginning of node. */
    startOffset?: number;
    /** The character to end at (exclusive). If not specifies, wraps until end of node. */
    endOffset?: number;
  }
) {
  // Ignore pure-whitespace nodes. Do this here rather than in tree walker so that the range start/end offsets line up with the actual first/last text nodes in the range.
  if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
    return;
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
  range.surroundContents(wrapperElement.cloneNode(true));
};

/** Returns all text nodes that are partially or fully selected.
 * @param selection A selection spanning the text nodes to return.
 * @param options Customization options.
 */
export function getSelectedTextNodes(
  selection: Selection,
  options?: TextNodeWalkerOptions
): Text[] {
  const allTextNodes: Text[] = [];
  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i);
    const textNodesInRange = getTextNodesInRange(range, options);
    allTextNodes.push(...textNodesInRange);
  }
  return allTextNodes;
};

/** Wraps each text node in a range with the given wrapper element.
 * @param range A Range spanning the text nodes to wrap.
 * @param wrapper An element with which to wrap each text node.
 * @param options Customization options.
 */
export function wrapEachTextNodeInRange(
  range: Range,
  wrapper: HTMLElement,
  options?: TextNodeWalkerOptions
) {
  const selectedTextNodes = getTextNodesInRange(range, options);
  selectedTextNodes.forEach((node) => {
    let startOffset =
      node === range.startContainer ? range.startOffset : undefined;
    let endOffset = node === range.endContainer ? range.endOffset : undefined;
    wrapTextNode(node, wrapper, { startOffset, endOffset });
  });
};

/** Wraps each text node in the selection with the given wrapper element.
 * @param selection A selection spanning the text nodes to wrap.
 * @param wrapTextNode A function to wrap each text node.
 * @param options Customization options.
 */
export function wrapSelectedTextNodes(
  selection: Selection,
  wrapper: HTMLElement,
  options?: TextNodeWalkerOptions
) {
  // Firefox supports multiple ranges
  for (let rangeIndex = 0; rangeIndex < selection.rangeCount; rangeIndex++) {
    const range = selection.getRangeAt(rangeIndex);
    wrapEachTextNodeInRange(range, wrapper, options);
  }
};
