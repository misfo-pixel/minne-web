import 'server-only'
import { mockCall } from './shopMock'

// 调云函数 shopManage / shopOrders 的网页入口（HTTP 访问服务），只在服务器上调。
// 和 webFeed 用同一把 x-web-key；店长身份是登录凭证（cookie 里那个），每次都由云函数重新核对。

const URLS = {
  manage: process.env.SHOPMANAGE_URL,
  orders: process.env.SHOPORDERS_URL
}
const KEY = process.env.WEBFEED_KEY || ''

export type CloudFn = keyof typeof URLS
export type CallResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; message: string; auth?: boolean }

export async function callShop(fn: CloudFn, action: string, payload: Record<string, unknown> = {}, token = ''): Promise<CallResult> {
  const url = URLS[fn]
  if (!url) {
    // 本地开发没配地址：用内存里的演示小店，方便看页面。线上没配就是没部署好
    if (process.env.NODE_ENV !== 'production') return mockCall(fn, action, payload, token)
    return { ok: false, message: '店长后台还没配置好' }
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-web-key': KEY },
      body: JSON.stringify({ action, token, ...payload }),
      cache: 'no-store'
    })
    const data = await res.json()
    if (res.status === 401) return { ok: false, message: data.message || '登录已失效，请重新登录', auth: true }
    if (!res.ok || !data.success) return { ok: false, message: data.message || '服务出错了' }
    return { ok: true, data }
  } catch {
    return { ok: false, message: '连不上服务器，请稍后重试' }
  }
}
