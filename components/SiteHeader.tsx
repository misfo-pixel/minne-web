import Link from 'next/link'
import { MODULE_LIST } from '@/lib/modules'

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap site-header-inner">
        <Link href="/" className="brand">
          <img src="/loon-144.png" alt="" className="brand-logo" />
          <span className="brand-name">明尼助手</span>
        </Link>
        <nav className="site-nav" aria-label="板块">
          {MODULE_LIST.map(m => (
            <Link key={m.type} href={m.path}>{m.title}</Link>
          ))}
          <Link href="/groupbuy">一起拼团</Link>
        </nav>
        <Link href="/merchants" className="btn btn-gold btn-sm">商家入驻</Link>
      </div>
    </header>
  )
}
