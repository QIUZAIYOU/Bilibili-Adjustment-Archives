// ==UserScript==
// @name        ShadowDOMHelper
// @author      QIAN
// @version     0.0.1
// @description 用于辅助操作 Shadow DOM 的工具类
// @homepage    https://github.com/QIUZAIYOU/ShadowDOM-Helper

// ==/UserScript==

class ShadowDOMHelper {
  static #shadowRoots = new WeakMap();
  static #observers = new WeakMap();
  static #selectorCache = new Map();
  static #styleCache = new WeakMap();

  // ==================== 核心初始化 ====================
  /**
   * 初始化函数，用于修改Element.prototype.attachShadow方法，以便追踪创建的shadow roots
   */
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

  /**
   * 处理已存在的元素
   *
   * 遍历文档中的所有元素，如果元素存在 shadowRoot 且尚未记录在 shadowRoots 中，
   * 则将该元素的 shadowRoot 添加到 shadowRoots 中。
   */
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
  /**
   * 获取指定宿主的 Shadow Root
   *
   * @param {HTMLElement} host 宿主元素
   * @returns {ShadowRoot|null} 返回 Shadow Root 对象，如果不存在则返回 null
   */
  static getShadowRoot(host) {
    this.#validateElement(host);
    return host.shadowRoot || this.#shadowRoots.get(host) || null;
  }

  /**
   * 查询指定主机下的第一个匹配的元素
   *
   * @param {HTMLElement} host - 主机元素
   * @param {string} selector - CSS选择器
   * @returns {HTMLElement|null} - 返回第一个匹配的元素，如果不存在则返回null
   */
  static querySelector(host, selector) {
    return this.#query(host, selector, false)[0] || null;
  }

  /**
   * 查询指定主机元素下所有匹配选择器的元素
   *
   * @param {HTMLElement} host - 要查询的主机元素
   * @param {string} selector - CSS选择器字符串
   * @returns {NodeList} - 返回匹配指定选择器的所有元素集合
   */
  static querySelectorAll(host, selector) {
    return this.#query(host, selector, true);
  }

  /**
   * 查询选择器匹配的元素
   *
   * @param {HTMLElement} host 宿主元素
   * @param {string} selector 选择器字符串
   * @param {boolean} findAll 是否返回所有匹配的元素
   * @returns {HTMLElement[]} 返回匹配选择器的元素数组，如果只返回第一个匹配的元素，则返回一个元素数组
   */
  static #query(host, selector, findAll) {
    this.#validateElement(host);
    this.#validateSelector(selector);

    const parts = this.#parseSelector(selector);
    let elements = [host];
    // console.log("解析后主体: ", parts);

