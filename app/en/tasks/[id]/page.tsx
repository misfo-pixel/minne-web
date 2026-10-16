import DetailPage, { detailMetadata } from '@/components/DetailPage'

export function generateMetadata(props: PageProps<'/en/tasks/[id]'>) {
  return detailMetadata('task', props.params, 'en')
}

export default function Page(props: PageProps<'/en/tasks/[id]'>) {
  return <DetailPage type="task" lang="en" params={props.params} />
}
