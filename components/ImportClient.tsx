'use client'

import { useState, useTransition } from 'react'
import { checkCode, parse, submit } from '@/app/import/actions'
import type { ParsedItem } from '@/lib/menuParse'

// 导入菜单的网页端：输码 → 贴链接 / 文字 / 照片 → AI 整理 → 核对 → 发回小程序。
// 菜单分好几页的，可以「再加一部分」，结果接在后面。

type Row = ParsedItem & { picked: boolean; priceText: string }
type Source = 'url' | 'text' | 'photo'

const MAX_PHOTOS = 4

// 手机拍的照片动辄 5MB，先在浏览器里压到长边 1600px 的 JPEG，一张三四百 KB，AI 认字也够用
function compress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(img.src)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function toRows(items: ParsedItem[]): Row[] {
  return items.map(i => ({
    ...i,
    priceText: i.price == null ? '' : String(i.price),
    picked: !i.restricted
  }))
}

export default function ImportClient() {
  const [step, setStep] = useState<'code' | 'input' | 'review' | 'done'>('code')
  const [code, setCode] = useState('')
  const [shopName, setShopName] = useState('')
  const [parsesLeft, setParsesLeft] = useState(0)
  const [source, setSource] = useState<Source>('url')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [sent, setSent] = useState(0)
  const [error, setError] = useState('')
  const [pending, start] = useTransition()

  const run = (fn: () => Promise<void>) => {
    setError('')
    start(async () => {
      try {
        await fn()
      } catch {
        setError('网络出错了，请重试')
      }
    })
  }

  const onCheck = () => run(async () => {
    const r = await checkCode(code)
    if (!r.ok) return setError(r.message)
    setCode(r.code)
    setShopName(r.shopName)
    setParsesLeft(r.parsesLeft)
    setStep('input')
  })

  const onPhotos = async (files: FileList | null) => {
    if (!files) return
    const list = [...files].slice(0, MAX_PHOTOS - photos.length)
    try {
      const out = await Promise.all(list.map(compress))
      setPhotos(p => [...p, ...out].slice(0, MAX_PHOTOS))
    } catch {
      setError('有照片读不出来，换一张试试')
    }
  }

  const onParse = () => run(async () => {
    const input = source === 'url' ? { url } : source === 'text' ? { text } : { images: photos }
    const r = await parse(code, input)
    if (!r.ok) return setError(r.message)
    setParsesLeft(n => Math.max(0, n - 1))
    setRows(prev => [...prev, ...toRows(r.items)])
    setStep('review')
  })

  const update = (i: number, patch: Partial<Row>) => setRows(rs => rs.map((r, k) => (k === i ? { ...r, ...patch } : r)))

  const picked = rows.filter(r => r.picked && !r.restricted)
  const missingPrice = picked.find(r => r.priceText.trim() === '' || !(Number(r.priceText) >= 0))

  const onSubmit = () => run(async () => {
    if (missingPrice) return setError(`「${missingPrice.name}」还没填价格`)
    const items = picked.map(({ name, priceText, unit, description, category }) => ({
      name: name.trim(), price: Number(priceText), unit, description, category, restricted: false
    }))
    const r = await submit(code, items)
    if (!r.ok) return setError(r.message)
    setSent(r.count)
    setStep('done')
  })

  return (
    <div className="importer">
      {step === 'code' && (
        <div className="imp-card">
          <h2 className="imp-title">输入导入码</h2>
          <p className="muted">在明尼助手小程序「我的小店 → 商品管理 → 从网页导入菜单」里拿到</p>
          <form onSubmit={e => { e.preventDefault(); onCheck() }} className="imp-code-row">
            <input
              className="imp-code"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="K7M4QX"
              autoComplete="one-time-code"
              autoCapitalize="characters"
              inputMode="text"
              aria-label="导入码"
            />
            <button className="btn btn-primary btn-lg" disabled={pending || code.length !== 6}>{pending ? '核对中…' : '下一步'}</button>
          </form>
        </div>
      )}

      {step === 'input' && (
        <div className="imp-card">
          <h2 className="imp-title">导入到「{shopName}」</h2>
          <div className="kind-switch imp-tabs" role="tablist">
            {([['url', '菜单链接'], ['text', '粘贴文字'], ['photo', '拍照 / 截图']] as [Source, string][]).map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={source === k} className={source === k ? 'on' : ''} onClick={() => setSource(k)}>{label}</button>
            ))}
          </div>

          {source === 'url' && (
            <input className="imp-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://你家餐馆官网/menu" inputMode="url" />
          )}
          {source === 'text' && (
            <textarea className="imp-input imp-text" value={text} onChange={e => setText(e.target.value)} placeholder="把菜单整段复制过来，菜名、价格都要有" />
          )}
          {source === 'photo' && (
            <div className="imp-photos">
              {photos.map((p, i) => (
                <div key={i} className="imp-photo">
                  <img src={p} alt={`菜单照片 ${i + 1}`} />
                  <button type="button" aria-label="删掉这张" onClick={() => setPhotos(ps => ps.filter((_, k) => k !== i))}>×</button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="imp-photo imp-photo-add">
                  <input type="file" accept="image/*" multiple onChange={e => { onPhotos(e.target.files); e.target.value = '' }} />
                  ＋ 选照片
                </label>
              )}
            </div>
          )}

          <div className="imp-actions">
            <button className="btn btn-primary btn-lg" onClick={onParse}
              disabled={pending || parsesLeft <= 0 || (source === 'url' ? !url.trim() : source === 'text' ? !text.trim() : !photos.length)}>
              {pending ? 'AI 整理中，通常要半分钟…' : 'AI 整理'}
            </button>
            {rows.length > 0 && <button className="btn btn-ghost" onClick={() => setStep('review')} disabled={pending}>回到表格</button>}
            <span className="muted imp-left">这个导入码还能整理 {parsesLeft} 次</span>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="imp-card">
          <div className="imp-review-head">
            <h2 className="imp-title">核对一下（已选 {picked.length} 件）</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setStep('input')} disabled={pending || parsesLeft <= 0}>菜单还有别的页？再加一部分</button>
          </div>
          <p className="muted">名字、价格可以直接改。拼团价和堂食价不一样的话，在这里改成拼团价。</p>

          <div className="imp-table">
            {rows.map((r, i) => (
              <div key={i} className={`imp-row${r.restricted ? ' imp-row-off' : ''}`}>
                <input type="checkbox" checked={r.picked && !r.restricted} disabled={r.restricted}
                  onChange={e => update(i, { picked: e.target.checked })} aria-label={`选中 ${r.name}`} />
                <div className="imp-row-main">
                  <input className="imp-cell imp-name" value={r.name} maxLength={40} onChange={e => update(i, { name: e.target.value })} disabled={r.restricted} aria-label="名称" />
                  <div className="imp-row-sub">
                    {r.restricted ? <span className="imp-bad">酒类等禁售品，不能上架</span>
                      : <>
                        {r.category && <span className="chip">{r.category}</span>}
                        {r.unit && <span className="chip">{r.unit}</span>}
                        {r.description && <span className="imp-desc">{r.description}</span>}
                      </>}
                  </div>
                </div>
                {!r.restricted && (
                  <label className={`imp-price${r.picked && r.priceText.trim() === '' ? ' imp-price-missing' : ''}`}>
                    $<input inputMode="decimal" value={r.priceText} onChange={e => update(i, { priceText: e.target.value })} placeholder="价格" aria-label="价格" />
                  </label>
                )}
              </div>
            ))}
          </div>

          <div className="imp-actions imp-sticky">
            <button className="btn btn-primary btn-lg" onClick={onSubmit} disabled={pending || !picked.length}>
              {pending ? '发送中…' : `发送到小程序（${picked.length} 件）`}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="imp-card imp-done">
          <div className="imp-done-mark">✓</div>
          <h2 className="imp-title">已发送 {sent} 件</h2>
          <p>回到小程序的导入页，列表会自动出现。核对一遍，点「上架」就完成了。</p>
        </div>
      )}

      {error && <p className="imp-error" role="alert">{error}</p>}
    </div>
  )
}
