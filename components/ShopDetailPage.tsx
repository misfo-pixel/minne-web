import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import OpenInApp from '@/components/OpenInApp'
import SessionCard from '@/components/SessionCard'
import { getShop } from '@/lib/feed'
import { lp, type Lang } from '@/lib/i18n'

export async function shopMetadata(params: Promise<{ id: string }>, lang: Lang = 'zh') {
  const { id } = await params
  const data = await getShop(id)
  if (!data) return { title: lang === 'en' ? 'Shop not found' : '店铺不存在' }
  return {
    title: data.shop.name,
    description: data.shop.slogan || data.shop.description,
    openGraph: data.shop.logo ? { images: [data.shop.logo] } : undefined
  }
}

export default function ShopDetailPage({ params, lang = 'zh' }: { params: Promise<{ id: string }>; lang?: Lang }) {
  return (
    <main className="wrap page">
      <Suspense fallback={<div className="skeleton skeleton-tall" />}>
        <Shop params={params} lang={lang} />
      </Suspense>
    </main>
  )
}

async function Shop({ params, lang }: { params: Promise<{ id: string }>; lang: Lang }) {
  const en = lang === 'en'
  const { id } = await params
  const data = await getShop(id)
  if (!data) notFound()
  const { shop, items, sessions } = data

  return (
    <>
      <nav className="crumbs"><Link href={lp(lang, '/groupbuy')}>{en ? 'Group buys' : '一起拼团'}</Link></nav>

      <div className="shop-head">
        {shop.logo ? <img src={shop.logo} alt="" className="shop-logo" />
          : <span className="shop-logo session-logo-fallback"><img src="/icons/shop.svg" alt="" /></span>}
        <div>
          <h1 className="shop-name">{shop.name}</h1>
          {shop.slogan && <div className="shop-slogan">{shop.slogan}</div>}
        </div>
      </div>
      {shop.description && <p className="detail-desc">{shop.description}</p>}

      <h2 className="section-title">{en ? 'Sessions' : '拼团场次'}</h2>
      {sessions.length ? (
        <div className="session-grid">
          {sessions.map((s, i) => <SessionCard key={s._id || i} s={s} link={false} lang={lang} />)}
        </div>
      ) : (
        <p className="muted">{en ? 'No group buys right now' : '暂无拼团'}</p>
      )}

      <h2 className="section-title">{en ? 'Products' : '商品'}</h2>
      <div className="goods-grid">
        {items.map(i => (
          <div key={i._id} className={i.available ? 'goods' : 'goods goods-off'}>
            {i.image ? <img src={i.image} alt="" loading="lazy" className="goods-img" />
              : <div className="goods-img goods-img-empty">{i.name.slice(0, 2)}</div>}
            <div className="goods-body">
              <div className="goods-name">{i.name}</div>
              {i.description && <div className="goods-desc">{i.description}</div>}
              <div className="goods-foot">
                <span className="price">${i.price}{i.unit ? <small>/{i.unit}</small> : null}</span>
                {!i.available && <span className="chip">{en ? 'Sold out' : '已售罄'}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="sticky-cta">
        <OpenInApp lang={lang} label={en ? (sessions.length ? 'Join in the mini program' : 'View in the mini program') : (sessions.length ? '去小程序参团' : '去小程序看看')} hint={en ? `一起拼团 (Group buys) → ${shop.name}` : `一起拼团 → ${shop.name}`} className="btn btn-primary btn-block" />
      </div>
    </>
  )
}
