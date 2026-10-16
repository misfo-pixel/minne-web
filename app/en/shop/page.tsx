import ShopPage from '@/components/ShopPage'
import { COPY } from '@/lib/shopCopy'

export const metadata = {
  title: COPY.en.pageTitle,
  description: COPY.en.pageDesc,
  robots: { index: false, follow: false },
  alternates: { languages: { 'zh-CN': '/shop' } }
}

export default function Page() {
  return <ShopPage lang="en" />
}
