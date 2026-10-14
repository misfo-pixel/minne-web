import DetailPage, { detailMetadata } from '@/components/DetailPage'

export function generateMetadata(props: PageProps<'/groups/[id]'>) {
  return detailMetadata('group', props.params)
}

export default function Page(props: PageProps<'/groups/[id]'>) {
  return <DetailPage type="group" params={props.params} />
}
