import Link from 'next/link'
import { lp, type Lang } from '@/lib/i18n'
import { modules, chips, headline } from '@/lib/modules'
import type { Post, PostType } from '@/lib/types'

// 有图的走图片卡（二手、转租、群组的「供」那一面），没图的走文字卡。
// 和小程序一样按「这一条有没有图」决定，不按板块写死
export default function PostCard({ type, post, lang = 'zh' }: { type: PostType; post: Post; lang?: Lang }) {
  const mod = modules(lang)[type]
  const href = lp(lang, `${mod.path}/${post._id}`)
  const head = headline(type, post, lang)
  const tags = chips(type, post, lang)

  if (post.thumb) {
    return (
      <Link href={href} className="post-card">
        <img src={post.thumb} alt="" loading="lazy" className="post-card-img" />
        <div className="post-card-body">
          <div className="post-card-title">{post.title}</div>
          {head && <div className="price">{head}</div>}
          {tags.length > 0 && <div className="post-card-tags">{tags.join(' · ')}</div>}
        </div>
      </Link>
    )
  }
  return (
    <Link href={href} className="text-card">
      <div className="text-card-head">
        <div className="text-card-title">{post.title}</div>
        {head && <div className="price">{head}</div>}
      </div>
      {post.description && <div className="text-card-desc">{post.description}</div>}
      {tags.length > 0 && (
        <div className="chip-row">
          {tags.map(t => <span key={t} className="chip">{t}</span>)}
        </div>
      )}
    </Link>
  )
}
