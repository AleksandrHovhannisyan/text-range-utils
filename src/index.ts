/** Returns all of the text nodes that intersect with the given range. */
export const getTextNodesInRange = (
    range: Range,
    options?: {
      /** (Optional) tag names of parents that should be ignored. If not specified, defaults to `Set(['script', 'style', 'iframe', 'noscript'])`. */
      disallowedParentTags?: Set<string>;
    }
  ): Text[] => {
    const { disallowedParentTags } = {
      disallowedParentTags: new Set(["script", "style", "noscript", "iframe"]),
      ...options,
    };
    const textNodes: Text[] = [];

    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
      (node: Node) => {
        const parentElement = node.parentElement;
        if (
          parentElement &&
          disallowedParentTags.has(parentElement.tagName.toLowerCase())
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
   * @param params Customization options
   */
  export const wrapTextNode = (
    node: Text,
    params: {
      /** Element with which to wrap the text node. */
      wrapperElement: Node;
      /** The character offset to start from (inclusive). If not specified, wraps from beginning of node. */
      startOffset?: number;
      /** The character to end at (exclusive). If not specifies, wraps until end of node. */
      endOffset?: number;
    }
  ) => {
    const { wrapperElement, startOffset, endOffset } = params;
  
    // Ignore pure-whitespace nodes. Do this here rather than in tree walker so that the range start/end offsets line up with the actual first/last text nodes in the range.
    if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
      return;
    }
  
    // Select appropriate portion of the text node
    const range = document.createRange();
    range.selectNodeContents(node);
    if (typeof startOffset !== "undefined") {
      range.setStart(node, startOffset);
    }
    if (typeof endOffset !== "undefined") {
      range.setEnd(node, endOffset);
    }
  
    // Finally, wrap it
    range.surroundContents(wrapperElement);
  };
  