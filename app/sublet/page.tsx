import ListPage from '@/components/ListPage'
import { MODULES } from '@/lib/modules'

export const metadata = { title: MODULES.sublet.title }

export default function Page(props: PageProps<'/sublet'>) {
  return <ListPage type="sublet" searchParams={props.searchParams} />
}
