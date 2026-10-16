import DetailPage, { detailMetadata } from '@/components/DetailPage'

export function generateMetadata(props: PageProps<'/tasks/[id]'>) {
  return detailMetadata('task', props.params, 'zh')
}

export default function Page(props: PageProps<'/tasks/[id]'>) {
  return <DetailPage type="task" lang="zh" params={props.params} />
}
