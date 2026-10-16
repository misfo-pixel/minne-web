'use client'

import { useRef } from 'react'

// 网页只能看，要联系、下单、发布都得进小程序。点按钮弹出小程序码 + 搜一搜。
// 网页上拿不到每条帖子自己的小程序码（生成要走 cloud.openapi，只能从小程序端触发），
// 所以统一给首页码，再把帖子标题摆出来，进小程序后好找。
export default function OpenInApp({ label, hint, className, lang = 'zh' }: { label: string; hint?: string; className?: string; lang?: 'zh' | 'en' }) {
  const en = lang === 'en'
  const ref = useRef<HTMLDialogElement>(null)
  return (
    <>
      <button type="button" className={className || 'btn btn-primary'} onClick={() => ref.current?.showModal()}>
        {label}
      </button>
      <dialog
        ref={ref}
        className="app-dialog"
        onClick={e => {
          if (e.target === ref.current) ref.current?.close()   // 点遮罩关闭
        }}
      >
        <div className="app-dialog-body">
          <button type="button" className="app-dialog-close" aria-label={en ? 'Close' : '关闭'} onClick={() => ref.current?.close()}>
            ×
          </button>
          <div className="app-dialog-title">{en ? 'Continue in the 明尼助手 mini program' : '在明尼助手小程序里继续'}</div>
          <img src="/sou-combo.png" alt="明尼助手小程序码，微信搜一搜：明尼助手" className="app-dialog-code" />
          <p className="app-dialog-text">{en ? 'Scan with WeChat, or search “明尼助手” in WeChat' : '微信扫码，或在微信里搜「明尼助手」'}</p>
          {hint && <p className="app-dialog-hint">{en ? 'Then look for: ' : '进去后找：'}{hint}</p>}
        </div>
      </dialog>
    </>
  )
}
