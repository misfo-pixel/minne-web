'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadOrders, setOrderStatus } from '@/app/shop/actions'
import { COPY, type Lang } from '@/lib/shopCopy'
import { atText, localTime, md, money, weekday } from '@/lib/shopFormat'
import type { AdminOrder, AdminSession, OrderStatus } from '@/lib/shopTypes'
import { useAction } from './useAction'

// 订单：按场次筛、按状态分四栏。待确认那栏是电脑上最常用的——
// 一键复制这一场所有待确认买家的邮箱，粘进邮件密送栏群发收款码；买家回了付款截图，回这里点确认。

type Tab = 'forming' | 'pending' | 'active' | 'done'

const TAB_OF: Record<OrderStatus, Tab> = {
  forming: 'forming', confirming: 'pending', pending: 'pending',
  accepted: 'active', delivering: 'active', completed: 'done', cancelled: 'done'
}

type Props = {
  lang: Lang
  sessions: AdminSession[]
  sessionId: string
  onSessionChange: (id: string) => void
  onAuthLost: () => void
  notify: (msg: string) => void
}

function csvCell(v: string | number) {
  const s = String(v ?? '')
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

export default function ShopOrders({ lang, sessions, sessionId, onSessionChange, onAuthLost, notify }: Props) {
  const c = COPY[lang]
  const [tab, setTab] = useState<Tab>('pending')
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loaded, setLoaded] = useState(false)
  const [emailBox, setEmailBox] = useState('')
  const { pending, error, run } = useAction(lang, onAuthLost, c.errNetwork)

  // 选了某一场：一次拿这一场所有状态的单，四栏在本地分；没选：按栏去拿（每栏最近 50 单）
  const fetchTab = sessionId ? 'all' : tab
  const reload = useCallback(() => run(() => loadOrders(fetchTab, sessionId), r => {
    setOrders(r.orders)
    setLoaded(true)
  }), [run, fetchTab, sessionId])

  useEffect(() => { reload() }, [reload])

  const shown = useMemo(() => orders.filter(o => TAB_OF[o.status] === tab), [orders, tab])
  const tabCount = (t: Tab) => (sessionId ? orders.filter(o => TAB_OF[o.status] === t).length : null)
  const emails = useMemo(() => Array.from(new Set(shown.map(o => o.email.trim()).filter(Boolean))), [shown])

  const move = (o: AdminOrder, status: string) => {
    let reason = ''
    if (status === 'cancelled') {
      const r = window.prompt(c.cancelPrompt, '')
      if (r === null) return
      reason = r.trim()
    }
    run(() => setOrderStatus(o.id, status, reason), () => {
      notify(c.updated)
      reload()
    })
  }

  const copyText = async (text: string, ok: string) => {
    try {
      await navigator.clipboard.writeText(text)
      notify(ok)
      return true
    } catch {
      return false
    }
  }

  const copyEmails = async () => {
    const text = emails.join(', ')
    const ok = await copyText(text, c.copiedEmails(emails.length))
    // 复制不了（老浏览器、没给权限）就把邮箱摊开，手动选
    setEmailBox(ok ? '' : text)
    if (!ok) notify(c.copyFailed)
  }

  const exportCsv = () => {
    const rows = shown.map(o => [
      '#' + o.shortId,
      o.batchDate,
      c.statusText[o.status] || o.status,
      o.nickname,
      o.email,
      o.wechat,
      o.phone,
      o.pickup,
      o.items.map(i => `${i.name} x${i.count}`).join('; '),
      o.note,
      o.total,
      localTime(o.createdAt)
    ])
    const csv = [c.csvHead, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n')
    // 带 BOM，Excel 打开中文才不乱码
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    const s = sessions.find(x => x.id === sessionId)
    a.href = URL.createObjectURL(blob)
    // 文件名只用英文和数字：有的浏览器碰到中文文件名会退回成「download」
    a.download = `orders-${s ? s.date : 'all'}-${tab}.csv`
    // 链接要先放进页面再点，下载开始前也别回收
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(a.href), 10000)
  }

  return (
    <div className="sa-section">
      <div className="sa-tools">
        <select className="sa-select" value={sessionId} onChange={e => onSessionChange(e.target.value)} aria-label={c.allSessions}>
          <option value="">{c.allSessions}</option>
          {sessions.map(s => (
            <option key={s.id} value={s.id}>{c.sessionOption(weekday(s.date, lang) + ' ' + md(s.date) + ' ' + s.departTime, s.counts.total)}</option>
          ))}
        </select>
        <div className="kind-switch" role="tablist">
          {(Object.keys(c.orderTabs) as Tab[]).map(k => {
            const n = tabCount(k)
            return (
              <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
                {c.orderTabs[k]}{n ? ` ${n}` : ''}
              </button>
            )
          })}
        </div>
      </div>

      {shown.length > 0 && (
        <div className="sa-tools">
          {emails.length > 0 && <button className="btn btn-primary btn-sm" onClick={copyEmails}>{c.copyEmails(emails.length)}</button>}
          <button className="btn btn-ghost btn-sm" onClick={exportCsv}>{c.exportCsv}</button>
          {tab === 'pending' && emails.length > 0 && <span className="muted sa-tip">{c.emailsTip}</span>}
        </div>
      )}
      {emailBox && <textarea className="imp-input sa-emailbox" readOnly value={emailBox} onFocus={e => e.target.select()} />}

      {error && <p className="imp-error" role="alert">{error}</p>}
      {loaded && !shown.length && <p className="muted sa-empty">{pending ? c.loading : c.noOrders}</p>}

      <div className="sa-orders">
        {shown.map(o => (
          <div key={o.id} className={`sa-order${o.status === 'cancelled' ? ' sa-order-off' : ''}`}>
            <div className="sa-order-head">
              <span className="sa-order-id">#{o.shortId}</span>
              <span className="chip">{c.statusText[o.status] || o.status}</span>
              {o.batchDate && <span className="muted sa-order-day">{weekday(o.batchDate, lang)} {md(o.batchDate)}</span>}
              <span className="price sa-order-total">{money(o.total)}</span>
            </div>
            <div className="sa-order-who">
              <b>{o.nickname || '—'}</b> · {o.pickup}
            </div>
            {o.unlisted && <div className="imp-bad">{c.orderUnlisted}</div>}
            <ul className="sa-order-items">
              {o.items.map((i, k) => <li key={k}><span>{i.name}</span><span className="muted">×{i.count}</span></li>)}
            </ul>
            {o.note && <div className="sa-order-note">{c.orderNote}：{o.note}</div>}
            {o.noteImages.length > 0 && (
              <div className="sa-order-imgs">
                {o.noteImages.map(u => <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" /></a>)}
              </div>
            )}
            <div className="sa-order-contact">
              {o.email
                ? <><span className="muted">{c.orderEmail}</span> <span className="sa-mono">{o.email}</span> <button className="sa-link" onClick={() => copyText(o.email, c.copied)}>{c.copy}</button></>
                : o.wechat && <><span className="muted">{c.orderWechat}</span> {o.wechat} <button className="sa-link" onClick={() => copyText(o.wechat, c.copied)}>{c.copy}</button></>}
              {o.phone && <span className="sa-order-phone"><span className="muted">{c.orderPhone}</span> <a href={'tel:' + o.phone.replace(/[^\d+]/g, '')}>{o.phone}</a></span>}
            </div>
            {o.status === 'cancelled' && o.cancelReason && <div className="muted sa-order-note">{c.orderCancelled(o.cancelReason)}</div>}
            <div className="sa-order-foot">
              <span className="muted">{localTime(o.createdAt)}</span>
              <div className="sa-order-actions">
                {o.status === 'forming' && <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => move(o, 'cancelled')}>{c.reject}</button>}
                {(o.status === 'confirming' || o.status === 'pending') && <>
                  <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => move(o, 'cancelled')}>{c.cancel}</button>
                  <button className="btn btn-primary btn-sm" disabled={pending} onClick={() => move(o, 'accepted')}>{c.confirm}</button>
                </>}
                {o.status === 'accepted' && <>
                  <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => move(o, 'cancelled')}>{c.cancel}</button>
                  <button className="btn btn-primary btn-sm" disabled={pending} onClick={() => move(o, 'delivering')}>{c.startDelivery}</button>
                </>}
                {o.status === 'delivering' && <button className="btn btn-primary btn-sm" disabled={pending} onClick={() => move(o, 'completed')}>{c.delivered}</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {sessionId && (() => {
        // 用这一场的单现数，确认完一单马上变；场次列表上的数要等回到场次页才刷新
        const s = sessions.find(x => x.id === sessionId)
        if (!s || s.state !== 'formed') return null
        const waiting = orders.filter(o => TAB_OF[o.status] === 'pending').length
        const confirmed = orders.filter(o => ['accepted', 'delivering', 'completed'].includes(o.status)).length
        return <p className="muted sa-foot-note">{c.confirmLine(waiting, confirmed, atText(s.confirmAt, lang))}</p>
      })()}
    </div>
  )
}
