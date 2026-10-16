import ListPage from '@/components/ListPage'
import { modules } from '@/lib/modules'

export const metadata = {
  title: modules('zh').sublet.title,
  alternates: { languages: { en: '/en/sublet' } }
}

export default function Page(props: PageProps<'/sublet'>) {
  return <ListPage type="sublet" lang="zh" searchParams={props.searchParams} />
}
