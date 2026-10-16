'use client'

import { useEffect, useState } from 'react'
import { cancelSession, forceSession, loadSessionForm, reloadSessions, saveSession } from '@/app/shop/actions'
import { COPY, type Lang } from '@/lib/shopCopy'
import { addDays, atText, buildTimes, CALENDAR_DAYS, md, shiftAt, weekday } from '@/lib/shopFormat'
import type { AdminSession, SessionDraft, SessionForm, ShopPoint } from '@/lib/shopTypes'
import { useAction } from './useAction'

// 场次：开着的团 + 开新团 / 修改。规则和小程序「开团」页一样，存的时候以云函数为准：
//   截单固定在出发前一天；确认截止 = 截单后 12 小时，最晚出发前 1 小时
//   有人下单后日期、时间、取货点定死，只能调低门槛、开关每周重复；截单后只剩每周重复和取消

const MIN_OPTIONS = [0, 3, 5, 8, 10, 15, 20, 30]
const DEFAULT_DRAFT = { departTime: '17:00', cutoff: '22:00', minOrders: 10, repeatWeekly: false }

type Props = {
  lang: Lang
  now: string
  sessions: AdminSession[]
  points: ShopPoint[]
  disabled: boolean
  onSessions: (now: string, sessions: AdminSession[]) => void
  onShowOrders: (id: string) => void
  onAuthLost: () => void
  notify: (msg: string) => void
}

export default function ShopSessions({ lang, now, sessions, points, disabled, onSessions, onShowOrders, onAuthLost, notify }: Props) {
  const c = COPY[lang]
  const { pending, error, run } = useAction(lang, onAuthLost, c.errNetwork)
  const [editing, setEditing] = useState<SessionDraft | null>(null)

  // 进这一页就刷新一次单数：订单那页确认过的单，这里的数字才对得上
  useEffect(() => {
    run(reloadSessions, r => onSessions(r.now, r.sessions))
  }, [run, onSessions])

  const refresh = () => run(reloadSessions, r => onSessions(r.now, r.sessions))

  const today = now.slice(0, 10)
  const when = (s: AdminSession) => weekday(s.date, lang) + ' ' + md(s.date)

  const openNew = () => {
    // 默认挑两周内第一个还没开团的日子
    const taken = new Set(sessions.filter(s => s.state === 'open' || s.state === 'formed').map(s => s.date))
    let date = addDays(today, 1)
    for (let i = 1; i < CALENDAR_DAYS && taken.has(date); i++) date = addDays(today, i + 1)
    setEditing({ date, points: points.map(p => p.name), ...DEFAULT_DRAFT })
  }

  const force = (s: AdminSession) => {
    if (!window.confirm(c.forceConfirm)) return
    run(() => forceSession(s.id), () => { notify(c.forcedDone); refresh() })
  }

  const cancel = (s: AdminSession) => {
    const live = s.counts.forming + s.counts.confirming + s.counts.confirmed
    if (!window.confirm(c.cancelSessionConfirm(live))) return
    run(() => cancelSession(s.id), () => { notify(c.cancelledDone); refresh() })
  }

  return (
    <div className="sa-section">
      <div className="sa-tools">
        <button className="btn btn-primary btn-sm" onClick={openNew} disabled={disabled || pending}>{c.newSession}</button>
      </div>
      {error && <p className="imp-error" role="alert">{error}</p>}
      {!sessions.length && <p className="muted sa-empty">{c.noSessions}</p>}

      <div className="session-grid">
        {sessions.map(s => {
          const open = s.state === 'open'
          const min = s.minOrders
          const pct = min ? Math.min(100, Math.round((s.counts.total / min) * 100)) : 100
          const canForce = open && min > 0 && s.counts.total < min && !s.forced
          const canCancel = (open || s.state === 'formed') && s.departAt > now
          return (
            <div key={s.id} className={`session-card sa-session${open || s.state === 'formed' ? '' : ' sa-session-off'}`}>
              <div className="session-name-row">
                <span className="session-name">{c.sessionTitle(when(s), s.departTime)}</span>
                <span className={s.state === 'formed' ? 'gb-sticker' : 'chip'}>{c.sessionState[s.state]}</span>
                {s.repeatWeekly && <span className="chip">{c.repeatTag(weekday(s.date, lang))}</span>}
              </div>
              <div className="session-points">{s.points.join(' · ')}</div>
              {open && <>
                {min > 0 && <div className={`gb-bar${pct >= 100 ? ' gb-bar-done' : ''}`}><div className="gb-bar-fill" style={{ width: pct + '%' }} /></div>}
                <div className="gb-line">
                  <span className="gb-text">{c.countText(s.counts.total, min)}{s.forced ? c.forcedTag : ''}</span>
                  <span className="gb-cut">{c.cutoffLine(atText(s.cutoffAt, lang))}</span>
                </div>
              </>}
              {s.state === 'formed' && <div className="sa-session-confirm">{c.confirmLine(s.counts.confirming, s.counts.confirmed, atText(s.confirmAt, lang))}</div>}
              <div className="sa-session-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => onShowOrders(s.id)}>{c.sessionOrders}</button>
                <button className="btn btn-ghost btn-sm" disabled={disabled || pending}
                  onClick={() => setEditing({ id: s.id, date: s.date, departTime: s.departTime, cutoff: s.cutoff, minOrders: s.minOrders, repeatWeekly: s.repeatWeekly, points: s.points })}>
                  {open ? c.edit : c.settings}
                </button>
                {canForce && <button className="btn btn-gold btn-sm" disabled={pending} onClick={() => force(s)}>{c.force}</button>}
                {canCancel && <button className="sa-link sa-danger" disabled={pending} onClick={() => cancel(s)}>{c.cancelSession}</button>}
              </div>
            </div>
          )
        })}
      </div>

      {editing && (
        <SessionEditor lang={lang} draft={editing} today={today} sessions={sessions}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); notify(c.saved); refresh() }}
          onAuthLost={onAuthLost} />
      )}
    </div>
  )
}

