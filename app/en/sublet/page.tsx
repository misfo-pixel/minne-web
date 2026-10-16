import ListPage from '@/components/ListPage'
import { modules } from '@/lib/modules'

export const metadata = {
  title: modules('en').sublet.title,
  alternates: { languages: { 'zh-CN': '/sublet' } }
}

export default function Page(props: PageProps<'/en/sublet'>) {
  return <ListPage type="sublet" lang="en" searchParams={props.searchParams} />
}
