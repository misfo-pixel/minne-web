# 明尼助手网页版（minni-web）

明尼助手小程序的网页浏览版 + 商家入驻宣传页。只能浏览，联系、下单、发布都引导回小程序。

- `/` 首页；`/market` `/sublet` `/tasks` `/groups` 四个板块的列表和详情；`/groupbuy` 一起拼团
- `/merchants`、`/en/merchants` 商家入驻页（中 / 英）

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
4. **部署网站**：把本仓库推到 GitHub，在 Vercel 导入，环境变量按 `.env.example` 填三项，部署
5. 想要自己的域名：Vercel 项目 → Domains 里加，按提示改 DNS。海外服务器不需要备案

## 改东西去哪改

| 想改的 | 文件 |
|---|---|
| 板块名称、标签页、详情页显示哪几行 | `lib/modules.ts` |
| 商家页文案（中英两份） | `components/MerchantPage.tsx` |
| 配色、贴纸风格 | `app/globals.css` 顶部的变量 |
| 网页能拿到哪些字段 | 云函数 `webFeed` 的 `TYPES`（改完要重新部署云函数） |
