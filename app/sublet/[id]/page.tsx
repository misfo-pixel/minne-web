import DetailPage, { detailMetadata } from '@/components/DetailPage'

export function generateMetadata(props: PageProps<'/sublet/[id]'>) {
  return detailMetadata('sublet', props.params)
}

export default function Page(props: PageProps<'/sublet/[id]'>) {
  return <DetailPage type="sublet" params={props.params} />
}
