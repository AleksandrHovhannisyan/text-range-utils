/** Returns all of the text nodes that intersect with the given range. */
export const getTextNodesInRange = (
    range: Range,
    options?: {
      /** If any given text node is a descendant of one of these tags, it will be ignored. */
      disallowedAncestorTags?: string[];
    }
  ): Text[] => {
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
   * @param params Customization options
   */
  export const wrapTextNode = (
    node: Text,
    /** Element with which to wrap the text node. */
    wrapperElement: Node,
    params?: {
      /** The character offset to start from (inclusive). If not specified, wraps from beginning of node. */
      startOffset?: number;
      /** The character to end at (exclusive). If not specifies, wraps until end of node. */
      endOffset?: number;
    }
  ) => {
    // Ignore pure-whitespace nodes. Do this here rather than in tree walker so that the range start/end offsets line up with the actual first/last text nodes in the range.
    if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
      return;
    }
 
    // Select appropriate portion of the text node
    const range = document.createRange();
    range.selectNodeContents(node);
    if (typeof params?.startOffset !== "undefined") {
      range.setStart(node, params.startOffset);
    }
    if (typeof params?.endOffset !== "undefined") {
      range.setEnd(node, params?.endOffset);
    }
  
    // Finally, wrap it
    range.surroundContents(wrapperElement);
  };
  