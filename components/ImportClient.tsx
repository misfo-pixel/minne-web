'use client'

import { useState, useTransition } from 'react'
import { checkCode, parse, submit } from '@/app/import/actions'
import type { ParsedItem } from '@/lib/menuParse'
import { COPY, localizeError, type Lang } from '@/lib/importCopy'

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

export default function ImportClient({ lang = 'zh' }: { lang?: Lang }) {
  const c = COPY[lang]
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
  const fail = (message: string) => setError(localizeError(message, lang))

  const run = (fn: () => Promise<void>) => {
    setError('')
    start(async () => {
      try {
        await fn()
      } catch {
        setError(c.errNetwork)
      }
    })
  }

  const onCheck = () => run(async () => {
    const r = await checkCode(code)
    if (!r.ok) return fail(r.message)
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
      setError(c.errPhoto)
    }
  }

  const onParse = () => run(async () => {
    const input = source === 'url' ? { url } : source === 'text' ? { text } : { images: photos }
    const r = await parse(code, input)
    if (!r.ok) return fail(r.message)
    setParsesLeft(n => Math.max(0, n - 1))
    setRows(prev => [...prev, ...toRows(r.items)])
    setStep('review')
  })

  const update = (i: number, patch: Partial<Row>) => setRows(rs => rs.map((r, k) => (k === i ? { ...r, ...patch } : r)))

  const picked = rows.filter(r => r.picked && !r.restricted)
  const missingPrice = picked.find(r => r.priceText.trim() === '' || !(Number(r.priceText) >= 0))

  const onSubmit = () => run(async () => {
    if (missingPrice) return setError(c.errNoPrice(missingPrice.name))
    const items = picked.map(({ name, priceText, unit, description, category }) => ({
      name: name.trim(), price: Number(priceText), unit, description, category, restricted: false
    }))
    const r = await submit(code, items)
    if (!r.ok) return fail(r.message)
    setSent(r.count)
    setStep('done')
  })

  return (
    <div className="importer">
      {step === 'code' && (
        <div className="imp-card">
          <h2 className="imp-title">{c.codeTitle}</h2>
          <p className="muted">{c.codeHint}</p>
          <form onSubmit={e => { e.preventDefault(); onCheck() }} className="imp-code-row">
            <input
              className="imp-code"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="K7M4QX"
              autoComplete="one-time-code"
              autoCapitalize="characters"
              inputMode="text"
              aria-label={c.codeLabel}
            />
            <button className="btn btn-primary btn-lg" disabled={pending || code.length !== 6}>{pending ? c.codeChecking : c.codeNext}</button>
          </form>
        </div>
      )}

      {step === 'input' && (
        <div className="imp-card">
          <h2 className="imp-title">{c.importTo(shopName)}</h2>
          <div className="kind-switch imp-tabs" role="tablist">
            {(c.tabs as [Source, string][]).map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={source === k} className={source === k ? 'on' : ''} onClick={() => setSource(k)}>{label}</button>
            ))}
          </div>

          {source === 'url' && (
            <input className="imp-input" value={url} onChange={e => setUrl(e.target.value)} placeholder={c.urlPlaceholder} inputMode="url" />
          )}
          {source === 'text' && (
            <textarea className="imp-input imp-text" value={text} onChange={e => setText(e.target.value)} placeholder={c.textPlaceholder} />
          )}
          {source === 'photo' && (
            <div className="imp-photos">
              {photos.map((p, i) => (
                <div key={i} className="imp-photo">
                  <img src={p} alt={c.photoAlt(i + 1)} />
                  <button type="button" aria-label={c.removePhoto} onClick={() => setPhotos(ps => ps.filter((_, k) => k !== i))}>×</button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="imp-photo imp-photo-add">
                  <input type="file" accept="image/*" multiple onChange={e => { onPhotos(e.target.files); e.target.value = '' }} />
                  {c.addPhoto}
                </label>
              )}
            </div>
          )}

          <div className="imp-actions">
            <button className="btn btn-primary btn-lg" onClick={onParse}
              disabled={pending || parsesLeft <= 0 || (source === 'url' ? !url.trim() : source === 'text' ? !text.trim() : !photos.length)}>
              {pending ? c.parsing : c.parse}
            </button>
            {rows.length > 0 && <button className="btn btn-ghost" onClick={() => setStep('review')} disabled={pending}>{c.backToTable}</button>}
            <span className="muted imp-left">{c.parsesLeft(parsesLeft)}</span>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="imp-card">
          <div className="imp-review-head">
            <h2 className="imp-title">{c.reviewTitle(picked.length)}</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setStep('input')} disabled={pending || parsesLeft <= 0}>{c.addMore}</button>
          </div>
          <p className="muted">{c.reviewHint}</p>

          <div className="imp-table">
            {rows.map((r, i) => (
              <div key={i} className={`imp-row${r.restricted ? ' imp-row-off' : ''}`}>
                <input type="checkbox" checked={r.picked && !r.restricted} disabled={r.restricted}
                  onChange={e => update(i, { picked: e.target.checked })} aria-label={c.pickAria(r.name)} />
                <div className="imp-row-main">
                  <input className="imp-cell imp-name" value={r.name} maxLength={40} onChange={e => update(i, { name: e.target.value })} disabled={r.restricted} aria-label={c.nameAria} />
                  <div className="imp-row-sub">
                    {r.restricted ? <span className="imp-bad">{c.restricted}</span>
                      : <>
                        {r.category && <span className="chip">{r.category}</span>}
                        {r.unit && <span className="chip">{r.unit}</span>}
                        {r.description && <span className="imp-desc">{r.description}</span>}
                      </>}
                  </div>
                </div>
                {!r.restricted && (
                  <label className={`imp-price${r.picked && r.priceText.trim() === '' ? ' imp-price-missing' : ''}`}>
                    $<input inputMode="decimal" value={r.priceText} onChange={e => update(i, { priceText: e.target.value })} placeholder={c.pricePlaceholder} aria-label={c.priceAria} />
                  </label>
                )}
              </div>
            ))}
          </div>

          <div className="imp-actions imp-sticky">
            <button className="btn btn-primary btn-lg" onClick={onSubmit} disabled={pending || !picked.length}>
              {pending ? c.sending : c.send(picked.length)}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="imp-card imp-done">
          <div className="imp-done-mark">✓</div>
          <h2 className="imp-title">{c.doneTitle(sent)}</h2>
          <p>{c.doneText}</p>
        </div>
      )}

      {error && <p className="imp-error" role="alert">{error}</p>}
    </div>
  )
}
