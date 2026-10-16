import 'server-only'
import { cacheLife } from 'next/cache'
import { mockFeed } from './mock'
import type { HomeData, ListData, Post, PostType, ShopData, ShopsData } from './types'

// 所有数据都从 webFeed 云函数来，只在服务器上调：
//   - 浏览器不用跨域访问国内的云开发域名
//   - 结果缓存在 Vercel（美国），同一页面几十个人看只过一次太平洋
//   - x-web-key 只存在服务器环境变量里，不会出现在网页源码中
//
// 两种缓存按页面分：
//   - 首页、拼团列表不看网址参数，整页在构建时预渲染进静态外壳（ISR），用普通 'use cache'，
//     到点后台重新生成，所有访客共用
//   - 列表（?kind=&page=&q=）、详情（/[id]）要等请求来了才知道参数，这部分不在静态外壳里。
//     普通 'use cache' 只存在单个实例的内存里，Vercel 的无服务器实例来来去去，命中率很低，
//     所以用 'use cache: remote'，所有实例共享
// 参数（板块、页码、关键词、id）自动成为缓存键。图片链接 webFeed 给的有效期是 2 天，
// 缓存最长 1 小时（expire），不会出现图片链接过期的情况。
//
// 本地开发没配 WEBFEED_URL 时用 lib/mock.ts 的假数据；线上没配直接报错，免得把假数据挂出去。
// 想在本地用假数据跑 next build，设 WEBFEED_MOCK=1。

const BASE = process.env.WEBFEED_URL
const KEY = process.env.WEBFEED_KEY || ''

type Params = Record<string, string | number | undefined>

// next build 预渲染首页、拼团列表时 Next 会设这个（运行时没有）
const BUILDING = process.env.NEXT_PHASE === 'phase-production-build'

async function fetchOnce<T>(qs: URLSearchParams, action: unknown): Promise<T | null> {
  const res = await fetch(`${BASE}?${qs}`, { headers: { 'x-web-key': KEY } })
  if (res.status === 404) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) {
    throw Object.assign(new Error(`webFeed ${action} 失败：${res.status} ${data.message || ''}`), { status: res.status })
  }
  return data as T
}

async function call<T>(params: Params): Promise<T | null> {
  if (!BASE) {
    if (process.env.NODE_ENV === 'production' && !process.env.WEBFEED_MOCK) throw new Error('WEBFEED_URL 没配')
    return mockFeed(params) as T | null
  }
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v))
  })
  try {
    try {
      return await fetchOnce<T>(qs, params.action)
    } catch (e) {
      // 云函数冷启动常常超过 3 秒的默认超时（504），再来一次多半就是热的了。
      // 403（钥匙不对）这类重试也没用，直接报
      const status = (e as { status?: number }).status
      if (status && status < 500) throw e
      // 网址要和第一次不一样：Next 会把一次渲染里网址相同的 fetch 合并成一个，原样再发拿到的还是那个 504。
      // webFeed 只认自己用到的参数，多一个 retry 不影响结果
      const again = new URLSearchParams(qs)
      again.set('retry', '1')
      return await fetchOnce<T>(again, params.action)
    }
  } catch (e) {
    // 构建时云函数超时、出错（5xx、连不上）别让整次部署失败：页面先按「暂无」生成，上线后到 revalidate 时间自动重新拉。
    // 403 这类配置错误照样让构建失败——不然钥匙配错了会悄悄上线一个空网站。
    // 只在构建时这样；运行时照常抛错，Next 会继续给旧的缓存，不会把空页面缓存下来
    const status = (e as { status?: number }).status
    if (BUILDING && !(status && status < 500)) {
      console.warn(`[build] ${(e as Error).message}，这一页先按空数据生成`)
      return null
    }
    throw e
  }
}

export const PAGE_SIZE = 20

// revalidate：服务器上过了多少秒后台重新拉一次（期间照常返回旧的）。
// stale 是浏览器端前进后退时直接用手里那份的时长，不能低于 5 分钟：
// 低于 5 分钟的会被排除在 App Shell 之外，首页就不能整页预渲染了（见 Next 文档 cacheLife「Prerendering behavior」）
function life(revalidate: number) {
  cacheLife({ stale: 300, revalidate, expire: 3600 })
}

export async function getHome() {
  'use cache'
  life(120)
  return call<HomeData>({ action: 'home' })
}

export async function getList(type: PostType, kind: string | undefined, page: number, q?: string) {
  'use cache: remote'
  life(60)
  return call<ListData>({ action: 'list', type, kind, skip: (page - 1) * PAGE_SIZE, q })
}

export async function getPost(type: PostType, id: string) {
  'use cache: remote'
  life(120)
  const r = await call<{ item: Post }>({ action: 'detail', type, id })
  return r && r.item
}

export async function getShops() {
  'use cache'
  life(60)
  return call<ShopsData>({ action: 'shops' })
}

export async function getShop(id: string) {
  'use cache: remote'
  life(60)
  return call<ShopData>({ action: 'shop', id })
}
