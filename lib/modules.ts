import type { Post, PostType } from './types'

// 四个帖子板块的差异全在这张表里，和小程序 utils/kinds.js 是同一个思路：
// 列表页、详情页都是通用的，加板块或改文案只动这里。

export type Tab = { key: string; label: string; empty: string; closed: string }

export type Module = {
  type: PostType
  path: string
  icon: string
  tint: 'gold' | 'maroon' | 'cream' | 'plain'
  title: string
  sub: string
  unit: string                // 首页入口格上「N 条」的量词
  tabs: Tab[] | null
  searchable: boolean
  cta: string                 // 详情页底部按钮
}

export const MODULES: Record<PostType, Module> = {
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

export const MODULE_LIST = Object.values(MODULES)

// 和小程序 kinds.js 一致：早期帖子没有 kind，都是「供」那一面
export function tabOf(mod: Module, kind?: string): Tab | null {
  if (!mod.tabs) return null
  return mod.tabs.find(t => t.key === kind) || mod.tabs[0]
}

const CLOSED = ['sold', 'rented', 'done', 'expired']

export function closedLabel(mod: Module, post: Post): string {
  if (!post.status || CLOSED.indexOf(post.status) === -1) return ''
  if (post.status === 'expired') return '已过期'
  const tab = tabOf(mod, post.kind)
  return tab ? tab.closed : '已完成'
}

export function rentText(p: Post): string {
  if (p.rent_min == null || p.rent_max == null) return String(p.rent ?? '')
  if (p.rent_min === p.rent_max) return String(p.rent_min)
  return `${p.rent_min}-${p.rent_max}`
}

// 卡片右上角的那个数
export function headline(type: PostType, p: Post): string {
  if (type === 'item') return p.price != null ? `$${p.price}` : ''
  if (type === 'sublet') return `${p.kind === 'seek' ? '预算 ' : ''}$${rentText(p)}/月`
  if (type === 'task') return p.reward != null ? `$${p.reward}` : ''
  return ''
}

// 卡片底部的小字：只放能区分条目的信息
export function chips(type: PostType, p: Post): string[] {
  const out: string[] = []
  if (type === 'item' && p.pickup_spot) out.push(p.pickup_spot)
  if (type === 'sublet') {
    if (p.room_type) out.push(p.room_type)
    if (p.address) out.push(p.address)
    if (p.start_date) out.push(`${shortDate(p.start_date)} 起`)
  }
  if (type === 'task' && p.deadline) out.push(`${shortDate(p.deadline)} 截止`)
  if (type === 'group') {
    if (p.event_date) out.push(shortDate(p.event_date))
    if (p.location) out.push(p.location)
  }
  return out
}

// 详情页「左标签右值」的几行
export function rows(type: PostType, p: Post): [string, string][] {
  const r: [string, string | undefined | false][] = []
  if (type === 'item') {
    r.push([p.kind === 'want' ? '预算' : '价格', p.price != null && `$${p.price}`])
    r.push(['取货地点', p.pickup_spot])
  }
  if (type === 'sublet') {
    r.push([p.kind === 'seek' ? '预算' : '月租', `$${rentText(p)}/月`])
    r.push(['户型', p.room_type])
    r.push([p.kind === 'seek' ? '想找的区域' : '地址', p.address])
    r.push(['租期', p.start_date && `${longDate(p.start_date)}${p.end_date ? ' 至 ' + longDate(p.end_date) : ' 起'}`])
    r.push(['押金', p.deposit != null && `$${p.deposit}`])
    r.push(['水电网', p.utilities != null && `约 $${p.utilities}/月`])
    r.push(['家具', p.furnished === true ? '带家具' : p.furnished === false && p.kind !== 'seek' ? '不带家具' : false])
    r.push(['室友', p.roommate_info])
  }
  if (type === 'task') {
    r.push(['报酬', p.reward != null && `$${p.reward}`])
    r.push(['截止', p.deadline && longDate(p.deadline)])
    r.push(['地点', p.location])
  }
  if (type === 'group') {
    r.push(['日期', p.event_date && longDate(p.event_date)])
    r.push(['地点', p.location])
  }
  return r.filter((x): x is [string, string] => !!x[1])
}

const WEEK = ['日', '一', '二', '三', '四', '五', '六']

// 'YYYY-MM-DD' → '10月18日'。按字符串拆，不经过 Date，免得时区把日期挪一天
export function shortDate(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (!m) return s
  return `${Number(m[2])}月${Number(m[3])}日`
}

export function longDate(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (!m) return s
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return `${shortDate(s)} 周${WEEK[d.getUTCDay()]}`
}

// 拼团的截单时刻 'YYYY-MM-DD HH:MM'
export function cutoffText(s: string): string {
  const [date, time] = s.split(' ')
  return `${longDate(date)} ${time || ''}`.trim()
}
