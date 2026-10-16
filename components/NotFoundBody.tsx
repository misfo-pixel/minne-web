import Link from 'next/link'
import type { Lang } from '@/lib/i18n'

export default function NotFoundBody({ lang }: { lang: Lang }) {
  const en = lang === 'en'
  return (
    <main className="wrap page">
      <div className="empty-state">
        <img src="/loon.svg" alt="" width={96} height={96} />
        <p>{en ? 'This page doesn’t exist — it may have been deleted.' : '内容不存在，可能已经被删除了'}</p>
        <Link href={en ? '/en' : '/'} className="btn btn-primary">{en ? 'Back to home' : '回首页'}</Link>
      </div>
    </main>
  )
}
