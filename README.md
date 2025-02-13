# 哔哩哔哩（bilibili.com）调整

一个简单的小脚本，主要是给自己用的。

本脚本是对本人已发布的两个脚本：[哔哩哔哩（bilibili.com）播放页调整](https://greasyfork.org/zh-CN/scripts/415804-%E5%93%94%E5%93%A9%E5%93%94%E5%93%A9-bilibili-com-%E6%92%AD%E6%94%BE%E9%A1%B5%E8%B0%83%E6%95%B4) 和 [哔哩哔哩（bilibili.com）动态页优化](https://greasyfork.org/zh-CN/scripts/40295-%E5%93%94%E5%93%A9%E5%93%94%E5%93%A9-bilibili-com-%E5%8A%A8%E6%80%81%E9%A1%B5%E4%BC%98%E5%8C%96) 的整合。  

本脚本对以上两个脚本进行了完全的重构，并添加了部分新功能。

**本人用空闲时间陆陆续续改完，修修补补使用了几个月到现在暂未发现有什么问题，但是并不能保证一定没问题，若使用中发现问题请提出来，我会尽快处理，请勿随意差评。**

本脚本目前拥有功能如下：

视频会静音为浏览器安全行为，与本脚本无关，在浏览器地址栏左侧(不同浏览器位置及展现方式可能不同)网站权限中选择“允许音频和视频”即可。

一、通用调整：
1. ~~自动签到(登录即可)；~~(B站官方已下线签到功能)
2. 首页新增推荐视频历史记录(仅记录前6个推荐位中的非广告内容)，以防误点刷新错过想看的视频。  

二、动态页调整：
1. 默认显示"投稿视频"内容，可自行设置URL以免未来URL发生变化。  

三、播放页调整：
1. 自动定位到播放器（进入播放页，可自动定位到播放器，可设置偏移量及是否在点击主播放器时定位）；
2. 可设置播放器默认模式；
3. 可设置是否自动选择最高画质；
4. 新增快速返回播放器漂浮按钮；
5. 新增点击评论区时间锚点可快速返回播放器；
6. 网页全屏模式解锁(网页全屏模式下可滚动查看评论，并在播放器控制栏新增快速跳转至评论区按钮)；
7. 将视频简介内容优化后插入评论区或直接替换原简介区内容(替换原简介中固定格式的静态内容为跳转链接)；(已修复)
8. 视频播放过程中跳转指定时间节点至目标时间节点(可用来跳过片头片尾及中间广告等)；【只是说实现了这么个功能，但是由于并没有付费云数据库支撑，并不能保证使用效果】
9. 新增点击视频合集、下方推荐视频、结尾推荐视频卡片快速返回播放器；
10. 离开页面自动暂停视频，返回自动播放。
11. 新增自动开启字幕功能并添加快速开关。

## 历史更新

### 2025

`02.13 23:01`：修复「点击评论区时间锚点」返回至播放器失效的问题

`02.12 15:01`：修复「网页全屏解锁」后「插入跳转评论按钮」点击失效的问题

`01.31 19:23`：优化「定位至播放器」功能执行逻辑，并默认开启解锁合集/选集视频集数选择按钮功能；

`01.26 11:20`：修复「视频简介优化」及「点击评论区时间锚点可快速返回播放器」功能；

### 2024

`10.20 21:07`：修复点击视频结尾推荐视频不自动定位的问题；

`10.17 20:37`：新增自动开启字幕功能并添加快速开关；修复失效的函数；

`06.17 19:25`：修复「视频简介优化」功能因 VUE 版本号更新导致的样式错误问题。

`05.16 22:25`：优化「首页」推荐视频历史记录功能。