    for (const part of parts) {
      // console.log("当前匹配: ", part);
      const newElements = [];
      for (const el of elements) {
        if (el.nodeType === Node.COMMENT_NODE) break;
        const contexts = this.#getQueryContexts(el, part);
        // console.log(`当前元素 ${el.nodeName.toLowerCase()} 的上下文: `, contexts);
        contexts.forEach(context => {
          try {
            // console.log("当前匹配对象: ", context, "\n匹配选择器: ", part.selector, "\nisShadow: ", part.isShadow);
            const root = this.getShadowRoot(context);
            const matches = root ? context.shadowRoot.querySelectorAll(part.selector) : context.querySelectorAll(part.selector);
            // console.log("匹配结果： ", matches);
            newElements.push(...matches);
            // console.log("匹配合集： ", newElements);
          } catch (error) {
            console.error(`选择器错误: "${part.selector}"`, error);
          }
        });
      }
      elements = [...new Set(newElements)];
      // console.log("当前匹配结果: ", elements);
      if (!findAll && elements.length === 0) break;
    }
    return findAll ? elements : elements.slice(0, 1);
  }

  /**
   * 获取指定元素的上下文列表
   *
   * @param {HTMLElement} el - 目标元素
   * @param {Object} part - 包含是否为 Shadow DOM 的对象
   * @param {boolean} part.isShadow - 是否为 Shadow DOM
   * @returns {HTMLElement[]} - 元素的上下文列表
   */
  static #getQueryContexts(el, part) {
    // console.log(`// ==================== 获取 ${el.nodeName.toLowerCase()} 的上下文 ====================`);
    const contexts = [];
    if (part.isShadow) {
      // Shadow DOM 查询逻辑
      let current = el;
      const result = this.#deepQueryAll(current);
      if (result.length > 0) {
        contexts.push(current, ...result);
      }
    } else {
      // 普通子元素直接使用原生 DOM 上下文
      contexts.push(el);
    }
    return contexts;
  }

  // ==================== 实时监控 ====================
  /**
   * 监听指定元素或选择器的子节点变化，并调用回调函数
   *
   * @param {HTMLElement} host - 要监听的目标元素
   * @param {string} selector - 用于选择子节点的选择器
   * @param {Function} callback - 当子节点变化时调用的回调函数
   * @param {Object} options - 配置选项
   * @param {string} options.nodeNameFilter - 用于过滤节点名称的过滤器
   * @param {boolean} [options.checkHostTree=true] - 是否检查目标元素的子树
   * @param {boolean} [options.observeExisting=true] - 是否观察已存在的子节点
   * @param {number} [options.debounce=50] - 防抖时间间隔（毫秒）
   * @param {number} [options.maxRetries=3] - 最大重试次数
   * @returns {Function} - 返回一个用于取消监听的函数
   * @throws {Error} - 当未提供选择器或节点名称过滤器时抛出错误
   */
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

  /**
   * 处理DOM节点
   *
   * @param {Node} node 要处理的节点
   * @param {Node} host 根节点
   * @param {string} selector 选择器
   * @param {Function} callback 回调函数
   * @param {string} nodeNameFilter 节点名称过滤器
   * @param {boolean} checkHostTree 是否检查节点是否在根节点树中
   * @param {number} maxRetries 最大重试次数
   * @returns {void}
   */
  static #processNode(node, host, selector, callback, nodeNameFilter, checkHostTree, maxRetries) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    // 模式1：标签名快速匹配
    if (nodeNameFilter) {
      if (node.nodeName === nodeNameFilter.toUpperCase()) {
        this.#safeCallback(callback, node);
      }
      return;
    }

    // 模式2：完整路径验证
    if (this.#isFullMatch(node, host, selector)) {
      this.#safeCallback(callback, node);
    }
  }

  /**
   * 递归查询元素及其所有子元素，包括 Shadow DOM 中的元素。
   *
   * @param {Element} element - 要查询的根元素。
   * @returns {Element[]} - 包含查询到的所有元素的数组。
   */
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

  /**
   * 判断给定的元素是否完全匹配指定的选择器
   *
   * @param element 要判断的元素
   * @param host 元素所在的宿主元素
   * @param selector 选择器字符串
   * @returns 如果元素完全匹配选择器，则返回true；否则返回false
   */
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
  /**
   * 向指定的宿主元素添加样式。
   *
   * @param {HTMLElement} host - 宿主元素。
   * @param {string} selector - CSS选择器，用于选择需要添加样式的子元素。
   * @param {Object} styles - 要应用的样式对象。
   * @param {Object} [options={}] - 可选参数对象。
   * @param {boolean} [options.isolate=true] - 是否将样式隔离到目标元素。
   * @param {string} [options.mode='append'] - 样式应用模式，'append'表示追加，'replace'表示替换。
   * @param {string} [options.priority='low'] - 样式优先级，'low'表示低优先级，'high'表示高优先级。
   * @returns {boolean} 如果成功添加样式，则返回true；否则返回false。
   */
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

  /**
   * 应用样式规则到指定的样式标签中
   *
   * @param {HTMLElement} styleTag - 样式标签元素
   * @param {string} rule - 要应用的样式规则
   * @param {string} mode - 应用模式，'replace'表示替换现有内容，其他值表示追加内容
   * @param {string} priority - 优先级，'high'表示高优先级，其他值表示低优先级
   */
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
  /**
   * 调试查询路径
   *
   * @param {HTMLElement} host - 宿主元素
   * @param {string} selector - CSS选择器
   * @returns {HTMLElement|null} - 查询结果，若未找到则返回null
   */
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

  /**
   * 静态方法，用于诊断宿主元素的 Shadow Root
   *
   * @param {HTMLElement} host - 宿主元素
   */
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
  /**
   * 解析选择器字符串，返回解析后的结果
   *
   * @param {string} selector 选择器字符串
   * @returns {Array<{selector: string, isShadow: boolean}>} 解析后的结果数组，每个元素包含选择器字符串和是否为 ShadowRoot 的标志
   */
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

  /**
   * 解析样式并返回处理后的字符串。
   *
   * @param {string|Object} styles 样式字符串或对象
   * @returns {string} 处理后的样式字符串
   * @throws {TypeError} 如果样式既不是字符串也不是对象，则抛出TypeError
   */
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

  /**
   * 根据节点名称查找元素
   *
   * @param {HTMLElement} host - 宿主元素
   * @param {string} nodeName - 节点名称
   * @param {boolean} checkHostTree - 是否检查宿主树
   * @returns {HTMLElement[]} - 返回找到的元素数组
   */
  static #findByTagName(host, nodeName, checkHostTree) {
    const root = this.getShadowRoot(host) || host;
    const elements = Array.from(root.querySelectorAll('*'))
      .filter(el => el.nodeName.toLowerCase() === nodeName.toLowerCase());

    return checkHostTree
      ? elements.filter(el => this.#isInHostTree(el, host))
      : elements;
  }

  /**
   * 判断一个元素是否位于某个宿主元素的树结构中
   *
   * @param element 需要判断的元素
   * @param host 宿主元素
   * @returns 如果元素位于宿主元素的树结构中，则返回 true，否则返回 false
   */
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

  /**
   * 创建一个防抖函数
   *
   * @param {number} delay - 防抖延迟时间（毫秒）
   * @param {Function} fn - 需要防抖的函数
   * @returns {Function} 防抖后的函数
   */
  static #debounceHandler(delay, fn) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  /**
   * 安全地执行回调函数
   *
   * @param {Function} callback 需要执行的回调函数
   * @param {HTMLElement} el 需要传递给回调函数的元素
   */
  static #safeCallback(callback, el) {
    try {
      if (el?.isConnected) callback(el);
    } catch (error) {
      console.error('回调执行失败:', error);
    }
  }

  /**
   * 获取一个包含样式定义的 style 标签。
   *
   * @param {HTMLElement} element - 需要添加样式的元素。
   * @param {boolean} isolate - 是否需要隔离样式，仅对指定元素生效。
   * @returns {HTMLElement} - 返回包含样式定义的 style 标签。
   */
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

  /**
   * 验证元素是否为有效的 HTML 元素
   *
   * @param {HTMLElement} el - 要验证的元素
   * @throws {TypeError} 如果元素不是有效的 HTML 元素，则抛出 TypeError 异常
   */
  static #validateElement(el) {
    if (!(el instanceof HTMLElement)) {
      throw new TypeError('宿主元素必须是有效的 HTML 元素');
    }
  }

  /**
   * 验证选择器是否有效
   *
   * @param {string} selector - 要验证的选择器字符串
   * @throws {TypeError} 如果选择器不是有效的非空字符串，则抛出TypeError异常
   */
  static #validateSelector(selector) {
    if (typeof selector !== 'string' || selector.trim() === '') {
      throw new TypeError('选择器必须是有效的非空字符串');
    }
  }

  // ==================== 辅助方法 ====================
  /**
   * 在指定主机上持续查询指定选择器，直到找到匹配的元素或超时
   *
   * @param host 查询的目标主机，可以是字符串或DOM元素
   * @param selector CSS选择器字符串
   * @param options 可选参数对象，包含以下属性:
   *  - timeout: 查询超时时间（毫秒），默认为1000毫秒
   *  - findAll: 是否查询所有匹配的元素，默认为false（只查询第一个匹配的元素）
   *  - interval: 查询间隔时间（毫秒），默认为50毫秒
   * @returns 匹配的DOM元素或元素数组（当findAll为true时），超时则返回null
   * @throws 查询过程中出现异常时抛出错误
   */
  static async queryUntil(host, selector, options = {}) {
    const { timeout = 1000, findAll = false, interval = 50 } = options;
    let elapsed = 0;
    const start = Date.now();

    try {
      while (elapsed < timeout) {
        if (findAll) {
          const els = this.querySelectorAll(host, selector);
          if (els.length > 0) return els;
        } else {
          const el = this.querySelector(host, selector);
          if (el) return el;
        }

        await new Promise(r => setTimeout(r, interval));
        elapsed = Date.now() - start;
      }
    } catch (error) {
      console.error(`查询过程中出现错误: ${error.message}`);
    }

    console.warn(`查询超时: ${selector}`);
    return null;
  }
}

// 自动初始化
ShadowDOMHelper.init();