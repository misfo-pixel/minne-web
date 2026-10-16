import ListPage from '@/components/ListPage'
import { modules } from '@/lib/modules'

export const metadata = {
  title: modules('en').task.title,
  alternates: { languages: { 'zh-CN': '/tasks' } }
}

export default function Page(props: PageProps<'/en/tasks'>) {
  return <ListPage type="task" lang="en" searchParams={props.searchParams} />
}
