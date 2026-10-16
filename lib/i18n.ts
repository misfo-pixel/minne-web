// 中英两版：中文在原网址，英文在 /en 前缀下（/en、/en/market、/en/market/xxx …）。
// 帖子、店铺这些用户发的内容不翻译，只翻译界面文字。
export type Lang = 'zh' | 'en'

export function pick<T>(lang: Lang, zh: T, en: T): T {
  return lang === 'en' ? en : zh
}

// 站内链接加语言前缀
export function lp(lang: Lang, path: string): string {
  if (lang !== 'en') return path
  return path === '/' ? '/en' : '/en' + path
}

export function langOf(pathname: string): Lang {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'zh'
}

// 当前页面的另一种语言版本
export function switchPath(pathname: string): string {
  if (langOf(pathname) === 'en') return pathname.slice(3) || '/'
  return pathname === '/' ? '/en' : '/en' + pathname
}
