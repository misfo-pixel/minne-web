import ImportPage from '@/components/ImportPage'
import { COPY } from '@/lib/importCopy'

export const metadata = {
  title: COPY.en.pageTitle,
  description: COPY.en.pageDesc,
  robots: { index: false },
  alternates: { languages: { 'zh-CN': '/import' } }
}

export default function Page() {
  return <ImportPage lang="en" />
}
