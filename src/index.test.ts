/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach } from "vitest";
import {
  getTextNodesInRange,
  wrapSelectedTextNodes,
  wrapTextNode,
  getRangesOfText,
} from "./index.js";

beforeEach(() => {
  document.body.innerHTML = '';
  window.getSelection()?.removeAllRanges();
})

describe("getTextNodesInRange", () => {
  const p = document.createElement("p");
  const [text1, text2, text3] = [
    document.createTextNode("text1"),
    document.createTextNode("text2"),
    document.createTextNode("text3"),
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

    range.setStart(text1, 0);
    range.setEnd(text1, text1.length);
    expect(getTextNodesInRange(range)).toStrictEqual([text1]);

    range.setStart(text1, text1.length);
    range.setEnd(anchor, 0);
    expect(getTextNodesInRange(range)).toStrictEqual([text1]);

    range.setStart(text1, 0);
    range.setEnd(text2, 1);
    expect(getTextNodesInRange(range)).toStrictEqual([text1, text2]);

    range.setStart(text1, 0);
    range.setEnd(anchor, 2);
    expect(getTextNodesInRange(range)).toStrictEqual([text1, text2, text3]);

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

  test("wraps empty text nodes", () => {
    const parent = document.createElement("p");
    const text = document.createTextNode("");
    parent.appendChild(text);

    const wrapper = document.createElement("span");
    wrapper.classList.add('wrapper');
    wrapTextNode(text, wrapper);
    expect(parent.innerHTML).toStrictEqual('<span class="wrapper"></span>');
  });

  test("wraps and unwraps full text node", () => {
    const parent = document.createElement("p");
    const text = document.createTextNode("text");
    parent.appendChild(text);
    document.body.appendChild(parent);
    expect(text.parentElement).toStrictEqual(parent);

    const wrapper = document.createElement("span");
    wrapper.classList.add("wrapper");
    const unwrapTextNode = wrapTextNode(text, wrapper);
    expect(parent.innerHTML).toStrictEqual('<span class="wrapper">text</span>');
    unwrapTextNode();
    expect(parent.innerHTML).toStrictEqual("text");
  });

  test("wraps and unwraps partially selected text", () => {
    const parent = document.createElement("p");
    const [text1, text2, text3] = [
      document.createTextNode("text1"),
      document.createTextNode("text2"),
      document.createTextNode("text3"),
    ];
    parent.appendChild(text1);
    parent.appendChild(text2);
    parent.appendChild(text3);
    expect(text1.parentElement).toStrictEqual(parent);

    const wrapper = document.createElement("span");
    wrapper.classList.add("wrapper");
    const unwrapTextNode = wrapTextNode(text2, wrapper, {
      startOffset: 1,
      endOffset: 4,
    });
    expect(parent.innerHTML).toStrictEqual('text1t<span class="wrapper">ext</span>2text3');
    unwrapTextNode();
    expect(parent.innerHTML).toStrictEqual("text1text2text3");
  });
});

describe("wrapSelectedTextNodes", () => {
  test("wraps and unwraps text nodes in selection", () => {
    const [text1, text2, text3, text4] = [
      document.createTextNode("text1"),
      document.createTextNode("text2"),
      document.createTextNode("text3"),
      document.createTextNode("text4"),
    ];
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
    expect(document.body.innerHTML).toStrictEqual('<div>text1<p><a>text2</a>text3</p>text4</div>');

    const range = new Range();
    range.selectNodeContents(div);
    range.setStart(div, 0);
    range.setEnd(div, 2);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    const wrapper = document.createElement("span");
    wrapper.classList.add("wrapper");
    const unwrapSelectedTextNodes = wrapSelectedTextNodes(selection, wrapper);
    expect(div.innerHTML).toStrictEqual(
      '<span class="wrapper">text1</span><p><a><span class="wrapper">text2</span></a><span class="wrapper">text3</span></p>text4'
    );
    unwrapSelectedTextNodes();
    expect(document.body.innerHTML).toStrictEqual('<div>text1<p><a>text2</a>text3</p>text4</div>');
  });
  test('respects options.disallowedAncestorTags', () => {
    const [text1, text2, text3, text4] = [
      document.createTextNode("text1"),
      document.createTextNode("text2"),
      document.createTextNode("text3"),
      document.createTextNode("text4"),
    ];
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
    expect(document.body.innerHTML).toStrictEqual('<div>text1<p><a>text2</a>text3</p>text4</div>');

    const range = new Range();
    range.selectNodeContents(div);
    range.setStart(div, 0);
    range.setEnd(div, 2);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    const wrapper = document.createElement("span");
    wrapper.classList.add("wrapper");
    const unwrapSelectedTextNodes = wrapSelectedTextNodes(selection, wrapper, { disallowedAncestorTags: ["p"] });
    expect(div.innerHTML).toStrictEqual(
      '<span class="wrapper">text1</span><p><a>text2</a>text3</p>text4'
    );
    unwrapSelectedTextNodes();
    expect(document.body.innerHTML).toStrictEqual('<div>text1<p><a>text2</a>text3</p>text4</div>');
  })
  test("respects options.shouldWrapNode", () => {
    const [text1, text2, text3, text4] = [
      document.createTextNode("text1"),
      document.createTextNode("text2"),
      document.createTextNode("text3"),
      document.createTextNode("text4"),
    ];
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
    expect(document.body.innerHTML).toStrictEqual('<div>text1<p><a>text2</a>text3</p>text4</div>');

    const range = new Range();
    range.selectNodeContents(div);
    range.setStart(div, 0);
    range.setEnd(div, 2);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    const wrapper = document.createElement("span");
    wrapper.classList.add("wrapper");
    const unwrapSelectedTextNodes = wrapSelectedTextNodes(selection, wrapper, { shouldWrapNode: (node) => node.textContent !== 'text2' });
    expect(div.innerHTML).toStrictEqual(
      '<span class="wrapper">text1</span><p><a>text2</a><span class="wrapper">text3</span></p>text4'
    );
    unwrapSelectedTextNodes();
    expect(document.body.innerHTML).toStrictEqual('<div>text1<p><a>text2</a>text3</p>text4</div>');
  });
});

describe("getSubstringRanges", () => {
  test("returns ranges matching the regex", () => {
    const [p1, p2, p3, p4, p5, p6] = [
      document.createElement("p"),
      document.createElement("p"),
      document.createElement("p"),
      document.createElement("p"),
      document.createElement("p"),
      document.createElement("p"),
    ];
    p1.innerHTML = 'I live on 123 Main St in city';
    p2.innerHTML = 'Contact me at test@example.com or (111) 111-1111';
    p3.innerHTML = 'Have you ever been to 123 Main St?';
    p4.innerHTML = 'My SSN is 111-11-1111 and my email is test@example.com in case you forgot';
    p5.innerHTML = '1111 1111 1111 1111 is my credit card number';
    p6.innerHTML = 'My password is password';
    document.body.append(p1, p2, p3, p4, p5, p6);

    const [r1, r2, r3, r4, r5, r6] = [
      getRangesOfText(document.body, /123 Main St/g),
      getRangesOfText(document.body, /test@example\.com/g),
      getRangesOfText(document.body, /\(111\) 111-1111/g),
      getRangesOfText(document.body, /111-11-1111/g),
      getRangesOfText(document.body, /1111 1111 1111 1111/g),
      getRangesOfText(document.body, /password/), // test edge case, only match first occurrence
    ]

    expect(r1).toHaveLength(2);
    expect(r1[0].toString()).toBe('123 Main St');
    expect(r1[0].startContainer.parentElement).toBe(p1);
    expect(r1[1].toString()).toBe('123 Main St');
    expect(r1[1].startContainer.parentElement).toBe(p3);
    
    expect(r2).toHaveLength(2);
    expect(r2[0].toString()).toBe('test@example.com');
    expect(r2[0].startContainer.parentElement).toBe(p2);
    expect(r2[1].toString()).toBe('test@example.com');
    expect(r2[1].startContainer.parentElement).toBe(p4);

    expect(r3).toHaveLength(1);
    expect(r3[0].toString()).toBe('(111) 111-1111');
    expect(r3[0].startContainer.parentElement).toBe(p2);

    expect(r4).toHaveLength(1);
    expect(r4[0].toString()).toBe('111-11-1111');
    expect(r4[0].startContainer.parentElement).toBe(p4);

    expect(r5).toHaveLength(1);
    expect(r5[0].toString()).toBe('1111 1111 1111 1111');
    expect(r5[0].startContainer.parentElement).toBe(p5);

    expect(r6).toHaveLength(1);
    expect(r6[0].toString()).toBe('password');
    expect(r6[0].startContainer.parentElement).toBe(p6);
  });

  test("handles overlapping matches", () => {
    const [t1, t2, t3] = [
      document.createTextNode("aa"),
      document.createTextNode("b"),
      document.createTextNode("aa"),
    ]
    const p = document.createElement("p");
    p.append(t1, t2, t3);
    document.body.append(p);
    
    const ranges = getRangesOfText(document.body, /aba/g);
    expect(ranges).toHaveLength(1);
    expect(ranges[0].toString()).toBe('aba');
    expect(ranges[0].startContainer).toBe(t1);
    expect(ranges[0].startOffset).toBe(1);
  })

  test("returns an empty array if no matches", () => {
    const p = document.createElement("p");
    p.textContent = "This is some sample text without matches.";
    document.body.appendChild(p);

    const ranges = getRangesOfText(document.body, /nomatch/g);
    expect(ranges).toHaveLength(0);
  });
})