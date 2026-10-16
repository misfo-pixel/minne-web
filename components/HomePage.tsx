import Link from 'next/link'
import OpenInApp from '@/components/OpenInApp'
import PostCard from '@/components/PostCard'
import SessionCard from '@/components/SessionCard'
import { getHome, getShops } from '@/lib/feed'
import { moduleList } from '@/lib/modules'
import { lp, type Lang } from '@/lib/i18n'

export default async function HomePage({ lang = 'zh' }: { lang?: Lang }) {
  const en = lang === 'en'
  const L = (zh: string, e: string) => (en ? e : zh)
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
            <span className="kicker">{L('中国留学生的生活小程序', 'The everyday app for Chinese students')}</span>
            <h1 className="hero-title"><span>{L('明尼生活，', 'Minnesota life, ')}</span><em>{L('一站搞定', 'sorted')}</em></h1>
            <p className="hero-sub">{L('二手、转租、跑腿、找搭子、拼团。网页上先逛逛，联系和下单都在微信小程序里。', 'Second-hand, sublets, errands, buddies and group buys. Browse here; contact and order in the WeChat mini program.')}</p>
            <div className="hero-actions">
              <OpenInApp lang={lang} label={L('打开小程序', 'Open mini program')} className="btn btn-primary btn-lg" />
              <Link href={lp(lang, '/market')} className="btn btn-ghost btn-lg">{L('先逛二手', 'Browse marketplace')}</Link>
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
        {moduleList(lang).map(m => (
          <Link key={m.type} href={lp(lang, m.path)} className={`tile tile-${m.tint}`}>
            <span className={`icon-box tint-${m.tint}`}><img src={`/icons/${m.icon}.svg`} alt="" /></span>
            <span className="tile-title">{m.title}</span>
            <span className="tile-sub">{m.sub}</span>
            {counts && counts[m.type] > 0 && <span className="tile-count">{counts[m.type]} {m.unit}</span>}
          </Link>
        ))}
        <Link href={lp(lang, '/groupbuy')} className="tile tile-cream">
          <span className="icon-box tint-cream"><img src="/icons/shop.svg" alt="" /></span>
          <span className="tile-title">{L('一起拼团', 'Group buys')}</span>
          <span className="tile-sub">{L('满单成团，送到学校', 'Fill the order, delivered to campus')}</span>
          {sessions.length > 0 && <span className="tile-count">{shops!.sessions.length} {L('场拼团中', 'open now')}</span>}
        </Link>
      </section>

      {latest.length > 0 && (
        <section className="wrap home-section">
          <div className="section-row">
            <h2 className="display-title">{L('刚上架的二手', 'Just listed')}</h2>
            <Link href={lp(lang, '/market')} className="more">{L('查看全部', 'See all')} →</Link>
          </div>
          <div className="post-grid">
            {latest.map(p => <PostCard key={p._id} type="item" post={p} lang={lang} />)}
          </div>
        </section>
      )}

      {sessions.length > 0 && (
        <section className="wrap home-section">
          <div className="section-row">
            <h2 className="display-title">{L('正在拼团', 'Group buys open')}</h2>
            <Link href={lp(lang, '/groupbuy')} className="more">{L('查看全部', 'See all')} →</Link>
          </div>
          <div className="session-grid">
            {sessions.map(s => <SessionCard key={s._id} s={s} lang={lang} />)}
          </div>
        </section>
      )}

      <section className="wrap home-section">
        <Link href={lp(lang, '/merchants')} className="merchant-band">
          <span className="merchant-band-kicker">{L('商家入驻', 'For merchants')}</span>
          <span className="merchant-band-title">{L('你的好手艺，值得更多人知道', 'Your craft deserves a bigger audience')}</span>
          <span className="merchant-band-sub">{L('开一场团，凑够单再出发。不抽成，不经手钱。', 'Open a group buy and only go once it fills. No commission, we never touch your money.')}</span>
          <span className="merchant-band-go">{L('了解怎么开团', 'See how it works')} →</span>
        </Link>
      </section>

      <section className="wrap home-section app-card">
        <img src="/sou-combo.png" alt={L('明尼助手小程序码，微信搜一搜：明尼助手', '明尼助手 mini program code — search 明尼助手 in WeChat')} />
        <p>{L('微信扫码，或搜一搜「明尼助手」', 'Scan with WeChat, or search “明尼助手”')}</p>
      </section>
    </main>
  )
}
