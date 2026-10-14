import ListPage from '@/components/ListPage'
import { MODULES } from '@/lib/modules'

export const metadata = { title: MODULES.item.title }

export default function Page(props: PageProps<'/market'>) {
  return <ListPage type="item" searchParams={props.searchParams} />
}
