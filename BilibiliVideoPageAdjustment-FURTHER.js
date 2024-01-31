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
// @require           https://scriptcat.org/lib/513/2.0.0/ElementGetter.js#sha256=KbLWud5OMbbXZHRoU/GLVgvIgeosObRYkDEbE/YanRU=
// @grant             GM_setValue
// @grant             GM_getValue
// @grant             GM_addStyle
// @grant             GM_registerMenuCommand
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
    functionExecutionsCounts: 0,
    checkScreenModeSwitchSuccessDepths: 0,
    autoLocationRetryDepths: 0,
  }
  let arrays = {
    intervalIds: [],
    skipNodesRecords: []
  }
  const selector = {
    player: '#bilibili-player',
    playerContainer: '#bilibili-player .bpx-player-container',
    playerControler: '#bilibili-player .bpx-player-ctrl-btn',
    volumeButton: '.bpx-player-ctrl-volume-icon',
    mutedButton: '.bpx-player-ctrl-muted-icon',
    video: '#bilibili-player video',
    videoBwp: 'bwp-video',
    qualitySwitchButtons: '.bpx-player-ctrl-quality-menu-item',
    screenModeWideEnterButton: '.bpx-player-ctrl-wide-enter',
    screenModeWebEnterButton: '.bpx-player-ctrl-web-enter',
    danmukuBox: '#danmukuBox',
  }
  const utils = {
    initValue() {
      const value = [{
        name: 'is_vip',
        value: false,
      }, {
        name: 'player_type',
        value: 'video',
      }, {
        name: 'offset_top',
        value: 5,
      }, {
        name: 'player_offset_top',
        value: 168,
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
        this.setValue(v.name, v.value)
      })
    },
    getValue(name) {
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
          // utils.logger.info('urlchange')
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
    },
    /**
     * 获取指定元素属性样式
     * @param {*} selector CSS选择器
     * @param {*} attribute CSS属性名
     * @returns CSS属性值
     */
    async getElementComputedStyle(selector, attribute) {
      const element = await elmGetter.get(selector)
      return window.getComputedStyle(element)[attribute]
    },
    getElementToDocumentTop(el) {
      if (el.offsetParent) {
        utils.logger.debug(el.offsetTop)
        return this.getElementToDocumentTop(el.offsetParent) + el.offsetTop
      }
      else {
        return el.offsetTop
      }
    }
  }
  const vals = {
    is_vip: utils.getValue('is_vip'),
    player_type: utils.getValue('player_type'),
    offset_top: Math.trunc(utils.getValue('offset_top')),
    auto_locate: utils.getValue('auto_locate'),
    auto_locate_video: utils.getValue('auto_locate_video'),
    auto_locate_bangumi: utils.getValue('auto_locate_bangumi'),
    click_player_auto_locate: utils.getValue('click_player_auto_locate'),
    player_offset_top: Math.trunc(utils.getValue('player_offset_top')),
    current_screen_mode: utils.getValue('current_screen_mode'),
    selected_screen_mode: utils.getValue('selected_screen_mode'),
    auto_select_video_highest_quality: utils.getValue('auto_select_video_highest_quality'),
    contain_quality_4k: utils.getValue('contain_quality_4k'),
    contain_quality_8k: utils.getValue('contain_quality_8k'),
    webfull_unlock: utils.getValue('webfull_unlock'),
    auto_reload: utils.getValue('auto_reload'),
    auto_skip: utils.getValue('auto_skip')
  }
  const modules = {
    /**
     * 判断用户是否登录
     */
    isLogin() {
      return Boolean(document.cookie.replace(new RegExp(String.raw`(?:(?:^|.*;\s*)bili_jct\s*=\s*([^;]*).*$)|^.*$`), '$1') || null)
    },
    /**
     * 检查视频是否可以播放
     */
    checkVideoCanPlayThrough() {
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
     * 监听屏幕模式变化(normal/wide/web/full)
     */
    observerPlayerDataScreenChanges() {
      const playerContainer = document.querySelector(selector.playerContainer)
      const observer = new MutationObserver(mutations => {
        const playerDataScreen = playerContainer.getAttribute('data-screen')
        utils.setValue('current_screen_mode', playerDataScreen)
      }).observe(playerContainer, {
        attributes: true,
        attributeFilter: ['data-screen'],
      })
    },
    getCurrentScreenMode() {
      const playerDataScreen = document.querySelector(selector.playerContainer).getAttribute('data-screen')
      return playerDataScreen
    },
    /**
     * 递归检查屏幕模式是否切换成功
     * @param {*} expectScreenMode 期望的屏幕模式
     * @description
     * - 未成功自动重试
     * - 递归超过5次则返回失败
     */
    async checkScreenModeSwitchSuccess(expectScreenMode) {
      vars.checkScreenModeSwitchSuccessDepths++
      const enterBtnMap = {
        wide: async () => { return await elmGetter.get(selector.screenModeWideEnterButton) },
        web: async () => { return await elmGetter.get(selector.screenModeWebEnterButton) },
      }
      if (enterBtnMap[expectScreenMode]) {
        const enterBtn = await enterBtnMap[expectScreenMode]()
        enterBtn.click()
        await utils.sleep(200)
        const currentScreenMode = this.getCurrentScreenMode()
        const equal = expectScreenMode === currentScreenMode
        await utils.sleep(200)
        const danmukuBoxMarginTop = await utils.getElementComputedStyle(selector.danmukuBox, 'margin-top')
        const success = expectScreenMode === 'wide' ? equal && +danmukuBoxMarginTop.slice(0, -2) > 0 : equal
        if (success) return { done: success, mode: expectScreenMode }
        else {
          if (vars.checkScreenModeSwitchSuccessDepths === 5) return { done: false, mode: expectScreenMode }
          return this.checkScreenModeSwitchSuccess(expectScreenMode)
        }
      }
    },
    /**
     * 执行自动切换屏幕模式
     * @description
     * - 功能未开启，不执行切换函数，直接返回成功
     * - 功能开启，但当前屏幕已为宽屏或网页全屏，则直接返回成功
     * - 功能开启，执行切换函数
     */
    async autoSelectScreenMode() {
      if (vars.autoSelectScreenModeRunningCounts += 1) {
        if (vals.selected_screen_mode === 'close') return { done: true, mode: 'normal' }
        const currentScreenMode = this.getCurrentScreenMode()
        const screenModeMap = {
          wide: { done: true, mode: 'wide' },
          web: { done: true, mode: 'web' },
        }
        if (screenModeMap[currentScreenMode]) return screenModeMap[currentScreenMode]
        if (screenModeMap[vals.selected_screen_mode]) {
          return await this.checkScreenModeSwitchSuccess(vals.selected_screen_mode)
        }
      }
    },
    // 自动关闭静音
    async autoCancelMute() {
      if (vars.autoCancelMuteRunningCounts += 1) {
        const mutedButton = document.querySelector(selector.mutedButton)
        const volumeButton = document.querySelector(selector.volumeButton)
        const mutedButtonDisplay = mutedButton.style.display
        const volumeButtonDisplay = volumeButton.style.display
        if (mutedButtonDisplay === 'block' || volumeButtonDisplay === 'none') {
          mutedButton.click()
          utils.logger.info('静音丨已关闭')
        }
      }
    },
    /**
     * 自动选择最高画质
     * @description
     * 质量代码：
     * - 127->8K 超高清;120->4K 超清;116->1080P 60帧;
     * - 80->1080P 高清；64->720P 高清；32->480P 清晰；
     * - 16->360P 流畅；0->自动
     */
    async autoSelectVideoHighestQuality() {
      if (vars.autoSelectVideoHighestQualityRunningCounts += 1) {
        let message
        const qualitySwitchButtonsMap = new Map()
        if (!vals.auto_select_video_highest_quality) return
        const qualitySwitchButtons = await elmGetter.each(selector.qualitySwitchButtons, document, button => {
          qualitySwitchButtonsMap.set(button.dataset.value, button)
        })
        if (vals.is_vip) {
          if (!vals.contain_quality_4k && !vals.contain_quality_8k) {
            [...qualitySwitchButtonsMap].filter(quality => {
              return +quality[0] < 120
            })[0][1].click()
            message = '最高画质｜VIP｜不包含4K及8K｜切换成功'
          }
          if (vals.contain_quality_4k && !vals.contain_quality_8k) {
            qualitySwitchButtonsMap.get('120').click()
            message = '最高画质｜VIP｜4K｜切换成功'
          }
          if ((vals.contain_quality_4k && vals.contain_quality_8k) || (!vals.contain_quality_4k && vals.contain_quality_8k)) {
            qualitySwitchButtonsMap.get('127').click()
            message = '最高画质｜VIP｜8K｜切换成功'
          }
        } else {
          [...qualitySwitchButtonsMap].filter(button => {
            return button[1].children.length < 2
          })[0][1].click()
          message = '最高画质｜非VIP｜切换成功'
        }
        utils.logger.info(message)
      }
    },
    async autoLocation() {
      const onAutoLocate = vals.auto_locate && ((!vals.auto_locate_video && !vals.auto_locate_bangumi) || (vals.auto_locate_video && vals.player_type === 'video') || (vals.auto_locate_bangumi && vals.player_type === 'bangumi'))
      if (!onAutoLocate || vals.selected_screen_mode === 'web') return
      vars.autoLocationRetryDepths++
      const video = await elmGetter.get(selector.video)
      // video 相对文档顶部距离，大小不随页面滚动变化
      const videoOffsetTop = document.querySelector('#viewbox_report').getBoundingClientRect().height + document.querySelector('#biliMainHeader').getBoundingClientRect().height
      // video 相对文档顶部距离 - 设定的 video 相对浏览器视口顶部距离 = 文档滚动距离
      utils.documentScrollTo(videoOffsetTop - vals.offset_top)
      await utils.sleep(100)
      // video 相对浏览器视口顶部距离，大小随页面滚动变化
      const videoClientTop = Math.trunc(video.getBoundingClientRect().top)
      // 若设定的 video 相对浏览器视口顶部距离与获取的当前 video 相对浏览器视口顶部距离相等，则定位成功
      if (videoClientTop === vals.offset_top) {
        utils.logger.info('自动定位｜成功')
        return true
      } else {
        if (vars.autoLocationRetryDepths === 5) return false
        utils.logger.warn(`自动定位失败，继续尝试
        -----------------
        当前文档顶部偏移量：${Math.trunc(window.pageYOffset)}
        期望文档顶部偏移量：${videoOffsetTop - vals.offset_top}
        偏移量误差：${(videoOffsetTop - vals.offset_top) - Math.trunc(window.pageYOffset)}
        播放器顶部偏移量：${videoClientTop}
        设置偏移量：${vals.offset_top}`)
        await utils.sleep(100)
        utils.documentScrollTo(0)
        return this.autoLocation()
      }
    },
    async clickPlayerAutoLocation() {
      if (vals.click_player_auto_locate) {
        const video = await elmGetter.get(selector.video)
        video.addEventListener('click', () => {
          const videoClientTop = Math.trunc(video.getBoundingClientRect().top)
          const videoOffsetTop = utils.getElementToDocumentTop(video)
          utils.logger.debug(`${videoOffsetTop} - ${vals.offset_top} = ${videoClientTop - vals.offset_top}`)
          utils.documentScrollTo(videoOffsetTop - vals.offset_top)
        })
      }
    },
    /**
    * 前期准备函数
    * 提前执行其他脚本功能所依赖的其他函数
    */
    thePrepFunction() {
      if (vars.thePrepFunctionRunningCounts += 1) {
        utils.clearAllTimersWhenCloseTab()
        utils.whenWindowUrlChange()
        utils.initValue()
        modules.observerPlayerDataScreenChanges()
      }
    },
    /**
     * 脚本执行主函数
     * 定义了所有功能函数将按何种规则执行
     */
    async theMainFunction() {
      if (vars.theMainFunctionRunningCounts += 1) {
        // 自动定位前禁止用户操作滚动条
        document.body.style.overflow = 'hidden'
        const videoPlayerExists = await elmGetter.get(selector.video)
        if (videoPlayerExists) {
          utils.logger.info('播放器｜已找到')
          const isCanPlayThrough = await modules.checkVideoCanPlayThrough()
          const videoControlerBtnExists = await elmGetter.get(selector.playerControler)
          if (isCanPlayThrough || (!isCanPlayThrough && videoControlerBtnExists)) {
            utils.logger.info('视频资源｜可以播放')
            const selectedScreenMode = await modules.autoSelectScreenMode()
            if (selectedScreenMode.done) {
              utils.logger.info(`屏幕模式｜${selectedScreenMode['mode'].toUpperCase()}｜切换成功`)
              this.autoCancelMute()
              this.autoSelectVideoHighestQuality()
              this.clickPlayerAutoLocation()
              this.autoLocation()
              document.body.style.overflow = 'auto'
            } else {
              utils.logger.error('屏幕模式｜切换失败)')
              utils.reloadCurrentTab()
            }
          } else {
            utils.logger.error('视频资源｜加载失败')
            utils.reloadCurrentTab()
          }
        } else {
          utils.logger.error('播放器｜未找到')
          utils.reloadCurrentTab()
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
