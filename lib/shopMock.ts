import 'server-only'
import type { CallResult, CloudFn } from './shopApi'
import { addDays, buildTimes } from './shopFormat'

// 本地开发用的演示小店（没配 SHOPMANAGE_URL / SHOPORDERS_URL 时由 shopApi 调用，线上不会走到这里）。
// 登录码随便输 8 位都能进；数据存在内存里，重启 dev server 就复原。

type Doc = Record<string, unknown> & { _id: string }

function chicagoNow() {
  const p: Record<string, string> = {}
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date()).forEach(x => { if (x.type !== 'literal') p[x.type] = x.value })
  return `${p.year}-${p.month}-${p.day} ${p.hour === '24' ? '00' : p.hour}:${p.minute}`
}

const today = chicagoNow().slice(0, 10)
const points = [
  { name: 'Fresh Thyme 30th Ave', fee: 0, eta_minutes: 20 },
  { name: 'Macalester College', fee: 2, eta_minutes: 45 }
]

const db: { sessions: Doc[]; items: Doc[]; orders: Doc[]; useCategory: boolean; seq: number } = {
  seq: 100,
  useCategory: true,
  sessions: [
    { _id: 's1', date: addDays(today, 1), depart_time: '17:00', cutoff: '22:00', min_orders: 10, repeat_weekly: true, forced: false, state: 'formed', points: [points[0]], ...buildTimesDoc(addDays(today, 1), '17:00', '22:00') },
    { _id: 's2', date: addDays(today, 4), depart_time: '17:30', cutoff: '21:00', min_orders: 8, repeat_weekly: false, forced: false, state: 'open', points, ...buildTimesDoc(addDays(today, 4), '17:30', '21:00') }
  ],
  items: [
    { _id: 'i1', name: '麻婆豆腐', price: 13.99, unit: '份', description: '微辣，配米饭', specs: '含花生油', category: '热菜', available: true, image: '' },
    { _id: 'i2', name: '水煮鱼', price: 18.5, unit: '份', description: '', specs: '', category: '热菜', available: true, image: '' },
    { _id: 'i3', name: '凉拌黄瓜', price: 6, unit: '', description: '', specs: '', category: '凉菜', available: false, image: '' },
    { _id: 'i4', name: '红糖糍粑', price: 7.5, unit: '份', description: '6 个', specs: '', category: '小吃', available: true, image: '' }
  ],
  orders: [
    order('o1abc1', 's1', 'confirming', '小王', 'wang@umn.edu', [['麻婆豆腐', 2, 13.99]], 27.98),
    order('o2abc2', 's1', 'confirming', 'Lily', 'lily@umn.edu', [['水煮鱼', 1, 18.5], ['红糖糍粑', 1, 7.5]], 26, '少放辣'),
    order('o3abc3', 's1', 'accepted', '阿杰', 'jie@umn.edu', [['麻婆豆腐', 1, 13.99]], 13.99),
    order('o4abc4', 's1', 'confirming', 'Max', 'max@macalester.edu', [['红糖糍粑', 2, 7.5]], 17, '', 'Macalester College'),
    order('o5abc5', 's2', 'forming', '小李', 'li@umn.edu', [['水煮鱼', 2, 18.5]], 37)
  ]
}

function buildTimesDoc(date: string, depart: string, cutoff: string) {
  const t = buildTimes(date, depart, cutoff)
  return { depart_at: t.departAt, cutoff_at: t.cutoffAt, confirm_at: t.confirmAt }
}

function order(id: string, session: string, status: string, nick: string, email: string, items: [string, number, number][], total: number, note = '', pickup = 'Fresh Thyme 30th Ave'): Doc {
  return {
    _id: id, session_id: session, status, buyer_nickname: nick, contact_email: email, contact_wechat: '', phone: '',
    pickup_info: pickup, address_unlisted: false, note, note_image_urls: [], total, cancel_reason: '',
    items: items.map(([name, count, price]) => ({ name, count, price, unit: '份' })),
    batch_date: session === 's1' ? addDays(today, 1) : addDays(today, 4),
    created_at: new Date(Date.now() - Math.random() * 86400000).toISOString()
  }
}

const TABS: Record<string, string[]> = {
  forming: ['forming'], pending: ['confirming', 'pending'], active: ['accepted', 'delivering'],
  done: ['completed', 'cancelled'], all: ['forming', 'confirming', 'pending', 'accepted', 'delivering', 'completed', 'cancelled']
}
const NEXT: Record<string, string[]> = {
  forming: ['cancelled'], confirming: ['accepted', 'cancelled'], pending: ['accepted', 'cancelled'],
  accepted: ['delivering', 'cancelled'], delivering: ['completed']
}

const ok = (data: Record<string, unknown> = {}): CallResult => ({ ok: true, data: { success: true, ...data } })
const no = (message: string): CallResult => ({ ok: false, message })

function counts(id: string) {
  const c = { total: 0, forming: 0, confirming: 0, confirmed: 0 }
  db.orders.filter(o => o.session_id === id && o.status !== 'cancelled').forEach(o => {
    c.total++
    if (o.status === 'forming') c.forming++
    else if (o.status === 'confirming') c.confirming++
    else c.confirmed++
  })
  return c
}

