import Link from 'next/link'
import ImportClient from '@/components/ImportClient'
import { COPY, type Lang } from '@/lib/importCopy'

// 导入菜单页的外壳，中英两版共用（/import 和 /en/import），文案在 lib/importCopy.ts
export default function ImportPage({ lang }: { lang: Lang }) {
  const c = COPY[lang]
  return (
    <main className="wrap page" lang={lang === 'en' ? 'en' : undefined}>
      <div className="page-head">
        <span className="icon-box tint-cream"><img src="/icons/shop.svg" alt="" /></span>
        <div className="page-head-text">
          <h1 className="page-head-title">{c.headTitle}</h1>
          <div className="page-head-sub">{c.headSub}</div>
        </div>
        <Link href={c.switchHref} className="page-lang" hrefLang={lang === 'zh' ? 'en' : 'zh-CN'}>{c.switchLabel}</Link>
      </div>
      <ImportClient lang={lang} />
    </main>
  )
}
