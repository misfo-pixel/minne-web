import ShopPage from '@/components/ShopPage'
import { COPY } from '@/lib/shopCopy'

export const metadata = {
  title: COPY.zh.pageTitle,
  description: COPY.zh.pageDesc,
  robots: { index: false, follow: false },
  alternates: { languages: { en: '/en/shop' } }
}

export default function Page() {
  return <ShopPage lang="zh" />
}
