import 'server-only'

// 把各种样子的菜单（网页文字、复制来的文字、拍的照片）整理成商品表。
// 菜单格式五花八门：有的是官网纯文字，有的是 PDF/图片，小店常常只有纸质菜单，
// 给每个网站写抓取规则不现实，交给模型读，再由商家逐件核对。
//
// 用 OpenAI Responses API + JSON Schema 严格模式，返回的结构一定对得上；
// 模型名放环境变量 OPENAI_MODEL，换模型不用改代码。

export type ParsedItem = {
  name: string
  price: number | null
  unit: string
  description: string
  category: string
  restricted: boolean
}

const MODEL = process.env.OPENAI_MODEL || 'gpt-6-luna'
const MAX_TEXT = 40000        // 一份菜单网页去掉标签后很少超过这个数
const MAX_PAGE_BYTES = 3 * 1024 * 1024

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'price', 'unit', 'description', 'category', 'restricted'],
        properties: {
          name: { type: 'string' },
          price: { type: ['number', 'null'] },
          unit: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          restricted: { type: 'boolean' }
        }
      }
    }
  }
}

const INSTRUCTIONS = `You turn a restaurant or shop menu into a product list for a group-buy app.
Rules:
- One entry per orderable item. Keep the name exactly as on the menu; if both Chinese and English names appear, use "中文名 English name". Max 40 characters.
- price: the number in USD without "$". If an item has several sizes or prices, create one entry per size and put the size in unit (e.g. "small", "large", "lb"). If no price is shown, use null.
- unit: short, max 6 characters, or "" if none.
- description: the menu's own description, max 120 characters, or "". Never invent descriptions.
- category: the menu section heading as written (e.g. "Appetizers", "凉菜"), max 12 characters, or "".
- restricted: true for alcoholic drinks (beer, wine, sake, cocktails, liquor), tobacco, vape or cannabis products. Otherwise false. Keep restricted items in the list so the seller can see they were skipped.
- Skip things that are not items: hours, addresses, allergy notices, "market price" headers, combo rules.
- Output at most 150 items, in menu order.`

// 只抓公开网页，别让人拿它探内网
function safeUrl(raw: string): URL | null {
  try {
    const u = new URL(raw.trim())
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    const h = u.hostname
    if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || /^(\d+\.){3}\d+$/.test(h) || h.includes(':')) return null
    return u
  } catch {
    return null
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|tr|h\d|section)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#36;|&dollar;/g, '$').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim()
}

export async function fetchMenuPage(raw: string): Promise<{ text: string } | { error: string }> {
  const u = safeUrl(raw)
  if (!u) return { error: '链接格式不对' }
  // Toast、DoorDash 这类平台的条款不允许抓取，页面也是脚本渲染的，读不到菜单
  if (/toasttab\.com|doordash\.com|order\.online|grubhub\.com|ubereats\.com/i.test(u.hostname)) {
    return { error: '外卖平台的页面读不了，请打开商家自己的菜单页，或者复制菜单文字、拍照上传' }
  }
  try {
    const res = await fetch(u, {
      headers: { 'User-Agent': 'Mozilla/5.0 (MinnePal menu import; +https://minnepal.com)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
      cache: 'no-store'
    })
    if (!res.ok) return { error: `打不开这个网页（${res.status}）` }
    const type = res.headers.get('content-type') || ''
    if (!type.includes('text/html') && !type.includes('text/plain')) return { error: '这个链接不是网页，PDF 或图片请截图后用「拍照」上传' }
    const buf = await res.arrayBuffer()
    if (buf.byteLength > MAX_PAGE_BYTES) return { error: '网页太大了，请复制菜单文字粘贴进来' }
    const text = htmlToText(new TextDecoder().decode(buf)).slice(0, MAX_TEXT)
    if (!/\d/.test(text) || text.length < 80) return { error: '这个网页上读不到菜单内容，请复制文字或拍照上传' }
    return { text }
  } catch {
    return { error: '打不开这个网页，请复制菜单文字或拍照上传' }
  }
}

const DEMO: ParsedItem[] = [
  { name: '口水鸡 Mouth-Watering Chicken', price: 14, unit: '', description: 'Poached chicken in chili oil', category: '凉菜', restricted: false },
  { name: '水煮鱼 Boiled Fish', price: 26, unit: '', description: 'Fish fillet in spicy broth', category: '热菜', restricted: false },
  { name: '担担面 Dan Dan Noodles', price: null, unit: '', description: '', category: '面食', restricted: false },
  { name: 'Tsingtao', price: 9, unit: '', description: 'Light lager', category: 'Beer', restricted: true }
]

type Content = { type: 'input_text'; text: string } | { type: 'input_image'; image_url: string }

export async function parseMenu(input: { text?: string; images?: string[] }): Promise<{ items: ParsedItem[] } | { error: string }> {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    // 本地开发没配密钥：给几条假数据，方便看表格页面
    if (process.env.NODE_ENV !== 'production') return { items: DEMO }
    return { error: 'AI 服务还没配置好' }
  }

  const content: Content[] = []
  if (input.text) content.push({ type: 'input_text', text: 'Menu:\n' + input.text.slice(0, MAX_TEXT) })
  ;(input.images || []).forEach(url => content.push({ type: 'input_image', image_url: url }))
  if (!content.length) return { error: '没有收到菜单内容' }

  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        instructions: INSTRUCTIONS,
        input: [{ role: 'user', content }],
        text: { format: { type: 'json_schema', name: 'menu', strict: true, schema: SCHEMA } }
      }),
      signal: AbortSignal.timeout(90000),
      cache: 'no-store'
    })
    const data = await res.json()
    if (!res.ok) {
      console.error('OpenAI 出错：', res.status, data?.error?.message)
      return { error: 'AI 整理失败，请稍后重试' }
    }
    // Responses API 的输出在 output[].content[] 里，type 为 output_text 的那段是我们要的 JSON
    const text: string = (data.output || [])
      .flatMap((o: { content?: { type: string; text?: string }[] }) => o.content || [])
      .filter((c: { type: string }) => c.type === 'output_text')
      .map((c: { text?: string }) => c.text || '')
      .join('')
    const parsed = JSON.parse(text) as { items: ParsedItem[] }
    const items = (parsed.items || []).filter(i => i && i.name).slice(0, 150)
    if (!items.length) return { error: '没认出菜品，换一张更清楚的照片或直接贴文字试试' }
    return { items }
  } catch (e) {
    console.error('解析菜单失败：', e)
    return { error: 'AI 整理超时或失败，请重试；菜单很长的话可以分几次' }
  }
}
