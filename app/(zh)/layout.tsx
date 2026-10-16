import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'

// 中文页面共用的头尾
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader lang="zh" />
      {children}
      <SiteFooter lang="zh" />
    </>
  )
}
