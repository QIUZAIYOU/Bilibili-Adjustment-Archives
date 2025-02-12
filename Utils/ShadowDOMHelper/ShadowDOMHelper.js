// ==UserScript==
// @name        ShadowDOMHelper
// @author      QIAN
// @version     0.0.6
// @homepageURL	https://github.com/QIUZAIYOU/Bilibili-Adjustment/blob/main/Utils/ShadowDOMHelper/ShadowDOMHelper.js
// ==/UserScript==

class ShadowDOMHelper {
  static #shadowRoots = new WeakMap();
  static #observers = new WeakMap(); // 存储宿主元素与观察器的关系
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
  // ----------- 增强版查询核心 -----------
  /**
   * 实时查询元素（支持动态新增）
   * @param {HTMLElement} host - 宿主元素
   * @param {string} selector - 查询路径
   * @param {Function} callback - 匹配到元素时的回调 (element) => void
   * @param {Object} [options]
   * @param {boolean} [options.observeSubtree=true] - 是否监控子树变化
   * @param {boolean} [options.observeExisting=true] - 是否立即处理已存在元素
   */
  static watchQuery(host, selector, callback, options = {}) {
    const {
      observeSubtree = true,
      observeExisting = true
    } = options;

    // 初始化观察器
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        this.#processNewNodes(mutation.addedNodes, host, selector, callback);
      });
    });

    // 存储观察器
    this.#observers.set(host, { observer, selector, callback });

    // 开始观察
    observer.observe(this.getShadowRoot(host) || host, {
      childList: true,
      subtree: observeSubtree
    });

    // 处理现有元素
    if (observeExisting) {
      const existing = this.querySelectorAll(host, selector);
      existing.forEach(el => callback(el));
    }

    // 返回停止观察的方法
    return () => {
      observer.disconnect();
      this.#observers.delete(host);
    };
  }

  // 处理新增节点
  static #processNewNodes(nodes, host, selector, callback) {
    nodes.forEach(node => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      // 新增：检查当前节点自身是否匹配完整路径
      if (this.#isFullMatch(node, host, selector)) {
        callback(node);
      }

      // 深度遍历所有可能包含目标元素的容器
      const containers = [node, ...this.#getAllShadowRoots(node)];
      containers.forEach(container => {
        const walker = document.createTreeWalker(
          container,
          NodeFilter.SHOW_ELEMENT,
          {
            acceptNode: (n) =>
              this.#isFullMatch(n, host, selector) ?
                NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
          }
        );

        while (walker.nextNode()) {
          callback(walker.currentNode);
        }
      });
    });
  }

  // 新增：获取元素下所有嵌套的 ShadowRoot
  static #getAllShadowRoots(element) {
    const roots = [];
    const walk = (el) => {
      const root = this.getShadowRoot(el);
      if (root) {
        roots.push(root);
        root.querySelectorAll('*').forEach(child => walk(child));
      }
    };
    walk(element);
    return roots;
  }

  // 重构：精确全路径匹配验证
  static #isFullMatch(element, host, selector) {
    const pathParts = selector.split(/(\s*>>\s*|\s*>\s*)/g)
      .filter(p => p.trim() && !['>>', '>'].includes(p.trim()));

    let currentElement = element;
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const part = pathParts[i].trim();
      const parent = this.#getHierarchyParent(currentElement);

      if (!parent || !this.#matchSelectorPart(parent, part)) {
        return false;
      }
      currentElement = parent;
    }

    return currentElement === host;
  }

  // 重构：获取逻辑父级（考虑 ShadowDOM）
  static #getHierarchyParent(element) {
    if (element.assignedSlot) { // 处理 slot 元素
      return element.assignedSlot;
    }
    const parentNode = element.parentNode;
    if (parentNode?.nodeType === Node.DOCUMENT_FRAGMENT_NODE && parentNode.host) {
      return parentNode.host; // ShadowRoot 的宿主
    }
    return parentNode;
  }

  // 新增：支持复合选择器匹配
  static #matchSelectorPart(element, selector) {
    try {
      return element.matches(selector) ||
        element.assignedSlot?.matches(selector) ||
        element.getRootNode().host?.matches(selector);
    } catch {
      return false;
    }
  }
  // ----------- 样式操作功能 -----------
  /**
   * 向 ShadowDOM 内的元素添加样式
   * @param {HTMLElement} host - 宿主元素
   * @param {string} selector - 目标元素路径（支持 >> 和 > 操作符）
   * @param {string|Object} styles - CSS 字符串或样式对象（如 { color: 'red', fontSize: '14px' }）
   * @param {boolean} [isolate=true] - 是否隔离样式（为元素添加唯一属性）
   */
  static addStyle(host, selector, styles, isolate = true) {
    const targets = this.querySelectorAll(host, selector);
    if (targets.length === 0) {
      console.warn(`未找到匹配元素: ${selector}`);
      return false;
    }

    const styleContent = this.#parseStyles(styles);
    targets.forEach(target => {
      const styleId = `shadow-style-${Date.now()}`;
      let styleEl = target.shadowRoot?.querySelector(`#${styleId}`);

      // 动态创建或复用样式标签
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        const shadowRoot = this.getShadowRoot(target) || target.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(styleEl);
      }

      // 添加隔离属性（防止全局污染）
      if (isolate) {
        const uniqueAttr = `data-shadow-${Math.random().toString(36).slice(2, 9)}`;
        target.setAttribute(uniqueAttr, '');
        styleEl.textContent = `[${uniqueAttr}] { ${styleContent} }`;
      } else {
        styleEl.textContent += styleContent;
      }
    });

    return true;
  }

  // 解析样式输入
  static #parseStyles(styles) {
    if (typeof styles === 'string') {
      return styles.replace(/^\s*\{|\}\s*$/g, ''); // 去除 CSS 外层大括号
    } else if (typeof styles === 'object') {
      return Object.entries(styles)
        .map(([prop, value]) =>
          `${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`
        )
        .join(' ');
    }
    return '';
  }
  /**
 * 更新已有样式
 * @param {HTMLElement} host - 宿主元素
 * @param {string} selector - 目标元素路径
 * @param {string|Object} newStyles - 新样式
 */
  static updateStyle(host, selector, newStyles) {
    const targets = this.querySelectorAll(host, selector);
    targets.forEach(target => {
      const styleEl = target.shadowRoot?.querySelector('style[data-shadow-style]');
      if (styleEl) {
        styleEl.textContent = this.#parseStyles(newStyles);
      }
    });
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