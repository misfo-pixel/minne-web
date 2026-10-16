import ShopDetailPage, { shopMetadata } from '@/components/ShopDetailPage'

export function generateMetadata(props: PageProps<'/en/groupbuy/[id]'>) {
  return shopMetadata(props.params, 'en')
}

export default function Page(props: PageProps<'/en/groupbuy/[id]'>) {
  return <ShopDetailPage params={props.params} lang="en" />
}
