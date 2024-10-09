/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from "vitest";
import { getTextNodesInRange } from "./index.js";

describe("getTextNodesInRange", () => {
  const p = document.createElement("p");
  const [text1, text2, text3] = [
    document.createTextNode("hello "),
    document.createTextNode("wo"),
    document.createTextNode("rld"),
  ];
  const anchor = document.createElement("a");
  anchor.href = "https://example.com";
  const strong = document.createElement("strong");
  strong.appendChild(text2);
  anchor.appendChild(strong);
  anchor.appendChild(text3);
  p.appendChild(text1);
  p.appendChild(anchor);

  test("returns all selected text nodes", () => {
    const range = new Range();
    expect(getTextNodesInRange(range)).toStrictEqual([]);
    range.selectNodeContents(p);
    expect(getTextNodesInRange(range)).toStrictEqual([text1, text2, text3]);

    // "hello "
    range.setStart(text1, 0);
    range.setEnd(text1, text1.length);
    expect(getTextNodesInRange(range)).toStrictEqual([text1]);

    // "hello "
    range.setStart(text1, text1.length);
    range.setEnd(anchor, 0);
    expect(getTextNodesInRange(range)).toStrictEqual([text1]);

    // "hello w"
    range.setStart(text1, 0);
    range.setEnd(text2, 1);
    expect(getTextNodesInRange(range)).toStrictEqual([text1, text2]);

    // "hello world"
    range.setStart(text1, 0);
    range.setEnd(anchor, 2);
    expect(getTextNodesInRange(range)).toStrictEqual([text1, text2, text3]);

    // "or"
    range.setStart(text2, 1);
    range.setEnd(text3, 1);
    expect(getTextNodesInRange(range)).toStrictEqual([text2, text3]);
  });

  test("respects disallowedAncestorTags", () => {
    const range = new Range();
    range.selectNodeContents(p);

    // empty array is same as not specifying
    expect(
      getTextNodesInRange(range, { disallowedAncestorTags: [] })
    ).toStrictEqual([text1, text2, text3]);

    // ignore <a> tag's child text nodes (text2, text3)
    expect(
      getTextNodesInRange(range, { disallowedAncestorTags: ["a"] })
    ).toStrictEqual([text1]);

    // ignore only <strong> tag's child text nodes (text2)
    expect(
      getTextNodesInRange(range, { disallowedAncestorTags: ["strong"] })
    ).toStrictEqual([text1, text3]);

    // ignore all text nodes
    expect(
      getTextNodesInRange(range, { disallowedAncestorTags: ["p"] })
    ).toStrictEqual([]);
  });
});
