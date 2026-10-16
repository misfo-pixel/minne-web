import ShopAdmin from '@/components/shop/ShopAdmin'
import { COPY, type Lang } from '@/lib/shopCopy'

// 店长后台的外壳，中英两版共用（/shop 和 /en/shop），文案在 lib/shopCopy.ts。
// 外壳是静态的；登录、读数据都在 ShopAdmin 里通过服务器动作做，不在渲染时读 cookie
export default function ShopPage({ lang }: { lang: Lang }) {
  const c = COPY[lang]
  return (
    <main className="wrap page" lang={lang === 'en' ? 'en' : undefined}>
      <div className="page-head">
        <span className="icon-box tint-cream"><img src="/icons/shop.svg" alt="" /></span>
        <div className="page-head-text">
          <h1 className="page-head-title">{c.pageTitle}</h1>
          <div className="page-head-sub">{c.headSub}</div>
        </div>
      </div>
      <ShopAdmin lang={lang} />
    </main>
  )
}
