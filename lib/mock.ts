// 本地开发用的假数据（没配 WEBFEED_URL 时 lib/feed.ts 用它）。线上不会走到这里。

import type { Post, Session, ShopBrief, ShopItem } from './types'

function pic(label: string, bg: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${bg}"/>` +
    `<text x="200" y="230" font-size="64" text-anchor="middle" fill="#22141a" font-family="sans-serif">${label}</text></svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

const now = Date.now()
const ago = (h: number) => new Date(now - h * 3600e3).toISOString()

const items: Post[] = [
  { _id: 'i1', kind: 'sell', title: 'IKEA 落地灯，九成新', price: 15, thumb: pic('台灯', '#fff4d1'), pickup_spot: 'Comstock Hall', description: '搬家出，灯泡是暖光的，自取。', created_at: ago(2) },
  { _id: 'i2', kind: 'sell', title: 'Calculus 教材 第 9 版', price: 25, thumb: pic('教材', '#f6e3e6'), pickup_spot: 'Walter Library', description: 'MATH 1271 用的，有少量笔记。', created_at: ago(5) },
  { _id: 'i3', kind: 'sell', title: '电饭煲 3L 象印', price: 40, thumb: pic('电饭煲', '#fbf0dc'), description: '用了一年，内胆无划痕。', created_at: ago(9) },
  { _id: 'i4', kind: 'sell', title: '冬天的羽绒服 M 码', price: 60, thumb: pic('羽绒服', '#e8eef6'), pickup_spot: 'Dinkytown', description: '明州过冬够用，只穿过一季。', created_at: ago(20) },
  { _id: 'i5', kind: 'sell', title: '显示器 27 寸 4K', price: 120, thumb: pic('显示器', '#eaf3e6'), description: '带 HDMI 线，可以当面试。', created_at: ago(30) },
  { _id: 'i6', kind: 'want', title: '收一个二手自行车', price: 80, description: '能骑就行，最好带锁。', created_at: ago(4) }
]

const sublets: Post[] = [
  { _id: 's1', kind: 'offer', title: 'The Bridges 单间转租 1-5 月', rent: 950, address: 'The Bridges', room_type: '4B4B', start_date: '2027-01-01', end_date: '2027-05-31', thumb: pic('房间', '#fbf0dc'), furnished: true, utilities: 40, deposit: 500, roommate_info: '三位室友都是中国女生，作息规律', description: '寒假回国前出，家具全留。', created_at: ago(3) },
  { _id: 's2', kind: 'seek', title: '求一个 Dinkytown 附近的单间', rent_min: 700, rent_max: 1000, address: 'Dinkytown', room_type: 'Studio', description: '春季学期入住，男生，不抽烟。', created_at: ago(8) }
]

const tasks: Post[] = [
  { _id: 't1', title: '周六帮忙从 United Noodles 带一箱泡面', reward: 10, deadline: '2026-10-18', location: 'Coffman Union', description: '有车顺路的同学帮带一下，箱子不重。', created_at: ago(6) }
]

const groups: Post[] = [
  { _id: 'g1', kind: 'buddy', title: '周日去 Minnehaha Falls 拍秋景', event_date: '2026-10-19', location: 'Minnehaha Falls', thumb: pic('秋景', '#fde3c8'), description: '还差两个人凑一车，会拍照的优先。', created_at: ago(1) },
  { _id: 'g2', kind: 'club', title: 'Free Food 俱乐部', description: '每周分享校园里的免费吃的，群里通知。', created_at: ago(40) }
]

const sessions: Session[] = [
  { _id: 'ss1', shop_id: 'sh1', shop_name: '小王甜品', logo: pic('甜', '#FFCC33'), slogan: '周末的一口甜', date: '2026-10-18', depart_time: '17:30', cutoff_at: '2026-10-17 22:00', min_orders: 10, count: 7, points: [{ name: 'Coffman Union', fee: 2, arrive: '18:00' }, { name: 'Pioneer Hall', fee: 2, arrive: '18:10' }] },
  { _id: 'ss2', shop_id: 'sh2', shop_name: '蔬菜大拼盘', logo: pic('菜', '#c9e4b8'), slogan: '亚超直送，免开车', date: '2026-10-19', depart_time: '16:00', cutoff_at: '2026-10-18 22:00', min_orders: 8, count: 9, points: [{ name: 'Comstock Hall', fee: 3, arrive: '16:30' }] }
]

const idleShops: ShopBrief[] = [
  { _id: 'sh3', name: '阿姨家的饺子', logo: pic('饺', '#fbf0dc'), description: '手工包，冷冻带回家。' }
]

const shopItems: ShopItem[] = [
  { _id: 'p1', name: '葡式蛋挞', price: 3.5, unit: '个', image: pic('蛋挞', '#fff4d1'), available: true, sold: 42, description: '现烤，外皮酥。' },
  { _id: 'p2', name: '抹茶千层', price: 6, unit: '块', image: pic('千层', '#eaf3e6'), available: true, sold: 18 },
  { _id: 'p3', name: '芋泥麻薯', price: 4, unit: '个', available: false, sold: 25, description: '这周卖完了' }
]

const TABLE = { item: items, sublet: sublets, task: tasks, group: groups } as const

export function mockFeed(p: Record<string, string | number | undefined>) {
  if (p.action === 'home') {
    return {
      success: true,
      counts: { item: items.filter(i => i.kind === 'sell').length, sublet: sublets.length, task: tasks.length, group: groups.length },
      latest: items.filter(i => i.kind === 'sell')
    }
  }
  if (p.action === 'list') {
    const all = TABLE[p.type as keyof typeof TABLE] || []
    const kinds = { item: 'sell', sublet: 'offer', group: 'buddy' } as Record<string, string>
    const kind = (p.kind as string) || kinds[p.type as string]
    const q = String(p.q || '').toLowerCase()
    return {
      success: true,
      noMore: true,
      items: all.filter(i => (!i.kind || i.kind === kind) && (!q || i.title.toLowerCase().includes(q)))
    }
  }
  if (p.action === 'detail') {
    const all: Post[] = [...(TABLE[p.type as keyof typeof TABLE] || [])]
    const hit = all.find(i => i._id === p.id)
    if (!hit) return null
    return { success: true, item: { ...hit, status: 'on_sale', images: hit.thumb ? [hit.thumb, hit.thumb] : [] } }
  }
  if (p.action === 'shops') return { success: true, now: '2026-10-13 10:00', sessions, shops: idleShops }
  if (p.action === 'shop') {
    const s = sessions.find(x => x.shop_id === p.id)
    const idle = idleShops.find(x => x._id === p.id)
    if (!s && !idle) return null
    return {
      success: true,
      now: '2026-10-13 10:00',
      shop: s
        ? { _id: s.shop_id!, name: s.shop_name!, logo: s.logo, slogan: s.slogan, description: '家里烤的，每周末开一场。蛋挞当天早上现烤。' }
        : idle,
      items: shopItems,
      sessions: s ? [s] : []
    }
  }
  return null
}
