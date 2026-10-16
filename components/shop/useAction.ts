'use client'

import { useCallback, useState, useTransition } from 'react'
import { localizeError, type Lang } from '@/lib/shopCopy'
import type { Result } from '@/lib/shopTypes'

// 店长后台各块共用：跑一个服务器动作，统一处理出错、登录失效、网络断了。
// 返回值是动作成功时的结果，失败时为 null（错误已经放进 error 里了）。
export function useAction(lang: Lang, onAuthLost: () => void, networkError: string) {
  const [pending, start] = useTransition()
  const [error, setError] = useState('')

  const run = useCallback(<T extends object>(fn: () => Promise<Result<T>>, then?: (r: { ok: true } & T) => void) => {
    setError('')
    start(async () => {
      try {
        const r = await fn()
        if (!r.ok) {
          if (r.auth) onAuthLost()
          else setError(localizeError(r.message, lang))
          return
        }
        then?.(r)
      } catch {
        setError(networkError)
      }
    })
  }, [lang, onAuthLost, networkError])

  return { pending, error, setError, run }
}
