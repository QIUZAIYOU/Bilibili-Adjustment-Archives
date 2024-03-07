// ==UserScript==
// @name              哔哩哔哩（bilibili.com）调整 - 纯原生JS版
// @namespace         哔哩哔哩（bilibili.com）调整 - 纯原生JS版
// @copyright         QIAN
// @license           GPL-3.0 License
// @version           0.1.6
// @description       一、动态页调整：1.导航样式优化。2.默认显示"投稿视频"内容。二、播放页调整：1.自动定位到播放器（进入播放页，可自动定位到播放器，可设置偏移量及是否在点击主播放器时定位）；2.可设置是否自动选择最高画质；3.可设置播放器默认模式；
// @author            QIAN
// @match             *://www.bilibili.com
// @match             *://www.bilibili.com/video/*
// @match             *://www.bilibili.com/bangumi/play/*
// @match             *://www.bilibili.com/list/*
// @match             *://t.bilibili.com/*
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
// ==/UserScript==
(function () {
  'use strict';
  let vars = {
    theMainFunctionRunningCount: 0,
    thePrepFunctionRunningCount: 0,
    autoSelectScreenModeRunningCount: 0,
    autoCancelMuteRunningCount: 0,
    webfullUnlockRunningCount: 0,
    autoSelectVideoHighestQualityRunningCount: 0,
    insertGoToCommentButtonCount: 0,
    insertSetSkipTimeNodesButtonCount: 0,
    insertSetSkipTimeNodesSwitchButtonCount: 0,
    functionExecutionsCount: 0,
    checkScreenModeSwitchSuccessDepths: 0,
    autoLocationToPlayerRetryDepths: 0,
  }
  let arrays = {
    screenModes: ['wide', 'web'],
    intervalIds: [],
    skipNodesRecords: [],
  }
  const selectors = {
    app: '#app',
    header: '#biliMainHeader',
    player: '#bilibili-player',
    playerWrap: '#playerWrap',
    playerWebscreen: '#bilibili-player.mode-webscreen',
    playerContainer: '#bilibili-player .bpx-player-container',
    playerController: '#bilibili-player .bpx-player-ctrl-btn',
    playerControllerBottomRight: '.bpx-player-control-bottom-right',
    playerTooltipArea: '.bpx-player-tooltip-area',
    playerTooltipTitle: '.bpx-player-tooltip-title',
    playerDanmuSetting: '.bpx-player-dm-setting',
    playerEndingRelateVideo: '.bpx-player-ending-related-item',
    volumeButton: '.bpx-player-ctrl-volume-icon',
    mutedButton: '.bpx-player-ctrl-muted-icon',
    video: '#bilibili-player video',
    videoBwp: 'bwp-video',
    videoTitleArea: '#viewbox_report',
    videoFloatNav: '.fixed-sidenav-storage',
    videoComment: '#comment',
    videoCommentReplyList: '#comment .reply-list',
    videoTime: '.video-time,.video-seek',
    videoDescription: '#v_desc',
    videoDescriptionInfo: '#v_desc .basic-desc-info',
    videoDescriptionText: '#v_desc .desc-info-text',
    videoNextPlayAndRecommendLink: '.video-page-card-small .card-box',
    videoSectonsEpisodeLink: '.video-sections-content-list .video-episode-card',
    bangumiComment: '#comment_module',
    bangumiFloatNav: '#__next div[class*="navTools_floatNavExp"] div[class*="navTools_navMenu"]',
    bangumiMainContainer: '.main-container',
    bangumiSectonsEpisodeLink: '#__next div[class*="numberList_wrapper"] div[class*="numberListItem_number_list_item"] ',
    qualitySwitchButtons: '.bpx-player-ctrl-quality-menu-item',
    screenModeWideEnterButton: '.bpx-player-ctrl-wide-enter',
    screenModeWideLeaveButton: '.bpx-player-ctrl-wide-leave',
    screenModeWebEnterButton: '.bpx-player-ctrl-web-enter',
    screenModeWebLeaveButton: '.bpx-player-ctrl-web-leave',
    screenModeFullControlButton: '.bpx-player-ctrl-full',
    danmukuBox: '#danmukuBox',
    danmuShowHideTip: 'div[aria-label="弹幕显示隐藏"]',
    membersContainer: '.members-info-container',
    membersUpAvatarFace: '.membersinfo-upcard:first-child picture img',
    upAvatarFace: '.up-info-container .up-avatar-wrap .bili-avatar .bili-avatar-face',
    upAvatarDecoration: '.up-info-container .up-avatar-wrap .bili-avatar .bili-avatar-pendent-dom .bili-avatar-img',
    upAvatarIcon: '.up-info-container .up-avatar-wrap .bili-avatar .bili-avatar-icon',
    setSkipTimeNodesPopover: '#setSkipTimeNodesPopover',
    setSkipTimeNodesPopoverToggleButton: '#setSkipTimeNodesPopoverToggleButton',
    setSkipTimeNodesPopoverHeaderExtra: '#setSkipTimeNodesPopover .header .extra',
    setSkipTimeNodesPopoverTips: '#setSkipTimeNodesPopover .tips',
    setSkipTimeNodesPopoverTipsDetail: '#setSkipTimeNodesPopover .tips .detail',
    setSkipTimeNodesPopoverTipsContents: '#setSkipTimeNodesPopover .tips .contents',
    setSkipTimeNodesPopoverRecords: '#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .records',
    setSkipTimeNodesPopoverResult: '#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .result',
    setSkipTimeNodesInput: '#setSkipTimeNodesInput',
    skipTimeNodesRecordsArray: '#skipTimeNodesRecordsArray',
    clearRecordsButton: '#clearRecordsButton',
    saveRecordsButton: '#saveRecordsButton',
    uploadSkipTimeNodesButton: '#uploadSkipTimeNodesButton',
    indexBodyElement: '#i_cecream',
    indexRecommendVideoSix: '.recommended-container_floor-aside .feed-card:nth-child(-n+7)',
    indexRecommendVideoRollButtonWrapper: '.recommended-container_floor-aside .feed-roll-btn',
    indexRecommendVideoRollButton: '.recommended-container_floor-aside .feed-roll-btn button.roll-btn',
    indexRecommendVideoHistoryOpenButton: '#indexRecommendVideoHistoryOpenButton',
    indexRecommendVideoHistoryPopover: '#indexRecommendVideoHistoryPopover',
    clearRecommendVideoHistoryButton: '#clearRecommendVideoHistoryButton',
    AutoSkipSwitchInput: '#Auto-Skip-Switch',

  }
  const vals = {
    is_vip: () => { return utils.getValue('is_vip') },
    player_type: () => { return utils.getValue('player_type') },
    offset_top: () => { return Math.trunc(utils.getValue('offset_top')) },
    auto_locate: () => { return utils.getValue('auto_locate') },
    get_offest_method: () => { return utils.getValue('get_offest_method') },
    auto_locate_video: () => { return utils.getValue('auto_locate_video') },
    auto_locate_bangumi: () => { return utils.getValue('auto_locate_bangumi') },
    click_player_auto_locate: () => { return utils.getValue('click_player_auto_locate') },
    video_player_offset_top: () => { return Math.trunc(utils.getValue('video_player_offset_top')) },
    bangumi_player_offset_top: () => { return Math.trunc(utils.getValue('bangumi_player_offset_top')) },
    current_screen_mode: () => { return utils.getValue('current_screen_mode') },
    selected_screen_mode: () => { return utils.getValue('selected_screen_mode') },
    auto_select_video_highest_quality: () => { return utils.getValue('auto_select_video_highest_quality') },
    contain_quality_4k: () => { return utils.getValue('contain_quality_4k') },
    contain_quality_8k: () => { return utils.getValue('contain_quality_8k') },
    webfull_unlock: () => { return utils.getValue('webfull_unlock') },
    auto_reload: () => { return utils.getValue('auto_reload') },
    auto_skip: () => { return utils.getValue('auto_skip') },
    web_video_link: () => { return utils.getValue('web_video_link') },
  }
  const styles = {
    IndexAdjustment: '#indexRecommendVideoHistoryOpenButton{margin-top:10px!important}#indexRecommendVideoHistoryPopover{position:fixed!important;top:50%!important;left:50%!important;box-sizing:border-box!important;padding:20px!important;width:600px!important;max-height:70vh!important;border:none!important;border-radius:6px!important;font-size:15px!important;transform:translate(-50%,-50%)!important;overscroll-behavior:contain!important}#indexRecommendVideoHistoryPopover::backdrop{backdrop-filter:blur(3px)}#indexRecommendVideoHistoryPopover .indexRecommendVideoHistoryPopoverTitle{display:flex;margin-bottom:16px;text-align:center;font-size:22px;align-items:center;justify-content:space-between}#indexRecommendVideoHistoryPopover ul{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:space-between!important}#indexRecommendVideoHistoryPopover ul li{padding:7px 0;width:100%;border-color:#ededed!important;border-style:solid!important;line-height:24px!important;border-bottom-width:1px!important}#indexRecommendVideoHistoryPopover ul li:first-child{border-top-width:1px!important}#indexRecommendVideoHistoryPopover ul li a{color:#333!important}#indexRecommendVideoHistoryPopover ul li:hover a{color:#00a1d6!important}#clearRecommendVideoHistoryButton{position:sticky!important;display:flex!important;padding:10px!important;width:80px!important;border-radius:6px!important;background:#00a1d6!important;color:#fff!important;font-size:15px!important;line-height:16px!important;cursor:pointer!important;align-items:center!important;justify-content:center}',
    VideoPageAdjustment: '.back-to-top-wrap .locate{visibility:hidden}.back-to-top-wrap:has(.visible) .locate{visibility:visible}.bpx-player-container[data-screen=full] #goToComments{opacity:.6;cursor:not-allowed;pointer-events:none}#comment-description .user-name{display:flex;padding:0 5px;height:22px;border:1px solid;border-radius:4px;align-items:center;justify-content:center}.bpx-player-ctrl-skip{border:none!important;background:0 0!important}.bpx-player-container[data-screen=full] #setSkipTimeNodesPopoverToggleButton,.bpx-player-container[data-screen=web] #setSkipTimeNodesPopoverToggleButton{height:32px!important;line-height:32px!important}#setSkipTimeNodesPopover{top:50%!important;left:50%!important;box-sizing:border-box!important;padding:15px!important;max-width:456px!important;border:0!important;border-radius:6px!important;font-size:14px!important;transform:translate(-50%,-50%)!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper{display:flex!important;flex-direction:column!important;gap:7px!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper button{display:flex!important;width:100%;height:34px!important;border-style:solid!important;border-width:1px!important;border-radius:6px!important;text-align:center!important;line-height:34px!important;cursor:pointer;align-items:center!important;justify-content:center!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper button:disabled{cursor:not-allowed}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .header{display:flex!important;font-weight:700!important;align-items:center!important;justify-content:space-between!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .header .title{font-weight:700!important;font-size:16px!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .header .extra{font-size:12px!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .header .extra,#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .result{padding:2px 5px!important;border:1px solid #d9ecff!important;border-radius:6px!important;background-color:#ecf5ff!important;color:#409eff!important;font-weight:400!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .success{display:flex!important;padding:2px 5px!important;border-color:#e1f3d8!important;background-color:#f0f9eb!important;color:#67c23a!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .danger{display:flex!important;padding:2px 5px!important;border-color:#fde2e2!important;background-color:#fef0f0!important;color:#f56c6c!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .handles{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:7px!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .tips{position:relative!important;overflow:hidden;box-sizing:border-box!important;padding:7px!important;border-color:#e9e9eb!important;border-radius:6px!important;background-color:#f4f4f5!important;color:#909399!important;font-size:13px!important;transition:height .3s!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .tips.open{height:134px!important;line-height:20px!important;}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .tips.close{height:34px!important;line-height:22px!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .tips .detail{position:absolute!important;top:9px!important;right:7px!important;display:flex!important;cursor:pointer!important;transition:transform .3s!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .tips .detail.open{transform:rotate(0)}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .tips .detail.close{transform:rotate(180deg)}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .records{display:none;flex-direction:column!important;gap:7px}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .records .recordsButtonsGroup{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:7px!important}#clearRecordsButton{border-color:#d3d4d6!important;background:#f4f4f5!important;color:#909399!important}#clearRecordsButton:disabled{border-color:#e9e9eb!important;background-color:#f4f4f5!important;color:#bcbec2!important}#saveRecordsButton{border-color:#c2e7b0!important;background:#f0f9eb!important;color:#67c23a!important}#saveRecordsButton:disabled{border-color:#e1f3d8!important;background-color:#f0f9eb!important;color:#a4da89!important}#setSkipTimeNodesInput{box-sizing:border-box!important;padding:5px!important;width:calc(100% - 39px)!important;height:34px!important;border:1px solid #cecece!important;border-radius:6px!important;line-height:34px!important}#uploadSkipTimeNodesButton{width:52px!important;height:34px!important;border:none!important;background:#00a1d6!important;color:#fff!important}#uploadSkipTimeNodesButton:hover{background:#00b5e5!important}#skipTimeNodesRecordsArray{display:flex!important;padding:2px 5px!important;border-radius:6px!important}',
    BodyHidden: 'body{overflow:hidden!important}',
    ResetPlayerLayout: 'body{padding-top:0;position:auto}#playerWrap{display:block}#bilibili-player{height:auto;position:relative}.bpx-player-mini-warp{display:none}',
    UnlockWebscreen: 'body.webscreen-fix{padding-top:BODYHEIGHT;position:unset}#bilibili-player.mode-webscreen{height:BODYHEIGHT;position:absolute}#playerWrap{display:none}#danmukuBox{margin-top:0}',
    FreezeHeaderAndVideoTitle: '#biliMainHeader{height:64px!important}#viewbox_report{height:108px!important;padding-top:22px!important}.members-info-container{height:86px!important;overflow:hidden!important;padding-top:11px!important}.membersinfo-wide .header{display:none!important}',
  }
  const regexps = {
    // 如果使用全局检索符(g)，则在多次使用 RegExp.prototype.test() 时会导致脚本执行失败，
    // 因为在全局检索符下(g), RegExp.prototype.test() 在匹配成功后会设置下一次匹配的起始索引 lastindex
    // 但是当前页面的 URL 为固定字符串，在上一次匹配成功后设置的 lastindex 后没有其他字符串，所以会匹配失败
    // 例如：使用 /asifadeaway/g.test('https://www.asifadeaway.com/post/Watched.html') 检查是否含有字符串'asifadeaway',此时返回 true 并将 lastindex 设为 23
    // 后续再执行一次同样的检查则会返回 false 并将 lastindex 设为 0，因为继上次检查匹配成功后再次检查会从索引位置 23 开始，而此位置往后并没有字符串'asifadeaway'
    // 以下的正则表达式都包含了整个 URL 字符串，所以匹配成功一次之后 lastindex 会被设置为 URL 字符串的长度，再次执行后必定返回 false
    // 所以会产生匹配成功之后再次匹配就会失败的奇怪现象，就是因为 lastindex 的值在上一次匹配成功后被设为了字符串的长度
    // 因此不使用全局检索符(g)
    video: /.*:\/\/www\.bilibili\.com\/(video|bangumi\/play|list)\/.*/i,
    dynamic: /.*:\/\/t\.bilibili\.com\/.*/i,
  }
  const utils = {
    /**
     * 初始化所有数据
     */
    initValue () {
      const value = [{
        name: 'is_vip',
        value: true,
      }, {
        name: 'player_type',
        value: 'video',
      }, {
        name: 'offset_top',
        value: 5,
      }, {
        name: 'video_player_offset_top',
        value: 168,
      }, {
        name: 'bangumi_player_offset_top',
        value: 104,
      }, {
        name: 'auto_locate',
        value: true,
      }, {
        name: 'get_offest_method',
        value: 'function',
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
      }, {
        name: 'web_video_link',
        value: 'https://t.bilibili.com/?tab=video'
      }]
      value.forEach(v => {
        if (utils.getValue(v.name) === undefined) {
          utils.setValue(v.name, v.value)
        }
      })
    },
    /**
     * 获取自定义数据
     * @param {String} 数据名称
     * @returns 数据数值
     */
    getValue (name) {
      return GM_getValue(name)
    },
    /**
     * 写入自定义数据
     * @param {String} 数据名称
     * @param {*} 数据数值
     */
    setValue (name, value) {
      GM_setValue(name, value)
    },
    /**
     * 休眠
     * @param {Number} 时长
     * @returns
     */
    sleep (times) {
      return new Promise(resolve => setTimeout(resolve, times))
    },
    /**
     * 判断数组长度是否为偶数
     */
    isArrayLengthEven (arr) {
      return arr.length % 2 === 0
    },
    /**
     * 向文档插入自定义样式
     * @param {String} id 样式表id
     * @param {String} css 样式内容
     */

    insertStyleToDocument (id, css) {
      const styleElement = GM_addStyle(css)
      styleElement.id = id
    },
    /**
     * 自定义日志打印
     * - info->信息；warn->警告
     * - error->错误；debug->调试
     */
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
     * 检查当前文档是否被激活
     */
    checkDocumentIsHidden () {
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
     * 为元素添加监听器并执行相应函数
     */
    async addEventListenerToElement () {
      if (window.location.href === 'https://www.bilibili.com/') {
        const [$indexRecommendVideoRollButton, $clearRecommendVideoHistoryButton] = await elmGetter.get([selectors.indexRecommendVideoRollButton, selectors.clearRecommendVideoHistoryButton])
        $indexRecommendVideoRollButton.addEventListener('click', () => {
          modules.setIndexRecordRecommendVideoHistory()
          modules.getIndexRecordRecommendVideoHistory()
        })
        $clearRecommendVideoHistoryButton.addEventListener('click', () => {
          modules.clearRecommendVideoHistory()
        })
      }
      if (regexps.video.test(window.location.href)) {
        if (window.onurlchange === null) {
          window.addEventListener('urlchange', () => {
            modules.locationToPlayer()
            modules.insertVideoDescriptionToComment()
            // utils.logger.debug('URL改变了！')
          })
        } else {
          modules.clickRelatedVideoAutoLocation()
        }
        window.addEventListener("popstate", () => {
          modules.autoLocationAndInsertVideoDescriptionToComment()
        })
        const [$playerContainer, $AutoSkipSwitchInput] = await elmGetter.get([selectors.playerContainer, selectors.AutoSkipSwitchInput])
        $playerContainer.addEventListener('fullscreenchange', (event) => {
          let isFullscreen = document.fullscreenElement === event.target
          if (!isFullscreen) modules.locationToPlayer()
        })
        document.addEventListener('keydown', (event) => {
          if (event.key === 'j') {
            $AutoSkipSwitchInput.click()
          }
        })
        if (vals.auto_skip()) {
          const [$video, $setSkipTimeNodesPopoverToggleButton, $setSkipTimeNodesPopoverRecords, $skipTimeNodesRecordsArray, $saveRecordsButton] = await elmGetter.get([selectors.video, selectors.setSkipTimeNodesPopoverToggleButton, selectors.setSkipTimeNodesPopoverRecords, selectors.skipTimeNodesRecordsArray, selectors.saveRecordsButton])
          document.addEventListener('keydown', (event) => {
            if (event.key === 'k') {
              const currentTime = Math.ceil($video.currentTime)
              arrays.skipNodesRecords.push(currentTime)
              arrays.skipNodesRecords = Array.from(new Set(arrays.skipNodesRecords))
              if (arrays.skipNodesRecords.length > 0) {
                $setSkipTimeNodesPopoverRecords.style.display = 'flex'
                $skipTimeNodesRecordsArray.innerText = `打点数据：${JSON.stringify(arrays.skipNodesRecords)}`
                if (utils.isArrayLengthEven(arrays.skipNodesRecords)) {
                  $skipTimeNodesRecordsArray.classList.remove('danger')
                  $skipTimeNodesRecordsArray.classList.add('success')
                  $saveRecordsButton.removeAttribute('disabled')
                } else {
                  $skipTimeNodesRecordsArray.classList.remove('success')
                  $skipTimeNodesRecordsArray.classList.add('danger')
                  $saveRecordsButton.setAttribute('disabled', true)
                }
              }
            }
            if (event.key === 'g') {
              $setSkipTimeNodesPopoverToggleButton.click()
            }
          })
        }
      }
    },
    /**
     * 刷新当前页面
     */
    reloadCurrentTab () {
      if (vals.auto_reload()) location.reload()
    },
    /**
     * 滚动文档至目标位置
     * @param {Number} 滚动距离
     */
    documentScrollTo (offset) {
      document.documentElement.scrollTop = offset
    },
    /**
     * 获取指定 meta 标签的属性值
     * @param {*} attribute 属性名称
     * @returns 属性值
     */
    async getMetaContent (attribute) {
      const meta = await elmGetter.get(`meta[${attribute}]`)
      if (meta) {
        return meta.getAttribute('content')
      } else {
        return null
      }
    },
    /**
     * 获取Body 元素高度
     * @returns Body 元素高度
     */
    getBodyHeight () {
      const bodyHeight = document.body.clientHeight || 0
      const docHeight = document.documentElement.clientHeight || 0
      return bodyHeight < docHeight ? bodyHeight : docHeight
    },
    /**
     * 确保页面销毁时清除所有定时器
     */
    clearAllTimersWhenCloseTab () {
      window.addEventListener('beforeunload', () => {
        for (let id of arrays.intervalIds) {
          clearInterval(id)
        }
        arrays.intervalIds = []
      })
    },
    /**
     * 获取目标元素至文档距离
     * @param {String} 目标元素
     * @returns 顶部和左侧距离
     */
    getElementOffsetToDocument (element) {
      let rect, win
      if (!element.getClientRects().length) {
        return {
          top: 0,
          left: 0
        }
      }
      rect = element.getBoundingClientRect()
      win = element.ownerDocument.defaultView
      return {
        top: rect.top + win.pageYOffset,
        left: rect.left + win.pageXOffset
      }
    },
    /**
     * 创建并插入元素至目标元素
     * @param {String} Html 字符串
     * @param {Element} 目标元素
     * @param {String} 插入方法（before/after/prepend/append）
     * @returns 被创建的元素
     */
    createElementAndInsert (HtmlString, target, method) {
      const element = elmGetter.create(HtmlString, target)
      target[method](element)
      return element
    },
    /**
     * 判断函数是否为异步函数
     * - 不使用 targetFunction() instanceof Promise 方法
     * - 因为这会导致 targetFunction 函数在此处执行一遍，从而增加 vars 里相关的计数变量
     * - 当之后真正执行时会因为相关计数变量值不等于 1 导致在 executeFunctionsSequentially 函数里获取不到返回值
     */
    isAsyncFunction (targetFunction) {
      return targetFunction.constructor.name === 'AsyncFunction'
    },
    /**
     * 按顺序依次执行函数数组中的函数
     * @param {Array} functions 待执行的函数数组
     * - 当函数为异步函数时，只有当前一个函数执行完毕时才会继续执行下一个函数
     * - 当函数为同步函数时，则只会执行相应函数
     */
    executeFunctionsSequentially (functions) {
      if (functions.length > 0) {
        const currentFunction = functions.shift()
        if (utils.isAsyncFunction(currentFunction)) {
          currentFunction().then(result => {
            // console.log(currentFunction.name, result)
            if (result) {
              const { message, callback } = result
              if (message) utils.logger.info(message)
              if (callback && typeof callback === 'function') callback()
              if (callback && Array.isArray(callback)) modules.executeFunctionsSequentially(callback)
            }
            // else utils.logger.debug(currentFunction.name)
            utils.executeFunctionsSequentially(functions)
          }).catch(error => {
            utils.logger.error(error)
            utils.reloadCurrentTab()
          })
        } else {
          // console.log(currentFunction.name, result)
          const result = currentFunction()
          if (result) {
            const { message } = result
            if (message) utils.logger.info(message)
          }
        }
      }
    }
  }
  const modules = {
    //** ----------------------- 视频播放页相关功能 ----------------------- **//
    /**
     * 判断用户是否登录
     */
    isLogin () {
      return Boolean(document.cookie.replace(new RegExp(String.raw`(?:(?:^|.*;\s*)bili_jct\s*=\s*([^;]*).*$)|^.*$`), '$1') || window.UserStatus.userInfo.isLogin || null)
    },
    /**
     * 获取当前视频ID/video BVID/bangumi EPID
     */
    getCurrentVideoID () {
      const currentUrl = window.location.href
      return currentUrl.includes('www.bilibili.com/video') ? currentUrl.split('/')[4] : currentUrl.includes('www.bilibili.com/bangumi') ? currentUrl.split('/')[5].split('?')[0] : 'error'
    },
    /**
     * 获取当前视频类型(video/bangumi)
     * 如果都没匹配上则弹窗报错
     * @returns 当前视频类型
     */
    async getCurrentPlayerType () {
      const playerType = (window.location.href.startsWith('https://www.bilibili.com/video') || window.location.href.startsWith('https://www.bilibili.com/list/')) ? 'video' : window.location.href.startsWith('https://www.bilibili.com/bangumi') ? 'bangumi' : false
      if (!playerType) {
        utils.logger.debug('视频类型丨未匹配')
        alert('未匹配到当前视频类型，请反馈当前地址栏链接。')
      }
      utils.setValue('player_type', playerType)
      // utils.logger.debug(`${playerType} ${vals.player_type()}`)
      if (vals.player_type() === playerType) return { message: `视频类型丨${playerType}` }
      else modules.getCurrentPlayerType()
    },
    /**
     * 检查视频元素是否存在
     * - 若存在返回成功消息
     * - 若不存在则抛出异常
     */
    async checkVideoExistence () {
      const $video = await elmGetter.get(selectors.video)
      if ($video) return { message: '播放器｜已找到' }
      else throw new Error('播放器｜未找到')
    },
    /**
     * 检查视频是否可以播放
     */
    async checkVideoCanPlayThrough () {
      return new Promise((resolve, reject) => {
        let attempts = 100
        let message
        const timer = setInterval(() => {
          const $video = document.querySelector(selectors.video)
          const videoReadyState = $video.readyState
          if (videoReadyState === 4) {
            message = '视频资源｜可以播放'
            resolve({ message })
            clearInterval(timer)
          } else if (attempts <= 0) {
            message = '视频资源｜加载失败'
            reject({ message })
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
    async observerPlayerDataScreenChanges () {
      const $playerContainer = await elmGetter.get(selectors.playerContainer, 100)
      const observer = new MutationObserver(() => {
        const playerDataScreen = $playerContainer.getAttribute('data-screen')
        utils.setValue('current_screen_mode', playerDataScreen)
      })
      observer.observe($playerContainer, {
        attributes: true,
        attributeFilter: ['data-screen'],
      })
    },
    /**
     * 获取当前屏幕模式
     * @param {Number} 延时
     * @returns
     */
    async getCurrentScreenMode (delay = 0) {
      // if (vals.player_type() === 'bangumi') await utils.sleep(1000)
      const $playerContainer = await elmGetter.get(selectors.playerContainer, delay)
      // utils.logger.debug($playerContainer)
      return $playerContainer.getAttribute('data-screen')
    },
    /**
     * 执行自动切换屏幕模式

     * - 功能未开启，不执行切换函数，直接返回成功
     * - 功能开启，但当前屏幕已为宽屏或网页全屏，则直接返回成功
     * - 功能开启，执行切换函数
     */
    async autoSelectScreenMode () {
      if (++vars.autoSelectScreenModeRunningCount === 1) {
        if (vals.selected_screen_mode() === 'close') return { message: '屏幕模式｜功能已关闭' }
        const currentScreenMode = await modules.getCurrentScreenMode()
        if (arrays.screenModes.includes(currentScreenMode)) return { message: `屏幕模式｜当前已是 ${currentScreenMode.toUpperCase()} 模式` }
        if (arrays.screenModes.includes(vals.selected_screen_mode())) {
          const result = await modules.checkScreenModeSwitchSuccess(vals.selected_screen_mode())
          if (result) return { message: `屏幕模式｜${vals.selected_screen_mode().toUpperCase()}｜切换成功` }
          else throw new Error(`屏幕模式｜${vals.selected_screen_mode().toUpperCase()}｜切换失败：已达到最大重试次数`)
        }
      }
    },
    /**
     * 递归检查屏幕模式是否切换成功
     * @param {*} expectScreenMode 期望的屏幕模式
     * - 未成功自动重试
     * - 递归超过 10 次则返回失败
     */
    async checkScreenModeSwitchSuccess (expectScreenMode) {
      const enterBtnMap = {
        wide: async () => { return await elmGetter.get(selectors.screenModeWideEnterButton) },
        web: async () => { return await elmGetter.get(selectors.screenModeWebEnterButton) },
      }
      if (enterBtnMap[expectScreenMode]) {
        const enterBtn = await enterBtnMap[expectScreenMode]()
        enterBtn.click()
        const currentScreenMode = await modules.getCurrentScreenMode()
        const equal = expectScreenMode === currentScreenMode
        const success = vals.player_type() === 'video' ? expectScreenMode === 'wide' ? equal && +getComputedStyle(document.querySelector(selectors.danmukuBox))['margin-top'].slice(0, -2) > 0 : equal : equal
        // utils.logger.debug(`${vals.player_type()} ${expectScreenMode} ${currentScreenMode} ${equal} ${success}`)
        if (success) return success
        else {
          if (++vars.checkScreenModeSwitchSuccessDepths === 10) return false
          // utils.logger.warn(`屏幕模式切换失败，继续尝试丨当前：${currentScreenMode}，期望：${expectScreenMode}`)
          await utils.sleep(300)
          return modules.checkScreenModeSwitchSuccess(expectScreenMode)
        }
      }
    },
    // 设置位置数据并滚动至播放器
    async setlocationDataAndScrollToPlayer () {
      const getOffestMethod = vals.get_offest_method()
      let playerOffsetTop
      if (getOffestMethod === 'elements') {
        const $header = await elmGetter.get(selectors.header, 100)
        const $placeholderElement = await elmGetter.get(selectors.videoTitleArea, 100) || await elmGetter.get(selectors.bangumiMainContainer, 100)
        const headerHeight = $header.getBoundingClientRect().height
        const placeholderElementHeight = $placeholderElement.getBoundingClientRect().height
        playerOffsetTop = vals.player_type() === 'video' ? headerHeight + placeholderElementHeight : headerHeight + +getComputedStyle($placeholderElement)['margin-top'].slice(0, -2)
      }
      if (getOffestMethod === 'function') {
        const $player = await elmGetter.get(selectors.player)
        playerOffsetTop = utils.getElementOffsetToDocument($player).top

      }
      // utils.logger.debug(playerOffsetTop)
      vals.player_type() === 'video' ? utils.setValue('video_player_offset_top', playerOffsetTop) : utils.setValue('bangumi_player_offset_top', playerOffsetTop)
      await modules.getCurrentScreenMode() === 'wide' ? utils.documentScrollTo(playerOffsetTop - vals.offset_top()) : utils.documentScrollTo(0)
      return
      // utils.logger.debug('定位至播放器！')
    },
    /**
     * 自动定位至播放器并检查是否成功
     */
    async autoLocationToPlayer () {
      const unlockbody = () => {
        document.getElementById('BodyHiddenStyle')?.remove()
      }
      const onAutoLocate = vals.auto_locate() && ((!vals.auto_locate_video() && !vals.auto_locate_bangumi()) || (vals.auto_locate_video() && vals.player_type() === 'video') || (vals.auto_locate_bangumi() && vals.player_type() === 'bangumi'))
      if (!onAutoLocate || vals.selected_screen_mode() === 'web') return { callback: unlockbody }
      await modules.setlocationDataAndScrollToPlayer()
      const playerOffsetTop = vals.player_type() === 'video' ? vals.video_player_offset_top() : vals.bangumi_player_offset_top()
      const result = await modules.checkAutoLocationSuccess(playerOffsetTop - vals.offset_top())
      if (result) return { message: '自动定位｜成功', callback: unlockbody }
      else throw new Error(`自动定位｜失败：已达到最大重试次数`)
    },
    /**
     * 递归检查屏自动定位是否成功
     * @param {*} expectOffest 期望文档滚动偏移量
     * - 未定位成功自动重试，递归超过 10 次则返回失败
     * - 基础数据：
     * - videoOffsetTop：播放器相对文档顶部距离，大小不随页面滚动变化
     * - videoClientTop：播放器相对浏览器视口顶部距离，大小随页面滚动变化
     * - targetOffset：用户期望的播放器相对浏览器视口顶部距离，由用户自定义
     * - 文档滚动距离：videoOffsetTop - targetOffset
     */
    async checkAutoLocationSuccess (expectOffest) {
      const $video = await elmGetter.get(selectors.video)
      utils.documentScrollTo(expectOffest)
      await utils.sleep(300)
      const videoClientTop = Math.trunc($video.getBoundingClientRect().top)
      const playerOffsetTop = vals.player_type() === 'video' ? vals.video_player_offset_top() : vals.bangumi_player_offset_top()
      // 成功条件：实际偏移量与用户设置偏移量相等/期望文档滚动偏移量与当前文档滚动偏移量相等/实际偏移量与用户设置偏移量误差小于5
      const success = (videoClientTop === vals.offset_top()) || ((playerOffsetTop - vals.offset_top()) - Math.trunc(window.pageYOffset) === 0) || (Math.abs(videoClientTop - vals.offset_top()) < 5)
      if (success) return success
      else {
        if (++vars.autoLocationToPlayerRetryDepths === 10) return false
        // utils.logger.debug(`${videoOffsetTop} ${videoClientTop} ${vals.offset_top()} ${Math.abs((videoOffsetTop - vals.offset_top()) - Math.trunc(window.pageYOffset))}`)
        utils.logger.warn(`
                    自动定位失败，继续尝试
                    -----------------
                    期望文档滚动偏移量：${playerOffsetTop - vals.offset_top()}
                    当前文档滚动偏移量：${Math.trunc(window.pageYOffset)}
                    文档滚动偏移量误差：${(playerOffsetTop - vals.offset_top()) - Math.trunc(window.pageYOffset)}
                    播放器顶部偏移量：${videoClientTop}
                    设置偏移量：${vals.offset_top()}`)
        utils.documentScrollTo(0)
        await utils.sleep(300)
        return modules.checkAutoLocationSuccess(expectOffest)
      }
    },
    /**
     * 文档滚动至播放器(使用已有数据)
     */
    async locationToPlayer () {
      const playerOffsetTop = vals.player_type() === 'video' ? vals.video_player_offset_top() : vals.bangumi_player_offset_top()
      utils.documentScrollTo(await modules.getCurrentScreenMode() !== 'web' ? playerOffsetTop - vals.offset_top() : 0)
    },
    /**
     * 点击播放器自动定位
     */
    async clickPlayerAutoLocation () {
      if (vals.click_player_auto_locate()) {
        const $video = await elmGetter.get(selectors.video)
        $video.addEventListener('click', async () => {
          const currentScreenMode = await modules.getCurrentScreenMode()
          if (['full', 'mini'].includes(currentScreenMode)) return
          await modules.locationToPlayer()
        })
      }
    },
    /**
     * 自动关闭静音
     */
    async autoCancelMute () {
      if (++vars.autoCancelMuteRunningCount === 1) {
        const [$mutedButton, $volumeButton] = await elmGetter.get([selectors.mutedButton, selectors.volumeButton])
        // const mutedButtonDisplay = getComputedStyle(mutedButton)['display']
        // const volumeButtonDisplay = getComputedStyle(volumeButton)['display']
        const mutedButtonDisplay = $mutedButton.style.display
        const volumeButtonDisplay = $volumeButton.style.display
        if (mutedButtonDisplay === 'block' || volumeButtonDisplay === 'none') {
          $mutedButton.click()
          // utils.logger.info('静音丨已关闭')
          return {
            message: '静音丨已关闭'
          }
        }
      }
    },
    /**
     * 自动选择最高画质
     * - 质量代码：
     * - 127->8K 超高清;120->4K 超清;116->1080P 60帧;
     * - 80->1080P 高清；64->720P 高清；32->480P 清晰；
     * - 16->360P 流畅；0->自动
     */
    async autoSelectVideoHighestQuality () {
      if (++vars.autoSelectVideoHighestQualityRunningCount === 1) {
        let message
        const qualitySwitchButtonsMap = new Map()
        if (!vals.auto_select_video_highest_quality()) return
        await elmGetter.each(selectors.qualitySwitchButtons, document.body, button => {
          qualitySwitchButtonsMap.set(button.dataset.value, button)
        })
        const qualitySwitchButtonsArray = [...qualitySwitchButtonsMap]
        if (vals.is_vip()) {
          if (!vals.contain_quality_4k() && !vals.contain_quality_8k()) {
            qualitySwitchButtonsArray.filter(quality => {
              return +quality[0] < 120
            })[0][1].click()
            message = '最高画质｜VIP｜不包含4K及8K｜切换成功'
          }
          if (vals.contain_quality_4k() && !vals.contain_quality_8k()) {
            qualitySwitchButtonsMap.get('120').click()
            message = '最高画质｜VIP｜4K｜切换成功'
          }
          if ((vals.contain_quality_4k() && vals.contain_quality_8k()) || (!vals.contain_quality_4k() && vals.contain_quality_8k())) {
            qualitySwitchButtonsMap.get('127').click()
            message = '最高画质｜VIP｜8K｜切换成功'
          }
        } else {
          qualitySwitchButtonsArray.filter(button => {
            return button[1].children.length < 2
          })[0][1].click()
          message = '最高画质｜非VIP｜切换成功'
        }
        // utils.logger.info(message)
        return { message }
      }
    },
    /**
     * 插入漂浮功能按钮
     * - 快速返回至播放器
     */
    async insertFloatSideNavToolsButton () {
      const $floatNav = vals.player_type() === 'video' ? await elmGetter.get(selectors.videoFloatNav) : await elmGetter.get(selectors.bangumiFloatNav, 100)
      const dataV = $floatNav.lastChild.attributes[1].name
      let $locateButton
      if (vals.player_type() === 'video') {
        const locateButtonHtml = '<div class="fixed-sidenav-storage-item locate" title="定位至播放器"><svg t="1643419779790" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1775" width="200" height="200" style="width: 50%;height: 100%;fill: currentColor;"><path d="M512 352c-88.008 0-160.002 72-160.002 160 0 88.008 71.994 160 160.002 160 88.01 0 159.998-71.992 159.998-160 0-88-71.988-160-159.998-160z m381.876 117.334c-19.21-177.062-162.148-320-339.21-339.198V64h-85.332v66.134c-177.062 19.198-320 162.136-339.208 339.198H64v85.334h66.124c19.208 177.062 162.144 320 339.208 339.208V960h85.332v-66.124c177.062-19.208 320-162.146 339.21-339.208H960v-85.334h-66.124zM512 810.666c-164.274 0-298.668-134.396-298.668-298.666 0-164.272 134.394-298.666 298.668-298.666 164.27 0 298.664 134.396 298.664 298.666S676.27 810.666 512 810.666z" p-id="1776"></path></svg>定位</div>'.replace('title="定位至播放器"', `title="定位至播放器" ${dataV}`)
        $locateButton = utils.createElementAndInsert(locateButtonHtml, $floatNav.lastChild, 'prepend')
      }
      if (vals.player_type() === 'bangumi') {
        const floatNavMenuItemClass = $floatNav.lastChild.lastChild.getAttribute('class')
        const locateButtonHtml = `<div class="${floatNavMenuItemClass} locate" style="height:40px;padding:0" title="定位至播放器">\n<svg t="1643419779790" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1775" width="200" height="200" style="width: 50%;height: 100%;fill: currentColor;"><path d="M512 352c-88.008 0-160.002 72-160.002 160 0 88.008 71.994 160 160.002 160 88.01 0 159.998-71.992 159.998-160 0-88-71.988-160-159.998-160z m381.876 117.334c-19.21-177.062-162.148-320-339.21-339.198V64h-85.332v66.134c-177.062 19.198-320 162.136-339.208 339.198H64v85.334h66.124c19.208 177.062 162.144 320 339.208 339.208V960h85.332v-66.124c177.062-19.208 320-162.146 339.21-339.208H960v-85.334h-66.124zM512 810.666c-164.274 0-298.668-134.396-298.668-298.666 0-164.272 134.394-298.666 298.668-298.666 164.27 0 298.664 134.396 298.664 298.666S676.27 810.666 512 810.666z" p-id="1776"></path></svg></div>`
        $locateButton = utils.createElementAndInsert(locateButtonHtml, $floatNav.lastChild, 'before')
      }
      $locateButton.addEventListener('click', async () => {
        await modules.locationToPlayer()
      })
    },
    /**
     * 点击时间锚点自动返回播放器
     */
    async clickVideoTimeAutoLocation () {
      await utils.sleep(100)
      const $video = await elmGetter.get('video')
      const $clickTarget = vals.player_type() === 'video' ? await elmGetter.get(selectors.videoComment, 100) : await elmGetter.get(selectors.bangumiComment, 100)
      await elmGetter.each(selectors.videoTime, $clickTarget, async (target) => {
        target.addEventListener('click', async (event) => {
          event.stopPropagation()
          await modules.locationToPlayer()
          // const targetTime = vals.player_type() === 'video' ? target.dataset.videoTime : target.dataset.time
          const targetTime = target.dataset.videoTime
          if (targetTime > $video.duration) alert('当前时间点大于视频总时长，将跳到视频结尾！')
          $video.currentTime = targetTime
          $video.play()
        })
      })
    },
    /**
     * 网页全屏模式解锁
     */
    async webfullScreenModeUnlock () {
      if (vals.webfull_unlock() && vals.selected_screen_mode() === 'web' && ++vars.webfullUnlockRunningCount === 1) {
        if (vals.player_type() === 'bangumi') return
        const [$app, $playerWrap, $player, $playerWebscreen, $wideEnterButton, $wideLeaveButton, $webEnterButton, $webLeaveButton, $fullControlButton] = await elmGetter.get([selectors.app, selectors.playerWrap, selectors.player, selectors.playerWebscreen, selectors.screenModeWideEnterButton, selectors.screenModeWideLeaveButton, selectors.screenModeWebEnterButton, selectors.screenModeWebLeaveButton, selectors.screenModeFullControlButton])
        const resetPlayerLayout = async () => {
          if (document.getElementById('UnlockWebscreenStlye')) document.getElementById('UnlockWebscreenStlye').remove()
          if (!document.getElementById('ResetPlayerLayoutStyle')) utils.insertStyleToDocument('ResetPlayerLayoutStyle', styles.ResetPlayerLayout)
          $playerWrap.append($player)
          utils.setValue('current_screen_mode', 'wide')
          await utils.sleep(300)
          await modules.locationToPlayer()
        }
        const bodyHeight = utils.getBodyHeight()
        utils.insertStyleToDocument('UnlockWebscreenStlye', styles.UnlockWebscreen.replace(/BODYHEIGHT/gi, `${bodyHeight}px`))
        $app.prepend($playerWebscreen)
        $webLeaveButton.addEventListener('click', async () => {
          await utils.sleep(100)
          await resetPlayerLayout()
        })
        $webEnterButton.addEventListener('click', async () => {
          if (!document.getElementById('UnlockWebscreenStlye')) utils.insertStyleToDocument('UnlockWebscreenStlye', styles.UnlockWebscreen.replace(/BODYHEIGHT/gi, `${bodyHeight}px`))
          $app.prepend($playerWebscreen)
          await modules.locationToPlayer()
        })
        $wideEnterButton.addEventListener('click', async () => {
          await utils.sleep(100)
          await resetPlayerLayout()
        })
        $wideLeaveButton.addEventListener('click', async () => {
          await utils.sleep(100)
          await resetPlayerLayout()
        })
        $fullControlButton.addEventListener('click', async () => {
          await utils.sleep(100)
          await resetPlayerLayout()
        })
        return {
          message: '网页全屏解锁｜成功',
          callback: modules.insertGoToCommentButton
        }
      }
    },
    /**
     * 网页全屏模式解锁后插入跳转评论按钮
     */
    async insertGoToCommentButton () {
      if (vals.player_type() === 'video' && vals.webfull_unlock() && ++vars.insertGoToCommentButtonCount === 1) {
        const [$comment, $playerControllerBottomRight] = await elmGetter.get([selectors.videoComment, selectors.playerControllerBottomRight])
        const goToCommentBtnHtml = '<div class="bpx-player-ctrl-btn bpx-player-ctrl-comment" role="button" aria-label="前往评论" tabindex="0"><div id="goToComments" class="bpx-player-ctrl-btn-icon"><span class="bpx-common-svg-icon"><svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="88" height="88" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%; transform: translate3d(0px, 0px, 0px);"><path d="M512 85.333c235.637 0 426.667 191.03 426.667 426.667S747.637 938.667 512 938.667a424.779 424.779 0 0 1-219.125-60.502A2786.56 2786.56 0 0 0 272.82 866.4l-104.405 28.48c-23.893 6.507-45.803-15.413-39.285-39.296l28.437-104.288c-11.008-18.688-18.219-31.221-21.803-37.91A424.885 424.885 0 0 1 85.333 512c0-235.637 191.03-426.667 426.667-426.667zm-102.219 549.76a32 32 0 1 0-40.917 49.216A223.179 223.179 0 0 0 512 736c52.97 0 103.19-18.485 143.104-51.67a32 32 0 1 0-40.907-49.215A159.19 159.19 0 0 1 512 672a159.19 159.19 0 0 1-102.219-36.907z" fill="#currentColor"/></svg></span></div></div>'
        const $goToCommentButton = utils.createElementAndInsert(goToCommentBtnHtml, $playerControllerBottomRight, 'append')
        $goToCommentButton.addEventListener('click', (event) => {
          event.stopPropagation()
          utils.documentScrollTo(utils.getElementOffsetToDocument($comment).top - 10)
          // utils.logger.info('到达评论区')
        })
      }
    },
    /**
     * 将视频简介内容插入评论区或直接替换原简介区内容
     * - 视频简介存在且内容过长，则将视频简介内容插入评论区，否则直接替换原简介区内容
     * - 若视频简介中包含型如 "00:00:00" 的时间内容，则将其转换为可点击的时间锚点元素
     * - 若视频简介中包含 URL 链接，则将其转换为跳转链接
     * - 若视频简介中包含视频 BV 号或专栏 cv 号，则将其转换为跳转链接
     */
    async insertVideoDescriptionToComment () {
      if (vals.player_type() === 'bangumi') return
      const $commentDescription = document.getElementById('comment-description')
      if ($commentDescription) $commentDescription.remove()

      const [$videoDescription, $videoDescriptionInfo, $videoCommentReplyList] = await elmGetter.get([selectors.videoDescription, selectors.videoDescriptionInfo, selectors.videoCommentReplyList])
      const getTotalSecondsFromTimeString = (timeString) => {
        if (timeString.length === 5) timeString = '00:' + timeString
        const [hours, minutes, seconds] = timeString.split(':').map(Number)
        const totalSeconds = hours * 3600 + minutes * 60 + seconds
        return totalSeconds
      }
      const nbspToBlankRegexp = /&nbsp;/g
      const timeStringRegexp = /(\d\d:\d\d(:\d\d)*)/g
      const urlRegexp = /(?<!((href|url)="))(http|https|ftp):\/\/[\w-]+(\.[\w\-]+)*([\w\-\.\,\@\?\^\=\%\&\:\/\~\+\#;]*[\w\-\@?\^\=\%\&\/~\+#;])?/g
      const plaintVideoIdRegexp = /(?<!(>|\/))(BV([A-Za-z0-9]){10})(?!(<\/))/g
      const plaintReadIdRegexp = /(?<!(>|\/))(cv([0-9]){7})(?!(<\/a))/g
      const blankRegexp = /^\s*[\r\n]/gm
      // 匹配一种特殊空白符(%09)
      const specialBlankRegexp = /%09(%09)*/g
      if ($videoDescription.childElementCount > 1 && $videoDescriptionInfo.childElementCount > 0) {
        let $upAvatarFace, $upAvatarIcon, upAvatarFaceLink
        const $membersContainer = document.querySelector(selectors.membersContainer)
        if ($membersContainer) {
          const $membersUpAvatarFace = await elmGetter.get(selectors.membersUpAvatarFace)
          upAvatarFaceLink = $membersUpAvatarFace.getAttribute('src')
        } else {
          [$upAvatarFace, $upAvatarIcon] = await elmGetter.get([selectors.upAvatarFace, selectors.upAvatarIcon])
          upAvatarFaceLink = $upAvatarFace.dataset.src.replace('@96w_96h_1c_1s_!web-avatar', '@160w_160h_1c_1s_!web-avatar-comment')
        }
        // 先将内容编码后替换特殊空白符(%09)为普通空格(%20)后再解码供后续使用
        const resetVideoDescriptionInfoHtml = decodeURIComponent(encodeURIComponent($videoDescriptionInfo.innerHTML).replace(specialBlankRegexp, '%20'))
        const videoDescriptionInfoHtml = resetVideoDescriptionInfoHtml.replace(nbspToBlankRegexp, ' ').replace(timeStringRegexp, (match) => {
          return `<a class="jump-link video-time" data-video-part="-1" data-video-time="${getTotalSecondsFromTimeString(match)}">${match}</a>`
        }).replace(urlRegexp, (match) => {
          return `<a href="${match}" target="_blank">${match}</a>`
        }).replace(plaintVideoIdRegexp, (match) => {
          return `<a href="https://www.bilibili.com/video/${match}" target="_blank">${match}</a>`
        }).replace(plaintReadIdRegexp, (match) => {
          return `<a href="https://www.bilibili.com/read/${match}" target="_blank">${match}</a>`
        }).replace(blankRegexp, '')
        const upAvatarDecorationLink = document.querySelector(selectors.upAvatarDecoration) ? document.querySelector(selectors.upAvatarDecoration).dataset.src.replace('@144w_144h_!web-avatar', '@240w_240h_!web-avatar-comment') : ''
        const videoDescriptionReplyTemplate = `
                <div data-v-eb69efad="" data-v-bad1995c="" id="comment-description" class="reply-item">
                    <div data-v-eb69efad="" class="root-reply-container">
                        <div data-v-eb69efad="" class="root-reply-avatar" >
                            <div data-v-eb69efad="" class="avatar">
                                <div class="bili-avatar" style="width:48px;height:48px">
                                    <img class="bili-avatar-img bili-avatar-face bili-avatar-img-radius" data-src="${upAvatarFaceLink}" src="${upAvatarFaceLink}">
                                    <div class="bili-avatar-pendent-dom">
                                        <img class="bili-avatar-img" data-src="${upAvatarDecorationLink}" alt="" src="${upAvatarDecorationLink}">
                                    </div>
                                    <span class="${$upAvatarIcon?.classList}"></span>
                                </div>
                            </div>
                        </div>
                        <div data-v-eb69efad="" class="content-warp">
                            <div data-v-eb69efad="" class="user-info">
                                <div data-v-eb69efad="" class="user-name" style="color:#00a1d6!important">视频简介丨播放页调整</div>
                            </div>
                            <div data-v-eb69efad="" class="root-reply">
                                <span data-v-eb69efad="" class="reply-content-container root-reply">
                                    <span class="reply-content">${decodeURIComponent(videoDescriptionInfoHtml)}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div data-v-eb69efad="" class="bottom-line"></div>
                </div>
                `
        utils.createElementAndInsert(videoDescriptionReplyTemplate, $videoCommentReplyList, 'prepend')
        document.querySelector('#comment-description:not(:first-child)')?.remove()
      } else {
        $videoDescriptionInfo.innerHTML = $videoDescriptionInfo.innerHTML.replace(nbspToBlankRegexp, ' ').replace(timeStringRegexp, (match) => {
          return `<a class="jump-link video-time" data-video-part="-1" data-video-time="${getTotalSecondsFromTimeString(match)}">${match}</a>`
        }).replace(urlRegexp, (match) => {
          return `<a href="${match}" target="_blank">${match}</a>`
        }).replace(plaintVideoIdRegexp, (match) => {
          return `<a href="https://www.bilibili.com/video/${match}" target="_blank">${match}</a>`
        }).replace(blankRegexp, '')
      }
    },
    /**
     * 设置当前视频自动跳过信息
     * - indexedDB
     * - 数据存在浏览器本地
     */
    async setVideoSkipTimeNodesByIndexedDB (videoSkipTimeNodesArray) {
      const videoID = modules.getCurrentVideoID()
      if (videoID !== 'error') {
        const videoSkipTimeNodesList = localforage.createInstance({
          name: 'videoSkipTimeNodesList',
        })
        const result = videoSkipTimeNodesList.setItem(videoID, videoSkipTimeNodesArray).then(() => {
          // logger.info(`自动跳过丨节点储存丨${value}丨成功丨本地`)
          return {
            code: 200,
            message: `节点上传丨本地：成功`
          }
        }).catch(error => {
          // logger.error(error)
          return {
            code: 0,
            message: error
          }
        })
        return result
      } else {
        utils.logger.error('videoID丨获取失败')
      }
    },
    /**
     * 获取当前视频自动跳过信息
     * - indexedDB
     * - 数据存在浏览器本地
     */
    async getVideoSkipTimeNodesByIndexedDB () {
      const videoSkipTimeNodesList = localforage.createInstance({
        name: 'videoSkipTimeNodesList',
      })
      const videoID = modules.getCurrentVideoID()
      if (videoID !== 'error') {
        try {
          const value = await videoSkipTimeNodesList.getItem(videoID)
          return value
        } catch (error) {
          utils.logger.error(error)
        }
      } else {
        utils.logger.error('videoID丨获取失败')
      }
    },
    /**
     * 设置当前视频自动跳过信息
     * - Axios
     * - 数据存在云数据库
     */
    async setVideoSkipTimeNodesByAxios (timeNodesArray) {
      const videoID = modules.getCurrentVideoID()
      const videoAuthor = decodeURIComponent(await utils.getMetaContent('name="author"'))
      let videoTitle, videoUrl
      if (vals.player_type() === 'video') {
        videoTitle = decodeURIComponent(document.title.replace('_哔哩哔哩_bilibili', ''))
        videoUrl = decodeURIComponent(await utils.getMetaContent('itemprop="url"'))
      }
      if (vals.player_type() === 'bangumi') {
        videoTitle = document.title.replace(/-*高清.*哩/gi, '')
        videoUrl = decodeURIComponent(await utils.getMetaContent('property="og:url"'))
      }
      if (videoID !== 'error') {
        const timeNodesArraySafe = decodeURIComponent(timeNodesArray)
        const url = `https://hn216.api.yesapi.cn/?s=SVIP.Swxqian_MyApi.AUpdateSkipTimeNodes&return_data=0&videoID=${videoID}&timeNodesArray=${timeNodesArraySafe}&videoTitle=${videoTitle}&videoAuthor=${videoAuthor}&videoUrl=${videoUrl}&app_key=A11B09901609FA722CFDFEB981EC31DB&sign=6BAEA5FDE94074B8C3ADF35789AE8B18&yesapi_allow_origin=1`
        const result = await axios.post(url).then(respones => {
          // utils.logger.debug(respones)
          const responesData = respones.data
          const { msg, ret, data } = responesData
          const { err_msg } = data
          if (Object.keys(data).length === 0) {
            return {
              code: ret,
              message: `云端：失败：${msg}`
            }
          } else {
            return {
              code: ret,
              message: err_msg
            }
          }
        }).catch(error => {
          // logger.debug(error)
          return {
            message: error
          }
        })
        return result
      } else {
        utils.logger.error('videoID丨获取失败')
      }
    },
    /**
     * 获取当前视频自动跳过信息
     * - Axios
     * - 数据存在云数据库
     */
    async getVideoSkipTimeNodesByAxios () {
      const videoID = modules.getCurrentVideoID()
      if (videoID !== 'error') {
        const url = `https://hn216.api.yesapi.cn/?s=SVIP.Swxqian_MyApi.AGetSkipTimeNodes&return_data=0&videoID=${videoID}&app_key=A11B09901609FA722CFDFEB981EC31DB&sign=574181B06EBD07D9252199563CD7D9D3&yesapi_allow_origin=1`
        const result = await axios.post(url).then(respones => {
          const skipNodesInfo = respones.data.data
          const success = skipNodesInfo.success
          const timeNodesArray = skipNodesInfo.info?.timeNodesArray
          if (success && timeNodesArray !== '') {
            // utils.logger.info(skipNodesInfo.info.timeNodesArray)
            return JSON.parse(timeNodesArray)
          } else {
            return false
          }
        }).catch(error => {
          utils.logger.error(error)
        })
        return result
      } else {
        utils.logger.error('videoID丨获取失败')
      }
    },
    /**
     * 自动跳过视频已设置设置时间节点
     */
    async autoSkipTimeNodes () {
      if (!vals.auto_skip()) return
      const videoID = modules.getCurrentVideoID()
      const $video = await elmGetter.get(selectors.video)
      const skipTo = (seconds) => {
        $video.currentTime = seconds
        if ($video.paused) {
          $video.play()
        }
      }
      const findTargetTimeNode = (num, arr) => {
        for (let i = 0; i < arr[0].length; i++) {
          if (arr[0][i] === num) {
            return arr[1][i];
          }
        }
        return null;
      }
      if (videoID !== 'error') {
        let videoSkipTimeNodesArray
        const videoSkipTimeNodesArrayIndexedDB = await modules.getVideoSkipTimeNodesByIndexedDB()
        if (videoSkipTimeNodesArrayIndexedDB) {
          videoSkipTimeNodesArray = videoSkipTimeNodesArrayIndexedDB
        } else {
          const videoSkipTimeNodesArrayAxios = await modules.getVideoSkipTimeNodesByAxios()
          if (videoSkipTimeNodesArrayAxios) {
            videoSkipTimeNodesArray = videoSkipTimeNodesArrayAxios
            await modules.setVideoSkipTimeNodesByIndexedDB(videoSkipTimeNodesArray)
          } else {
            utils.logger.info('自动跳过丨节点信息不存在')
            return
          }
        }
        utils.logger.info(`自动跳过丨已获取节点信息丨${JSON.stringify(videoSkipTimeNodesArray)}`)
        $video.addEventListener('timeupdate', function () {
          const currentTime = Math.ceil($video.currentTime)
          const targetTimeNode = findTargetTimeNode(currentTime, videoSkipTimeNodesArray)
          if (vals.auto_skip() && targetTimeNode) skipTo(targetTimeNode)
        })
      }
    },
    /**
     * 插入设置跳过时间节点按钮
     */
    async insertSetSkipTimeNodesButton () {
      const videoID = modules.getCurrentVideoID()
      if (++vars.insertSetSkipTimeNodesButtonCount === 1 && vals.auto_skip()) {
        const [$video, $playerContainer, $playerControllerBottomRight, $playerTooltipArea] = await elmGetter.get([selectors.video, selectors.playerContainer, selectors.playerControllerBottomRight, selectors.playerTooltipArea])
        const validateInputValue = (inputValue) => {
          const regex = /^\[\d+,\d+\](,\[\d+,\d+\])*?$/g;
          const numbers = inputValue.match(/\[(\d+),(\d+)\]/g)?.flatMap(match => match.slice(1, -1).split(',')).map(Number) || [];
          const hasDuplicates = new Set(numbers).size !== numbers.length
          if (inputValue === '' || !regex.test(inputValue) || hasDuplicates) {
            return false
          }
          const isAscending = numbers.every((num, i) => i === 0 || num >= numbers[i - 1])
          return isAscending
        }
        // [[10,20],[30,40]] → [[10,30],[20,40]]
        const convertArrayReadableToSave = (arr) => {
          return arr[0].map((col, i) => arr.map(row => row[i]))
        }
        // [10,20,30,40] → [[10,30],[20,40]]
        // const convertArrayRecordToSave = (arr) => {
        //     return arr.reduce((acc, num, i) => {
        //         i % 2 === 0 ? acc[0].push(num) : acc[1].push(num);
        //         return acc;
        //     }, [[], []]);
        // }
        // [10,20,30,40] → [[10,20],[30,40]]
        const convertArrayRecordToReadable = (arr) => {
          return arr.reduce((acc, _, i) => {
            if (i % 2 === 0) {
              acc.push(arr.slice(i, i + 2));
            }
            return acc;
          }, []);
        }
        const setSkipTimeNodesPopoverToggleButtonHtml = `
                <button id="setSkipTimeNodesPopoverToggleButton" popovertarget="setSkipTimeNodesPopover" class="bpx-player-ctrl-btn bpx-player-ctrl-skip" role="button" aria-label="插入时间节点" tabindex="0">
                    <div class="bpx-player-ctrl-btn-icon">
                        <span class="bpx-common-svg-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" class="icon" viewBox="0 0 1024 1024">
                                <path fill="#fff" d="M672 896a21.333 21.333 0 0 1 21.333 21.333v21.334A21.333 21.333 0 0 1 672 960H352a21.333 21.333 0 0 1-21.333-21.333v-21.334A21.333 21.333 0 0 1 352 896h320zM512 64a362.667 362.667 0 0 1 181.333 676.821v69.846A21.333 21.333 0 0 1 672 832H352a21.333 21.333 0 0 1-21.333-21.333V740.82A362.667 362.667 0 0 1 512 64zm24.107 259.243a21.333 21.333 0 0 0-29.398 6.826l-1.792 3.499a21.333 21.333 0 0 0-1.45 7.765l-.043 62.806-129.45-80.896a21.333 21.333 0 0 0-32.64 18.09v179.03a21.333 21.333 0 0 0 21.333 21.333l3.968-.384a21.333 21.333 0 0 0 7.338-2.859l129.451-80.981.043 62.89a21.333 21.333 0 0 0 32.64 18.091l143.232-89.514a21.333 21.333 0 0 0 0-36.182z" />
                            </svg>
                        </span>
                    </div>
                </button>
                `
        const setSkipTimeNodesPopoverHtml = `
                <div id="setSkipTimeNodesPopover" popover>
                    <div class="setSkipTimeNodesWrapper">
                        <div class="header">
                            <span class="title">上传时间节点(${videoID})</span>
                            <span class="extra"></span>
                        </div>
                        <div class="tips close">
                            <span class="detail open">
                                <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                                    <path d="M512 926.476C283.087 926.476 97.524 740.913 97.524 512S283.087 97.524 512 97.524 926.476 283.087 926.476 512 740.913 926.476 512 926.476zm0-73.143c188.514 0 341.333-152.82 341.333-341.333S700.513 170.667 512 170.667 170.667 323.487 170.667 512 323.487 853.333 512 853.333zm-6.095-192.097L283.526 438.857l51.712-51.712 170.667 170.667L676.57 387.145l51.712 51.712-222.378 222.379z" fill="#909399"></path>
                                </svg>
                            </span>
                            <div class="contents">
                                视频播放到相应时间点时将触发跳转至设定时间点
                                <br>
                                格式：[触发时间点,目标时间点]
                                <br>
                                条件：触发时间点始终小于目标时间点且任意两数不相等
                                <br>
                                例：[10,20] 表示视频播放至第 10 秒时跳转至第 20 秒
                                <br>
                                若有多组节点请使用英文逗号 ',' 隔开
                                <br>
                                例：[10,20],[30,40],[50,60]
                            </div>
                        </div>
                        <span style="display:flex;color:#f56c6c">🈲请勿随意上传无意义时间点，否则将严重影响其他用户观看体验！</span>
                        <div class="records">
                            <span id="skipTimeNodesRecordsArray"></span>
                            <div class="recordsButtonsGroup">
                                <button id="clearRecordsButton">清除数据</button>
                                <button id="saveRecordsButton">保存数据</button>
                            </div>
                        </div>
                        <div class="handles">
                            <input id="setSkipTimeNodesInput" value="">
                            <button id="uploadSkipTimeNodesButton">上传</button>
                        </div>
                        <div class="result" style="display:none"></div>
                    </div>
                </div>
                `
        const setSkipTimeNodesButtonTipHtml = `
                <div id="setSkipTimeNodesButtonTip" class="bpx-player-tooltip-item" style="visibility: hidden; opacity: 0; transform: translate(0px, 0px);">
                    <div class="bpx-player-tooltip-title">上传节点</div>
                </div>
                `
        const $setSkipTimeNodesPopoverToggleButton = utils.createElementAndInsert(setSkipTimeNodesPopoverToggleButtonHtml, $playerControllerBottomRight, 'append')
        const $setSkipTimeNodesPopover = utils.createElementAndInsert(setSkipTimeNodesPopoverHtml, $playerContainer, 'append')
        const $setSkipTimeNodesButtonTip = utils.createElementAndInsert(setSkipTimeNodesButtonTipHtml, $playerTooltipArea, 'append')
        $setSkipTimeNodesPopoverToggleButton.addEventListener('mouseover', function () {
          const { top, left } = utils.getElementOffsetToDocument(this)
          // utils.logger.debug(`${top} ${left} ${window.pageYOffset} ${top - window.pageYOffset}`)
          $setSkipTimeNodesButtonTip.style.top = `${top - window.pageYOffset - (this.clientHeight * 2) - 5}px`
          $setSkipTimeNodesButtonTip.style.left = `${left - ($setSkipTimeNodesButtonTip.clientWidth / 2) + (this.clientWidth / 2)}px`
          $setSkipTimeNodesButtonTip.style.opacity = 1
          $setSkipTimeNodesButtonTip.style.visibility = 'visible'
          $setSkipTimeNodesButtonTip.style.transition = 'opacity .3s'

        })
        $setSkipTimeNodesPopoverToggleButton.addEventListener('mouseout', () => {
          $setSkipTimeNodesButtonTip.style.opacity = 0
          $setSkipTimeNodesButtonTip.style.visibility = 'hidden'
        })
        const [$setSkipTimeNodesPopoverHeaderExtra, $setSkipTimeNodesPopoverTips, $setSkipTimeNodesPopoverTipsDetail, $setSkipTimeNodesPopoverRecords, $setSkipTimeNodesInput, $skipTimeNodesRecordsArray, $setSkipTimeNodesPopoverResult, $clearRecordsButton, $saveRecordsButton, $uploadSkipTimeNodesButton] = await elmGetter.get([selectors.setSkipTimeNodesPopoverHeaderExtra, selectors.setSkipTimeNodesPopoverTips, selectors.setSkipTimeNodesPopoverTipsDetail, selectors.setSkipTimeNodesPopoverRecords, selectors.setSkipTimeNodesInput, selectors.skipTimeNodesRecordsArray, selectors.setSkipTimeNodesPopoverResult, selectors.clearRecordsButton, selectors.saveRecordsButton, selectors.uploadSkipTimeNodesButton])
        $setSkipTimeNodesPopoverTipsDetail.addEventListener('click', function (event) {
          event.stopPropagation()
          const detailClassList = [...this.classList]
          if (detailClassList.includes('open')) {
            this.classList.replace('open', 'close')
            $setSkipTimeNodesPopoverTips.classList.replace('close', 'open')
          }
          if (detailClassList.includes('close')) {
            this.classList.replace('close', 'open')
            $setSkipTimeNodesPopoverTips.classList.replace('open', 'close')
          }
        })
        $setSkipTimeNodesPopoverToggleButton.addEventListener('click', () => {
          const currentTime = Math.ceil($video.currentTime)
          $setSkipTimeNodesPopoverHeaderExtra.innerText = `${currentTime} / ${$video.duration}`
        })
        $setSkipTimeNodesPopover.addEventListener('toggle', (event) => {
          if (event.newState === 'open') {
            $video.pause()
          }
          if (event.newState === 'closed') {
            $video.play()
          }
        })
        $clearRecordsButton.addEventListener('click', () => {
          arrays.skipNodesRecords = []
          $skipTimeNodesRecordsArray.className = ''
          $skipTimeNodesRecordsArray.innerText = ''
          $setSkipTimeNodesPopoverRecords.style.display = 'none'
          $setSkipTimeNodesInput.value = ''
        })
        $saveRecordsButton.addEventListener('click', () => {
          $setSkipTimeNodesInput.value = JSON.stringify(convertArrayRecordToReadable(JSON.parse($skipTimeNodesRecordsArray.innerText.replace('打点数据：', '')))).slice(1, -1)
        })
        const resetResultContent = (delay = 3000) => {
          const resetResultContentTimeout = setTimeout(() => {
            $setSkipTimeNodesPopoverResult.innerText = ''
            $setSkipTimeNodesPopoverResult.className = 'result'
            clearTimeout(resetResultContentTimeout)
          }, delay)
          arrays.intervalIds.push(resetResultContentTimeout)
        }
        $uploadSkipTimeNodesButton.addEventListener('click', async () => {
          const inputValue = $setSkipTimeNodesInput.value
          if (!validateInputValue(inputValue)) {
            $setSkipTimeNodesPopoverResult.classList.remove('success')
            $setSkipTimeNodesPopoverResult.classList.add('danger')
            $setSkipTimeNodesPopoverResult.innerText = '请按格式条件输入正确内容！'
            resetResultContent()
          } else {
            const timeNodesArray = convertArrayReadableToSave(JSON.parse(`[${inputValue}]`))
            const result_indexedDB = await modules.setVideoSkipTimeNodesByIndexedDB(timeNodesArray)
            const result_axios = await modules.setVideoSkipTimeNodesByAxios(JSON.stringify(timeNodesArray))
            // logger.debug(`${JSON.stringify(result_indexedDB)}丨${JSON.stringify(result_axios)}`)
            if ((result_indexedDB.code && result_axios.code) === 200) {
              $setSkipTimeNodesInput.value = ''
              $setSkipTimeNodesPopoverResult.classList.remove('danger')
              $setSkipTimeNodesPopoverResult.classList.add('success')
              $setSkipTimeNodesPopoverResult.innerText = `${result_indexedDB.message}丨${result_axios.message}`
            } else {
              $setSkipTimeNodesPopoverResult.classList.remove('success')
              $setSkipTimeNodesPopoverResult.classList.add('danger')
              $setSkipTimeNodesPopoverResult.innerText = `${result_indexedDB.message}丨${result_axios.message}`
            }
            resetResultContent()
          }
        })
      }
    },
    /**
     * 插入跳过时间节点功能开关
     */
    async insertSkipTimeNodesSwitchButton () {
      if (++vars.insertSetSkipTimeNodesSwitchButtonCount === 1) {
        const skipTimeNodesSwitchButtonHtml = `
                <div id="autoSkipSwitchButton" class="bpx-player-dm-switch bui bui-danmaku-switch" aria-label="跳过开启关闭">
                <div class="bui-area">
                    <input id="Auto-Skip-Switch" class="bui-danmaku-switch-input" type="checkbox" ${vals.auto_skip() ? 'checked' : ''}>
                    <label class="bui-danmaku-switch-label">
                    <span class="bui-danmaku-switch-on">
                        <svg xmlns="http://www.w3.org/2000/svg" data-pointer="none" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M12 4.83h-1.53L8.76 2.27a1 1 0 1 0-1.67 1.12l1 1.5L5.92 5a4 4 0 0 0-3.83 3.4 30.92 30.92 0 0 0-.24 4.18 31.81 31.81 0 0 0 .35 5.12A4 4 0 0 0 6 21.06l.91.05c1.2.06 1.8.09 3.6.09a1 1 0 0 0 1-1 1 1 0 0 0-1-1c-1.76 0-2.34 0-3.5-.09l-.91-.05a2 2 0 0 1-1.91-1.71 29.75 29.75 0 0 1-.33-4.8 28 28 0 0 1 .23-3.9A2 2 0 0 1 6 6.93c2.45-.08 4.47-.13 6.06-.13s3.62 0 6.07.13A2 2 0 0 1 20 8.75c.08.52.12 2 .14 3.06v.88a1 1 0 1 0 2-.06v-.86c0-1.12-.08-2.66-.16-3.27A4 4 0 0 0 18.19 5l-2.53-.08 1.05-1.46a1 1 0 0 0-1.64-1.18l-1.86 2.55H12z" />
                        <path fill="#00aeec" fill-rule="evenodd" d="M22.85 14.63a1 1 0 0 0-1.42.07l-5.09 5.7-2.21-2.27L14 18a1 1 0 0 0-1.32 1.49l3 3 .1.09a1 1 0 0 0 1.36-.12L22.93 16l.08-.1a1 1 0 0 0-.16-1.27z" />
                        <path d="M7.58 8.23h3.12v3.54h-.9v1.62h1v.67a7.14 7.14 0 0 0 1.84-1.41v-1l-.72.36a17 17 0 0 0-1-2.17l.83-.41a18.26 18.26 0 0 1 .9 2.12V7.82h1v5a9 9 0 0 1-.47 3.05 5.26 5.26 0 0 1-1.4 2.13l-.78-.7a5 5 0 0 0 1.56-3.4 7.46 7.46 0 0 1-1.29 1.1l-.5-.83v.09h-1V16c.37-.13.7-.25 1-.37v.94a29.54 29.54 0 0 1-3.39 1.19l-.29-.93.42-.11v-3.9h.84v3.64l.55-.18v-4.51H7.58zm2.22 2.68V9.09H8.48v1.82zm6.53-1.81l.86.42a10 10 0 0 1-1.25 2.32l-.71-.5v.92a11.11 11.11 0 0 1 2 1.62l-.59.9a11.39 11.39 0 0 0-1.39-1.44v3.17c0 .21.1.32.29.32h.35a.36.36 0 0 0 .35-.22 4.31 4.31 0 0 0 .18-1.47l.9.28a4.27 4.27 0 0 1-.4 2 1.1 1.1 0 0 1-.83.3h-.84c-.66 0-1-.34-1-1v-8.9h1v3.33a9.28 9.28 0 0 0 1.08-2.05z" />
                        </svg>
                    </span>
                    <span class="bui-danmaku-switch-off">
                        <svg xmlns="http://www.w3.org/2000/svg" data-pointer="none" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M8.09 4.89l-1-1.5a1 1 0 1 1 1.68-1.12l1.7 2.57h2.74l1.86-2.59a1 1 0 0 1 1.64 1.18l-1.05 1.45 2.53.12a4 4 0 0 1 3.74 3.51c.08.61.13 2.15.16 3.27v.86a1 1 0 0 1-2 .07v-.89c0-1.1-.06-2.54-.14-3.06a2 2 0 0 0-1.85-1.82c-2-.07-4-.12-6.07-.13-1.59 0-3.62 0-6.06.13a2 2 0 0 0-1.92 1.74 28 28 0 0 0-.23 3.91 29.71 29.71 0 0 0 .33 4.79 2 2 0 0 0 1.91 1.71c1.8.1 3.61.14 5.41.14a1 1 0 0 1 1 1 1 1 0 0 1-1 1c-1.84 0-3.67-.05-5.51-.15A4 4 0 0 1 2.2 17.7a31.81 31.81 0 0 1-.35-5.12 30.92 30.92 0 0 1 .24-4.18A4 4 0 0 1 5.92 5l2.16-.07zm10 17.17a4 4 0 1 0-4-4 4 4 0 0 0 3.97 4zm0-1.5a2.5 2.5 0 0 1-2.5-2.5 2.61 2.61 0 0 1 .28-1.16l3.33 3.4a2.55 2.55 0 0 1-1.14.26zm2.5-2.5a2.38 2.38 0 0 1-.29 1.16l-3.3-3.4a2.5 2.5 0 0 1 3.61 2.24z" />
                        <path fill="none" d="M8.28 9.08H9.6v1.83H8.28zM13.42 15.08v-.85h-.11c0 .29-.09.58-.15.85z" />
                        <path d="M13.31 14.23h-1a7.52 7.52 0 0 1-.18.85h1.05c.04-.27.09-.56.13-.85zM13.4 9.6v-.24l-.54.24h.54zM13.4 9V7.82h-1V8l.33-.11A8.32 8.32 0 0 1 13.4 9zM12.41 9.4v.2h.11a2 2 0 0 0-.11-.2zM11.59 9.6l-.08-.18-.84.41c.18.32.36.67.53 1V9.6z" />
                        <path d="M11.2 13.64a7 7 0 0 1-.64.41v-.67h-1v-1.61h.9V8.22H7.37v3.55h1.32v4.5l-.55.18v-3.64h-.83v3.87l-.42.11.29.94a32.83 32.83 0 0 0 3.38-1.19v-.95c-.27.12-.59.24-1 .38v-1.69h1v-.08l.51.82a6.91 6.91 0 0 0 .94-.79h-.81zm-2.92-2.73V9.08H9.6v1.83zM15 8.2v-.38h-1V9.6h.34c.28-.46.5-.93.66-1.4zM10.78 17.3l.8.69a5.19 5.19 0 0 0 1.24-1.84h-1.15a4.22 4.22 0 0 1-.89 1.15zM16.81 9.89c.06-.13.12-.24.18-.38l-.86-.42c-.07.18-.16.34-.24.51h.92z" />
                        <path d="M15 13.84v-.5c.1.08.21.2.32.3a4.33 4.33 0 0 1 .92-.44 11.62 11.62 0 0 0-1.24-.95v-.91l.7.49a9.47 9.47 0 0 0 1.08-1.94V9.6h-.92a8.86 8.86 0 0 1-.86 1.55v-3c-.19.47-.41.94-.65 1.4H14v5.17a5.13 5.13 0 0 1 1-.88zM13.4 12.83V9.6h-.54l.54-.24V9a8.32 8.32 0 0 0-.66-1.11l-.33.11v1.4a2 2 0 0 1 .11.2h-.11v2a18.76 18.76 0 0 0-.82-2h-.39v1.27a12.22 12.22 0 0 1 .48 1.13l.73-.37v1a7.31 7.31 0 0 1-1.21 1v.59h.8c.11-.11.23-.21.34-.33 0 .12 0 .22-.06.33h1a12.21 12.21 0 0 0 .12-1.39zM13.16 15.08h-1.05a4.9 4.9 0 0 1-.44 1.07h1.15c0-.09.07-.17.11-.27.07-.25.16-.52.23-.8z" />
                        </svg>
                    </span>
                    </label>
                </div>
                </div>
                `
        const skipTimeNodesSwitchButtonTipHtml = `
                <div id="autoSkipTips" class="bpx-player-tooltip-item" style="visibility: hidden; opacity: 0; transform: translate(0px, 0px);">
                    <div class="bpx-player-tooltip-title">关闭自动跳过(j)</div>
                </div>
                `
        const [playerDanmuSetting, playerTooltipArea] = await elmGetter.get([selectors.playerDanmuSetting, selectors.playerTooltipArea])
        const $skipTimeNodesSwitchButton = utils.createElementAndInsert(skipTimeNodesSwitchButtonHtml, playerDanmuSetting, 'after')
        const $autoSkipTips = utils.createElementAndInsert(skipTimeNodesSwitchButtonTipHtml, playerTooltipArea, 'append')
        const $AutoSkipSwitchInput = await elmGetter.get(selectors.AutoSkipSwitchInput)
        $AutoSkipSwitchInput.addEventListener('change', event => {
          utils.setValue('auto_skip', event.target.checked)
          $autoSkipTips.querySelector(selectors.playerTooltipTitle).innerText = event.target.checked ? '关闭自动跳过(j)' : '开启自动跳过(j)'
          // logger.debug(getValue('auto_skip'))
        })
        $skipTimeNodesSwitchButton.addEventListener('mouseover', async function () {
          const { top, left } = utils.getElementOffsetToDocument(this)
          $autoSkipTips.style.top = `${top - window.pageYOffset - (this.clientHeight) - 12}px`
          $autoSkipTips.style.left = `${left - ($autoSkipTips.clientWidth / 2) + (this.clientWidth / 2)}px`
          $autoSkipTips.style.opacity = 1
          $autoSkipTips.style.visibility = 'visible'
          $autoSkipTips.style.transition = 'opacity .3s'

        })
        $skipTimeNodesSwitchButton.addEventListener('mouseout', function () {
          $autoSkipTips.style.opacity = 0
          $autoSkipTips.style.visibility = 'hidden'
        })
      }
    },
    /**
     * 自动返回播放器并更新评论区简介
     */
    async autoLocationAndInsertVideoDescriptionToComment () {
      modules.locationToPlayer()
      await utils.sleep(1500)
      modules.insertVideoDescriptionToComment()
    },
    /**
     * 点击相关视频自动返回播放器并更新评论区简介
     * - 合集中的其他视频
     * - 推荐列表中的视频
     */
    async clickRelatedVideoAutoLocation () {
      if (vals.player_type() === 'video') {
        await elmGetter.each(selectors.videoSectonsEpisodeLink, (link) => {
          link.addEventListener('click', () => {
            modules.autoLocationAndInsertVideoDescriptionToComment()
          })
        })
        await elmGetter.each(selectors.videoNextPlayAndRecommendLink, (link) => {
          link.addEventListener('click', () => {
            modules.autoLocationAndInsertVideoDescriptionToComment()
          })
        })
        await elmGetter.each(selectors.playerEndingRelateVideo, (link) => {
          link.addEventListener('click', () => {
            modules.autoLocationAndInsertVideoDescriptionToComment()
          })
        })
      }
      if (vals.player_type() === 'bangumi') {
        await elmGetter.each(selectors.bangumiSectonsEpisodeLink, (link) => {
          link.addEventListener('click', async () => {
            await utils.sleep(100)
            modules.locationToPlayer()
          })
        })
      }
    },
    //** ----------------------- 动态页相关功能 ----------------------- **//
    /**
     * 默认显示投稿视频
     */
    changeCurrentUrlToVideoSubmissions () {
      const web_video_link = vals.web_video_link()
      const url = window.location.href
      const indexLink = 'https://t.bilibili.com/pages/nav/index'
      const newIndexLinkRegexp = /(https:\/\/t.bilibili.com\/pages\/nav\/index_new).*/i
      const indexVoteLinkRegexp = /https:\/\/t.bilibili.com\/vote\/h5\/index\/#\/result\?vote_id=.*/i
      const webVoteLinkRegexp = /t.bilibili.com\/h5\/dynamic\/vote#\/result\?vote_id=.*/i
      const indexLotteryLinkRegexp = /https:\/\/t.bilibili.com\/lottery\/h5\/index\/.*/i
      const webLotteryLinkRegexp = /https:\/\/t.bilibili.com\/lottery\/.*/i
      const moreDynamicLinkRegexp = /https:\/\/t.bilibili.com\/[0-9]+\?tab=[0-9]+/i
      const dynamicDetailLinkRegexp = /https:\/\/t.bilibili.com\/[0-9]+/i
      const dynamicTopicDetailLinkRegexp = /https:\/\/t.bilibili.com\/topic\/[0-9]+/i
      if (url == indexLink || newIndexLinkRegexp.test(url) || indexVoteLinkRegexp.test(url) || webVoteLinkRegexp.test(url) || indexLotteryLinkRegexp.test(url) || webLotteryLinkRegexp.test(url) || moreDynamicLinkRegexp.test(url) || dynamicDetailLinkRegexp.test(url) || dynamicTopicDetailLinkRegexp.test(url)) {
        //不影响BiliBili首页导航栏动态悬浮窗、动态页里投票及互动抽奖页等内容显示
        return false
      }
      if (url !== web_video_link) {
        window.location.href = web_video_link
      } else {
        return { message: '动态页｜已切换至投稿视频' }
      }
    },
    //** ----------------------- 首页相关功能 ----------------------- **//
    /**
     * 记录首页推荐的前 6 个视频
     */
    async setIndexRecordRecommendVideoHistory () {
      const indexRecommendVideoHistory = localforage.createInstance({
        name: 'indexRecommendVideoHistory',
      })
      await elmGetter.each(selectors.indexRecommendVideoSix, document.body, async video => {
        const url = video.querySelector('a').href
        const title = video.querySelector('h3').title
        if (window.location.host.includes('bilibili.com') && !url.includes('cm.bilibili.com')) {
          indexRecommendVideoHistory.setItem(title, url)
        }
      })
    },
    async insertIndexRecommendVideoHistoryOpenButton () {
      if (document.getElementById(selectors.indexRecommendVideoHistoryOpenButton)) document.getElementById(selectors.indexRecommendVideoHistoryOpenButton).remove()
      if (document.getElementById(selectors.indexRecommendVideoHistoryPopover)) document.getElementById(selectors.indexRecommendVideoHistoryPopover).remove()
      const $indexRecommendVideoRollButtonWrapper = await elmGetter.get(selectors.indexRecommendVideoRollButtonWrapper)
      const indexRecommendVideoHistoryOpenButtonHtml = `
            <button id="indexRecommendVideoHistoryOpenButton" popovertarget="indexRecommendVideoHistoryPopover" class="primary-btn roll-btn">
                <span>历史记录</span>
            </button>`
      const indexRecommendVideoHistoryPopoverHtml = `
            <div id="indexRecommendVideoHistoryPopover" popover>
                <div class="indexRecommendVideoHistoryPopoverTitle">
                    首页视频推荐历史记录
                    <div id="clearRecommendVideoHistoryButton">清空记录</div>
                </div>
                <ul></ul>
            </div>`
      utils.createElementAndInsert(indexRecommendVideoHistoryOpenButtonHtml, $indexRecommendVideoRollButtonWrapper, 'append')
      const $indexRecommendVideoHistoryPopover = utils.createElementAndInsert(indexRecommendVideoHistoryPopoverHtml, document.body, 'append')
      $indexRecommendVideoHistoryPopover.addEventListener('toggle', async (event) => {
        const indexBodyElement = await elmGetter.get(selectors.indexBodyElement)
        if (event.newState === 'open') {
          indexBodyElement.style.pointerEvents = 'none'
        }
        if (event.newState === 'closed') {
          indexBodyElement.style.pointerEvents = 'auto'
        }
      })
    },
    async getIndexRecordRecommendVideoHistory () {
      const indexRecommendVideoHistory = localforage.createInstance({
        name: 'indexRecommendVideoHistory',
      })
      const $indexRecommendVideoHistoryPopover = await elmGetter.get(selectors.indexRecommendVideoHistoryPopover)
      $indexRecommendVideoHistoryPopover.querySelector('ul').innerHTML = ''
      await indexRecommendVideoHistory.iterate(function (value, key) {
        utils.createElementAndInsert(`<li><a href="${value}" target="_blank">${key}</a></li>`, $indexRecommendVideoHistoryPopover.querySelector('ul'), 'append')
      })
    },
    async clearRecommendVideoHistory () {
      const indexRecommendVideoHistory = localforage.createInstance({
        name: 'indexRecommendVideoHistory',
      })
      indexRecommendVideoHistory.clear()
      const $indexRecommendVideoHistoryPopover = await elmGetter.get(selectors.indexRecommendVideoHistoryPopover)
      $indexRecommendVideoHistoryPopover.querySelector('ul').innerHTML = ''
      $indexRecommendVideoHistoryPopover.hidePopover()
    },
    //** ----------------------- 脚本最终执行函数 ----------------------- **//
    /**
     * 前期准备函数
     * 提前执行其他脚本功能所依赖的其他函数
     */
    thePrepFunction () {
      if (++vars.thePrepFunctionRunningCount === 1) {
        utils.initValue()
        utils.clearAllTimersWhenCloseTab()
        if (window.location.href === 'https://www.bilibili.com/') {
          utils.insertStyleToDocument('IndexAdjustmentStyle', styles.IndexAdjustment)
        }
        if (regexps.video.test(window.location.href)) {
          utils.insertStyleToDocument('BodyHiddenStyle', styles.BodyHidden)
          utils.insertStyleToDocument('VideoPageAdjustmentStyle', styles.VideoPageAdjustment)
          utils.insertStyleToDocument('FreezeHeaderAndVideoTitleStyle', styles.FreezeHeaderAndVideoTitle)
          modules.observerPlayerDataScreenChanges()
        }
      }
    },
  }
  if (modules.isLogin()) {
    modules.thePrepFunction()
    const timer = setInterval(async () => {
      const dicumentHidden = utils.checkDocumentIsHidden()
      if (!dicumentHidden) {
        clearInterval(timer)
        utils.logger.info('当前标签｜已激活｜开始应用配置')
        let functionsArray = []
        if (regexps.video.test(window.location.href)) {
          functionsArray = [
            modules.getCurrentPlayerType,
            modules.checkVideoExistence,
            modules.checkVideoCanPlayThrough,
            modules.autoSelectScreenMode,
            modules.webfullScreenModeUnlock,
            modules.autoLocationToPlayer,
            modules.autoCancelMute,
            modules.autoSelectVideoHighestQuality,
            modules.clickPlayerAutoLocation,
            modules.insertFloatSideNavToolsButton,
            modules.clickVideoTimeAutoLocation,
            modules.insertVideoDescriptionToComment,
            modules.autoSkipTimeNodes,
            modules.insertSetSkipTimeNodesButton,
            modules.insertSkipTimeNodesSwitchButton,
          ]
          await utils.sleep(2000)
        }
        if (regexps.dynamic.test(window.location.href)) {
          functionsArray = [
            modules.changeCurrentUrlToVideoSubmissions
          ]
        }
        if (window.location.href === 'https://www.bilibili.com/') {
          functionsArray = [
            modules.setIndexRecordRecommendVideoHistory,
            modules.insertIndexRecommendVideoHistoryOpenButton,
            modules.getIndexRecordRecommendVideoHistory,
          ]
        }
        utils.addEventListenerToElement()
        utils.executeFunctionsSequentially(functionsArray)
      } else {
        utils.logger.info('当前标签｜未激活｜等待激活')
      }
    }, 100)
    arrays.intervalIds.push(timer)
  }
  else utils.logger.warn('请登录｜本脚本只能在登录状态下使用')
})();
