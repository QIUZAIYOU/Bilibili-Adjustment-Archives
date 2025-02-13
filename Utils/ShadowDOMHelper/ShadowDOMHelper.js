// ==UserScript==
// @name        ShadowDOMHelper
// @author      QIAN
// @version     0.0.6
// @homepageURL	https://github.com/QIUZAIYOU/Bilibili-Adjustment/blob/main/Utils/ShadowDOMHelper/ShadowDOMHelper.js
// ==/UserScript==

class ShadowDOMHelper {
  static #shadowRoots = new WeakMap();
  static #observers = new WeakMap();
  static #selectorCache = new Map();
  static #styleCache = new WeakMap();

  // ==================== 核心初始化 ====================
  static init() {
    if (Element.prototype.attachShadow.__monkeyPatched) return;
    const originalAttachShadow = Element.prototype.attachShadow;

    Element.prototype.attachShadow = function (options) {
      const shadowRoot = originalAttachShadow.call(this, options);
      ShadowDOMHelper.#shadowRoots.set(this, shadowRoot);
      return shadowRoot;
    };

    Element.prototype.attachShadow.__monkeyPatched = true;
    this.#processExistingElements();
  }

  static #processExistingElements() {
    const walker = document.createTreeWalker(
      document.documentElement,
      NodeFilter.SHOW_ELEMENT
    );

