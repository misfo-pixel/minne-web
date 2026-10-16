import Link from 'next/link'
import { Suspense } from 'react'
import LangSwitch from './LangSwitch'
import { lp, type Lang } from '@/lib/i18n'
import { moduleList } from '@/lib/modules'

export default function SiteHeader({ lang }: { lang: Lang }) {
  const en = lang === 'en'
  return (
    <header className="site-header">
      <div className="wrap site-header-inner">
        <Link href={lp(lang, '/')} className="brand">
          <img src="/loon-144.png" alt="" className="brand-logo" />
          <span className="brand-name">明尼助手</span>
        </Link>
        <nav className="site-nav" aria-label={en ? 'Sections' : '板块'}>
          {moduleList(lang).map(m => (
            <Link key={m.type} href={lp(lang, m.path)}>{m.title}</Link>
          ))}
          <Link href={lp(lang, '/groupbuy')}>{en ? 'Group buys' : '一起拼团'}</Link>
        </nav>
        <Suspense fallback={<LangSwitch lang={lang} fallback />}><LangSwitch lang={lang} /></Suspense>
        <Link href={lp(lang, '/merchants')} className="btn btn-gold btn-sm">{en ? 'For merchants' : '商家入驻'}</Link>
      </div>
    </header>
  )
}
