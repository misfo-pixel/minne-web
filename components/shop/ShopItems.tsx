'use client'

import { useMemo, useState } from 'react'
import { deleteItem, importShopItems, parseShopMenu, reloadItems, saveItem, setItemPhoto, setUseCategory, toggleItem } from '@/app/shop/actions'
import ImportClient from '@/components/ImportClient'
import { COPY, type Lang } from '@/lib/shopCopy'
import { money } from '@/lib/shopFormat'
import type { AdminItem, ItemDraft } from '@/lib/shopTypes'
import { compressPhoto } from './photo'
import { useAction } from './useAction'

// 商品：改价、上下架马上生效；新增、改文字由云函数先过腾讯云内容审核（见 shopManage 的 tmsCheck），
// 不通过就把原因原样显示在编辑框里。照片在浏览器里压好再传，云函数审核后存云存储（shopManage 的 setItemImage）。

type Props = {
  lang: Lang
  shopName: string
  items: AdminItem[]
  useCategory: boolean
  onItems: (items: AdminItem[], useCategory: boolean) => void
  onAuthLost: () => void
  notify: (msg: string) => void
}

const EMPTY: ItemDraft = { name: '', price: 0, unit: '', description: '', specs: '', category: '', available: true }

export default function ShopItems({ lang, shopName, items, useCategory, onItems, onAuthLost, notify }: Props) {
  const c = COPY[lang]
  const { pending, error, run } = useAction(lang, onAuthLost, c.errNetwork)
  const [editing, setEditing] = useState<ItemDraft | null>(null)
  // 导入菜单：和 /import 同一个组件，已登录所以不用码，核对完直接上架
  const [importing, setImporting] = useState(false)

  const refresh = () => run(reloadItems, r => onItems(r.items, r.useCategory))

  const groups = useMemo(() => {
    if (!useCategory) return [{ name: '', items }]
    const map = new Map<string, AdminItem[]>()
    items.forEach(i => {
      const k = i.category || ''
      map.set(k, [...(map.get(k) || []), i])
    })
    // 没分类的放最后
    return [...map.entries()].sort((a, b) => (a[0] === '' ? 1 : b[0] === '' ? -1 : 0)).map(([name, list]) => ({ name, items: list }))
  }, [items, useCategory])

  const categories = useMemo(() => Array.from(new Set(items.map(i => i.category).filter(Boolean))), [items])

  const toggle = (i: AdminItem) => run(() => toggleItem(i.id, !i.available), () => {
    // 先在本地改掉，不用等整张表重新拉
    onItems(items.map(x => (x.id === i.id ? { ...x, available: !i.available } : x)), useCategory)
    notify(c.updated)
  })

  const remove = (i: AdminItem) => {
    if (!window.confirm(c.delConfirm(i.name))) return
    run(() => deleteItem(i.id), () => {
      onItems(items.filter(x => x.id !== i.id), useCategory)
      notify(c.updated)
    })
  }

  const switchCategory = (on: boolean) => run(() => setUseCategory(on), () => onItems(items, on))

  if (importing) {
    const authed = <T extends { ok: boolean; auth?: boolean }>(r: T) => {
      if (!r.ok && r.auth) onAuthLost()
      return r
    }
    return (
      <div className="sa-section">
        <div className="sa-tools">
          <button className="btn btn-ghost btn-sm" onClick={() => { setImporting(false); refresh() }}>{c.backToItems}</button>
        </div>
        <ImportClient lang={lang} shop={{
          name: shopName,
          parse: async input => authed(await parseShopMenu(input)),
          submit: async list => authed(await importShopItems(list)),
          onDone: () => { setImporting(false); refresh() }
        }} />
      </div>
    )
  }

  return (
    <div className="sa-section">
      <div className="sa-tools">
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({ ...EMPTY })} disabled={pending}>{c.newItem}</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setImporting(true)} disabled={pending}>{c.importMenu}</button>
        <label className="sa-check">
          <input type="checkbox" checked={useCategory} disabled={pending} onChange={e => switchCategory(e.target.checked)} />
          <span>{c.useCategory}</span>
        </label>
      </div>
      <p className="muted sa-tip sa-tip-block">{c.photoTip}</p>
      {error && <p className="imp-error" role="alert">{error}</p>}
      {!items.length && <p className="muted sa-empty">{c.noItems}</p>}

      {groups.map(g => (
        <div key={g.name || '-'} className="sa-group">
          {useCategory && <h3 className="sa-group-title">{g.name || c.uncategorized}</h3>}
          <div className="sa-items">
            {g.items.map(i => (
              <div key={i.id} className={`sa-item${i.available ? '' : ' sa-item-off'}`}>
                <button className="sa-item-photo" onClick={() => setEditing({ ...i })} aria-label={c.edit}>
                  {i.imageUrl
                    ? <img src={i.imageUrl} alt="" className="sa-item-img" />
                    : <span className="sa-item-img sa-item-img-empty">＋</span>}
                </button>
                <div className="sa-item-main">
                  <div className="sa-item-name">{i.name}</div>
                  <div className="sa-item-sub">
                    {!useCategory && i.category && <span className="chip">{i.category}</span>}
                    {i.description && <span className="muted">{i.description}</span>}
                  </div>
                </div>
                <div className="sa-item-price price">{money(i.price)}{i.unit && <small> / {i.unit}</small>}</div>
                <div className="sa-item-actions">
                  <button className={`sa-pill${i.available ? ' sa-pill-on' : ''}`} disabled={pending} onClick={() => toggle(i)}
                    title={i.available ? c.setOff : c.setOn}>
                    {i.available ? c.onSale : c.offSale}
                  </button>
                  <button className="sa-link" onClick={() => setEditing({ ...i })}>{c.edit}</button>
                  <button className="sa-link sa-danger" disabled={pending} onClick={() => remove(i)}>{c.del}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {editing && (
        <ItemEditor lang={lang} draft={editing} categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); notify(c.saved); refresh() }}
          onAuthLost={onAuthLost} />
      )}
    </div>
  )
}

// 照片的三种状态：没动 / 换了一张新的（浏览器里压好的 data URL）/ 去掉
type Photo = { kind: 'keep' } | { kind: 'new'; dataUrl: string } | { kind: 'remove' }

function ItemEditor({ lang, draft, categories, onClose, onSaved, onAuthLost }: {
  lang: Lang
  draft: ItemDraft
  categories: string[]
  onClose: () => void
  onSaved: () => void
  onAuthLost: () => void
}) {
  const c = COPY[lang]
  const { pending, error, setError, run } = useAction(lang, onAuthLost, c.errNetwork)
  const [d, setD] = useState({ ...draft, priceText: draft.id ? String(draft.price) : '' })
  const [photo, setPhoto] = useState<Photo>({ kind: 'keep' })
  const [busyPhoto, setBusyPhoto] = useState(false)
  const set = (patch: Partial<typeof d>) => setD(x => ({ ...x, ...patch }))
  const preview = photo.kind === 'new' ? photo.dataUrl : photo.kind === 'remove' ? '' : d.imageUrl || ''

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return
    setError('')
    setBusyPhoto(true)
    try {
      setPhoto({ kind: 'new', dataUrl: await compressPhoto(file) })
    } catch {
      setError(c.photoBad)
    } finally {
      setBusyPhoto(false)
    }
  }

  const save = () => {
    const price = Number(d.priceText)
    if (!d.name.trim()) return setError(c.needName)
    if (d.priceText.trim() === '' || !(price >= 0)) return setError(c.needPrice)
    run(async () => {
      const saved = await saveItem({
        id: d.id, name: d.name, price: Math.round(price * 100) / 100, unit: d.unit,
        description: d.description, specs: d.specs, category: d.category, available: d.available
      })
      if (!saved.ok || photo.kind === 'keep') return saved
      // 新商品先建好再传照片。照片没过的话商品已经在了：记下 id，再点保存只会重传照片，不会多建一件
      set({ id: saved.itemId })
      const r = await setItemPhoto(saved.itemId, photo.kind === 'new' ? photo.dataUrl : null)
      if (r.ok) {
        set({ imageUrl: r.imageUrl })
        setPhoto({ kind: 'keep' })
      }
      return r
    }, onSaved)
  }

  return (
    <div className="sa-modal" role="dialog" aria-modal="true" aria-label={draft.id ? c.itemEditTitle : c.itemNewTitle}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <form className="sa-modal-card" onSubmit={e => { e.preventDefault(); save() }}>
        <div className="sa-modal-head">
          <h2 className="imp-title">{draft.id ? c.itemEditTitle : c.itemNewTitle}</h2>
          <button type="button" className="sa-x" onClick={onClose} aria-label={c.close}>×</button>
        </div>
        <div className="sa-photo-row">
          {preview
            ? <img src={preview} alt="" className="sa-photo" />
            : <span className="sa-photo sa-photo-empty">{c.noPhoto}</span>}
          <div className="sa-photo-actions">
            <label className={`btn btn-ghost btn-sm${busyPhoto || pending ? ' sa-disabled' : ''}`}>
              <input type="file" accept="image/*" hidden disabled={busyPhoto || pending}
                onChange={e => { pickPhoto(e.target.files?.[0]); e.target.value = '' }} />
              {busyPhoto ? c.photoBusy : preview ? c.photoChange : c.photoAdd}
            </label>
            {preview && <button type="button" className="sa-link sa-danger" disabled={pending} onClick={() => setPhoto({ kind: 'remove' })}>{c.photoRemove}</button>}
            {photo.kind !== 'keep' && <span className="muted sa-tip">{c.photoPending}</span>}
          </div>
        </div>
        <div className="sa-grid">
          <label className="sa-field sa-field-wide">
            <span>{c.itemName}</span>
            <input className="imp-input" value={d.name} maxLength={40} onChange={e => set({ name: e.target.value })} autoFocus />
          </label>
          <label className="sa-field">
            <span>{c.itemPrice}</span>
            <input className="imp-input" inputMode="decimal" value={d.priceText} onChange={e => set({ priceText: e.target.value })} placeholder="12.99" />
          </label>
          <label className="sa-field">
            <span>{c.itemUnit}</span>
            <input className="imp-input" value={d.unit} maxLength={6} onChange={e => set({ unit: e.target.value })} />
          </label>
          <label className="sa-field sa-field-wide">
            <span>{c.itemCategory}</span>
            <input className="imp-input" value={d.category} maxLength={12} list="sa-categories" onChange={e => set({ category: e.target.value })} />
            <datalist id="sa-categories">{categories.map(x => <option key={x} value={x} />)}</datalist>
          </label>
          <label className="sa-field sa-field-wide">
            <span>{c.itemDesc}</span>
            <textarea className="imp-input sa-textarea" value={d.description} maxLength={500} onChange={e => set({ description: e.target.value })} />
          </label>
          <label className="sa-field sa-field-wide">
            <span>{c.itemSpecs}</span>
            <textarea className="imp-input sa-textarea" value={d.specs} maxLength={500} onChange={e => set({ specs: e.target.value })} />
          </label>
        </div>
        <label className="sa-check sa-repeat">
          <input type="checkbox" checked={d.available} onChange={e => set({ available: e.target.checked })} />
          <span>{c.itemAvailable}</span>
        </label>
        {error && <p className="imp-error" role="alert">{error}</p>}
        <div className="imp-actions">
          <button className="btn btn-primary" disabled={pending || busyPhoto}>{pending ? c.saving : c.save}</button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>{c.close}</button>
        </div>
      </form>
    </div>
  )
}