function SessionEditor({ lang, draft, today, sessions, onClose, onSaved, onAuthLost }: {
  lang: Lang
  draft: SessionDraft
  today: string
  sessions: AdminSession[]
  onClose: () => void
  onSaved: () => void
  onAuthLost: () => void
}) {
  const c = COPY[lang]
  const { pending, error, run } = useAction(lang, onAuthLost, c.errNetwork)
  const [d, setD] = useState<SessionDraft>(draft)
  const [form, setForm] = useState<SessionForm | null>(null)
  const set = (patch: Partial<SessionDraft>) => setD(x => ({ ...x, ...patch }))

  // 改已有的场次时拿它现在的单数决定能改什么；开新团时拿这天别家的排期，方便错开
  const formDate = draft.id ? '' : d.date
  useEffect(() => {
    run(() => loadSessionForm(draft.id || '', formDate), r => setForm(r))
  }, [run, draft.id, formDate])

  const session = form?.session || sessions.find(s => s.id === draft.id) || null
  const closed = !!draft.id && !!session && session.state !== 'open'
  const locked = !!draft.id && !closed && (form?.count || 0) > 0
  const minNow = session ? session.minOrders : 0
  const points = form?.points || []

  const times = buildTimes(d.date, d.departTime, d.cutoff)
  const tooEarly = times.confirmAt < shiftAt(times.cutoffAt, 60)
  const minChoices = Array.from(new Set([...MIN_OPTIONS, d.minOrders])).sort((a, b) => a - b)
    .filter(n => !locked || n <= minNow)

  const save = () => run(() => saveSession(d), onSaved)

  return (
    <div className="sa-modal" role="dialog" aria-modal="true" aria-label={draft.id ? c.formEdit : c.formNew}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <form className="sa-modal-card" onSubmit={e => { e.preventDefault(); save() }}>
        <div className="sa-modal-head">
          <h2 className="imp-title">{draft.id ? c.formEdit : c.formNew}</h2>
          <button type="button" className="sa-x" onClick={onClose} aria-label={c.close}>×</button>
        </div>

        {locked && <p className="sa-note">{c.lockedOrdered(form?.count || 0)}</p>}
        {closed && <p className="sa-note">{c.lockedClosed}</p>}

        <div className="sa-grid">
          <label className="sa-field">
            <span>{c.formDate}</span>
            <input type="date" className="imp-input" value={d.date} disabled={locked || closed}
              min={addDays(today, 1)} max={addDays(today, CALENDAR_DAYS - 1)} onChange={e => set({ date: e.target.value })} required />
          </label>
          <label className="sa-field">
            <span>{c.formDepart}</span>
            <input type="time" className="imp-input" value={d.departTime} disabled={locked || closed} onChange={e => set({ departTime: e.target.value })} required />
          </label>
          <label className="sa-field">
            <span>{c.formCutoff}</span>
            <input type="time" className="imp-input" value={d.cutoff} disabled={locked || closed} onChange={e => set({ cutoff: e.target.value })} required />
          </label>
          <label className="sa-field">
            <span>{c.formMin}</span>
            <select className="imp-input" value={d.minOrders} disabled={closed} onChange={e => set({ minOrders: Number(e.target.value) })}>
              {minChoices.map(n => <option key={n} value={n}>{c.minOption(n)}</option>)}
            </select>
          </label>
        </div>

        {d.date && d.departTime && d.cutoff && (
          <p className={tooEarly ? 'imp-bad sa-times' : 'muted sa-times'}>
            {tooEarly ? c.tooEarly : c.formTimes(atText(times.cutoffAt, lang), atText(times.confirmAt, lang))}
          </p>
        )}
        {!draft.id && !!form?.others.length && (
          <p className="muted sa-times">{c.others(form.others.map(o => `${o.shopName} ${o.departTime}`).join('、'))}</p>
        )}

        {!form?.exactAddress && (
          <fieldset className="sa-points" disabled={locked || closed}>
            <legend>{c.formPoints}</legend>
            {!points.length && <p className="muted">{c.noPoints}</p>}
            {points.map(p => (
              <label key={p.name} className="sa-check">
                <input type="checkbox" checked={d.points.includes(p.name)}
                  onChange={e => set({ points: e.target.checked ? [...d.points, p.name] : d.points.filter(x => x !== p.name) })} />
                <span>{p.name}</span>
              </label>
            ))}
          </fieldset>
        )}

        <label className="sa-check sa-repeat">
          <input type="checkbox" checked={d.repeatWeekly} onChange={e => set({ repeatWeekly: e.target.checked })} />
          <span>{c.formRepeat}</span>
        </label>

        {error && <p className="imp-error" role="alert">{error}</p>}
        <div className="imp-actions">
          <button className="btn btn-primary" disabled={pending || (!closed && !locked && tooEarly)}>{pending ? c.saving : c.save}</button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>{c.close}</button>
        </div>
      </form>
    </div>
  )
}
