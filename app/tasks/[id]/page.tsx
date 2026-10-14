import DetailPage, { detailMetadata } from '@/components/DetailPage'

export function generateMetadata(props: PageProps<'/tasks/[id]'>) {
  return detailMetadata('task', props.params)
}

export default function Page(props: PageProps<'/tasks/[id]'>) {
  return <DetailPage type="task" params={props.params} />
}
