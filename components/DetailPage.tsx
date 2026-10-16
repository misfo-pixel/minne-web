import Link from 'next/link'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import OpenInApp from './OpenInApp'
import { getPost } from '@/lib/feed'
import { modules, closedLabel, headline, rows, tabOf } from '@/lib/modules'
import { lp, type Lang } from '@/lib/i18n'
import type { PostType } from '@/lib/types'

export async function detailMetadata(type: PostType, params: Promise<{ id: string }>, lang: Lang = 'zh') {
  const { id } = await params
  const post = await getPost(type, id)
  if (!post) return { title: lang === 'en' ? 'Not found' : '内容不存在' }
  const head = headline(type, post, lang)
  return {
    title: head ? `${post.title} ${head}` : post.title,
    description: post.description?.slice(0, 120),
    openGraph: post.images?.[0] ? { images: [post.images[0]] } : undefined
  }
}

// params 只在 Suspense 里面读：先发静态外壳，帖子内容流式补上，补完的整页进 ISR 缓存
export default function DetailPage({ type, params, lang = 'zh' }: { type: PostType; params: Promise<{ id: string }>; lang?: Lang }) {
  return (
    <main className="wrap page">
      <Suspense fallback={<div className="detail"><div className="skeleton skeleton-tall" /></div>}>
        <Detail type={type} params={params} lang={lang} />
      </Suspense>
    </main>
  )
}

async function Detail({ type, params, lang }: { type: PostType; params: Promise<{ id: string }>; lang: Lang }) {
  const en = lang === 'en'
  const { id } = await params
  const post = await getPost(type, id)
  if (!post) notFound()
  const mod = modules(lang)[type]
  const base = lp(lang, mod.path)
  const closed = closedLabel(mod, post, lang)
  const tab = tabOf(mod, post.kind)
  const head = headline(type, post, lang)
  const images = post.images || []

  return (
    <>
      <nav className="crumbs">
        <Link href={base}>{mod.title}</Link>
        {tab && <> / <Link href={tab === mod.tabs![0] ? base : `${base}?kind=${tab.key}`}>{tab.label}</Link></>}
      </nav>

      {closed && <div className="closed-banner">{closed}</div>}

      <div className={images.length ? 'detail' : 'detail detail-noimg'}>
        {images.length > 0 && (
          <div className="gallery">
            {images.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noreferrer" className="gallery-item">
                <img src={src} alt={en ? `${post.title} photo ${i + 1}` : `${post.title} 第 ${i + 1} 张图`} loading={i ? 'lazy' : 'eager'} />
              </a>
            ))}
          </div>
        )}

        <div className="detail-info">
          <h1 className="detail-title">{post.title}</h1>
          {head && <div className="price detail-price">{head}</div>}

          {rows(type, post, lang).length > 0 && (
            <dl className="kv">
              {rows(type, post, lang).map(([k, v]) => (
                <div key={k} className="kv-row"><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          )}

          {post.description && <p className="detail-desc">{post.description}</p>}

          {!closed && (
            <div className="detail-cta">
              <OpenInApp lang={lang} label={mod.cta} hint={post.title} className="btn btn-primary btn-block" />
            </div>
          )}
          <p className="disclaimer">{en ? 'Posted by users. Inspect items in person and never pay in advance.' : '信息由用户发布，交易请当面验货，谨防先付款。'}</p>
        </div>
      </div>
    </>
  )
}
