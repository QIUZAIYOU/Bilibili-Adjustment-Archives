// ==UserScript==
// @name              哔哩哔哩（bilibili.com）播放页调整 - 纯原生JS版
// @namespace         哔哩哔哩（bilibili.com）播放页调整 - 纯原生JS版
// @copyright         QIAN
// @license           GPL-3.0 License
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
        setSkipTimeNodesSwitchButtonCount: 0,
        functionExecutionsCount: 0,
        checkScreenModeSwitchSuccessDepths: 0,
        autoLocationToPlayerRetryDepths: 0,
    }
    let arrays = {
        intervalIds: [],
        skipNodesRecords: []
    }
    const selectors = {
        app: '#app',
        header: '#biliMainHeader',
        player: '#bilibili-player',
        playerWrap: '#playerWrap',
        playerWebscreen: '#bilibili-player.mode-webscreen',
        playerContainer: '#bilibili-player .bpx-player-container',
        playerControler: '#bilibili-player .bpx-player-ctrl-btn',
        playerControlerBottomRight: '.bpx-player-control-bottom-right',
        playerTooltipArea: '.bpx-player-tooltip-area',
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
        bangumiComment: '#comment_module',
        bangumiFloatNav: '[class*="navTools_floatNavExp"] [class*="navTools_navMenu"]',
        bangumiMainContainer: '.main-container',
        qualitySwitchButtons: '.bpx-player-ctrl-quality-menu-item',
        screenModeWideEnterButton: '.bpx-player-ctrl-wide-enter',
        screenModeWideLeaveButton: '.bpx-player-ctrl-wide-leave',
        screenModeWebEnterButton: '.bpx-player-ctrl-web-enter',
        screenModeWebLeaveButton: '.bpx-player-ctrl-web-leave',
        screenModeFullControlButton: '.bpx-player-ctrl-full',
        danmukuBox: '#danmukuBox',
        upAvatorFace: '.up-info-container .up-avatar-wrap .bili-avatar .bili-avatar-face',
        upAvatorDecoration: '.up-info-container .up-avatar-wrap .bili-avatar .bili-avatar-pendent-dom .bili-avatar-img',
        upAvatorIcon: '.up-info-container .up-avatar-wrap .bili-avatar .bili-avatar-icon',
        setSkipTimeNodesPopover: '#setSkipTimeNodesPopover',
        setSkipTimeNodesPopoverHeaderExtra: '#setSkipTimeNodesPopover .header .extra',
        setSkipTimeNodesPopoverTips: '#setSkipTimeNodesPopover .tips',
        setSkipTimeNodesPopoverTipsDetail: '#setSkipTimeNodesPopover .tips .detail',
        setSkipTimeNodesPopoverTipsContents: '#setSkipTimeNodesPopover .tips .contents',
        setSkipTimeNodesPopoverRecords: '#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .records',
        setSkipTimeNodesInput: '#setSkipTimeNodesInput',
        timeNodesRecordsArray: '#timeNodesRecordsArray',
        clearRecordsButton: '#clearRecordsButton',
        saveRecordsButton: '#saveRecordsButton',
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
        auto_skip: () => { return utils.getValue('auto_skip') }
    }
    const styles = {
        AdjustmentStyle: '.back-to-top-wrap .locate{visibility:hidden}.back-to-top-wrap:has(.visible) .locate{visibility:visible}.bpx-player-container[data-screen=full] #goToComments{opacity:.6;cursor:not-allowed;pointer-events:none}#comment-description .user-name{display:flex;padding:0 5px;height:22px;border:1px solid;border-radius:4px;align-items:center;justify-content:center}.bpx-player-ctrl-skip{border:none!important;background:0 0!important}.bpx-player-container[data-screen=full] #setSkipTimeNodesPopoverToggleButton,.bpx-player-container[data-screen=web] #setSkipTimeNodesPopoverToggleButton{height:32px!important;line-height:32px!important}#setSkipTimeNodesPopover{top:50%!important;left:50%!important;box-sizing:border-box!important;padding:15px!important;max-width:456px!important;border:0!important;border-radius:6px!important;font-size:14px!important;transform:translate(-50%,-50%)!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper{display:flex!important;flex-direction:column!important;gap:7px!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper button{display:flex!important;width:100%;height:34px!important;border-style:solid!important;border-width:1px!important;border-radius:6px!important;text-align:center!important;line-height:34px!important;cursor:pointer;align-items:center!important;justify-content:center!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper button:disabled{cursor:not-allowed}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .header{display:flex!important;font-weight:700!important;align-items:center!important;justify-content:space-between!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .header .title{font-weight:700!important;font-size:16px!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .header .extra{font-size:12px!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .header .extra,#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .result{padding:2px 5px!important;border:1px solid #d9ecff!important;border-radius:6px!important;background-color:#ecf5ff!important;color:#409eff!important;font-weight:400!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .success{display:flex!important;padding:2px 5px!important;border-color:#e1f3d8!important;background-color:#f0f9eb!important;color:#67c23a!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .danger{display:flex!important;padding:2px 5px!important;border-color:#fde2e2!important;background-color:#fef0f0!important;color:#f56c6c!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .handles{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:7px!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .tips{position:relative!important;overflow:hidden;box-sizing:border-box!important;padding:7px!important;border-color:#e9e9eb!important;border-radius:6px!important;background-color:#f4f4f5!important;color:#909399!important;font-size:13px!important;transition:height .3s!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .tips.open{height:131px!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .tips.close{height:34px!important;line-height:22px!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .tips .detail{position:absolute!important;top:9px!important;right:7px!important;display:flex!important;cursor:pointer!important;transition:transform .3s!important}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .tips .detail.open{transform:rotate(0)}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .tips .detail.close{transform:rotate(180deg)}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .records{display:none;flex-direction:column!important;gap:7px}#setSkipTimeNodesPopover .setSkipTimeNodesWrapper .records .recordsButtonsGroup{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:7px!important}#clearRecordsButton{border-color:#d3d4d6!important;background:#f4f4f5!important;color:#909399!important}#clearRecordsButton:disabled{border-color:#e9e9eb!important;background-color:#f4f4f5!important;color:#bcbec2!important}#saveRecordsButton{border-color:#c2e7b0!important;background:#f0f9eb!important;color:#67c23a!important}#saveRecordsButton:disabled{border-color:#e1f3d8!important;background-color:#f0f9eb!important;color:#a4da89!important}#setSkipTimeNodesInput{box-sizing:border-box!important;padding:5px!important;width:calc(100% - 39px)!important;height:34px!important;border:1px solid #cecece!important;border-radius:6px!important;line-height:34px!important}#setSkipTimeNodesButton{width:52px!important;height:34px!important;border:none!important;background:#00a1d6!important;color:#fff!important}#setSkipTimeNodesButton:hover{background:#00b5e5!important}#timeNodesRecordsArray{display:flex!important;padding:2px 5px!important;border-radius:6px!important}',
        BodyHidden: 'body{overflow:hidden!important}',
        ResetPlayerLayoutStyle: 'body{padding-top:0;position:auto}#playerWrap{display:block}#bilibili-player{height:auto;position:relative}.bpx-player-mini-warp{display:none}',
        UnlockWebscreenStlye: 'body.webscreen-fix{padding-top:BODYHEIGHT;position:unset}#bilibili-player.mode-webscreen{height:BODYHEIGHT;position:absolute}#playerWrap{display:none}#danmukuBox{margin-top:0}'
    }
    const utils = {
        /**
         * 初始化所有数据
         */
        initValue() {
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
        getValue(name) {
            return GM_getValue(name)
        },
        /**
         * 写入自定义数据
         * @param {String} 数据名称
         * @param {*} 数据数值
         */
        setValue(name, value) {
            GM_setValue(name, value)
        },
        /**
         * 休眠
         * @param {Number} 时长
         * @returns
         */
        sleep(times) {
            return new Promise(resolve => setTimeout(resolve, times))
        },
        /**
         * 向文档插入自定义样式
         * @param {String} id 样式表id
         * @param {String} css 样式内容
         */
        insertStyleToDocument(id, css) {
            const styleElement = GM_addStyle(css)
            styleElement.id = id
        },
        /**
         * 自定义日志打印
         * - info->信息；warn->警告
         * - error->错误；debug->调试
         */
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
        // /**
        //  * 检查元素是否存在
        //  * @param {String} selector 元素选择器
        //  * @param {Number} maxAttempts 最大尝试次数
        //  * @param {Number} delay 检查时间间隔
        //  */
        // checkElementExistence(selector, maxAttempts, delay) {
        //   return new Promise(resolve => {
        //     let attempts = 0
        //     const timer = setInterval(() => {
        //       attempts++
        //       const $element = document.querySelector(selector)
        //       if ($element) {
        //         clearInterval(timer)
        //         resolve(true)
        //       } else if (attempts === maxAttempts) {
        //         clearInterval(timer)
        //         resolve(false)
        //       }
        //     }, delay)
        //     arrays.intervalIds.push(timer)
        //   })
        // },
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
         * 为元素添加监听器并执行相应函数
         */
        async addEventListenerToElement() {
            const [$playerContainer] = await elmGetter.get([selectors.playerContainer])
            if (window.onurlchange === null) {
                window.addEventListener('urlchange', async () => {
                    await modules.locationToPlayer()
                    await modules.insertVideoDescriptionToComment()
                    // utils.logger.debug('URL改变了！')
                })
            }
            $playerContainer.addEventListener('fullscreenchange', async (event) => {
                let isFullscreen = document.fullscreenElement === event.target;
                if (!isFullscreen) await modules.locationToPlayer()
            })
        },
        /**
         * 刷新当前页面
         */
        reloadCurrentTab() {
            if (vals.auto_reload()) location.reload()
        },
        /**
         * 滚动文档至目标位置
         * @param {Number} 滚动距离
         */
        documentScrollTo(offset) {
            document.documentElement.scrollTop = offset
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
        /**
         * 获取Body 元素高度
         * @returns Body 元素高度
         */
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
         * 获取目标元素至文档距离
         * @param {String} 目标元素
         * @returns 顶部和左侧距离
         */
        getElementOffsetToDocument(element) {
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
        createElementAndInsert(HtmlString, target, method) {
            const element = elmGetter.create(HtmlString, target)
            target[method](element)
            return element
        },
        /**
         * 按顺序依次执行函数数组中的函数
         * @param {Array} functions 待执行的函数数组
         * - 只有当前一个函数执行完毕时才会继续执行下一个函数
         */
        async executeFunctionsSequentially(functions) {
            if (functions.length > 0) {
                const currentFunction = functions.shift()
                await currentFunction().then(result => {
                    // console.log(currentFunction.name, message)
                    if (result) {
                        const {
                            message,
                            callback
                        } = result
                        if (message) utils.logger.info(message)
                        if (callback && typeof callback === 'function') callback()
                    }
                    utils.executeFunctionsSequentially(functions)
                }).catch(error => {
                    utils.logger.error(error)
                    utils.reloadCurrentTab()
                })
            }
        }
    }
    const modules = {
        /**
         * 判断用户是否登录
         */
        isLogin() {
            return Boolean(document.cookie.replace(new RegExp(String.raw`(?:(?:^|.*;\s*)bili_jct\s*=\s*([^;]*).*$)|^.*$`), '$1') || window.UserStatus.userInfo.isLogin || null)
        },
        /**
         * 获取当前视频ID/video BVID/bangumi EPID
         */
        getCurrentVideoID() {
            const currentUrl = document.URL
            return currentUrl.includes('www.bilibili.com/video') ? currentUrl.split('/')[4] : currentUrl.includes('www.bilibili.com/bangumi') ? currentUrl.split('/')[5].split('?')[0] : 'error'
        },
        /**
         * 获取当前视频类型(video/bangumi)
         * 如果都没匹配上则弹窗报错
         * @returns 当前视频类型
         */
        async getCurrentPlayerType() {
            const playerType = (document.URL.startsWith('https://www.bilibili.com/video') || document.URL.startsWith('https://www.bilibili.com/list/')) ? 'video' : document.URL.startsWith('https://www.bilibili.com/bangumi') ? 'bangumi' : false
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
        async checkVideoExistence() {
            const $video = await elmGetter.get(selectors.video)
            if ($video) return { message: '播放器｜已找到' }
            else throw new Error('播放器｜未找到')
        },
        /**
         * 检查视频是否可以播放
         */
        async checkVideoCanPlayThrough() {
            // const BwpVideoPlayerExists = await utils.checkElementExistence(selectors.videoBwp, 10, 10)
            // if (BwpVideoPlayerExists) {
            //   return new Promise(resolve => {
            //     resolve(true)
            //   })
            // }
            return new Promise((resolve, reject) => {
                let attempts = 100
                let message
                const timer = setInterval(() => {
                    const $video = document.querySelector(selectors.video)
                    const videoReadyState = $video.readyState
                    if (videoReadyState === 4) {
                        message = '视频资源｜可以播放'
                        resolve({
                            message
                        })
                        clearInterval(timer)
                    } else if (attempts <= 0) {
                        message = '视频资源｜加载失败'
                        reject({
                            message
                        })
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
        async observerPlayerDataScreenChanges() {
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
        async getCurrentScreenMode(delay = 0) {
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
        async autoSelectScreenMode() {
            if (++vars.autoSelectScreenModeRunningCount === 1) {
                if (vals.selected_screen_mode() === 'close') return { message: '屏幕模式｜功能已关闭' }
                const currentScreenMode = await modules.getCurrentScreenMode()
                const screenModeMap = ['wide', 'web']
                if (screenModeMap.includes(currentScreenMode)) return { message: `屏幕模式｜当前已是 ${currentScreenMode.toUpperCase()} 模式` }
                if (screenModeMap.includes(vals.selected_screen_mode())) {
                    const result = await modules.checkScreenModeSwitchSuccess(vals.selected_screen_mode())
                    // utils.logger.debug(`${result}`)
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
        async checkScreenModeSwitchSuccess(expectScreenMode) {
            const enterBtnMap = {
                wide: async () => { return await elmGetter.get(selectors.screenModeWideEnterButton) },
                web: async () => { return await elmGetter.get(selectors.screenModeWebEnterButton) },
            }
            if (enterBtnMap[expectScreenMode]) {
                const enterBtn = await enterBtnMap[expectScreenMode]()
                enterBtn.click()
                const currentScreenMode = await modules.getCurrentScreenMode(300)
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
        async setlocationDataAndScrollToPlayer() {
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
            vals.player_type() === 'video' ? utils.setValue('video_player_offset_top', playerOffsetTop) : utils.setValue('bangumi_player_offset_top', playerOffsetTop)
            await modules.getCurrentScreenMode() === 'wide' ? utils.documentScrollTo(playerOffsetTop - vals.offset_top()) : utils.documentScrollTo(0)
            return
            // utils.logger.debug('定位至播放器！')
        },
        /**
         * 自动定位至播放器并检查是否成功
         */
        async autoLocationToPlayer() {
            const unlockbody = () => {
                document.getElementById('BodyHidden').remove()
            }
            const onAutoLocate = vals.auto_locate() && ((!vals.auto_locate_video() && !vals.auto_locate_bangumi()) || (vals.auto_locate_video() && vals.player_type() === 'video') || (vals.auto_locate_bangumi() && vals.player_type() === 'bangumi'))
            if (!onAutoLocate || vals.selected_screen_mode() === 'web') return { callback: unlockbody }
            await modules.setlocationDataAndScrollToPlayer()
            await utils.sleep(100)
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
        async checkAutoLocationSuccess(expectOffest) {
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
        async locationToPlayer() {
            const playerOffsetTop = vals.player_type() === 'video' ? vals.video_player_offset_top() : vals.bangumi_player_offset_top()
            utils.documentScrollTo(await modules.getCurrentScreenMode() !== 'web' ? playerOffsetTop - vals.offset_top() : 0)
        },
        /**
         * 点击播放器自动定位
         */
        async clickPlayerAutoLocation() {
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
        async autoCancelMute() {
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
        async autoSelectVideoHighestQuality() {
            if (++vars.autoSelectVideoHighestQualityRunningCount === 1) {
                let message
                const qualitySwitchButtonsMap = new Map()
                if (!vals.auto_select_video_highest_quality()) return
                await elmGetter.each(selectors.qualitySwitchButtons, document, button => {
                    qualitySwitchButtonsMap.set(button.dataset.value, button)
                })
                await utils.sleep(100)
                if (vals.is_vip()) {
                    if (!vals.contain_quality_4k() && !vals.contain_quality_8k()) {
                        [...qualitySwitchButtonsMap].filter(quality => {
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
                    [...qualitySwitchButtonsMap].filter(button => {
                        return button[1].children.length < 2
                    })[0][1].click()
                    message = '最高画质｜非VIP｜切换成功'
                }
                // utils.logger.info(message)
                return {
                    message
                }
            }
        },
        /**
         * 插入漂浮功能按钮
         * - 快速返回至播放器
         */
        async insertFloatSideNavToolsButton() {
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
        async clickVideoTimeAutoLocation() {
            await utils.sleep(100)
            const $video = await elmGetter.get('video')
            const $clickTarget = vals.player_type() === 'video' ? await elmGetter.get(selectors.videoComment, 100) : await elmGetter.get(selectors.bangumiComment, 100)
            await elmGetter.each(selectors.videoTime, $clickTarget, async (target) => {
                target.addEventListener('click', async (event) => {
                    event.stopPropagation()
                    await modules.locationToPlayer()
                    const targetTime = vals.player_type() === 'video' ? target.dataset.videoTime : target.dataset.time
                    if (targetTime > $video.duration) alert('当前时间点大于视频总时长，将跳到视频结尾！')
                    $video.currentTime = targetTime
                    $video.play()
                })
            })
        },
        /**
         * 网页全屏模式解锁
         */
        async webfullScreenModeUnlock() {
            if (vals.webfull_unlock() && vals.selected_screen_mode() === 'web' && ++vars.webfullUnlockRunningCount === 1) {
                if (vals.player_type() === 'bangumi') return
                const [$app, $playerWrap, $player, $playerWebscreen, $wideEnterButton, $wideLeaveButton, $webEnterButton, $webLeaveButton, $fullControlButton] = await elmGetter.get([selectors.app, selectors.playerWrap, selectors.player, selectors.playerWebscreen, selectors.screenModeWideEnterButton, selectors.screenModeWideLeaveButton, selectors.screenModeWebEnterButton, selectors.screenModeWebLeaveButton, selectors.screenModeFullControlButton])
                const resetPlayerLayout = async () => {
                    if (document.getElementById('UnlockWebscreenStlye')) document.getElementById('UnlockWebscreenStlye').remove()
                    if (!document.getElementById('ResetPlayerLayoutStyle')) utils.insertStyleToDocument('ResetPlayerLayoutStyle', styles.ResetPlayerLayoutStyle)
                    $playerWrap.append($player)
                    utils.setValue('current_screen_mode', 'wide')
                    await utils.sleep(300)
                    await modules.locationToPlayer()
                }
                const bodyHeight = utils.getBodyHeight()
                utils.insertStyleToDocument('UnlockWebscreenStlye', styles.UnlockWebscreenStlye.replace(/BODYHEIGHT/gi, `${bodyHeight}px`))
                $app.prepend($playerWebscreen)
                $webLeaveButton.addEventListener('click', async () => {
                    await utils.sleep(100)
                    await resetPlayerLayout()
                })
                $webEnterButton.addEventListener('click', async () => {
                    if (!document.getElementById('UnlockWebscreenStlye')) utils.insertStyleToDocument('UnlockWebscreenStlye', styles.UnlockWebscreenStlye.replace(/BODYHEIGHT/gi, `${bodyHeight}px`))
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
        async insertGoToCommentButton() {
            if (vals.player_type() === 'video' && vals.webfull_unlock() && ++vars.insertGoToCommentButtonCount === 1) {
                const [$comment, $playerControlerBottomRight] = await elmGetter.get([selectors.videoComment, selectors.playerControlerBottomRight])
                const goToCommentBtnHtml = '<div class="bpx-player-ctrl-btn bpx-player-ctrl-comment" role="button" aria-label="前往评论" tabindex="0"><div id="goToComments" class="bpx-player-ctrl-btn-icon"><span class="bpx-common-svg-icon"><svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="88" height="88" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%; transform: translate3d(0px, 0px, 0px);"><path d="M512 85.333c235.637 0 426.667 191.03 426.667 426.667S747.637 938.667 512 938.667a424.779 424.779 0 0 1-219.125-60.502A2786.56 2786.56 0 0 0 272.82 866.4l-104.405 28.48c-23.893 6.507-45.803-15.413-39.285-39.296l28.437-104.288c-11.008-18.688-18.219-31.221-21.803-37.91A424.885 424.885 0 0 1 85.333 512c0-235.637 191.03-426.667 426.667-426.667zm-102.219 549.76a32 32 0 1 0-40.917 49.216A223.179 223.179 0 0 0 512 736c52.97 0 103.19-18.485 143.104-51.67a32 32 0 1 0-40.907-49.215A159.19 159.19 0 0 1 512 672a159.19 159.19 0 0 1-102.219-36.907z" fill="#currentColor"/></svg></span></div></div>'
                const $goToCommentButton = utils.createElementAndInsert(goToCommentBtnHtml, $playerControlerBottomRight, 'append')
                $goToCommentButton.addEventListener('click', (event) => {
                    event.stopPropagation()
                    utils.documentScrollTo(utils.getElementOffsetToDocument($comment).top - 10)
                    // utils.logger.info('到达评论区')
                })
            }
        },
        /**
         * 将视频简介内容插入评论区
         * - 视频简介存在且内容过长，则将视频简介内容插入评论区
         * - 若视频简介中包含型如 "00:00:00" 的时间内容，则将其转换为可点击的时间锚点元素
         * - 若视频简介中包含 URL 链接，则将其转换为跳转链接
         * - 若视频简介中包含视频 BV 号，则将其转换为跳转链接
         */
        async insertVideoDescriptionToComment() {
            const $commentDescription = document.getElementById('comment-description')
            if ($commentDescription) $commentDescription.remove()
            const [$upAvatorFace, $upAvatorIcon, $videoDescription, $videoDescriptionInfo, $videoCommentReplyList] = await elmGetter.get([selectors.upAvatorFace, selectors.upAvatorIcon, selectors.videoDescription, selectors.videoDescriptionInfo, selectors.videoCommentReplyList])
            const getTotalSecondsFromTimeString = (timeString) => {
                if (timeString.length === 5) timeString = '00:' + timeString
                const [hours, minutes, seconds] = timeString.split(':').map(Number)
                const totalSeconds = hours * 3600 + minutes * 60 + seconds
                return totalSeconds
            }

            if ($videoDescription.childElementCount > 1 && $videoDescriptionInfo) {
                const timeStringRegexp = /(\d\d:\d\d(:\d\d)*)/g
                const urlRegexp = /(http|https|ftp):\/\/[\w\-]+(\.[\w\-]+)*([\w\-\.\,\@\?\^\=\%\&\:\/\~\+\#]*[\w\-\@?\^\=\%\&\/~\+#])?/g
                const plaintVideoIdRegexp = /(?<!(\/|>))((BV)([A-Za-z0-9]){10})(?!(\/|<))/g
                const blankRegexp = /^\s*[\r\n]/gm
                const videoDescriptionInfoHtml = $videoDescriptionInfo.innerHTML.replace(blankRegexp, '').replace(timeStringRegexp, (match) => {
                    return `<a class="jump-link video-time" data-video-part="-1" data-video-time="${getTotalSecondsFromTimeString(match)}">${match}</a>`
                }).replace(urlRegexp, (match) => {
                    return `<a href="${match}" target="_blank">${match}</a>`
                }).replace(plaintVideoIdRegexp, (match) => {
                    return `<a href="https://www.bilibili.com/video/${match}" target="_blank">${match}</a>`
                })
                const upAvatorFace = $upAvatorFace.dataset.src.replace('@96w_96h_1c_1s_!web-avatar', '@160w_160h_1c_1s_!web-avatar-comment')
                const upAvatorDecoration = document.querySelector(selectors.upAvatorDecoration) ? document.querySelector(selectors.upAvatorDecoration).dataset.src.replace('@144w_144h_!web-avatar', '@240w_240h_!web-avatar-comment') : ''
                const videoDescriptionReplyTemplate = `
                <div data-v-eb69efad="" data-v-bad1995c="" id="comment-description" class="reply-item">
                    <div data-v-eb69efad="" class="root-reply-container">
                        <div data-v-eb69efad="" class="root-reply-avatar" >
                            <div data-v-eb69efad="" class="avatar">
                                <div class="bili-avatar" style="width:48px;height:48px">
                                    <img class="bili-avatar-img bili-avatar-face bili-avatar-img-radius" data-src="${upAvatorFace}" src="${upAvatorFace}">
                                    <div class="bili-avatar-pendent-dom">
                                        <img class="bili-avatar-img" data-src="${upAvatorDecoration}" alt="" src="${upAvatorDecoration}">
                                    </div>
                                    <span class="${$upAvatorIcon.classList}"></span>
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
            }
        },
        /**
         * 自动跳过视频已设置设置时间节点
         */
        async autoSkipTimeNodes() {
            const videoID = modules.getCurrentVideoID()
            const $video = await elmGetter.get(selectors.video)
            const skipTo = (seconds) => {
                $video.currentTime = seconds
                if (video.paused) {
                    video.play()
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
                const videoSkipTimeNodesArray = await modules.getVideoSkipTimeNodesByIndexedDB() || await modules.getVideoSkipTimeNodesByAxios()
                if (videoSkipTimeNodesArray) {
                    utils.logger.info(`自动跳过丨已获取节点信息丨${JSON.stringify(videoSkipTimeNodesArray)}`)
                    $video.addEventListener('timeupdate', function () {
                        const currentTime = Math.ceil(this.currentTime)
                        const targetTimeNode = findTargetTimeNode(currentTime, videoSkipTimeNodesArray)
                        if (utils.getValue('auto_skip') && targetTimeNode) skipTo(targetTimeNode)
                    })
                } else {
                    utils.logger.info('自动跳过丨节点信息不存在')
                }
            }
        },
        /**
         * 插入设置跳过时间节点按钮
         */
        async insertSetSkipTimeNodesButton() {
            const videoID = modules.getCurrentVideoID()
            const [$video, $playerControlerBottomRight, $playerTooltipArea] = await elmGetter.get([selectors.video, selectors.playerControlerBottomRight, selectors.playerTooltipArea])
            if (++vars.insertSetSkipTimeNodesButtonCount === 1) {
                const validateInputValue = (inputValue) => {
                    const regex = /^\[\d+,\d+\](,\[\d+,\d+\])*?$/g;
                    const numbers = input.match(/\[(\d+),(\d+)\]/g)?.flatMap(match => match.slice(1, -1).split(',')).map(Number) || [];
                    const hasDuplicates = new Set(numbers).size !== numbers.length
                    if (input === '' || !regex.test(input) || hasDuplicates) {
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
                const convertArrayRecordToSave = (arr) => {
                    return arr.reduce((acc, num, i) => {
                        i % 2 === 0 ? acc[0].push(num) : acc[1].push(num);
                        return acc;
                    }, [[], []]);
                }
                // [10,20,30,40] → [[10,20],[30,40]]
                const convertArrayRecordToReadable = (arr) => {
                    return arr.reduce((acc, _, i) => {
                        if (i % 2 === 0) {
                            acc.push(arr.slice(i, i + 2));
                        }
                        return acc;
                    }, []);
                }
                const isArrayLengthEven = (arr) => {
                    return arr.length % 2 === 0
                }
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
                        <span id="timeNodesRecordsArray"></span>
                        <div class="recordsButtonsGroup">
                            <button id="clearRecordsButton">清除数据</button>
                            <button id="saveRecordsButton">保存数据</button>
                        </div>
                    </div>
                    <div class="handles">
                        <input id="setSkipTimeNodesInput" value="">
                        <button id="setSkipTimeNodesButton">上传</button>
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
            const $setSkipTimeNodesPopoverToggleButton = utils.createElementAndInsert(setSkipTimeNodesPopoverToggleButtonHtml, $playerControlerBottomRight, 'append')
            const $setSkipTimeNodesPopover = utils.createElementAndInsert(setSkipTimeNodesPopoverHtml, document.body, 'append')
            const $setSkipTimeNodesButtonTip = utils.createElementAndInsert(setSkipTimeNodesButtonTipHtml, $playerTooltipArea, 'append')
            $setSkipTimeNodesPopoverToggleButton.addEventListener('mouseover', function () {
                const { top, left } = utils.getElementOffsetToDocument(this)
                // utils.logger.debug(`${top} ${left} ${window.pageYOffset} ${top - window.pageYOffset}`)
                $setSkipTimeNodesButtonTip.style.top = `${top - window.pageYOffset - (this.getBoundingClientRect().height * 2) - 5}px`
                $setSkipTimeNodesButtonTip.style.left = `${left - (this.getBoundingClientRect().width / 2)}px`
                $setSkipTimeNodesButtonTip.style.opacity = 1
                $setSkipTimeNodesButtonTip.style.visibility = 'visible'
                $setSkipTimeNodesButtonTip.style.transition = 'opacity .3s'

            })
            $setSkipTimeNodesPopoverToggleButton.addEventListener('mouseout', () => {
                $setSkipTimeNodesButtonTip.style.opacity = 0
                $setSkipTimeNodesButtonTip.style.visibility = 'hidden'
            })
            const [$setSkipTimeNodesPopoverHeaderExtra, $setSkipTimeNodesPopoverTips, $setSkipTimeNodesPopoverTipsDetail] = await elmGetter.get([selectors.setSkipTimeNodesPopoverHeaderExtra, selectors.setSkipTimeNodesPopoverTips, selectors.setSkipTimeNodesPopoverTipsDetail])
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
                $video.pause()
                const currentTime = Math.ceil($video.currentTime)
                $setSkipTimeNodesPopoverHeaderExtra.innerText = `${currentTime} / ${$video.duration}`
            })
        },
        /**
         * 前期准备函数
         * 提前执行其他脚本功能所依赖的其他函数
         */
        thePrepFunction() {
            if (++vars.thePrepFunctionRunningCount === 1) {
                utils.insertStyleToDocument('BodyHidden', styles.BodyHidden)
                utils.clearAllTimersWhenCloseTab()
                utils.addEventListenerToElement()
                utils.insertStyleToDocument('AdjustmentStyle', styles.AdjustmentStyle)
                utils.initValue()
                modules.observerPlayerDataScreenChanges()
            }
        },
        /**
         * 脚本执行主函数
         * 定义了所有功能函数将按何种规则执行
         */
        async theMainFunction() {
            if (++vars.theMainFunctionRunningCount === 1) {
                const videoPlayerExists = await elmGetter.get(selectors.video)
                if (videoPlayerExists) {
                    utils.logger.info('播放器｜已找到')
                    const isCanPlayThrough = await modules.checkVideoCanPlayThrough()
                    const videoControlerBtnExists = await elmGetter.get(selectors.playerControler)
                    if (isCanPlayThrough || (!isCanPlayThrough && videoControlerBtnExists)) {
                        utils.logger.info('视频资源｜可以播放')
                        const selectedScreenMode = await modules.autoSelectScreenMode()
                        if (selectedScreenMode) {
                            utils.logger.info(`屏幕模式｜${vals.selected_screen_mode().toUpperCase()}｜切换成功`)
                            const autoLocationToPlayerSuccess = await modules.autoLocationToPlayer()
                            if (autoLocationToPlayerSuccess) {
                                modules.autoCancelMute()
                                modules.autoSelectVideoHighestQuality()
                                modules.clickPlayerAutoLocation()
                                modules.insertFloatSideNavToolsButton()
                                document.body.style.overflow = 'auto'
                            }
                        } else {
                            utils.logger.error(`屏幕模式｜${vals.selected_screen_mode().toUpperCase()}｜切换失败)`)
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
        const timer = setInterval(async () => {
            const dicumentHidden = utils.checkDocumentIsHidden()
            if (!dicumentHidden) {
                clearInterval(timer)
                utils.logger.info('当前标签｜已激活｜开始应用配置')
                // modules.theMainFunction()
                const functions = [
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
                    modules.insertSetSkipTimeNodesButton
                ]
                await utils.sleep(2000)
                utils.executeFunctionsSequentially(functions)
            } else {
                utils.logger.info('当前标签｜未激活｜等待激活')
            }
        }, 100)
        arrays.intervalIds.push(timer)
    } else utils.logger.warn('请登录｜本脚本只能在登录状态下使用')
})();
