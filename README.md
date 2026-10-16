# 明尼助手网页版（minne-web）

明尼助手小程序的网页浏览版 + 商家入驻宣传页。只能浏览，联系、下单、发布都引导回小程序。

- `/` 首页；`/market` `/sublet` `/tasks` `/groups` 四个板块的列表和详情；`/groupbuy` 一起拼团
- `/merchants`、`/en/merchants` 商家入驻页（中 / 英）
- `/shop`、`/en/shop` 店长后台（中 / 英）：店长用小程序里拿的登录码登进自己的店，看订单、确认订单、复制待确认买家邮箱、导出表格、开团、改商品文字和价格。见下面「店长后台」

## 数据从哪来

```
浏览器 ──> Vercel（Next.js，美国）──x-web-key──> 云函数 webFeed（HTTP 访问服务，上海）──> 云数据库
```

- 浏览器从不直接访问云开发：不用处理跨域，密钥只在服务器上
- webFeed 只下发白名单字段，所有联系方式、发布者身份、审核中的帖子都不出去（见 `campus-helper/cloudfunctions/webFeed/index.js` 开头）
- 结果缓存在 Vercel（`lib/feed.ts`），同一页面一两分钟内只过一次太平洋

本地没配 `WEBFEED_URL` 时自动用 `lib/mock.ts` 的假数据，直接 `npm run dev` 就能看。

## 上线步骤

1. **部署云函数**：微信开发者工具里右键 `cloudfunctions/webFeed` →「上传并部署：云端安装依赖」
2. **配密钥**：云开发控制台 → 云函数 → webFeed → 函数配置 → 环境变量，加 `WEB_KEY`，值用 `openssl rand -hex 24` 生成。没配的话接口一律返回 403
3. **开 HTTP 访问**：云开发控制台 → HTTP 访问服务 → 新建，路径 `/webfeed`，关联云函数 webFeed。拿到地址后先自测：
   ```bash
   curl -H "x-web-key: 你的密钥" "https://你的地址/webfeed?action=home"
   ```
   返回 `{"success":true,...}` 就通了
4. **部署网站**：把本仓库推到 GitHub，在 Vercel 导入，环境变量按 `.env.example` 填（`SITE_URL` 没有自己的域名时可以不填），部署
5. 想要自己的域名：Vercel 项目 → Domains 里加，按提示改 DNS。海外服务器不需要备案

## 店长后台（/shop）

```
浏览器 ──> Vercel 服务器动作（app/shop/actions.ts）──x-web-key + 登录凭证──> 云函数 shopManage / shopOrders ──> 云数据库
```

- 登录：店长在小程序「我的小店 → 电脑上管理」拿 8 位登录码（5 分钟、一次性），网页上输入后换一个 7 天的登录凭证，存在 httpOnly cookie 里，页面脚本读不到。小程序那页有「退出所有网页登录」
- 店长身份、能不能动这家店，全由云函数核对，网站这边不做权限判断（见 `campus-helper/cloudfunctions/shopManage/index.js` 的「网页登录」）
- 网页能做的操作是云函数里的白名单：订单、场次、商品文字和价格、上下架。开店、店铺资料（logo、取货点）、商品照片、海报、删店还是只能在小程序里做
- 网页上新增商品或改商品文字，云函数先过腾讯云文本内容安全（TMS）；只改价格、上下架不送审
- 这些页面不让搜索引擎收录。本地没配 `SHOPMANAGE_URL` 时用 `lib/shopMock.ts` 的演示小店，登录码随便输 8 位

上线：

1. 微信开发者工具里重新部署 `shopManage`（「上传并部署：云端安装依赖」，多了 `tencentcloud-sdk-nodejs-tms`）和 `shopOrders`
2. 云开发控制台 → 云函数 → `shopManage` 和 `shopOrders` → 环境变量，都加 `WEB_KEY`（和 webFeed 同一个值）。`shopManage` 再加 `TMS_SECRET_ID`、`TMS_SECRET_KEY`（只授权 QcloudTMSFullAccess 的子账号密钥），超时调到 10 秒
3. HTTP 访问服务新建两条：`/shopmanage` 关联 shopManage，`/shoporders` 关联 shopOrders
4. Vercel 环境变量加 `SHOPMANAGE_URL`、`SHOPORDERS_URL`，重新部署
5. 有人登录过之后，云数据库里会出现 `web_logins`、`web_sessions` 两个集合，把权限改成「所有用户不可读写」

## 改东西去哪改

| 想改的 | 文件 |
|---|---|
| 板块名称、标签页、详情页显示哪几行 | `lib/modules.ts` |
| 商家页文案（中英两份） | `components/MerchantPage.tsx` |
| 配色、贴纸风格 | `app/globals.css` 顶部的变量 |
| 网页能拿到哪些字段 | 云函数 `webFeed` 的 `TYPES`（改完要重新部署云函数） |
| 店长后台文案（中英两份） | `lib/shopCopy.ts` |
