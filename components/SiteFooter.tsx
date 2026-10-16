import type { Lang } from '@/lib/i18n'

export default function SiteFooter({ lang }: { lang: Lang }) {
  const en = lang === 'en'
  return (
    <footer className="site-footer">
      <div className="wrap">
        {en ? (
          <>
            <p>明尼助手 (MinnePal) is a WeChat mini program for Chinese students. This is the web version for browsing — to contact, order or post, please use the mini program in WeChat.</p>
            <p>明尼助手 is run independently by students and is not affiliated with the University of Minnesota.</p>
          </>
        ) : (
          <>
            <p>明尼助手是中国留学生的生活小程序。这里是网页浏览版，联系、下单和发布请在微信小程序里操作。</p>
            <p>明尼助手由学生独立运营，与明尼苏达大学没有隶属关系。</p>
          </>
        )}
      </div>
    </footer>
  )
}
