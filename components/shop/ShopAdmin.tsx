'use client'

import { useCallback, useEffect, useState } from 'react'
import { loadDashboard, login, logout } from '@/app/shop/actions'
import { COPY, type Lang } from '@/lib/shopCopy'
import type { AdminItem, AdminSession, Dashboard } from '@/lib/shopTypes'
import ShopItems from './ShopItems'
import ShopOrders from './ShopOrders'
import ShopSessions from './ShopSessions'
import { useAction } from './useAction'

// 店长后台：输登录码 → 订单 / 场次 / 商品三块。
// 数据都走 app/shop/actions.ts 的服务器动作，登录凭证在 httpOnly cookie 里，这里碰不到。

type Tab = 'orders' | 'sessions' | 'items'

export default function ShopAdmin({ lang }: { lang: Lang }) {
  const c = COPY[lang]
  const [phase, setPhase] = useState<'loading' | 'login' | 'ready'>('loading')
  const [data, setData] = useState<Dashboard | null>(null)
  const [tab, setTab] = useState<Tab>('orders')
  // 从场次卡片点「订单」：订单那块只看这一场
  const [orderSession, setOrderSession] = useState('')
  const [code, setCode] = useState('')
  const [flash, setFlash] = useState('')

  const onAuthLost = useCallback(() => {
    setData(null)
    setPhase('login')
  }, [])
  const { pending, error, setError, run } = useAction(lang, onAuthLost, c.errNetwork)

  const load = useCallback(() => run(loadDashboard, r => {
    setData(r)
    setPhase('ready')
  }), [run])

  useEffect(() => { load() }, [load])

  const notify = useCallback((msg: string) => {
    setFlash(msg)
    window.setTimeout(() => setFlash(f => (f === msg ? '' : f)), 2400)
  }, [])

  const onLogin = () => run(() => login(code), () => {
    setCode('')
    load()
  })

  const onLogout = () => run(logout, () => {
    setData(null)
    setPhase('login')
  })

  const setSessions = useCallback((now: string, sessions: AdminSession[]) => {
    setData(d => (d ? { ...d, now, sessions } : d))
  }, [])
  const setItems = useCallback((items: AdminItem[], useCategory: boolean) => {
    setData(d => (d ? { ...d, items, shop: { ...d.shop, useCategory } } : d))
  }, [])

  if (phase === 'login') {
    return (
      <div className="sa-login imp-card">
        <h2 className="imp-title">{c.loginTitle}</h2>
        <p className="muted">{c.loginHint}</p>
        <form onSubmit={e => { e.preventDefault(); onLogin() }} className="imp-code-row">
          <input
            className="imp-code"
            value={code.length > 4 ? code.slice(0, 4) + '-' + code.slice(4) : code}
            onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
            placeholder="K7M4-QXPA"
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            aria-label={c.loginLabel}
          />
          <button className="btn btn-primary btn-lg" disabled={pending || code.length !== 8}>{pending ? c.loginBusy : c.loginGo}</button>
        </form>
        <p className="muted sa-login-keep">{c.loginKeep}</p>
        {error && <p className="imp-error" role="alert">{error}</p>}
      </div>
    )
  }

  if (phase === 'loading' || !data) {
    return (
      <div className="sa-loading">
        {error
          ? <><p className="imp-error" role="alert">{error}</p><button className="btn btn-ghost" onClick={() => { setError(''); load() }}>{c.retry}</button></>
          : <p className="muted">{c.loading}</p>}
      </div>
    )
  }

  const { shop } = data

  return (
    <div className="sa">
      <div className="sa-bar">
        <div className="sa-shop">
          {shop.logoUrl
            ? <img src={shop.logoUrl} alt="" className="sa-logo" />
            : <span className="sa-logo sa-logo-fallback"><img src="/icons/shop.svg" alt="" /></span>}
          <span className="sa-shop-name">{shop.name}</span>
        </div>
        <div className="kind-switch" role="tablist">
          {(Object.keys(c.tabs) as Tab[]).map(k => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{c.tabs[k]}</button>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onLogout} disabled={pending}>{c.logout}</button>
      </div>

      {shop.takedown && <p className="imp-error">{c.takedown}</p>}

      {tab === 'orders' && (
        <ShopOrders lang={lang} sessions={data.sessions} sessionId={orderSession} onSessionChange={setOrderSession}
          onAuthLost={onAuthLost} notify={notify} />
      )}
      {tab === 'sessions' && (
        <ShopSessions lang={lang} now={data.now} sessions={data.sessions} points={shop.points} disabled={shop.takedown}
          onSessions={setSessions} onShowOrders={id => { setOrderSession(id); setTab('orders') }}
          onAuthLost={onAuthLost} notify={notify} />
      )}
      {tab === 'items' && (
        <ShopItems lang={lang} shopName={shop.name} items={data.items} useCategory={shop.useCategory} onItems={setItems}
          onAuthLost={onAuthLost} notify={notify} />
      )}

      {flash && <div className="sa-flash" role="status">{flash}</div>}
    </div>
  )
}
