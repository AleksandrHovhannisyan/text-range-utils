---
"text-range-utils": major
---

- (Breaking) Updated `wrapTextNode` to no longer ignore empty text nodes or whitespace-only text nodes. If you want to ignore these text nodes, you should check `node` yourself before calling `wrapTextNode`. This gives you greater control over the function's behavior.
- Added stricter typing for `disallowedAncestorTags` for better auto-complete of HTML tag names (previously `string[]`).
- Added a new option to `wrapRangeTextNodes` and `wrapSelectedTextNodes` to: `shouldWrapNode`. Use this to filter/ignore nodes.
- Updated documentation.