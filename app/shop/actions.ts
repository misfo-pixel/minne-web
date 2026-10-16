'use server'

import { cookies } from 'next/headers'
import { callShop, type CallResult, type CloudFn } from '@/lib/shopApi'
import type {
  AdminItem, AdminOrder, AdminSession, Dashboard, Fail, ItemDraft, OrderTab, Result, SessionDraft, SessionForm, ShopInfo
} from '@/lib/shopTypes'

// 店长后台的服务器动作。浏览器只拿得到这里收窄过的数据，登录凭证在 httpOnly cookie 里，页面脚本读不到。
// 每个动作都带着凭证去云函数，「这家店是不是你的」由云函数核对（见 campus-helper 的 shopManage「网页登录」），
// 这里不做任何权限判断，也不信任页面传来的店铺 ID。

const COOKIE = 'minne_shop'
const SESSION_SECONDS = 7 * 24 * 3600   // 和云函数里凭证的有效期一致

type Raw = Record<string, unknown>
const str = (v: unknown) => (v == null ? '' : String(v))
const num = (v: unknown) => Number(v) || 0
const list = (v: unknown): Raw[] => (Array.isArray(v) ? v : [])

async function token() {
  return (await cookies()).get(COOKIE)?.value || ''
}

// 登录失效（过期、在小程序里点了退出所有网页登录）就顺手清掉 cookie
async function call(fn: CloudFn, action: string, payload: Raw = {}): Promise<CallResult> {
  const t = await token()
  if (!t) return { ok: false, message: '请先登录', auth: true }
  const r = await callShop(fn, action, payload, t)
  if (!r.ok && r.auth) (await cookies()).delete(COOKIE)
  return r
}

const fail = (r: CallResult & { ok: false }): Fail => ({ ok: false, message: r.message, auth: r.auth })

// ---- 收窄 ----

function toSession(s: Raw): AdminSession {
  const c = (s.counts || {}) as Raw
  return {
    id: str(s._id),
    date: str(s.date),
    departTime: str(s.depart_time),
    cutoff: str(s.cutoff),
    cutoffAt: str(s.cutoff_at),
    confirmAt: str(s.confirm_at),
    departAt: str(s.depart_at),
    minOrders: num(s.min_orders),
    repeatWeekly: s.repeat_weekly === true,
    forced: s.forced === true,
    state: (['open', 'formed', 'failed', 'cancelled'].includes(str(s.state)) ? s.state : 'open') as AdminSession['state'],
    points: list(s.points).map(p => str(p.name)),
    counts: { total: num(c.total), forming: num(c.forming), confirming: num(c.confirming), confirmed: num(c.confirmed) }
  }
}

function toOrder(o: Raw): AdminOrder {
  const id = str(o._id)
  return {
    id,
    shortId: id.slice(-6).toUpperCase(),
    status: str(o.status) as AdminOrder['status'],
    sessionId: str(o.session_id),
    batchDate: str(o.batch_date),
    nickname: str(o.buyer_nickname),
    email: str(o.contact_email),
    wechat: str(o.contact_wechat),
    phone: str(o.phone),
    pickup: str(o.pickup_info),
    unlisted: o.address_unlisted === true,
    items: list(o.items).map(i => ({ name: str(i.name), count: num(i.count), price: num(i.price), unit: str(i.unit) })),
    note: str(o.note),
    noteImages: list(o.note_image_urls).map(str).filter(Boolean),
    total: num(o.total),
    createdAt: str(o.created_at),
    cancelReason: str(o.cancel_reason)
  }
}

function toItem(i: Raw): AdminItem {
  return {
    id: str(i._id),
    name: str(i.name),
    price: num(i.price),
    unit: str(i.unit),
    description: str(i.description),
    specs: str(i.specs),
    category: str(i.category),
    available: i.available !== false,
    imageUrl: str(i.image_url)
  }
}

function toShop(s: Raw): ShopInfo {
  return {
    name: str(s.name),
    logoUrl: str(s.logo_url),
    takedown: s.takedown === true,
    needsDelivery: s.needs_delivery !== false,
    exactAddress: s.exact_address === true,
    points: list(s.pickup_points).map(p => ({ name: str(p.name), fee: num(p.fee), eta_minutes: num(p.eta_minutes) })),
    useCategory: s.use_category === true
  }
}

// ---- 登录 ----

export async function login(code: string): Promise<Result<{ shopName: string }>> {
  const c = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
  if (c.length !== 8) return { ok: false, message: '登录码是 8 位' }
  const r = await callShop('manage', 'webLogin', { code: c })
  if (!r.ok) return fail(r)
  ;(await cookies()).set(COOKIE, str(r.data.token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_SECONDS
  })
  return { ok: true, shopName: str(r.data.shopName) }
}

export async function logout(): Promise<Result> {
  const t = await token()
  if (t) await callShop('manage', 'webLogout', {}, t)
  ;(await cookies()).delete(COOKIE)
  return { ok: true }
}

// ---- 读 ----

