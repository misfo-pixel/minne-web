import ShopDetailPage, { shopMetadata } from '@/components/ShopDetailPage'

export function generateMetadata(props: PageProps<'/groupbuy/[id]'>) {
  return shopMetadata(props.params, 'zh')
}

export default function Page(props: PageProps<'/groupbuy/[id]'>) {
  return <ShopDetailPage params={props.params} lang="zh" />
}
