// 店长后台的时间换算。场次时间一律是云函数给的明尼苏达当地时间（'YYYY-MM-DD HH:MM' 字符串），
// 按字符串比大小、当成 UTC 做加减，和小程序 utils/group.js、云函数 shopManage 是同一套算法。

export const CALENDAR_DAYS = 14   // 开团只能开两周内，和 shopManage 一致

function pad(n: number) {
  return n < 10 ? '0' + n : '' + n
}

export function addDays(date: string, n: number): string {
  const d = new Date(date + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate())
}

export function shiftAt(at: string, minutes: number): string {
  const d = new Date(at.replace(' ', 'T') + ':00Z')
  d.setUTCMinutes(d.getUTCMinutes() + minutes)
  return d.toISOString().slice(0, 16).replace('T', ' ')
}

// 截单固定在出发前一天；确认截止：截单后 12 小时，最晚出发前 1 小时。只用来显示，存的时候以云函数为准
export function buildTimes(date: string, departTime: string, cutoff: string) {
  const departAt = date + ' ' + departTime
  const cutoffAt = shiftAt(date + ' ' + cutoff, -24 * 60)
  const a = shiftAt(cutoffAt, 12 * 60)
  const b = shiftAt(departAt, -60)
  return { departAt, cutoffAt, confirmAt: a < b ? a : b }
}

const WEEK_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function weekday(date: string, lang: 'zh' | 'en'): string {
  const d = new Date(date + 'T12:00:00Z')
  if (isNaN(d.getTime())) return ''
  return (lang === 'en' ? WEEK_EN : WEEK_ZH)[d.getUTCDay()]
}

// '2026-10-16' → '10/16'
export function md(date: string): string {
  const m = /^\d{4}-(\d{2})-(\d{2})/.exec(date || '')
  return m ? Number(m[1]) + '/' + Number(m[2]) : ''
}

// '2026-10-16 22:00' → '周五 10/16 22:00'
export function atText(at: string, lang: 'zh' | 'en'): string {
  if (!at) return ''
  return weekday(at.slice(0, 10), lang) + ' ' + md(at) + ' ' + at.slice(11, 16)
}

// 下单时间（ISO）按明尼苏达时间显示
export function localTime(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const parts: Record<string, string> = {}
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(d).forEach(p => { if (p.type !== 'literal') parts[p.type] = p.value })
  return Number(parts.month) + '/' + Number(parts.day) + ' ' + (parts.hour === '24' ? '00' : parts.hour) + ':' + parts.minute
}

export function money(n: number): string {
  return '$' + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(/\.00$/, '')
}