// 一进来要的东西一次拿齐。服务器动作在浏览器那边是排队一个个发的，拆成三个动作就要等三趟
export async function loadDashboard(): Promise<Result<Dashboard>> {
  const t = await token()
  if (!t) return { ok: false, message: '', auth: true }
  const [shop, sessions, items] = await Promise.all([
    call('manage', 'getMine'),
    call('manage', 'sessions'),
    call('manage', 'listItems')
  ])
  for (const r of [shop, sessions, items]) if (!r.ok) return fail(r)
  if (!shop.ok || !sessions.ok || !items.ok) return { ok: false, message: '服务出错了' }
  if (!shop.data.shop) return { ok: false, message: '你还没有店铺' }
  return {
    ok: true,
    shop: { ...toShop(shop.data.shop as Raw), useCategory: items.data.useCategory === true },
    now: str(sessions.data.now),
    sessions: list(sessions.data.sessions).map(toSession),
    items: list(items.data.items).map(toItem)
  }
}

export async function reloadSessions(): Promise<Result<{ now: string; sessions: AdminSession[] }>> {
  const r = await call('manage', 'sessions')
  if (!r.ok) return fail(r)
  return { ok: true, now: str(r.data.now), sessions: list(r.data.sessions).map(toSession) }
}

export async function reloadItems(): Promise<Result<{ items: AdminItem[]; useCategory: boolean }>> {
  const r = await call('manage', 'listItems')
  if (!r.ok) return fail(r)
  return { ok: true, items: list(r.data.items).map(toItem), useCategory: r.data.useCategory === true }
}

export async function loadOrders(tab: OrderTab, sessionId: string): Promise<Result<{ orders: AdminOrder[] }>> {
  const r = await call('orders', 'list', { tab, sessionId: sessionId || '' })
  if (!r.ok) return fail(r)
  return { ok: true, orders: list(r.data.orders).map(toOrder) }
}

export async function loadSessionForm(sessionId: string, date: string): Promise<Result<SessionForm>> {
  const r = await call('manage', 'sessionForm', { sessionId: sessionId || '', date: date || '' })
  if (!r.ok) return fail(r)
  return {
    ok: true,
    now: str(r.data.now),
    points: list(r.data.points).map(p => ({ name: str(p.name), fee: num(p.fee), eta_minutes: num(p.eta_minutes) })),
    exactAddress: r.data.exact_address === true,
    session: r.data.session ? toSession(r.data.session as Raw) : null,
    count: num(r.data.count),
    others: list(r.data.others).map(o => ({ shopName: str(o.shop_name), departTime: str(o.depart_time) }))
  }
}

// ---- 改 ----

const done = (r: CallResult): Result => (r.ok ? { ok: true } : fail(r))

const ORDER_NEXT = ['accepted', 'delivering', 'completed', 'cancelled']

export async function setOrderStatus(orderId: string, status: string, reason = ''): Promise<Result> {
  if (!ORDER_NEXT.includes(status)) return { ok: false, message: '参数不完整' }
  return done(await call('orders', 'updateStatus', { orderId: str(orderId), status, reason: str(reason).slice(0, 60) }))
}

export async function saveSession(d: SessionDraft): Promise<Result> {
  const payload = {
    sessionId: d.id || '',
    date: str(d.date),
    depart_time: str(d.departTime),
    cutoff: str(d.cutoff),
    min_orders: num(d.minOrders),
    repeat_weekly: d.repeatWeekly === true,
    points: Array.isArray(d.points) ? d.points.map(str) : []
  }
  return done(await call('manage', d.id ? 'updateSession' : 'openSession', payload))
}

export async function forceSession(sessionId: string): Promise<Result> {
  return done(await call('manage', 'forceSession', { sessionId: str(sessionId) }))
}

export async function cancelSession(sessionId: string): Promise<Result> {
  return done(await call('manage', 'cancelSession', { sessionId: str(sessionId) }))
}

export async function saveItem(d: ItemDraft): Promise<Result<{ itemId: string }>> {
  const r = await call('manage', 'saveItem', {
    itemId: d.id || '',
    name: str(d.name).slice(0, 40),
    price: Number(d.price),
    unit: str(d.unit),
    description: str(d.description).slice(0, 500),
    specs: str(d.specs).slice(0, 500),
    category: str(d.category).slice(0, 12),
    available: d.available !== false
  })
  return r.ok ? { ok: true, itemId: str(r.data.itemId) } : fail(r)
}

// 换商品照片。浏览器已经压成 JPEG（见 components/shop/photo.ts），这里只认 JPEG 的 data URL；
// 审核、存云存储、删旧图都在云函数里。image 为 null 是去掉照片
const MAX_PHOTO_CHARS = 1_400_000   // 1MB 的图转成 base64 约 1.37M 字符，云函数那边也卡 1MB

export async function setItemPhoto(itemId: string, image: string | null): Promise<Result<{ imageUrl: string }>> {
  let payload: Raw = { itemId: str(itemId), remove: true }
  if (image !== null) {
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(image))
    if (!m || m[1].length > MAX_PHOTO_CHARS) return { ok: false, message: '图片格式不对，请换一张' }
    payload = { itemId: str(itemId), image: m[1] }
  }
  const r = await call('manage', 'setItemImage', payload)
  return r.ok ? { ok: true, imageUrl: str(r.data.image_url) } : fail(r)
}

export async function toggleItem(itemId: string, available: boolean): Promise<Result> {
  return done(await call('manage', 'toggleItem', { itemId: str(itemId), available: available === true }))
}

export async function deleteItem(itemId: string): Promise<Result> {
  return done(await call('manage', 'deleteItem', { itemId: str(itemId) }))
}

export async function setUseCategory(use: boolean): Promise<Result> {
  return done(await call('manage', 'setUseCategory', { use: use === true }))
}
