import GroupbuyPage from '@/components/GroupbuyPage'

export const metadata = {
  title: 'Group buys',
  description: 'Asian groceries and home bakers in the Twin Cities — once enough people order, it gets delivered to a pickup point.',
  alternates: { languages: { 'zh-CN': '/groupbuy' } }
}

export default function Page() {
  return <GroupbuyPage lang="en" />
}
