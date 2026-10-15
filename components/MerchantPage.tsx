import Link from 'next/link'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { ReactNode } from 'react'

// 商家入驻宣传页，中英两版共用一个模板。文案来自仓库外的 merchant-guide/guide.html 和 guide-en.html，
// 截图也是从那边拷来的（public/merchants/zh|en）。改说法时两边一起改。
// 对外一律说「入驻商家」，不说「合作商家」——《商家责任告知书》写明商家不是平台的合作方。

const EMAIL = 'yang9926@umn.edu'

// 推荐取货点。和小程序开店向导预填的两个点一致（campus-helper miniprogram/utils/shopForm.js），改名字两边一起改。
// 地图用 Google 地图按地址嵌入，不用 API key。照片放 public/merchants/points/<photo>，文件在就显示，没有就只显示地图
type Point = { name: string; address: string; photo: string }
const POINTS: Point[] = [
  { name: 'Fresh Thyme 30th Ave', address: 'Fresh Thyme Market, 24 30th Ave SE, Minneapolis, MN 55414', photo: 'freshthyme.jpg' },
  { name: 'Macalester College', address: 'Macalester College, 1600 Grand Ave, St Paul, MN 55105', photo: 'macalester.jpg' }
]
const hasPhoto = (file: string) => existsSync(path.join(process.cwd(), 'public', 'merchants', 'points', file))

type Copy = {
  lang: 'zh' | 'en'
  switchLabel: string
  switchHref: string
  kicker: string
  title: ReactNode
  sub: string
  apply: string
  applySubject: string
  howLink: string
  badges: string[]
  whyTitle: string
  why: { title: string; text: string }[]
  pointsTitle: string
  pointsSub: string
  pointText: string[]
  mapLink: string
  howTitle: string
  steps: { title: string; text: string; img: string }[]
  faqTitle: string
  faq: { q: string; a: string }[]
  endTitle: string
  endSub: string
  scan: string
}

const ZH: Copy = {
  lang: 'zh',
  switchLabel: 'English',
  switchHref: '/en/merchants',
  kicker: '商家入驻 · 一起拼团',
  title: <>凑够单，<em>再出发</em></>,
  sub: '想把拿手菜、亚超好货、家庭烘焙卖给明大同学，又怕备了货没人买、跑一趟只送两三单？在明尼助手开一场团，人够了再出发。',
  apply: '申请开店码',
  applySubject: '开店',
  howLink: '看看怎么开团',
  badges: ['不抽成', '不经手资金', '满单才出发'],
  whyTitle: '明尼助手能帮你做什么',
  why: [
    { title: '不够门槛，不用出发', text: '每场团设一个成团门槛，比如 10 单。截单时没凑够，这场团和里面的订单自动取消，不用白跑一趟。' },
    { title: '一次做一批，价格可以更低', text: '拼团是先收单、再一起做：一次出几十份，备料、出餐、跑一趟的成本都摊薄了。菜单不用长，挑三五样拿手菜，价格比堂食低一点，更容易凑够单。' },
    { title: '送到一个点，不用挨家送', text: '取货点你自己定，每个点的配送费也你自己定。' },
    { title: '钱的事，你和买家自己定', text: '明尼助手只帮你记下谁要了什么，不经手任何资金，也不从你的单里抽成。' },
    { title: '一键出海报', text: '开团后点一下，生成列出商品、取货点和截单时间的长图海报，底部带小程序码。发朋友圈、发群，买家长按识别就能下单。' }
  ],
  pointsTitle: '推荐取货点',
  pointsSub: '开店时这两个点已经帮你填好，可以改、删，也可以再加自己的点。UMN 校区的点各家出发地不同，开店时自己加上。',
  pointText: [
    'UMN 东边 Prospect Park，University Ave 和 30th Ave 路口。学生常来买菜，名字好记，门口好找。',
    '在 St Paul。学校不大，约在校区就能找到人。比 Fresh Thyme 远，路上大约多 25 分钟。'
  ],
  mapLink: '在 Google 地图打开',
  howTitle: '开一场团，五步',
  steps: [
    { title: '上架商品', text: '在「我的小店」点「商品管理」→「添加商品」，只有名称和价格是必填。菜单长的话点「从网页导入菜单」，在 minnepal.com/import 贴菜单链接、文字或照片，回小程序核对后一次上架。卖完了关掉开关就行。', img: 's06-menu.jpg' },
    { title: '在日历上点一天', text: '「我的小店」有一个两周的日历，点哪天就在哪天开团。小灰点是别家的团，错开同类的店更容易成团。', img: 's05-dash.jpg' },
    { title: '设门槛和取货点', text: '填出发时间、截单时间、成团门槛，勾选这一场去哪几个取货点，点「开团」。', img: 's07-session.jpg' },
    { title: '一键出海报', text: '在场次卡片上点「海报」。杂志、黑板、手账三种版式随时切换，保存后发朋友圈、发群。', img: 'styles.jpg' },
    { title: '接单到送达，三个按钮', text: '成团后用邮件联系买家收款，收到钱点「确认订单」；出发点「开始配送」；送到取货点拍一张照片，点「已送达」，买家会收到通知。', img: 's09-orders.jpg' }
  ],
  faqTitle: '常见问题',
  faq: [
    { q: '要交钱吗？', a: '不用。明尼助手不经手任何资金，也不从你的单里抽成。' },
    { q: '买家怎么付款？', a: '成团后你用邮件联系买家收款，金额以小程序里的订单为准。买家的邮箱都是验证过的学校邮箱。' },
    { q: '菜单很长，要一样样录吗？', a: '不用。在「商品管理」点「从网页导入菜单」拿导入码，用浏览器打开 minnepal.com/import，贴菜单链接、文字或照片，整理好回小程序核对，一次上架。' },
    { q: '没凑够单怎么办？', a: '截单时没到门槛，这场团和订单自动取消，系统会通知买家。不想等，也可以点「照常送」。' },
    { q: '卖食品有什么要求？', a: '如果你销售食品，需要自己符合当地的相关规定。开店前，小程序里会请你阅读并确认《商家责任告知书》。' },
    { q: '怎么开店？', a: `发邮件到 ${EMAIL}，备注「开店」，我们把开店码发给你。开店码 7 天内有效，一码一店。` }
  ],
  endTitle: '下一场团，从你开始',
  endSub: `发邮件到 ${EMAIL}，备注「开店」`,
  scan: '买家在这里找到你：微信扫码或搜一搜「明尼助手」'
}

