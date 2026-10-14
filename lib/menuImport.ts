import 'server-only'

// 调云函数 menuImport 的网页端那几个动作（check / useParse / submit），只在服务器上调。
// 和 webFeed 用同一把 x-web-key；地址是 HTTP 访问服务里给 menuImport 配的路径。

const URL_ = process.env.MENUIMPORT_URL
const KEY = process.env.WEBFEED_KEY || ''

export type ImportResult = { ok: true; data: Record<string, unknown> } | { ok: false; message: string }

export async function callImport(action: string, payload: Record<string, unknown>): Promise<ImportResult> {
  if (!URL_) {
    // 本地开发没配地址：码随便填，假装成功，方便看页面
    if (process.env.NODE_ENV !== 'production') {
      const count = Array.isArray(payload.items) ? payload.items.length : 0
      return { ok: true, data: { shopName: '演示小店', parsesLeft: 5, count } }
    }
    return { ok: false, message: '导入服务还没配置好' }
  }
  try {
    const res = await fetch(URL_, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-web-key': KEY },
      body: JSON.stringify({ action, ...payload }),
      cache: 'no-store'
    })
    const data = await res.json()
    if (!res.ok || !data.success) return { ok: false, message: data.message || '服务出错了' }
    return { ok: true, data }
  } catch {
    return { ok: false, message: '连不上导入服务，请稍后重试' }
  }
}
