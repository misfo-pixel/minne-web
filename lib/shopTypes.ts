// 店长后台（/shop）在浏览器和服务器之间传的数据。只留页面用得到的字段，
// 云函数原样返回的记录在 app/shop/actions.ts 里先收窄成这些再给浏览器。

export type ShopPoint = { name: string; fee: number; eta_minutes: number }

export type ShopInfo = {
  name: string
  logoUrl: string
  takedown: boolean
  needsDelivery: boolean
  exactAddress: boolean
  points: ShopPoint[]
  useCategory: boolean
}

export type SessionState = 'open' | 'formed' | 'failed' | 'cancelled'

export type AdminSession = {
  id: string
  date: string            // 'YYYY-MM-DD'，明尼苏达当地日期
  departTime: string      // 'HH:MM'
  cutoff: string          // 截单几点（前一天）
  cutoffAt: string        // 'YYYY-MM-DD HH:MM'
  confirmAt: string
  departAt: string
  minOrders: number
  repeatWeekly: boolean
  forced: boolean
  state: SessionState
  points: string[]
  counts: { total: number; forming: number; confirming: number; confirmed: number }
}

export type OrderStatus = 'forming' | 'confirming' | 'pending' | 'accepted' | 'delivering' | 'completed' | 'cancelled'
export type OrderTab = 'forming' | 'pending' | 'active' | 'done' | 'all'

export type AdminOrder = {
  id: string
  shortId: string
  status: OrderStatus
  sessionId: string
  batchDate: string
  nickname: string
  email: string
  wechat: string
  phone: string
  pickup: string
  unlisted: boolean
  items: { name: string; count: number; price: number; unit: string }[]
  note: string
  noteImages: string[]
  total: number
  createdAt: string       // ISO
  cancelReason: string
}

export type AdminItem = {
  id: string
  name: string
  price: number
  unit: string
  description: string
  specs: string
  category: string
  available: boolean
  imageUrl: string
}

export type ItemDraft = Omit<AdminItem, 'id' | 'imageUrl'> & { id?: string; imageUrl?: string }

export type SessionDraft = {
  id?: string
  date: string
  departTime: string
  cutoff: string
  minOrders: number
  repeatWeekly: boolean
  points: string[]
}

export type SessionForm = {
  now: string
  points: ShopPoint[]
  exactAddress: boolean
  session: AdminSession | null
  count: number
  others: { shopName: string; departTime: string }[]
}

export type Dashboard = {
  shop: ShopInfo
  now: string
  sessions: AdminSession[]
  items: AdminItem[]
}

// 服务器动作统一的返回：auth 为 true 表示登录失效，页面回到输码那一步
export type Fail = { ok: false; message: string; auth?: boolean }
export type Result<T = object> = ({ ok: true } & T) | Fail
