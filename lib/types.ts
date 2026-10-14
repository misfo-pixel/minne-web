// webFeed 云函数（campus-helper/cloudfunctions/webFeed）返回的形状。
// 字段是那边白名单挑出来的，这里不会有联系方式。

export type PostType = 'item' | 'sublet' | 'task' | 'group'

export type Post = {
  _id: string
  title: string
  description?: string
  kind?: string
  status?: string
  thumb?: string
  images?: string[]
  created_at?: string
  // 二手
  price?: number
  pickup_spot?: string
  expire_date?: string
  // 转租
  rent?: number
  rent_min?: number
  rent_max?: number
  address?: string
  room_type?: string
  start_date?: string
  end_date?: string
  deposit?: number
  furnished?: boolean
  utilities?: number | null
  roommate_info?: string
  // 委托
  reward?: number
  deadline?: string
  // 委托、群组
  location?: string
  event_date?: string
}

export type Point = { name: string; fee: number; arrive: string }

export type Session = {
  _id?: string
  shop_id?: string
  shop_name?: string
  logo?: string
  slogan?: string
  date: string
  depart_time: string
  cutoff_at: string
  min_orders: number
  count: number
  points: Point[]
}

export type ShopBrief = { _id: string; name: string; logo?: string; description?: string }

export type ShopItem = {
  _id: string
  name: string
  price: number
  unit?: string
  description?: string
  specs?: string
  image?: string
  category?: string
  available: boolean
  sold: number
}

export type HomeData = { counts: Record<PostType, number>; latest: Post[] }
export type ListData = { items: Post[]; noMore: boolean }
export type ShopsData = { now: string; sessions: Session[]; shops: ShopBrief[] }
export type ShopData = {
  now: string
  shop: { _id: string; name: string; logo?: string; description?: string; slogan?: string; min_order?: number }
  items: ShopItem[]
  sessions: Session[]
}
