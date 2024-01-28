// ==UserScript==
// @name              哔哩哔哩（bilibili.com）播放页调整 - 纯原生JS版
// @license           GPL-3.0 License
// @namespace         https://greasyfork.org/zh-CN/scripts/415804-bilibili%E6%92%AD%E6%94%BE%E9%A1%B5%E8%B0%83%E6%95%B4-%E8%87%AA%E7%94%A8
// @version           0.1
// @description       1.自动定位到播放器（进入播放页，可自动定位到播放器，可设置偏移量及是否在点击主播放器时定位）；2.可设置是否自动选择最高画质；3.可设置播放器默认模式；
// @author            QIAN
// @match             *://*.bilibili.com/video/*
// @match             *://*.bilibili.com/bangumi/play/*
// @match             *://*.bilibili.com/list/*
// @run-at            document-start
// @require           https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js
// @require           https://cdn.jsdelivr.net/npm/axios@1.6.5/dist/axios.min.js
// @grant             GM_setValue
// @grant             GM_getValue
// @grant             GM_registerMenuCommand
// @grant             GM_getResourceText
// @grant             GM.info
// @supportURL        https://github.com/QIUZAIYOU/Bilibili-VideoPage-Adjustment-Further
// @homepageURL       https://github.com/QIUZAIYOU/Bilibili-VideoPage-Adjustment-Further
// @icon              https://www.bilibili.com/favicon.ico?v=1
// @downloadURL https://update.greasyfork.org/scripts/415804/%E5%93%94%E5%93%A9%E5%93%94%E5%93%A9%EF%BC%88bilibilicom%EF%BC%89%E6%92%AD%E6%94%BE%E9%A1%B5%E8%B0%83%E6%95%B4.user.js
// @updateURL https://update.greasyfork.org/scripts/415804/%E5%93%94%E5%93%A9%E5%93%94%E5%93%A9%EF%BC%88bilibilicom%EF%BC%89%E6%92%AD%E6%94%BE%E9%A1%B5%E8%B0%83%E6%95%B4.meta.js
// ==/UserScript==
(function () {
  'use strict';
  let counts = {
    theMainFunctionRunning: 0,
    thePrepFunctionRunning: 0,
    autoSelectScreenModeRunning: 0,
    autoCancelMuteRunning: 0,
    webfullUnlockRunning: 0,
    autoSelectVideoHighestQualityRunning: 0,
    insertGoToCommentsButton: 0,
    insertSetSkipTimeNodesButton: 0,
    insertSkipTimeNodesSwitchButton: 0,
    functionExecutions: 0,
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
    currentUrl: document.URL,
    getValue () {
      return GM_getValue(name)
    },
    setValue (name, value) {
      GM_setValue(name, value)
    },
    sleep (times) {
      return new Promise(resolve => setTimeout(resolve, times))
    },
    /**
     * 向文档插入自定义样式
     * @param {String} id 样式表id
     * @param {String} css 样式内容
     */
    insertStyleToDocument (id, css) {
      const style = document.createElement('STYLE')
      style.id = id
      style.type = "text/css"
      style.innerHTML = css
      document.head.appendChild(style)
    },
    logger: {
      info (content) {
        console.info('%c播放页调整', 'color:white;background:#006aff;padding:2px;border-radius:2px', content);
      },
      warn (content) {
        console.warn('%c播放页调整', 'color:white;background:#ff6d00;padding:2px;border-radius:2px', content);
      },
      error (content) {
        console.error('%c播放页调整', 'color:white;background:#f33;padding:2px;border-radius:2px', content);
      },
      debug (content) {
        console.info('%c播放页调整(调试)', 'color:white;background:#cc00ff;padding:2px;border-radius:2px', content);
      },
    },
    /**
     * 检查元素是否存在
     * @param {String} selector 元素选择器
     * @param {Number} maxAttempts 最大尝试次数
     * @param {Number} delay 检查时间间隔
     */
    checkElementExistence (selector, maxAttempts, delay) {
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
     * @returns
     */
    async checkVideoCanPlayThrough () {
      // const BwpVideoPlayerExists = await this.checkElementExistence(selector.videoBwp, 10, 10)
      // if (BwpVideoPlayerExists) {
      //   return new Promise(async resolve => {
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
    }
  }
  async function theMainFunction () {
    const videoPlayerExists = await utils.checkElementExistence(selector.video, 5, 100)
    if (videoPlayerExists) {
      const isCanPlayThrough = await utils.checkVideoCanPlayThrough()
      const videoControlerBtnExists = await utils.checkElementExistence(selector.videoControlerBtn, 100, 100)
      if (isCanPlayThrough && videoControlerBtnExists) {

      }
    }
  }
  theMainFunction()
})();
