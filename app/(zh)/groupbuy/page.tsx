import GroupbuyPage from '@/components/GroupbuyPage'

export const metadata = {
  title: '一起拼团',
  description: '满单成团，送到学校。双城的亚超、家庭烘焙，凑够人一起送到取货点。',
  alternates: { languages: { en: '/en/groupbuy' } }
}

export default function Page() {
  return <GroupbuyPage lang="zh" />
}
