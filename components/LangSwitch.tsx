'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { lp, switchPath, type Lang } from '@/lib/i18n'

// 顶部的中/EN 切换：跳到当前页面的另一种语言版本。
// 读网址要放在 Suspense 里；预渲染时先给一个跳到另一语言首页的链接
export default function LangSwitch({ lang, fallback }: { lang: Lang; fallback?: boolean }) {
  const en = lang === 'en'
  const label = en ? '中文' : 'EN'
  const hrefLang = en ? 'zh-CN' : 'en'
  if (fallback) return <Link href={lp(en ? 'zh' : 'en', '/')} className="page-lang" hrefLang={hrefLang}>{label}</Link>
  return <Current label={label} hrefLang={hrefLang} />
}

function Current({ label, hrefLang }: { label: string; hrefLang: string }) {
  const pathname = usePathname() || '/'
  return <Link href={switchPath(pathname)} className="page-lang" hrefLang={hrefLang}>{label}</Link>
}
