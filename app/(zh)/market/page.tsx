import ListPage from '@/components/ListPage'
import { modules } from '@/lib/modules'

export const metadata = {
  title: modules('zh').item.title,
  alternates: { languages: { en: '/en/market' } }
}

export default function Page(props: PageProps<'/market'>) {
  return <ListPage type="item" lang="zh" searchParams={props.searchParams} />
}
