import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="wrap page">
      <div className="empty-state">
        <img src="/loon.svg" alt="" width={96} height={96} />
        <p>内容不存在，可能已经被删除了</p>
        <Link href="/" className="btn btn-primary">回首页</Link>
      </div>
    </main>
  )
}
