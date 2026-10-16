import ListPage from '@/components/ListPage'
import { modules } from '@/lib/modules'

export const metadata = {
  title: modules('zh').group.title,
  alternates: { languages: { en: '/en/groups' } }
}

export default function Page(props: PageProps<'/groups'>) {
  return <ListPage type="group" lang="zh" searchParams={props.searchParams} />
}
