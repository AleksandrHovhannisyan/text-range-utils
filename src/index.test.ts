/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from "vitest";
import { getTextNodesInRange } from "./index.js";

describe("getTextNodesInRange", () => {
  test('returns all selected text nodes', () => {
    const p = document.createElement('p');
    const [text1, text2] = [document.createTextNode('hello '), document.createTextNode('world')];
    const strong = document.createElement('strong');
    strong.appendChild(text2);;
    p.appendChild(text1);
    p.appendChild(strong);
    const range = new Range();
    range.selectNodeContents(p);
    expect(getTextNodesInRange(range)).toStrictEqual([text1, text2]);  
  })
});
