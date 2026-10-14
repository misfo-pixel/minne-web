import Link from 'next/link'
import OpenInApp from '@/components/OpenInApp'
import PostCard from '@/components/PostCard'
import SessionCard from '@/components/SessionCard'
import { getHome, getShops } from '@/lib/feed'
import { MODULE_LIST } from '@/lib/modules'

export default async function Home() {
  const [home, shops] = await Promise.all([getHome(), getShops()])
  const counts = home?.counts
  const sessions = (shops?.sessions || []).slice(0, 3)
  // 桌面一行 4 件，取满整行，别剩一件孤零零地挂在下面
  const latest = home ? home.latest.slice(0, home.latest.length >= 8 ? 8 : 4) : []

  return (
    <main>
      <section className="hero">
        <div className="wrap hero-row">
          <div className="hero-copy">
            <span className="kicker">明大中国同学的生活小程序</span>
            <h1 className="hero-title"><span>明尼生活，</span><em>一站搞定</em></h1>
            <p className="hero-sub">二手、转租、跑腿、找搭子、拼团。网页上先逛逛，联系和下单都在微信小程序里。</p>
            <div className="hero-actions">
              <OpenInApp label="打开小程序" className="btn btn-primary btn-lg" />
              <Link href="/market" className="btn btn-ghost btn-lg">先逛二手</Link>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span className="tape tape-a" />
            <img src="/loon.svg" alt="" className="hero-loon" />
            <svg className="spark spark-a" viewBox="0 0 24 24"><path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" /></svg>
            <svg className="spark spark-b" viewBox="0 0 24 24"><path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" /></svg>
          </div>
        </div>
      </section>

      <section className="wrap tiles">
        {MODULE_LIST.map(m => (
          <Link key={m.type} href={m.path} className={`tile tile-${m.tint}`}>
            <span className={`icon-box tint-${m.tint}`}><img src={`/icons/${m.icon}.svg`} alt="" /></span>
            <span className="tile-title">{m.title}</span>
            <span className="tile-sub">{m.sub}</span>
            {counts && counts[m.type] > 0 && <span className="tile-count">{counts[m.type]} {m.unit}</span>}
          </Link>
        ))}
        <Link href="/groupbuy" className="tile tile-cream">
          <span className="icon-box tint-cream"><img src="/icons/shop.svg" alt="" /></span>
          <span className="tile-title">一起拼团</span>
          <span className="tile-sub">满单成团，送到学校</span>
          {sessions.length > 0 && <span className="tile-count">{shops!.sessions.length} 场拼团中</span>}
        </Link>
      </section>

      {latest.length > 0 && (
        <section className="wrap home-section">
          <div className="section-row">
            <h2 className="display-title">刚上架的二手</h2>
            <Link href="/market" className="more">查看全部 →</Link>
          </div>
          <div className="post-grid">
            {latest.map(p => <PostCard key={p._id} type="item" post={p} />)}
          </div>
        </section>
      )}

      {sessions.length > 0 && (
        <section className="wrap home-section">
          <div className="section-row">
            <h2 className="display-title">正在拼团</h2>
            <Link href="/groupbuy" className="more">查看全部 →</Link>
          </div>
          <div className="session-grid">
            {sessions.map(s => <SessionCard key={s._id} s={s} />)}
          </div>
        </section>
      )}

      <section className="wrap home-section">
        <Link href="/merchants" className="merchant-band">
          <span className="merchant-band-kicker">商家入驻</span>
          <span className="merchant-band-title">想把好东西卖给明大同学？</span>
          <span className="merchant-band-sub">开一场团，凑够单再出发。不抽成，不经手钱。</span>
          <span className="merchant-band-go">了解怎么开团 →</span>
        </Link>
      </section>

      <section className="wrap home-section app-card">
        <img src="/sou-combo.png" alt="明尼助手小程序码，微信搜一搜：明尼助手" />
        <p>微信扫码，或搜一搜「明尼助手」</p>
      </section>
    </main>
  )
}
