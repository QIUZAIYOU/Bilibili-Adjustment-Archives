// ==UserScript==
// @name              哔哩哔哩（bilibili.com）播放页调整 - 纯原生JS版
// @copyright         QIAN
// @license           GPL-3.0 License
// @namespace         https://greasyfork.org/zh-CN/scripts/415804-bilibili%E6%92%AD%E6%94%BE%E9%A1%B5%E8%B0%83%E6%95%B4-%E8%87%AA%E7%94%A8
// @version           0.1
// @description       1.自动定位到播放器（进入播放页，可自动定位到播放器，可设置偏移量及是否在点击主播放器时定位）；2.可设置是否自动选择最高画质；3.可设置播放器默认模式；
// @author            QIAN
// @match             *://*.bilibili.com/video/*
// @match             *://*.bilibili.com/bangumi/play/*
// @match             *://*.bilibili.com/list/*
// @require           https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js
// @require           https://cdn.jsdelivr.net/npm/axios@1.6.5/dist/axios.min.js
// @grant             GM_setValue
// @grant             GM_getValue
// @grant             GM_addStyle
// @grant             GM_log
// @grant             GM_registerMenuCommand
// @grant             GM.info
// @grant             window.onurlchange
// @supportURL        https://github.com/QIUZAIYOU/Bilibili-VideoPage-Adjustment-Further
// @homepageURL       https://github.com/QIUZAIYOU/Bilibili-VideoPage-Adjustment-Further
// @icon              https://www.bilibili.com/favicon.ico?v=1
// @downloadURL https://update.greasyfork.org/scripts/415804/%E5%93%94%E5%93%A9%E5%93%94%E5%93%A9%EF%BC%88bilibilicom%EF%BC%89%E6%92%AD%E6%94%BE%E9%A1%B5%E8%B0%83%E6%95%B4.user.js
// @updateURL https://update.greasyfork.org/scripts/415804/%E5%93%94%E5%93%A9%E5%93%94%E5%93%A9%EF%BC%88bilibilicom%EF%BC%89%E6%92%AD%E6%94%BE%E9%A1%B5%E8%B0%83%E6%95%B4.meta.js
// ==/UserScript==
(function () {
  'use strict';
  let vars = {
    currentUrl: document.URL,
    theMainFunctionRunningCounts: 0,
    thePrepFunctionRunningCounts: 0,
    autoSelectScreenModeRunningCounts: 0,
    autoCancelMuteRunningCounts: 0,
    webfullUnlockRunningCounts: 0,
    autoSelectVideoHighestQualityRunningCounts: 0,
    insertGoToCommentsButtonCounts: 0,
    insertSetSkipTimeNodesButtonCounts: 0,
    insertSkipTimeNodesSwitchButtonCounts: 0,
    functionExecutionsCounts: 0
  }
  const vals = {
    initValue() {
      const value = [{
        name: 'is_vip',
        value: false,
      }, {
        name: 'player_type',
        value: 'video',
      }, {
        name: 'offset_top',
        value: 7,
      }, {
        name: 'player_offset_top',
        value: 160,
      }, {
        name: 'auto_locate',
        value: true,
      }, {
        name: 'auto_locate_video',
        value: true,
      }, {
        name: 'auto_locate_bangumi',
        value: true,
      }, {
        name: 'click_player_auto_locate',
        value: true,
      }, {
        name: 'current_screen_mode',
        value: 'normal',
      }, {
        name: 'selected_screen_mode',
        value: 'wide',
      }, {
        name: 'auto_select_video_highest_quality',
        value: true,
      }, {
        name: 'contain_quality_4k',
        value: false,
      }, {
        name: 'contain_quality_8k',
        value: false,
      }, {
        name: 'webfull_unlock',
        value: false,
      }, {
        name: 'auto_reload',
        value: false,
      }, {
        name: 'auto_skip',
        value: false,
      }]
      value.forEach(v => {
        if (getValue(v.name) === undefined) {
          setValue(v.name, v.value)
        }
      })
    },
    is_vip: getValue('is_vip'),
    player_type: getValue('player_type'),
    offset_top: Math.trunc(getValue('offset_top')),
    auto_locate: getValue('auto_locate'),
    auto_locate_video: getValue('auto_locate_video'),
    auto_locate_bangumi: getValue('auto_locate_bangumi'),
    click_player_auto_locate: getValue('click_player_auto_locate'),
    player_offset_top: Math.trunc(getValue('player_offset_top')),
    current_screen_mode: getValue('current_screen_mode'),
    selected_screen_mode: getValue('selected_screen_mode'),
    auto_select_video_highest_quality: getValue('auto_select_video_highest_quality'),
    contain_quality_4k: getValue('contain_quality_4k'),
    contain_quality_8k: getValue('contain_quality_8k'),
    webfull_unlock: getValue('webfull_unlock'),
    auto_reload: getValue('auto_reload'),
    auto_skip: getValue('auto_skip')
  }
  let arrays = {
    intervalIds: [],
    skipNodesRecords: []
  }
  const selector = {
    player: '#bilibili-player',
    video: '#bilibili-player video',
    videoBwp: 'bwp-video',
    videoContainer: '#bilibili-player .bpx-player-container',
    videoControlerBtn: '#bilibili-player .bpx-player-ctrl-btn'
  }
  const utils = {
    getValue() {
      return GM_getValue(name)
    },
    setValue(name, value) {
      GM_setValue(name, value)
    },
    sleep(times) {
      return new Promise(resolve => setTimeout(resolve, times))
    },
    /**
     * 向文档插入自定义样式
     * @param {String} id 样式表id
     * @param {String} css 样式内容
     */
    insertStyleToDocument(css) {
      GM_addStyle(css)
    },
    logger: {
      info(content) {
        console.info('%c播放页调整', 'color:white;background:#006aff;padding:2px;border-radius:2px', content);
      },
      warn(content) {
        console.warn('%c播放页调整', 'color:white;background:#ff6d00;padding:2px;border-radius:2px', content);
      },
      error(content) {
        console.error('%c播放页调整', 'color:white;background:#f33;padding:2px;border-radius:2px', content);
      },
      debug(content) {
        console.info('%c播放页调整(调试)', 'color:white;background:#cc00ff;padding:2px;border-radius:2px', content);
      },
    },
    /**
     * 检查元素是否存在
     * @param {String} selector 元素选择器
     * @param {Number} maxAttempts 最大尝试次数
     * @param {Number} delay 检查时间间隔
     * @returns Promise() TorF
     */
    checkElementExistence(selector, maxAttempts, delay) {
      return new Promise(resolve => {
        let attempts = 0
        const timer = setInterval(() => {
          attempts++
          const $element = document.querySelector(selector)
          if ($element) {
            clearInterval(timer)
            resolve(true)
          } else if (attempts === maxAttempts) {
            clearInterval(timer)
            resolve(false)
          }
        }, delay)
        arrays.intervalIds.push(timer)
      })
    },
    /**
     * 检查视频是否可以播放
     * @returns Promise() TorF
     */
    async checkVideoCanPlayThrough() {
      // const BwpVideoPlayerExists = await this.checkElementExistence(selector.videoBwp, 10, 10)
      // if (BwpVideoPlayerExists) {
      //   return new Promise(resolve => {
      //     resolve(true)
      //   })
      // }
      return new Promise(resolve => {
        let attempts = 100
        const timer = setInterval(() => {
          const $video = document.querySelector(selector.video)
          const videoReadyState = $video.readyState
          if (videoReadyState === 4) {
            resolve(true)
            clearInterval(timer)
          } else if (attempts <= 0) {
            resolve(false)
            clearInterval(timer)
          }
          attempts--
        }, 100)
        arrays.intervalIds.push(timer)
      })
    },
    /**
     * 检查当前文档是否被激活
     */
    checkDocumentIsHidden() {
      const visibilityChangeEventNames = ['visibilitychange', 'mozvisibilitychange', 'webkitvisibilitychange', 'msvisibilitychange']
      const documentHiddenPropertyName = visibilityChangeEventNames.find(name => name in document) || 'onfocusin' in document || 'onpageshow' in window ? 'hidden' : null
      if (documentHiddenPropertyName !== null) {
        const isHidden = () => document[documentHiddenPropertyName]
        const onChange = () => isHidden()
        // 添加各种事件监听器
        visibilityChangeEventNames.forEach(eventName => document.addEventListener(eventName, onChange))
        window.addEventListener('focus', onChange)
        window.addEventListener('blur', onChange)
        window.addEventListener('pageshow', onChange)
        window.addEventListener('pagehide', onChange)
        document.onfocusin = document.onfocusout = onChange
        return isHidden()
      }
      // 如果无法判断是否隐藏，则返回undefined
      return undefined
    },
    /**
     * 监听当前URL变化并执行函数
     */
    whenWindowUrlChange() {
      if (window.onurlchange === null) {
        // 支持该功能
        window.addEventListener('urlchange', () => {
          utils.logger.info('urlchange')
        });
      }
    },
    reloadCurrentTab() {
      if (vals.auto_reload) location.reload()
    },
    documentScrollTo(offset) {
      document.documentElement.scrollTop = offset
      document.body.scrollTop = offset
    },
    /**
     * 获取指定 meta 标签的属性值
     * @param {*} attribute 属性名称
     * @returns 属性值
     */
    getMetaContent(attribute) {
      const meta = document.querySelector(`meta[${attribute}]`)
      if (meta) {
        return meta.getAttribute('content')
      } else {
        return null
      }
    },
    getBodyHeight() {
      const bodyHeight = document.body.clientHeight || 0
      const docHeight = document.documentElement.clientHeight || 0
      return bodyHeight < docHeight ? bodyHeight : docHeight
    },
    /**
     * 确保页面销毁时清除所有定时器
     */
    clearAllTimersWhenCloseTab() {
      window.addEventListener('beforeunload', () => {
        for (let id of arrays.intervalIds) {
          clearInterval(id)
        }
        arrays.intervalIds = []
      })
    }
  }
  const modules = {
    /**
     * 判断用户是否登录
     * @returns 
     */
    isLogin() {
      return Boolean(document.cookie.replace(new RegExp(String.raw`(?:(?:^|.*;\s*)bili_jct\s*=\s*([^;]*).*$)|^.*$`), '$1') || null)
    },
    /**
    * 前期准备函数
    * 提前执行其他脚本功能所依赖的其他函数
    */
    thePrepFunction() {
      if (vars.thePrepFunctionRunningCounts += 1) {
        utils.clearAllTimersWhenCloseTab()
        utils.whenWindowUrlChange()
        vals.initValue()
      }
    },
    /**
     * 脚本执行主函数
     * 定义了所有功能函数将按何种规则执行
     */
    async theMainFunction() {
      const videoPlayerExists = await utils.checkElementExistence(selector.video, 5, 100)
      if (videoPlayerExists) {
        const isCanPlayThrough = await utils.checkVideoCanPlayThrough()
        const videoControlerBtnExists = await utils.checkElementExistence(selector.videoControlerBtn, 100, 100)
        if (isCanPlayThrough && videoControlerBtnExists) {

        }
      }
    }
  }
  if (modules.isLogin()) {
    modules.thePrepFunction()
    const timer = setInterval(() => {
      const dicumentHidden = utils.checkDocumentIsHidden()
      if (!dicumentHidden) {
        utils.logger.info('当前标签｜已激活｜开始应用配置')
        clearInterval(timer)
        modules.theMainFunction()
      } else {
        utils.logger.info('当前标签｜未激活｜等待激活')
      }
    }, 100)
    arrays.intervalIds.push(timer)
  } else utils.logger.warn('请登录｜本脚本只能在登录状态下使用')
})();
