import type { Post, PostType } from './types'
import type { Lang } from './i18n'

// 四个帖子板块的差异全在这张表里，和小程序 utils/kinds.js 是同一个思路：
// 列表页、详情页都是通用的，加板块或改文案只动这里。中英文案都在这里。

export type Tab = { key: string; label: string; empty: string; closed: string }

export type Module = {
  type: PostType
  path: string                // 不带语言前缀，链接时用 lp(lang, path)
  icon: string
  tint: 'gold' | 'maroon' | 'cream' | 'plain'
  title: string
  sub: string
  unit: string                // 首页入口格上「N 条」的量词
  tabs: Tab[] | null
  searchable: boolean
  cta: string                 // 详情页底部按钮
}

const ZH: Record<PostType, Module> = {
  item: {
    type: 'item', path: '/market', icon: 'market', tint: 'gold',
    title: '二手市场', sub: '低价淘，轻松出', unit: '件在售', searchable: true, cta: '去小程序联系卖家',
    tabs: [
      { key: 'sell', label: '出售', empty: '还没有商品', closed: '已售出' },
      { key: 'want', label: '求购', empty: '还没有人发求购', closed: '已结束' }
    ]
  },
  sublet: {
    type: 'sublet', path: '/sublet', icon: 'sublet', tint: 'plain',
    title: '公寓转租', sub: '找房、转租、找室友', unit: '条房源', searchable: false, cta: '去小程序联系房主',
    tabs: [
      { key: 'offer', label: '转租', empty: '还没有房源', closed: '已租出' },
      { key: 'seek', label: '求租', empty: '还没有人发求租', closed: '已结束' }
    ]
  },
  task: {
    type: 'task', path: '/tasks', icon: 'task', tint: 'maroon',
    title: '任务委托', sub: '代取、代购、跑腿', unit: '个委托', searchable: false, cta: '去小程序接单',
    tabs: null
  },
  group: {
    type: 'group', path: '/groups', icon: 'group', tint: 'plain',
    title: '兴趣群组', sub: '找搭子、组乐队', unit: '个群组', searchable: false, cta: '去小程序加入',
    tabs: [
      { key: 'buddy', label: '找搭子', empty: '还没有人找搭子', closed: '已凑齐' },
      { key: 'club', label: '长期群', empty: '还没有长期群', closed: '已停止招新' }
    ]
  }
}

const EN: Record<PostType, Module> = {
  item: {
    type: 'item', path: '/market', icon: 'market', tint: 'gold',
    title: 'Marketplace', sub: 'Buy cheap, sell easy', unit: 'for sale', searchable: true, cta: 'Contact seller in the mini program',
    tabs: [
      { key: 'sell', label: 'For sale', empty: 'No items yet', closed: 'Sold' },
      { key: 'want', label: 'Wanted', empty: 'No wanted posts yet', closed: 'Closed' }
    ]
  },
  sublet: {
    type: 'sublet', path: '/sublet', icon: 'sublet', tint: 'plain',
    title: 'Sublets', sub: 'Rooms, sublets, roommates', unit: 'listings', searchable: false, cta: 'Contact owner in the mini program',
    tabs: [
      { key: 'offer', label: 'Offering', empty: 'No listings yet', closed: 'Rented' },
      { key: 'seek', label: 'Looking', empty: 'No one is looking yet', closed: 'Closed' }
    ]
  },
  task: {
    type: 'task', path: '/tasks', icon: 'task', tint: 'maroon',
    title: 'Errands', sub: 'Pickups, shopping, favors', unit: 'errands', searchable: false, cta: 'Take it in the mini program',
    tabs: null
  },
  group: {
    type: 'group', path: '/groups', icon: 'group', tint: 'plain',
    title: 'Groups', sub: 'Find buddies, start a band', unit: 'groups', searchable: false, cta: 'Join in the mini program',
    tabs: [
      { key: 'buddy', label: 'Buddies', empty: 'No buddy posts yet', closed: 'Full' },
      { key: 'club', label: 'Clubs', empty: 'No clubs yet', closed: 'Not recruiting' }
    ]
  }
}

export function modules(lang: Lang = 'zh'): Record<PostType, Module> {
  return lang === 'en' ? EN : ZH
}
export function moduleList(lang: Lang = 'zh'): Module[] {
  return Object.values(modules(lang))
}

export const MODULES = ZH
export const MODULE_LIST = Object.values(ZH)

// 和小程序 kinds.js 一致：早期帖子没有 kind，都是「供」那一面
export function tabOf(mod: Module, kind?: string): Tab | null {
  if (!mod.tabs) return null
  return mod.tabs.find(t => t.key === kind) || mod.tabs[0]
}

const CLOSED = ['sold', 'rented', 'done', 'expired']

export function closedLabel(mod: Module, post: Post, lang: Lang = 'zh'): string {
  if (!post.status || CLOSED.indexOf(post.status) === -1) return ''
  if (post.status === 'expired') return lang === 'en' ? 'Expired' : '已过期'
  const tab = tabOf(mod, post.kind)
  return tab ? tab.closed : lang === 'en' ? 'Done' : '已完成'
}

