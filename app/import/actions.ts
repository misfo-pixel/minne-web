'use server'

import { callImport } from '@/lib/menuImport'
import { fetchMenuPage, parseMenu, type ParsedItem } from '@/lib/menuParse'

// 导入页的三个服务器动作。每一步都重新拿导入码去云函数核对，
// 不信任页面上的状态：码是唯一的凭据，AI 调用次数也记在码上（useParse），
// 没有有效的码就调不了 AI，别人拿这个页面也刷不了额度。

function normCode(c: unknown) {
  return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
}

export async function checkCode(code: string) {
  const c = normCode(code)
  if (c.length !== 6) return { ok: false as const, message: '导入码是 6 位' }
  const r = await callImport('check', { code: c })
  if (!r.ok) return { ok: false as const, message: r.message }
  return { ok: true as const, code: c, shopName: String(r.data.shopName || ''), parsesLeft: Number(r.data.parsesLeft) || 0 }
}

const MAX_IMAGES = 4
const MAX_IMAGE_CHARS = 1_500_000   // 前端压过之后一张远小于这个；兜底防直接往接口塞大图

export async function parse(code: string, input: { url?: string; text?: string; images?: string[] }) {
  const c = normCode(code)
  let text = (input.text || '').trim()
  const images = (input.images || [])
    .filter(s => typeof s === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(s) && s.length < MAX_IMAGE_CHARS)
    .slice(0, MAX_IMAGES)

  // 先把网页读下来，读不到就不占用一次 AI 次数
  if (input.url) {
    const page = await fetchMenuPage(input.url)
    if ('error' in page) return { ok: false as const, message: page.error }
    text = page.text
  }
  if (!text && !images.length) return { ok: false as const, message: '请先贴链接、文字或选照片' }

  const quota = await callImport('useParse', { code: c })
  if (!quota.ok) return { ok: false as const, message: quota.message }

  const r = await parseMenu({ text, images })
  if ('error' in r) return { ok: false as const, message: r.error }
  return { ok: true as const, items: r.items }
}

export async function submit(code: string, items: ParsedItem[]) {
  const r = await callImport('submit', { code: normCode(code), items: Array.isArray(items) ? items.slice(0, 150) : [] })
  if (!r.ok) return { ok: false as const, message: r.message }
  return { ok: true as const, count: Number(r.data.count) || 0 }
}
