# text-range-utils

Utils for working with text nodes in Ranges.

## Installation

```
npm install text-range-utils
```

## API

The two basic utils are:

- [`getTextNodesInRange`](#gettextnodesinrangerange-range-options-gettextnodesoptions-text)
- [`wrapTextNode`](#wraptextnodenode-text-wrapperelement-node-options-wraptextnodeoptions-unwrapfn)

You can use these individually, combine them yourself, or use the following composed utils:

- `getSelectedTextNodes`
- `wrapRangeTextNodes`
- `wrapSelectedTextNodes`

See below for details.

### `getTextNodesInRange(range: Range, options?: GetTextNodesOptions): Text[]`

Returns all text nodes that intersect with the given range.

#### Options

```ts
type GetTextNodesOptions = {
  /** Any text node that is a descendant of one of these tags will be ignored. */
  disallowedAncestorTags?: (keyof HTMLElementTagNameMap)[];
};
```

#### Examples

```ts
const range = new Range();
const textNodes = getTextNodesInRange(range, {
  disallowedAncestorTags: ["script", "style", "iframe", "noscript"],
});
```

### `getSelectedTextNodes(selection: Selection, options?: GetTextNodesOptions): Text[]`

- Returns all text nodes that intersect with the given selection.
- Handles selections that have multiple ranges (Firefox).

#### Options

```ts
type GetTextNodesOptions = {
  /** Any text node that is a descendant of one of these tags will be ignored. */
  disallowedAncestorTags?: (keyof HTMLElementTagNameMap)[];
};
```

#### Examples

```ts
const selection = window.getSelection();
if (selection) {
  const textNodes = getSelectedTextNodes(selection, {
    disallowedAncestorTags: ["script", "style", "iframe", "noscript"],
  });
}
```

### `wrapTextNode(node: Text, wrapperElement: Node, options?: WrapTextNodeOptions): UnwrapFn`

- Wraps `node` with `wrapperElement` while preserving all other children and sibling relationships.
- Ignores non-text nodes.
- Returns a function to undo the wrapping.

#### Options

```ts
type WrapTextNodeOptions = {
  /** The character offset to start from (inclusive). If not specified, wraps from beginning of node. */
  startOffset?: number;
  /** The character to end at (exclusive). If not specifies, wraps until end of node. */
  endOffset?: number;
};
```

#### Examples

```ts
const wrapper = document.createElement("span");
wrapper.classList.add("wrapper");
const textNode = document.createTextNode("wrap me");
// wrap <span class="wrapper">m</span>e
const unwrap = wrapTextNode(textNode, wrapper, {
  startOffset: 5,
  endOffset: 6,
});
// wrap me
unwrap();
```

### `wrapRangeTextNodes(range: Range, wrapper: HTMLElement, options?: WrapRangeTextNodesOptions): UnwrapFn`

- Wraps each text node in `range` with the given wrapper.
- Returns a function to undo the wrapping for all text nodes.

#### Options

```ts
type WrapRangeTextNodesOptions = GetTextNodesOptions & {
  /** Optional callback to filter which text nodes are wrapped. If this function returns `true`, `node` will be wrapped; else, it will be ignored. */
  shouldWrapNode?: (node: Text) => boolean;
}
```

#### Examples

```ts
const range = new Range();
const unwrap = wrapRangeTextNodes(range, wrapper);
```

### `wrapSelectedTextNodes(selection: Selection, wrapper: HTMLElement, options?: WrapRangeTextNodesOptions): UnwrapFn`

- Wraps each text node in `selection` with the given wrapper.
- Returns a function to undo the wrapping for all text nodes.

#### Options

```ts
type WrapRangeTextNodesOptions = GetTextNodesOptions & {
  /** Optional callback to filter which text nodes are wrapped. If this function returns `true`, `node` will be wrapped; else, it will be ignored. */
  shouldWrapNode?: (node: Text) => boolean;
}
```

#### Examples

```ts
const selection = window.getSelection();
if (selection) {
  const unwrap = wrapSelectedTextNodes(selection, wrapper);
}
```
