import Link from 'next/link'
import ModuleHead from '@/components/ModuleHead'
import SessionCard from '@/components/SessionCard'
import { getShops } from '@/lib/feed'
import { longDate } from '@/lib/modules'
import type { Session } from '@/lib/types'

export const metadata = { title: '一起拼团', description: '满单成团，送到学校。双城的亚超、家庭烘焙，凑够人一起送到取货点。' }

export default async function Page() {
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
      <ModuleHead icon="shop" tint="cream" title="一起拼团" sub="满单成团，送到学校">
        <Link href="/merchants" className="btn btn-ghost btn-sm">我要开团</Link>
      </ModuleHead>

      {days.length === 0 && (
        <div className="empty-state">
          <span className="icon-box tint-cream"><img src="/icons/shop.svg" alt="" /></span>
          <p>暂无拼团</p>
        </div>
      )}

      {days.map(d => (
        <section key={d.date} className="day">
          <h2 className="day-title">{longDate(d.date)}</h2>
          <div className="session-grid">
            {d.list.map(s => <SessionCard key={s._id} s={s} />)}
          </div>
        </section>
      ))}

      {shops.length > 0 && (
        <section className="day">
          <h2 className="day-title day-title-quiet">更多店铺</h2>
          <div className="shop-list">
            {shops.map(s => (
              <Link key={s._id} href={`/groupbuy/${s._id}`} className="shop-row">
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
