// ==UserScript==
// @name        ShadowDOMHelper
// @author      QIAN
// @version     0.0.4
// @homepageURL	https://github.com/QIUZAIYOU/Bilibili-Adjustment/blob/main/Utils/ShadowDOMHelper/ShadowDOMHelper.js
// ==/UserScript==

class ShadowDOMHelper {
  static #shadowRoots = new WeakMap();

  // ----------- 核心功能 -----------
  static init() {
    const originalAttachShadow = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (options) {
      const shadowRoot = originalAttachShadow.call(this, options);
      ShadowDOMHelper.#shadowRoots.set(this, shadowRoot);
      return shadowRoot;
    };
  }

  static getShadowRoot(host) {
    return host.shadowRoot || ShadowDOMHelper.#shadowRoots.get(host) || null;
  }

  static querySelector(host, selector) {
    return this.#query(host, selector, false)[0] || null;
  }

  static querySelectorAll(host, selector) {
    return this.#query(host, selector, true);
  }

  static #query(host, selector, findAll) {
    const parts = selector.split(/(\s*>>\s*|\s*>\s*)/).filter(p => p.trim());
    let elements = [host];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (part === '>>' || part === '>') continue;
      const prevSeparator = i > 0 ? parts[i - 1].trim() : null;
      const newElements = [];
      for (const el of elements) {
        let targets = [];
        if (prevSeparator === '>>') {
          const shadowRoot = this.getShadowRoot(el);
          targets = shadowRoot ? shadowRoot.querySelectorAll(part) : [];
        } else if (prevSeparator === '>') {
          targets = el.querySelectorAll(part);
        } else {
          const shadowRoot = this.getShadowRoot(el);
          targets = shadowRoot ? shadowRoot.querySelectorAll(part) : [];
        }
        newElements.push(...Array.from(targets));
      }
      elements = newElements;
      if (elements.length === 0 && !findAll) break;
    }
    return findAll ? elements : elements.slice(0, 1);
  }

  // ----------- 调试功能 -----------
  /**
   * 调试查询路径（打印每一步的结果）
   * @param {HTMLElement} host - 宿主元素
   * @param {string} selector - 查询路径
   * @param {boolean} [findAll=false] - 是否查询所有匹配元素
   */
  static debugQuery(host, selector, findAll = false) {
    console.groupCollapsed('[ShadowDOMHelper] 开始调试查询路径:', selector);
    console.log('初始宿主元素:', host);

    const parts = selector.split(/(\s*>>\s*|\s*>\s*)/).filter(p => p.trim());
    let elements = [host];

    parts.forEach((part, index) => {
      if (part === '>>' || part === '>') return;

      const prevSeparator = index > 0 ? parts[index - 1].trim() : null;
      const newElements = [];

      console.group(`层级 ${index + 1}: ${prevSeparator || 'INIT'} ${part}`);
      console.log('当前元素数量:', elements.length);

      elements.forEach((el, elIndex) => {
        console.groupCollapsed(`元素 ${elIndex + 1}:`, el);

        // 操作类型判断
        let operation;
        if (prevSeparator === '>>') {
          const shadowRoot = this.getShadowRoot(el);
          console.log('ShadowRoot:', shadowRoot);
          operation = shadowRoot ? shadowRoot.querySelectorAll(part) : [];
        } else if (prevSeparator === '>') {
          operation = el.querySelectorAll(part);
        } else {
          const shadowRoot = this.getShadowRoot(el);
          console.log('ShadowRoot:', shadowRoot);
          operation = shadowRoot ? shadowRoot.querySelectorAll(part) : [];
        }

        console.log('找到匹配元素:', Array.from(operation));
        newElements.push(...Array.from(operation));
        console.groupEnd();
      });

      elements = newElements;
      console.log('本层级后剩余元素:', elements.length);
      console.groupEnd();
    });

    console.log('最终结果:', findAll ? elements : elements[0] || null);
    console.groupEnd();
    return findAll ? elements : elements[0] || null;
  }

  /**
   * 验证 ShadowRoot 存在性
   * @param {HTMLElement} host - 宿主元素
   */
  static debugShadowRoot(host) {
    console.groupCollapsed('[ShadowDOMHelper] 验证 ShadowRoot');
    console.log('宿主元素:', host);

    const shadowRoot = this.getShadowRoot(host);
    console.log('是否存在:', !!shadowRoot);

    if (shadowRoot) {
      console.log('模式:', host.shadowRoot ? 'open' : 'closed (通过库捕获)');
      console.log('内容摘要:', shadowRoot.innerHTML.slice(0, 100) + '...');
    }

    console.groupEnd();
    return shadowRoot;
  }
}

// 自动初始化
ShadowDOMHelper.init();