export async function mockCall(fn: CloudFn, action: string, p: Record<string, unknown>, token: string): Promise<CallResult> {
  await new Promise(r => setTimeout(r, 150))
  if (action === 'webLogin') return ok({ token: 'demo'.repeat(16), shopName: '演示小店' })
  if (!token) return { ok: false, message: '登录已失效，请重新登录', auth: true }
  const now = chicagoNow()

  switch (`${fn}.${action}`) {
    case 'manage.webLogout': return ok()
    case 'manage.getMine':
      return ok({ shop: { name: '演示小店', logo_url: '', takedown: false, needs_delivery: true, exact_address: false, pickup_points: points, use_category: db.useCategory } })
    case 'manage.sessions':
      return ok({ now, sessions: db.sessions.filter(s => s.state !== 'cancelled').map(s => ({ ...s, counts: counts(s._id) })) })
    case 'manage.sessionForm': {
      const s = p.sessionId ? db.sessions.find(x => x._id === p.sessionId) : null
      return ok({ now, points, exact_address: false, session: s || null, count: s ? counts(s._id).total : 0, others: [{ shop_name: '隔壁烧烤', depart_time: '18:00', points: [] }] })
    }
    case 'manage.openSession':
    case 'manage.updateSession': {
      const date = String(p.date || ''), depart = String(p.depart_time || ''), cutoff = String(p.cutoff || '')
      const fields = {
        date, depart_time: depart, cutoff, min_orders: Number(p.min_orders) || 0, repeat_weekly: p.repeat_weekly === true,
        points: points.filter(x => (p.points as string[] || []).includes(x.name)), ...buildTimesDoc(date, depart, cutoff)
      }
      if (fields.cutoff_at <= now) return no('截单时间已经过了，换一天')
      if (!fields.points.length) return no('至少选一个取货点')
      if (action === 'openSession') {
        if (db.sessions.some(s => s.date === date && s.state !== 'cancelled')) return no('这天已经开过团了')
        db.sessions.push({ _id: 's' + ++db.seq, state: 'open', forced: false, ...fields })
      } else {
        const s = db.sessions.find(x => x._id === p.sessionId)
        if (!s) return no('没有权限')
        if (s.state !== 'open') s.repeat_weekly = fields.repeat_weekly
        else if (counts(s._id).total) Object.assign(s, { min_orders: Math.min(Number(s.min_orders), fields.min_orders), repeat_weekly: fields.repeat_weekly })
        else Object.assign(s, fields)
      }
      return ok()
    }
    case 'manage.forceSession': {
      const s = db.sessions.find(x => x._id === p.sessionId && x.state === 'open')
      if (!s) return no('这一场已经截单了')
      s.forced = true
      return ok()
    }
    case 'manage.cancelSession': {
      const s = db.sessions.find(x => x._id === p.sessionId)
      if (!s) return no('没有权限')
      s.state = 'cancelled'
      db.orders.filter(o => o.session_id === s._id && ['forming', 'confirming', 'accepted'].includes(String(o.status)))
        .forEach(o => { o.status = 'cancelled'; o.cancel_reason = '店长取消了这一场' })
      return ok()
    }
    case 'manage.listItems':
      return ok({ items: db.items.map(i => ({ ...i, image_url: '' })), useCategory: db.useCategory })
    case 'manage.setUseCategory':
      db.useCategory = p.use === true
      return ok()
    case 'manage.saveItem': {
      if (!String(p.name || '').trim()) return no('请填写商品名称')
      if (String(p.name).includes('违规')) return no('文字可能包含违规内容，请修改后再保存')
      const data = {
        name: String(p.name).trim(), price: Number(p.price), unit: String(p.unit || ''), description: String(p.description || ''),
        specs: String(p.specs || ''), category: String(p.category || ''), available: p.available !== false
      }
      const it = p.itemId ? db.items.find(i => i._id === p.itemId) : null
      if (it) Object.assign(it, data)
      else db.items.push({ _id: 'i' + ++db.seq, image: '', ...data })
      return ok()
    }
    case 'manage.toggleItem': {
      const it = db.items.find(i => i._id === p.itemId)
      if (it) it.available = !!p.available
      return ok()
    }
    case 'manage.deleteItem':
      db.items = db.items.filter(i => i._id !== p.itemId)
      return ok()
    case 'orders.list': {
      const st = TABS[String(p.tab)] || TABS.pending
      return ok({ orders: db.orders.filter(o => st.includes(String(o.status)) && (!p.sessionId || o.session_id === p.sessionId)) })
    }
    case 'orders.updateStatus': {
      const o = db.orders.find(x => x._id === p.orderId)
      if (!o || !(NEXT[String(o.status)] || []).includes(String(p.status))) return no('这个订单已经不能改成该状态了')
      o.status = p.status
      if (p.status === 'cancelled') o.cancel_reason = String(p.reason || '店长取消')
      return ok()
    }
    default:
      return no('未知操作：' + action)
  }
}
