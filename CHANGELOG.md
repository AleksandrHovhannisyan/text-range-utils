# text-range-utils

## 2.1.0

### Minor changes

- 18b5b31: Add getTextNodes util

## 2.0.2

### Patch Changes

- dd81a88: Loosen typing for disallowedAncestorTags

## 2.0.1

### Patch Changes

- 41f32d5: fixes typo in documentation

## 2.0.0

### Major Changes

- 348f8af: - (Breaking) Updated `wrapTextNode` to no longer ignore empty text nodes or whitespace-only text nodes. If you want to ignore these text nodes, you should check `node` yourself before calling `wrapTextNode`. This gives you greater control over the function's behavior.
  - Added stricter typing for `disallowedAncestorTags` for better auto-complete of HTML tag names (previously `string[]`).
  - Added a new option to `wrapRangeTextNodes` and `wrapSelectedTextNodes` to: `shouldWrapNode`. Use this to filter/ignore nodes.
  - Updated documentation.
