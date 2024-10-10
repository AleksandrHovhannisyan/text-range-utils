/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from "vitest";
import {
  getTextNodesInRange,
  wrapSelectedTextNodes,
  wrapTextNode,
} from "./index.js";

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

describe("wrapTextNode", () => {
  test("ignores non-text nodes", () => {
    const parent = document.createElement("p");
    const child = document.createElement("strong");
    child.textContent = "child";
    parent.appendChild(child);
    wrapTextNode(child as unknown as Text, document.createElement("span"));
    expect(child.parentElement).toStrictEqual(parent);
  });

  test("wraps full text node", () => {
    const parent = document.createElement("p");
    const text = document.createTextNode("wrap me");
    parent.appendChild(text);
    expect(text.parentElement).toStrictEqual(parent);

    const wrapper = document.createElement("span");
    wrapper.classList.add("wrapper");
    wrapTextNode(text, wrapper);
    expect(parent.innerHTML).toStrictEqual(
      '<span class="wrapper">wrap me</span>'
    );
  });

  test("ignores empty text nodes", () => {
    const parent = document.createElement("p");
    const text = document.createTextNode("");
    parent.appendChild(text);

    const wrapper = document.createElement("span");
    wrapTextNode(text, wrapper);
    expect(parent.innerHTML).toStrictEqual("");
  });

  test("wraps partially selected text", () => {
    const parent = document.createElement("p");
    const text = document.createTextNode("wrap me");
    parent.appendChild(text);
    expect(text.parentElement).toStrictEqual(parent);

    const wrapper = document.createElement("span");
    wrapper.classList.add("wrapper");
    wrapTextNode(text, wrapper, { startOffset: 1, endOffset: 4 });
    expect(parent.innerHTML).toStrictEqual(
      'w<span class="wrapper">rap</span> me'
    );
  });
});

describe("wrapSelectedTextNodes", () => {
  test("wraps text nodes in selection", () => {
    const [text1, text2, text3, text4] = [
      document.createTextNode("text1"),
      document.createTextNode("text2"),
      document.createTextNode("text3"),
      document.createTextNode("text4"),
    ];
    // <div>text1<p><a>text2</a>text3</p>text4</div>
    const div = document.createElement("div");
    const p = document.createElement("p");
    const a = document.createElement("a");
    div.appendChild(text1);
    a.appendChild(text2);
    p.appendChild(a);
    p.appendChild(text3);
    div.appendChild(p);
    div.appendChild(text4);
    document.body.appendChild(div);

    const range = new Range();
    range.selectNodeContents(div);
    range.setStart(div, 0);
    range.setEnd(div, 2);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    
    const wrapper = document.createElement("span");
    wrapper.classList.add("wrapper");
    wrapSelectedTextNodes(selection, wrapper);
    expect(div.innerHTML).toStrictEqual(
      '<span class="wrapper">text1</span><p><a><span class="wrapper">text2</span></a><span class="wrapper">text3</span></p>text4'
    );
  });
});
