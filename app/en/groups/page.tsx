import ListPage from '@/components/ListPage'
import { modules } from '@/lib/modules'

export const metadata = {
  title: modules('en').group.title,
  alternates: { languages: { 'zh-CN': '/groups' } }
}

export default function Page(props: PageProps<'/en/groups'>) {
  return <ListPage type="group" lang="en" searchParams={props.searchParams} />
}
