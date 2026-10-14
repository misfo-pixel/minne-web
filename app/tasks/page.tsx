import ListPage from '@/components/ListPage'
import { MODULES } from '@/lib/modules'

export const metadata = { title: MODULES.task.title }

export default function Page(props: PageProps<'/tasks'>) {
  return <ListPage type="task" searchParams={props.searchParams} />
}
