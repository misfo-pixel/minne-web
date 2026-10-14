import type { Session } from './types'

// 和小程序 utils/group.js 的 progress 是同一套说法：门槛按单数算，对外说「再来 N 位」
// ——再来 N 个人各下一单就一定成团，这句话总成立。网页上没有「我」，所以不说「就差你了」。
export function progress(s: Session) {
  const min = Number(s.min_orders) || 0
  const count = Number(s.count) || 0
  if (!min) return { pct: 100, open: true, formed: true, text: '下单就送' }
  const gap = Math.max(0, min - count)
  return {
    pct: Math.min(100, Math.round((count / min) * 100)),
    open: false,
    formed: gap === 0,
    text: gap === 0 ? '已成团，还能上车' : `再来 ${gap} 位就开团`
  }
}

export function pointsText(s: Session): string {
  return s.points.map(p => `${p.name} ${p.arrive} 取`).join(' · ')
}
