import HomePage from '@/components/HomePage'

export const metadata = { alternates: { languages: { en: '/en' } } }

export default function Page() {
  return <HomePage lang="zh" />
}
