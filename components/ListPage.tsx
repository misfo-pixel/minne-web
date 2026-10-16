import Link from 'next/link'
import { Suspense } from 'react'
import ModuleHead from './ModuleHead'
import OpenInApp from './OpenInApp'
import PostCard from './PostCard'
import { getList } from '@/lib/feed'
import { modules, tabOf } from '@/lib/modules'
import { lp, type Lang } from '@/lib/i18n'
import type { PostType } from '@/lib/types'

type Search = { [key: string]: string | string[] | undefined }

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v
}

// 四个帖子板块共用的列表页。翻页用链接（?page=2），不用无限滚动：
// 服务端渲染、能缓存，分享出去的链接也停在同一页。
// 页头不看网址参数，先作为静态外壳发出去；切换、搜索、列表要读 searchParams，放进 Suspense 里流式补上
export default function ListPage({ type, searchParams, lang = 'zh' }: { type: PostType; searchParams: Promise<Search>; lang?: Lang }) {
  const mod = modules(lang)[type]
  return (
    <main className="wrap page">
      <ModuleHead icon={mod.icon} tint={mod.tint} title={mod.title} sub={mod.sub}>
        <OpenInApp lang={lang} label={lang === 'en' ? '+ Post' : '+ 发布'} className="btn btn-primary btn-sm" />
      </ModuleHead>
      <Suspense fallback={<ListSkeleton />}>
        <ListBody type={type} searchParams={searchParams} lang={lang} />
      </Suspense>
    </main>
  )
}

function ListSkeleton() {
  return (
    <div className="post-grid" aria-busy="true">
      {Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton" />)}
    </div>
  )
}

async function ListBody({ type, searchParams, lang }: { type: PostType; searchParams: Promise<Search>; lang: Lang }) {
  const en = lang === 'en'
  const mod = modules(lang)[type]
  const base = lp(lang, mod.path)
  const sp = await searchParams
  const tab = tabOf(mod, one(sp.kind))
  const q = mod.searchable ? (one(sp.q) || '').trim() : ''
  const page = Math.max(1, Math.min(50, Number(one(sp.page)) || 1))
  const data = await getList(type, tab?.key, page, q)
  const items = data?.items || []

  const href = (p: number) => {
    const qs = new URLSearchParams()
    if (tab && tab !== mod.tabs![0]) qs.set('kind', tab.key)
    if (q) qs.set('q', q)
    if (p > 1) qs.set('page', String(p))
    const s = qs.toString()
    return s ? `${base}?${s}` : base
  }

  return (
    <>
      <div className="list-tools">
        {mod.tabs && (
          <div className="kind-switch" role="tablist">
            {mod.tabs.map(t => (
              <Link key={t.key} href={t === mod.tabs![0] ? base : `${base}?kind=${t.key}`}
                    className={t.key === tab?.key ? 'on' : ''} role="tab" aria-selected={t.key === tab?.key}>
                {t.label}
              </Link>
            ))}
          </div>
        )}
        {mod.searchable && (
          <form action={base} className="search">
            {tab && tab !== mod.tabs![0] && <input type="hidden" name="kind" value={tab.key} />}
            <input name="q" defaultValue={q} placeholder={en ? 'Search items' : '搜索商品'} aria-label={en ? 'Search items' : '搜索商品'} />
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <span className={`icon-box tint-${mod.tint}`}><img src={`/icons/${mod.icon}.svg`} alt="" /></span>
          <p>{q ? (en ? `Nothing found for “${q}”` : `没有找到「${q}」`) : page > 1 ? (en ? 'No more' : '没有更多了') : tab ? tab.empty : (en ? 'No errands yet' : '暂无委托')}</p>
        </div>
      ) : (
        <div className={items.some(i => i.thumb) ? 'post-grid' : 'text-list'}>
          {items.map(p => <PostCard key={p._id} type={type} post={p} lang={lang} />)}
        </div>
      )}

      {(page > 1 || (data && !data.noMore)) && (
        <nav className="pager" aria-label={en ? 'Pages' : '翻页'}>
          {page > 1 ? <Link href={href(page - 1)} className="btn btn-ghost">{en ? 'Previous' : '上一页'}</Link> : <span />}
          <span className="pager-num">{en ? `Page ${page}` : `第 ${page} 页`}</span>
          {data && !data.noMore ? <Link href={href(page + 1)} className="btn btn-ghost">{en ? 'Next' : '下一页'}</Link> : <span />}
        </nav>
      )}
    </>
  )
}
