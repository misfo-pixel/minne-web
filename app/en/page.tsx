import HomePage from '@/components/HomePage'

export const metadata = {
  title: { absolute: '明尼助手 · Minnesota life, all in one place' },
  description: 'The everyday app for Chinese students in Minnesota: marketplace, sublets, errands, groups and group buys.',
  alternates: { languages: { 'zh-CN': '/' } },
  openGraph: { locale: 'en_US' }
}

export default function Page() {
  return <HomePage lang="en" />
}
