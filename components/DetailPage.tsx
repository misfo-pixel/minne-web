import Link from 'next/link'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import OpenInApp from './OpenInApp'
import { getPost } from '@/lib/feed'
import { MODULES, closedLabel, headline, rows, tabOf } from '@/lib/modules'
import type { PostType } from '@/lib/types'

export async function detailMetadata(type: PostType, params: Promise<{ id: string }>) {
  const { id } = await params
  const post = await getPost(type, id)
  if (!post) return { title: '内容不存在' }
  const head = headline(type, post)
  return {
    title: head ? `${post.title} ${head}` : post.title,
    description: post.description?.slice(0, 120),
    openGraph: post.images?.[0] ? { images: [post.images[0]] } : undefined
  }
}

// params 只在 Suspense 里面读：先发静态外壳，帖子内容流式补上，补完的整页进 ISR 缓存
export default function DetailPage({ type, params }: { type: PostType; params: Promise<{ id: string }> }) {
  return (
    <main className="wrap page">
      <Suspense fallback={<div className="detail"><div className="skeleton skeleton-tall" /></div>}>
        <Detail type={type} params={params} />
      </Suspense>
    </main>
  )
}

async function Detail({ type, params }: { type: PostType; params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPost(type, id)
  if (!post) notFound()
  const mod = MODULES[type]
  const closed = closedLabel(mod, post)
  const tab = tabOf(mod, post.kind)
  const head = headline(type, post)
  const images = post.images || []

  return (
    <>
      <nav className="crumbs">
        <Link href={mod.path}>{mod.title}</Link>
        {tab && <> / <Link href={tab === mod.tabs![0] ? mod.path : `${mod.path}?kind=${tab.key}`}>{tab.label}</Link></>}
      </nav>

      {closed && <div className="closed-banner">{closed}</div>}

      <div className={images.length ? 'detail' : 'detail detail-noimg'}>
        {images.length > 0 && (
          <div className="gallery">
            {images.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noreferrer" className="gallery-item">
                <img src={src} alt={`${post.title} 第 ${i + 1} 张图`} loading={i ? 'lazy' : 'eager'} />
              </a>
            ))}
          </div>
        )}

        <div className="detail-info">
          <h1 className="detail-title">{post.title}</h1>
          {head && <div className="price detail-price">{head}</div>}

          {rows(type, post).length > 0 && (
            <dl className="kv">
              {rows(type, post).map(([k, v]) => (
                <div key={k} className="kv-row"><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          )}

          {post.description && <p className="detail-desc">{post.description}</p>}

          {!closed && (
            <div className="detail-cta">
              <OpenInApp label={mod.cta} hint={post.title} className="btn btn-primary btn-block" />
            </div>
          )}
          <p className="disclaimer">信息由用户发布，交易请当面验货，谨防先付款。</p>
        </div>
      </div>
    </>
  )
}
