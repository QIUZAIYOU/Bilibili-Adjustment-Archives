// ==UserScript==
// @name         ShadowDOMHelper
// @author       QIAN
// @version      0.0.1
// @homepageURL   https://github.com/QIUZAIYOU/Bilibili-Adjustment/edit/main/ShadowDOMHelper.js
// ==/UserScript==

class ShadowDOMHelper {
  static #shadowRoots = new WeakMap(); // 存储 closed 模式的 shadowRoot

  /**
   * 初始化拦截 attachShadow 以捕获 closed 模式的 shadowRoot
   */
  static init() {
    const originalAttachShadow = Element.prototype.attachShadow;

    // 重写 attachShadow 方法以捕获 closed 模式的 shadowRoot
    Element.prototype.attachShadow = function (options) {
      const shadowRoot = originalAttachShadow.call(this, options);
      ShadowDOMHelper.#shadowRoots.set(this, shadowRoot); // 存储到 WeakMap
      return shadowRoot;
    };
  }

  /**
   * 获取 shadowRoot（兼容 open/closed 模式）
   * @param {HTMLElement} host
   * @returns {ShadowRoot|null}
   */
  static getShadowRoot(host) {
    // 优先尝试通过标准接口获取 open 模式的 shadowRoot
    return host.shadowRoot || ShadowDOMHelper.#shadowRoots.get(host) || null;
  }

  /**
   * 查询 shadowDOM 内的元素（支持嵌套）
   * @param {HTMLElement} host - 宿主元素
   * @param {string} selector - CSS 选择器（支持多级，如 ".level1 > .level2"）
   * @returns {HTMLElement|null}
   */
  static querySelector(host, selector) {
    const selectors = selector.split(">").map((s) => s.trim());
    let currentHost = host;

    for (const s of selectors) {
      const shadowRoot = this.getShadowRoot(currentHost);
      if (!shadowRoot) return null;
      currentHost = shadowRoot.querySelector(s);
      if (!currentHost) return null;
    }

    return currentHost;
  }

  /**
   * 查询所有匹配的元素
   * @param {HTMLElement} host
   * @param {string} selector
   * @returns {HTMLElement[]}
   */
  static querySelectorAll(host, selector) {
    const shadowRoot = this.getShadowRoot(host);
    return shadowRoot ? [...shadowRoot.querySelectorAll(selector)] : [];
  }
}

// 初始化拦截（只需调用一次）
ShadowDOMHelper.init();

// ----------------------
// 示例用法
// ----------------------

// 创建一个 closed 模式的 shadowDOM
const host = document.createElement("div");
document.body.appendChild(host);
host.attachShadow({ mode: "closed" });
host.shadowRoot.innerHTML = `
  <div class="outer">
    <div class="inner">
      <span id="target">找到我！</span>
    </div>
  </div>
`;

// 查询嵌套的 closed shadowDOM 元素
const result = ShadowDOMHelper.querySelector(
  host,
  ".outer > .inner > #target"
);

if (result) {
  console.log("找到 closed shadowDOM 元素:", result); // 成功获取
  result.textContent = "已被修改！";
} else {
  console.log("未找到元素");
}
