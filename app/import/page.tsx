import ImportPage from '@/components/ImportPage'
import { COPY } from '@/lib/importCopy'

export const metadata = {
  title: COPY.zh.pageTitle,
  description: COPY.zh.pageDesc,
  robots: { index: false },
  alternates: { languages: { en: '/en/import' } }
}

export default function Page() {
  return <ImportPage lang="zh" />
}
