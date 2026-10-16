import MerchantPage from '@/components/MerchantPage'

export const metadata = {
  title: '商家入驻',
  description: '在明尼助手开一场团，凑够单再出发。不抽成，不经手资金，送到取货点。',
  alternates: { languages: { en: '/en/merchants' } }
}

export default function Page() {
  return <MerchantPage lang="zh" />
}
