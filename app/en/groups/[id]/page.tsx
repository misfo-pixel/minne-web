import DetailPage, { detailMetadata } from '@/components/DetailPage'

export function generateMetadata(props: PageProps<'/en/groups/[id]'>) {
  return detailMetadata('group', props.params, 'en')
}

export default function Page(props: PageProps<'/en/groups/[id]'>) {
  return <DetailPage type="group" lang="en" params={props.params} />
}
