import ListPage from '@/components/ListPage'
import { modules } from '@/lib/modules'

export const metadata = {
  title: modules('zh').task.title,
  alternates: { languages: { en: '/en/tasks' } }
}

export default function Page(props: PageProps<'/tasks'>) {
  return <ListPage type="task" lang="zh" searchParams={props.searchParams} />
}