const EN: Copy = {
  lang: 'en',
  switchLabel: '中文',
  switchHref: '/merchants',
  kicker: 'For sellers · Group-buy',
  title: <>Fill the order first, <em>then go</em></>,
  sub: 'Want to sell your signature dishes, Asian groceries or home baking to UMN students, but worried you\'ll stock up and nobody buys, or drive over for two or three orders? Open a session on 明尼助手 and only head out once enough people have signed up.',
  apply: 'Get a shop code',
  applySubject: 'Open a shop',
  howLink: 'See how it works',
  badges: ['No commission', 'We never touch your money', 'Go only when it fills'],
  whyTitle: 'What group-buy does for you',
  why: [
    { title: 'Not enough orders? Don\'t go.', text: 'Every session has a minimum, say 10 orders. If it isn\'t met by the cutoff, the session and its orders are cancelled automatically.' },
    { title: 'Cook in batches, price lower', text: 'Orders come in first, then you make them all at once. Dozens of portions in one go spread out the cost of ingredients, prep and the trip. Keep the menu short: three to five dishes you do best, priced a little below dine-in, fill up faster.' },
    { title: 'One spot, not door to door', text: 'You choose the pickup points, and you set the delivery fee for each one.' },
    { title: 'Money is between you and your buyers', text: '明尼助手 only records who ordered what. We never handle any money and take no commission.' },
    { title: 'One-tap posters', text: 'One tap turns a session into a long poster with your products, pickup points, cutoff time and a mini program code. Share it; buyers long-press the code to order.' }
  ],
  pointsTitle: 'Suggested pickup points',
  pointsSub: 'These two are filled in for you when you open a shop. Edit or remove them, or add your own. Add UMN campus points yourself, since every shop starts from a different place.',
  pointText: [
    'East of UMN in Prospect Park, at University Ave and 30th Ave. Students shop here all the time, so it\'s easy to name and easy to find.',
    'In St Paul. The campus is small, so meeting on campus works. Farther than Fresh Thyme, about 25 more minutes on the road.'
  ],
  mapLink: 'Open in Google Maps',
  howTitle: 'Open a session in five steps',
  steps: [
    { title: 'List your products', text: 'In My Shop, tap Manage Products → Add Product. Only name and price are required. Long menu? Tap Import a menu from the web and paste your menu link, text or photos at minnepal.com/en/import, then review and list everything at once. Sold out? Just switch it off.', img: 's06-menu.jpg' },
    { title: 'Pick a day on the calendar', text: 'My Shop has a two-week calendar. Gray dots are other shops\' sessions; avoid days when similar shops are running.', img: 's05-dash.jpg' },
    { title: 'Set the minimum and pickup points', text: 'Set the departure time, cutoff and minimum, tick the pickup points for this session, then tap Open Session.', img: 's07-session.jpg' },
    { title: 'Make a poster', text: 'Tap Poster on the session card. Switch between Magazine, Chalkboard and Scrapbook, then save and share.', img: 'styles.jpg' },
    { title: 'Orders to delivery in three taps', text: 'Once it fills, email buyers to collect payment and tap Confirm Order. Tap Start Delivery when you leave. At the pickup point, take a photo and tap Delivered; buyers get notified.', img: 's09-orders.jpg' }
  ],
  faqTitle: 'FAQ',
  faq: [
    { q: 'Does it cost anything?', a: 'No. 明尼助手 never handles money and takes no commission on your orders.' },
    { q: 'How do buyers pay?', a: 'Once a session fills, you email buyers to collect payment; the amount is whatever their order shows in the mini program. Every buyer\'s email is a verified school address.' },
    { q: 'Do I have to add my menu item by item?', a: 'No. In Manage Products, tap Import a menu from the web to get an import code, open minnepal.com/en/import in a browser and paste your menu link, text or photos. Then review the items in the mini program and list them all at once.' },
    { q: 'What if it doesn\'t fill?', a: 'If the minimum isn\'t met by the cutoff, the session and its orders are cancelled and buyers are notified. Don\'t want to wait? Tap Go Anyway.' },
    { q: 'Is the app in English?', a: 'Yes. Go to Me → 语言 / Language and choose English.' },
    { q: 'Selling food?', a: 'If you sell food, you are responsible for following local rules. Before opening your shop, the mini program asks you to read and confirm the seller responsibility notice.' },
    { q: 'How do I start?', a: `Email ${EMAIL} with "Open a shop" and we'll send you a shop code. Each code opens one shop and is valid for 7 days.` }
  ],
  endTitle: 'Your next session starts here',
  endSub: `Email ${EMAIL} with "Open a shop"`,
  scan: 'Buyers find you here: scan in WeChat or search 明尼助手'
}

