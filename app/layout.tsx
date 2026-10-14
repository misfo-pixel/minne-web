import type { Metadata, Viewport } from 'next'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  title: { default: '明尼助手 · 明尼生活，一站搞定', template: '%s · 明尼助手' },
  description: '明大中国同学的生活小程序：二手市场、公寓转租、任务委托、兴趣群组、一起拼团。',
  openGraph: { siteName: '明尼助手', locale: 'zh_CN', type: 'website' }
}

export const viewport: Viewport = { themeColor: '#7A0019' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 展示字体：黄油体（和海报、小程序首页同一款）。中文字体 Google Fonts 会按字切片，只下用到的字 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=ZCOOL+QingKe+HuangYou&family=Bricolage+Grotesque:opsz,wght@12..96,800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
