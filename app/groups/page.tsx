import ListPage from '@/components/ListPage'
import { MODULES } from '@/lib/modules'

export const metadata = { title: MODULES.group.title }

export default function Page(props: PageProps<'/groups'>) {
  return <ListPage type="group" searchParams={props.searchParams} />
}
