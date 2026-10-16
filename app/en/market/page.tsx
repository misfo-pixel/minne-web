import ListPage from '@/components/ListPage'
import { modules } from '@/lib/modules'

export const metadata = {
  title: modules('en').item.title,
  alternates: { languages: { 'zh-CN': '/market' } }
}

export default function Page(props: PageProps<'/en/market'>) {
  return <ListPage type="item" lang="en" searchParams={props.searchParams} />
}
