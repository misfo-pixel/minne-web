import Link from 'next/link'
import ModuleHead from '@/components/ModuleHead'
import SessionCard from '@/components/SessionCard'
import { getShops } from '@/lib/feed'
import { longDate } from '@/lib/modules'
import type { Session } from '@/lib/types'
import { lp, type Lang } from '@/lib/i18n'

export default async function GroupbuyPage({ lang = 'zh' }: { lang?: Lang }) {
  const en = lang === 'en'
  const data = await getShops()
  const sessions = data?.sessions || []
  const shops = data?.shops || []

  // 按送达日分组，和小程序拼团列表一样
  const days: { date: string; list: Session[] }[] = []
  sessions.forEach(s => {
    const last = days[days.length - 1]
    if (last && last.date === s.date) last.list.push(s)
    else days.push({ date: s.date, list: [s] })
  })

  return (
    <main className="wrap page">
      <ModuleHead icon="shop" tint="cream" title={en ? 'Group buys' : '一起拼团'} sub={en ? 'Fill the order, delivered to campus' : '满单成团，送到学校'}>
        <Link href={lp(lang, '/merchants')} className="btn btn-ghost btn-sm">{en ? 'Open a group buy' : '我要开团'}</Link>
      </ModuleHead>

      {days.length === 0 && (
        <div className="empty-state">
          <span className="icon-box tint-cream"><img src="/icons/shop.svg" alt="" /></span>
          <p>{en ? 'No group buys right now' : '暂无拼团'}</p>
        </div>
      )}

      {days.map(d => (
        <section key={d.date} className="day">
          <h2 className="day-title">{longDate(d.date, lang)}</h2>
          <div className="session-grid">
            {d.list.map(s => <SessionCard key={s._id} s={s} lang={lang} />)}
          </div>
        </section>
      ))}

      {shops.length > 0 && (
        <section className="day">
          <h2 className="day-title day-title-quiet">{en ? 'More shops' : '更多店铺'}</h2>
          <div className="shop-list">
            {shops.map(s => (
              <Link key={s._id} href={lp(lang, `/groupbuy/${s._id}`)} className="shop-row">
                {s.logo ? <img src={s.logo} alt="" className="session-logo" />
                  : <span className="session-logo session-logo-fallback"><img src="/icons/shop.svg" alt="" /></span>}
                <div>
                  <div className="session-name">{s.name}</div>
                  {s.description && <div className="session-points">{s.description}</div>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
