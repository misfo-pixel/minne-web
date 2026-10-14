import ImportClient from '@/components/ImportClient'

export const metadata = {
  title: '导入菜单',
  description: '贴菜单链接、文字或照片，AI 整理成商品表，回到明尼助手小程序一次上架。',
  robots: { index: false }
}

export default function Page() {
  return (
    <main className="wrap page">
      <div className="page-head">
        <span className="icon-box tint-cream"><img src="/icons/shop.svg" alt="" /></span>
        <div className="page-head-text">
          <h1 className="page-head-title">导入菜单</h1>
          <div className="page-head-sub">贴链接、贴文字或拍照，AI 整理好，回小程序一次上架</div>
        </div>
      </div>
      <ImportClient />
    </main>
  )
}
