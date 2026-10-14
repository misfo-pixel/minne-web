import type { ReactNode } from 'react'

export default function ModuleHead({ icon, tint, title, sub, children }:
  { icon: string; tint: string; title: string; sub: string; children?: ReactNode }) {
  return (
    <div className="page-head">
      <span className={`icon-box tint-${tint}`}><img src={`/icons/${icon}.svg`} alt="" /></span>
      <div className="page-head-text">
        <h1 className="page-head-title">{title}</h1>
        <div className="page-head-sub">{sub}</div>
      </div>
      {children}
    </div>
  )
}
