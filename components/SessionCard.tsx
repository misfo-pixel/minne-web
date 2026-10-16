import Link from 'next/link'
import { cutoffText, longDate } from '@/lib/modules'
import { pointsText, progress } from '@/lib/groupbuy'
import type { Session } from '@/lib/types'
import { lp, type Lang } from '@/lib/i18n'

export default function SessionCard({ s, link = true, lang = 'zh' }: { s: Session; link?: boolean; lang?: Lang }) {
  const en = lang === 'en'
  const p = progress(s, lang)
  const dep = en ? `departs ${s.depart_time}` : `${s.depart_time} 出发`
  const body = (
    <>
      <div className="session-top">
        {s.shop_name && (s.logo
          ? <img src={s.logo} alt="" className="session-logo" />
          : <span className="session-logo session-logo-fallback"><img src="/icons/shop.svg" alt="" /></span>)}
        <div className="session-meta">
          <div className="session-name-row">
            <span className="session-name">{s.shop_name || `${longDate(s.date, lang)} ${dep}`}</span>
            {p.formed && !p.open && <span className="gb-sticker">{en ? 'Confirmed' : '已成团'}</span>}
          </div>
          {s.shop_name && <div className="session-when">{longDate(s.date, lang)} · {dep}</div>}
          <div className="session-points">{pointsText(s, lang)}</div>
        </div>
      </div>
      {!p.open && (
        <div className={`gb-bar${p.formed ? ' gb-bar-done' : ''}`}>
          <div className="gb-bar-fill" style={{ width: `${p.pct}%` }} />
        </div>
      )}
      <div className="gb-line">
        <span className={p.open ? 'gb-text-quiet' : 'gb-text'}>{p.text}</span>
        <span className="gb-cut">{en ? `Order by ${cutoffText(s.cutoff_at, lang)}` : `${cutoffText(s.cutoff_at)} 截单`}</span>
      </div>
    </>
  )
  if (link && s.shop_id) return <Link href={lp(lang, `/groupbuy/${s.shop_id}`)} className="session-card">{body}</Link>
  return <div className="session-card">{body}</div>
}