export default function MerchantPage({ lang }: { lang: 'zh' | 'en' }) {
  const c = lang === 'en' ? EN : ZH
  const mail = `mailto:${EMAIL}?subject=${encodeURIComponent(c.applySubject)}`
  const img = (name: string) => `/merchants/${c.lang}/${name}`

  return (
    <main lang={c.lang === 'en' ? 'en' : 'zh-CN'} className={`merchants merchants-${c.lang}`}>
      <section className="m-hero">
        <div className="wrap m-hero-row">
          <div className="m-hero-copy">
            <div className="m-hero-top">
              <span className="kicker kicker-dark">{c.kicker}</span>
              <Link href={c.switchHref} className="lang-switch">{c.switchLabel}</Link>
            </div>
            <h1 className="m-title">{c.title}</h1>
            <p className="m-sub">{c.sub}</p>
            <div className="hero-actions">
              <a href={mail} className="btn btn-gold btn-lg">{c.apply}</a>
              <a href="#how" className="btn btn-ghost-light btn-lg">{c.howLink} ↓</a>
            </div>
            <ul className="badges">
              {c.badges.map(b => <li key={b}>{b}</li>)}
            </ul>
          </div>
          <div className="m-hero-art" aria-hidden="true">
            <span className="tape tape-b" />
            <img src={img('styles.jpg')} alt="" />
          </div>
        </div>
      </section>

      <section className="wrap m-section">
        <h2 className="display-title">{c.whyTitle}</h2>
        <div className="why-grid">
          {c.why.map((w, i) => (
            <div key={w.title} className={`why why-${i}`}>
              <span className="why-num">{i + 1}</span>
              <h3>{w.title}</h3>
              <p>{w.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="wrap m-section">
        <h2 className="display-title">{c.howTitle}</h2>
        <ol className="steps">
          {c.steps.map((s, i) => (
            <li key={s.title} className="step">
              <div className="step-copy">
                <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
              <div className="step-shot"><img src={img(s.img)} alt={s.title} loading="lazy" /></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap m-section">
        <h2 className="display-title">{c.pointsTitle}</h2>
        <p className="points-sub">{c.pointsSub}</p>
        <div className="points">
          {POINTS.map((pt, i) => (
            <div key={pt.name} className="point">
              {hasPhoto(pt.photo) && <img className="point-photo" src={`/merchants/points/${pt.photo}`} alt={pt.name} loading="lazy" />}
              <iframe
                className="point-map"
                title={pt.name}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(pt.address)}&z=15&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="point-body">
                <h3>{pt.name}</h3>
                <p className="point-addr">{pt.address.split(', ').slice(1).join(', ')}</p>
                <p>{c.pointText[i]}</p>
                <a className="point-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pt.address)}`} target="_blank" rel="noopener noreferrer">{c.mapLink} →</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap m-section">
        <h2 className="display-title">{c.faqTitle}</h2>
        <div className="faq">
          {c.faq.map(f => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="wrap m-section">
        <div className="m-end">
          <div>
            <h2 className="m-end-title">{c.endTitle}</h2>
            <p className="m-end-sub">{c.endSub}</p>
            <a href={mail} className="btn btn-gold btn-lg">{c.apply}</a>
          </div>
          <div className="m-end-code">
            <img src="/sou-combo.png" alt="明尼助手" />
            <p>{c.scan}</p>
          </div>
        </div>
      </section>
    </main>
  )
}