    let currentNode;
    while ((currentNode = walker.nextNode())) {
      if (currentNode.shadowRoot && !this.#shadowRoots.has(currentNode)) {
        this.#shadowRoots.set(currentNode, currentNode.shadowRoot);
      }
    }
  }

  // ==================== DOM 查询 ====================
  static getShadowRoot(host) {
    this.#validateElement(host);
    return host.shadowRoot || this.#shadowRoots.get(host) || null;
  }

  static querySelector(host, selector) {
    return this.#query(host, selector, false)[0] || null;
  }

  static querySelectorAll(host, selector) {
    return this.#query(host, selector, true);
  }

  static #query(host, selector, findAll) {
    this.#validateElement(host);
    this.#validateSelector(selector);

    const parts = this.#parseSelector(selector);
    let elements = [host];

    for (const part of parts) {
      const newElements = [];

      for (const el of elements) {
        if (el.NodeType === Node.COMMENT_NODE) break;
        const contexts = this.#getQueryContexts(el, part);
        contexts.forEach(context => {
          try {
            const matches = context.querySelectorAll(part.selector);
            newElements.push(...matches);
          } catch (error) {
            console.error(`选择器错误: "${part.selector}"`, error);
          }
        });
      }

      elements = [...new Set(newElements)]; // 去重
      if (!findAll && elements.length === 0) break;
    }
    console.log(elements)
    const result = findAll ? elements : elements.slice(0, 1);

    return result;
  }

  static #getQueryContexts(el, part) {
    const contexts = [];
    if (part.isShadow) {
      let current = el;
      while (current) {
        const root = this.getShadowRoot(current);
        if (root) {
          // 过滤shadowRoot中的注释节点
          contexts.push(root);
          current = Array.from(root.childNodes).find(
            child => child.nodeType === Node.ELEMENT_NODE
          );
        } else {
          break;
        }
      }
    } else {
      contexts.push(el);
    }
    return contexts;
  }

  // ==================== 实时监控 ====================
  static watchQuery(host, selector, callback, options = {}) {
    this.#validateElement(host);

    const {
      nodeNameFilter,
      checkHostTree = true,
      observeExisting = true,
      debounce = 50,
      maxRetries = 3
    } = options;

    if (!nodeNameFilter && !selector) {
      throw new Error('必须提供 selector 或  nodeNameFilter');
    }

    const observer = new MutationObserver(this.#debounceHandler(debounce, mutations => {
      mutations.flatMap(m => Array.from(m.addedNodes))
        .forEach(node => this.#processNode(node, host, selector, callback, nodeNameFilter, checkHostTree, maxRetries));
    }));

    this.#observers.set(host, { observer, callback });

    observer.observe(this.getShadowRoot(host) || host, {
      childList: true,
      subtree: true
    });

    if (observeExisting) {
      const existing = nodeNameFilter
        ? this.#findByTagName(host, nodeNameFilter, checkHostTree)
        : this.querySelectorAll(host, selector);
      existing.forEach(el => this.#safeCallback(callback, el));
    }

    return () => {
      observer.disconnect();
      this.#observers.delete(host);
    };
  }

  static #processNode(node, host, selector, callback, nodeNameFilter, checkHostTree, maxRetries) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    // 模式1：标签名快速匹配
    if (nodeNameFilter) {
      if (node.nodeName === nodeNameFilter.toUpperCase()) {
        //if (!checkHostTree || this.#isInHostTree(node, host)) {
        //  this.#retryFindNested(node, callback, maxRetries);
        //}
        this.#safeCallback(callback, node);
      }
      return;
    }

    // 模式2：完整路径验证
    if (this.#isFullMatch(node, host, selector)) {
      this.#safeCallback(callback, node);
    }
  }

  static #retryFindNested(element, callback, retriesLeft) {
    const check = () => {
      const targets = this.#deepQueryAll(element);
      if (targets.length > 0) {
        targets.forEach(t => this.#safeCallback(callback, t));
        return true;
      }
      return false;
    };

    if (check()) return;

    if (retriesLeft > 0) {
      setTimeout(() => {
        this.#retryFindNested(element, callback, retriesLeft - 1);
      }, 100 * (4 - retriesLeft));
    }
  }

  static #deepQueryAll(element) {
    const results = [];
    const walk = (el) => {
      const shadowRoot = this.getShadowRoot(el);
      if (!shadowRoot) return;

      // 过滤注释节点和非元素节点
      const children = Array.from(shadowRoot.childNodes).filter(
        child => child.nodeType === Node.ELEMENT_NODE
      );

      results.push(...children);
      children.forEach(child => walk(child));
    };

    walk(element);
    return results;
  }

  static #isFullMatch(element, host, selector) {
    try {
      const parts = this.#parseSelector(selector);
      let current = element;

      for (const part of [...parts].reverse()) {
        const parent = part.isShadow
          ? current.getRootNode().host
          : current.parentElement;

        if (!parent || !parent.matches(part.selector)) return false;
        current = parent;
      }

      return current === host;
    } catch {
      return false;
    }
  }

  // ==================== 样式操作 ====================
  static addStyle(host, selector, styles, options = {}) {
    const {
      isolate = true,
      mode = 'append',
      priority = 'low'
    } = options;

    const targets = this.querySelectorAll(host, selector);
    if (targets.length === 0) return false;

    const styleStr = this.#parseStyles(styles);
    targets.forEach(target => {
      const styleTag = this.#getStyleTag(target, isolate);
      const rule = isolate
        ? `[${styleTag.dataset.uniqueAttr}] { ${styleStr} }`
        : styleStr;

      this.#applyStyle(styleTag, rule, mode, priority);
    });

    return true;
  }

  static #applyStyle(styleTag, rule, mode, priority) {
    if (mode === 'replace') {
      styleTag.textContent = rule;
    } else {
      const method = priority === 'high' ? 'insertBefore' : 'appendChild';
      const textNode = document.createTextNode(rule);
      styleTag[method](textNode, styleTag.firstChild);
    }
  }

  // ==================== 调试工具 ====================
  static debugQuery(host, selector) {
    console.groupCollapsed('[ShadowDOMHelper] 查询路径调试');
    const result = this.querySelector(host, selector);

    const parts = this.#parseSelector(selector);
    parts.forEach((part, index) => {
      console.group(`层级 ${index + 1}: ${part.isShadow ? 'Shadow' : 'DOM'} 选择器 "${part.selector}"`);
      console.log('上下文元素:', part.contexts);
      console.log('匹配元素:', part.results);
      console.groupEnd();
    });

    console.log('最终结果:', result);
    console.groupEnd();
    return result;
  }

  static debugShadowRoot(host) {
    console.groupCollapsed('[ShadowDOMHelper] ShadowRoot 诊断');
    try {
      const root = this.getShadowRoot(host);
      console.log('宿主:', host);
      console.log('是否存在:', !!root);
      console.log('模式:', host.shadowRoot ? 'open' : 'closed');
      console.log('子元素数量:', root?.children.length || 0);
      console.log('内容摘要:', root?.innerHTML?.slice(0, 200) + (root?.innerHTML?.length > 200 ? '...' : ''));
    } catch (error) {
      console.error('诊断失败:', error);
    }
    console.groupEnd();
  }

  // ==================== 私有工具方法 ====================
  static #parseSelector(selector) {
    if (this.#selectorCache.has(selector)) {
      return this.#selectorCache.get(selector);
    }

    const parts = [];
    const tokens = selector.split(/(\s*>>\s*|\s*>\s*)/g).map(t => t.trim()).filter(t => t !== '');

    let isShadow = false;
    let currentSelector = '';

    // 智能模式：当无操作符时默认进入 ShadowRoot
    if (tokens.length === 1 && !['>>', '>'].includes(tokens[0])) {
      parts.push({ selector: tokens[0].trim(), isShadow: true });
      this.#selectorCache.set(selector, parts);
      return parts;
    }

    for (const token of tokens) {
      if (token === '>>') {
        if (currentSelector) {
          parts.push({ selector: currentSelector, isShadow: true });
          currentSelector = '';
        }
        isShadow = true;
      } else if (token === '>') {
        if (currentSelector) {
          parts.push({ selector: currentSelector, isShadow: false });
          currentSelector = '';
        }
        isShadow = false;
      } else {
        currentSelector += token;
      }
    }

    if (currentSelector) {
      parts.push({ selector: currentSelector, isShadow });
    }

    this.#selectorCache.set(selector, parts);
    return parts;
  }

  static #parseStyles(styles) {
    if (typeof styles === 'string') {
      return styles
        .replace(/^\s*\{|\}\s*$/g, '')
        .replace(/;(\s*})/g, '$1')
        .trim();
    }

    if (typeof styles === 'object' && styles !== null) {
      return Object.entries(styles)
        .map(([prop, value]) =>
          `${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`
        )
        .join('; ');
    }

    throw new TypeError('样式必须是字符串或对象');
  }

  static #findByTagName(host, nodeName, checkHostTree) {
    const root = this.getShadowRoot(host) || host;
    const elements = Array.from(root.querySelectorAll('*'))
      .filter(el => el.nodeName.toLowerCase() === nodeName.toLowerCase());

    return checkHostTree
      ? elements.filter(el => this.#isInHostTree(el, host))
      : elements;
  }

  static #isInHostTree(element, host) {
    try {
      let root = element.getRootNode();
      while (root) {
        if (root === host.getRootNode()) return true;
        root = root.host?.getRootNode();
      }
      return false;
    } catch {
      return false;
    }
  }

  static #debounceHandler(delay, fn) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  static #safeCallback(callback, el) {
    try {
      if (el?.isConnected) callback(el);
    } catch (error) {
      console.error('回调执行失败:', error);
    }
  }

  static #getStyleTag(element, isolate) {
    const shadowRoot = this.getShadowRoot(element) || element.attachShadow({ mode: 'open' });
    // 清理可能存在的注释节点
    const comments = Array.from(shadowRoot.childNodes).filter(
      node => node.nodeType === Node.COMMENT_NODE
    );
    comments.forEach(c => c.remove());

    let styleTag = shadowRoot.querySelector('style[data-shadow-style]');

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.dataset.shadowStyle = true;
      shadowRoot.prepend(styleTag);

      if (isolate) {
        const uniqueAttr = `s-${Math.random().toString(36).slice(2, 8)}`;
        styleTag.dataset.uniqueAttr = uniqueAttr;
        element.setAttribute(uniqueAttr, '');
      }
    }

    return styleTag;
  }

  static #validateElement(el) {
    if (!(el instanceof HTMLElement)) {
      throw new TypeError('宿主元素必须是有效的 HTML 元素');
    }
  }

  static #validateSelector(selector) {
    if (typeof selector !== 'string' || selector.trim() === '') {
      throw new TypeError('选择器必须是有效的非空字符串');
    }
  }

  // ==================== 辅助方法 ====================
  static async queryUntil(host, selector, timeout = 1000) {
    let elapsed = 0;
    const start = Date.now();

    while (elapsed < timeout) {
      const el = this.querySelector(host, selector);
      if (el) return el;

      await new Promise(r => setTimeout(r, 50));
      elapsed = Date.now() - start;
    }

    console.warn(`查询超时: ${selector}`);
    return null;
  }
}

// 自动初始化
ShadowDOMHelper.init();