export function rentText(p: Post): string {
  if (p.rent_min == null || p.rent_max == null) return String(p.rent ?? '')
  if (p.rent_min === p.rent_max) return String(p.rent_min)
  return `${p.rent_min}-${p.rent_max}`
}

// 卡片右上角的那个数
export function headline(type: PostType, p: Post, lang: Lang = 'zh'): string {
  const en = lang === 'en'
  if (type === 'item') return p.price != null ? `$${p.price}` : ''
  if (type === 'sublet') {
    return en ? `${p.kind === 'seek' ? 'Budget ' : ''}$${rentText(p)}/mo` : `${p.kind === 'seek' ? '预算 ' : ''}$${rentText(p)}/月`
  }
  if (type === 'task') return p.reward != null ? `$${p.reward}` : ''
  return ''
}

// 卡片底部的小字：只放能区分条目的信息
export function chips(type: PostType, p: Post, lang: Lang = 'zh'): string[] {
  const en = lang === 'en'
  const out: string[] = []
  if (type === 'item' && p.pickup_spot) out.push(p.pickup_spot)
  if (type === 'sublet') {
    if (p.room_type) out.push(p.room_type)
    if (p.address) out.push(p.address)
    if (p.start_date) out.push(en ? `From ${shortDate(p.start_date, lang)}` : `${shortDate(p.start_date)} 起`)
  }
  if (type === 'task' && p.deadline) out.push(en ? `Due ${shortDate(p.deadline, lang)}` : `${shortDate(p.deadline)} 截止`)
  if (type === 'group') {
    if (p.event_date) out.push(shortDate(p.event_date, lang))
    if (p.location) out.push(p.location)
  }
  return out
}

// 详情页「左标签右值」的几行
export function rows(type: PostType, p: Post, lang: Lang = 'zh'): [string, string][] {
  const en = lang === 'en'
  const L = (zh: string, e: string) => (en ? e : zh)
  const r: [string, string | undefined | false][] = []
  if (type === 'item') {
    r.push([p.kind === 'want' ? L('预算', 'Budget') : L('价格', 'Price'), p.price != null && `$${p.price}`])
    r.push([L('取货地点', 'Pickup'), p.pickup_spot])
  }
  if (type === 'sublet') {
    r.push([p.kind === 'seek' ? L('预算', 'Budget') : L('月租', 'Rent'), `$${rentText(p)}${L('/月', '/mo')}`])
    r.push([L('户型', 'Layout'), p.room_type])
    r.push([p.kind === 'seek' ? L('想找的区域', 'Preferred area') : L('地址', 'Address'), p.address])
    r.push([L('租期', 'Lease'), p.start_date && `${longDate(p.start_date, lang)}${p.end_date ? L(' 至 ', ' to ') + longDate(p.end_date, lang) : L(' 起', ' onward')}`])
    r.push([L('押金', 'Deposit'), p.deposit != null && `$${p.deposit}`])
    r.push([L('水电网', 'Utilities'), p.utilities != null && L(`约 $${p.utilities}/月`, `~$${p.utilities}/mo`)])
    r.push([L('家具', 'Furniture'), p.furnished === true ? L('带家具', 'Furnished') : p.furnished === false && p.kind !== 'seek' ? L('不带家具', 'Unfurnished') : false])
    r.push([L('室友', 'Roommates'), p.roommate_info])
  }
  if (type === 'task') {
    r.push([L('报酬', 'Reward'), p.reward != null && `$${p.reward}`])
    r.push([L('截止', 'Due'), p.deadline && longDate(p.deadline, lang)])
    r.push([L('地点', 'Location'), p.location])
  }
  if (type === 'group') {
    r.push([L('日期', 'Date'), p.event_date && longDate(p.event_date, lang)])
    r.push([L('地点', 'Location'), p.location])
  }
  return r.filter((x): x is [string, string] => !!x[1])
}

const WEEK = ['日', '一', '二', '三', '四', '五', '六']
const WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// 'YYYY-MM-DD' → '10月18日' / 'Oct 18'。按字符串拆，不经过 Date，免得时区把日期挪一天
export function shortDate(s: string, lang: Lang = 'zh'): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (!m) return s
  if (lang === 'en') return `${MONTH_EN[Number(m[2]) - 1]} ${Number(m[3])}`
  return `${Number(m[2])}月${Number(m[3])}日`
}

export function longDate(s: string, lang: Lang = 'zh'): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (!m) return s
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  if (lang === 'en') return `${WEEK_EN[d.getUTCDay()]}, ${shortDate(s, lang)}`
  return `${shortDate(s)} 周${WEEK[d.getUTCDay()]}`
}

// 拼团的截单时刻 'YYYY-MM-DD HH:MM'
export function cutoffText(s: string, lang: Lang = 'zh'): string {
  const [date, time] = s.split(' ')
  return `${longDate(date, lang)} ${time || ''}`.trim()
}
