import DetailPage, { detailMetadata } from '@/components/DetailPage'

export function generateMetadata(props: PageProps<'/groups/[id]'>) {
  return detailMetadata('group', props.params, 'zh')
}

export default function Page(props: PageProps<'/groups/[id]'>) {
  return <DetailPage type="group" lang="zh" params={props.params} />
}
