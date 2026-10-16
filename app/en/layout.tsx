import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'

// 英文页面（/en/…）共用的头尾
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader lang="en" />
      {children}
      <SiteFooter lang="en" />
    </>
  )
}
