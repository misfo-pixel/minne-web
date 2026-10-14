import MerchantPage from '@/components/MerchantPage'

export const metadata = {
  title: 'Sell to UMN students',
  description: 'Open a group-buy session on 明尼助手 and only go once it fills. No commission, we never touch your money.',
  alternates: { languages: { 'zh-CN': '/merchants' } }
}

export default function Page() {
  return <MerchantPage lang="en" />
}
