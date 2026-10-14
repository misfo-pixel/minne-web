// 导入菜单页的中英文案，客户端组件和页面都会用，所以不加 server-only。
// 服务端（actions / menuParse / 云函数）返回的错误提示是中文原文，英文页用 localizeError 按原文查表翻译，
// 查不到就原样显示。服务端新增或改了提示，记得同步改下面的 ERRORS_EN。

export type Lang = 'zh' | 'en'

export type ImportCopy = {
  pageTitle: string
  pageDesc: string
  headTitle: string
  headSub: string
  codeTitle: string
  codeHint: string
  codeLabel: string
  codeNext: string
  codeChecking: string
  importTo: (shop: string) => string
  tabs: [string, string][]
  urlPlaceholder: string
  textPlaceholder: string
  addPhoto: string
  photoAlt: (n: number) => string
  removePhoto: string
  parse: string
  parsing: string
  backToTable: string
  parsesLeft: (n: number) => string
  reviewTitle: (n: number) => string
  addMore: string
  reviewHint: string
  pickAria: (name: string) => string
  nameAria: string
  priceAria: string
  pricePlaceholder: string
  restricted: string
  send: (n: number) => string
  sending: string
  doneTitle: (n: number) => string
  doneText: string
  errNetwork: string
  errPhoto: string
  errNoPrice: (name: string) => string
}

export const COPY: Record<Lang, ImportCopy> = {
  zh: {
    pageTitle: '导入菜单',
    pageDesc: '贴菜单链接、文字或照片，AI 整理成商品表，回到明尼助手小程序一次上架。',
    headTitle: '导入菜单',
    headSub: '贴链接、贴文字或拍照，AI 整理好，回小程序一次上架',
    codeTitle: '输入导入码',
    codeHint: '在明尼助手小程序「我的小店 → 商品管理 → 从网页导入菜单」里拿到',
    codeLabel: '导入码',
    codeNext: '下一步',
    codeChecking: '核对中…',
    importTo: shop => `导入到「${shop}」`,
    tabs: [['url', '菜单链接'], ['text', '粘贴文字'], ['photo', '拍照 / 截图']],
    urlPlaceholder: 'https://你家餐馆官网/menu',
    textPlaceholder: '把菜单整段复制过来，菜名、价格都要有',
    addPhoto: '＋ 选照片',
    photoAlt: n => `菜单照片 ${n}`,
    removePhoto: '删掉这张',
    parse: 'AI 整理',
    parsing: 'AI 整理中，通常要半分钟…',
    backToTable: '回到表格',
    parsesLeft: n => `这个导入码还能整理 ${n} 次`,
    reviewTitle: n => `核对一下（已选 ${n} 件）`,
    addMore: '菜单还有别的页？再加一部分',
    reviewHint: '名字、价格可以直接改。拼团价和堂食价不一样的话，在这里改成拼团价。',
    pickAria: name => `选中 ${name}`,
    nameAria: '名称',
    priceAria: '价格',
    pricePlaceholder: '价格',
    restricted: '酒类等禁售品，不能上架',
    send: n => `发送到小程序（${n} 件）`,
    sending: '发送中…',
    doneTitle: n => `已发送 ${n} 件`,
    doneText: '回到小程序的导入页，列表会自动出现。核对一遍，点「上架」就完成了。',
    errNetwork: '网络出错了，请重试',
    errPhoto: '有照片读不出来，换一张试试',
    errNoPrice: name => `「${name}」还没填价格`
  },
  en: {
    pageTitle: 'Import a menu',
    pageDesc: 'Paste a menu link, text or photos. AI turns it into a product list, then you list everything at once in the 明尼助手 mini program.',
    headTitle: 'Import a menu',
    headSub: 'Paste a link, paste text or take photos. AI sorts it out, then list everything at once in the mini program.',
    codeTitle: 'Enter your import code',
    codeHint: 'Get it in the 明尼助手 mini program: My Shop → Manage Products → Import a menu from the web',
    codeLabel: 'Import code',
    codeNext: 'Next',
    codeChecking: 'Checking…',
    importTo: shop => `Importing to “${shop}”`,
    tabs: [['url', 'Menu link'], ['text', 'Paste text'], ['photo', 'Photo / screenshot']],
    urlPlaceholder: 'https://your-restaurant.com/menu',
    textPlaceholder: 'Paste the whole menu here. Item names and prices are both needed.',
    addPhoto: '+ Add photos',
    photoAlt: n => `Menu photo ${n}`,
    removePhoto: 'Remove this photo',
    parse: 'Organize with AI',
    parsing: 'AI is working, usually about 30 seconds…',
    backToTable: 'Back to the list',
    parsesLeft: n => `${n} ${n === 1 ? 'run' : 'runs'} left for this code`,
    reviewTitle: n => `Review (${n} selected)`,
    addMore: 'More pages in your menu? Add another part',
    reviewHint: 'You can edit names and prices right here. If the group-buy price differs from the dine-in price, enter the group-buy price.',
    pickAria: name => `Select ${name}`,
    nameAria: 'Name',
    priceAria: 'Price',
    pricePlaceholder: 'Price',
    restricted: 'Alcohol and other restricted items can’t be listed',
    send: n => `Send to mini program (${n})`,
    sending: 'Sending…',
    doneTitle: n => `Sent ${n} ${n === 1 ? 'item' : 'items'}`,
    doneText: 'Go back to the import page in the mini program and the list will appear on its own. Review the items and list them, and you’re done.',
    errNetwork: 'Network error, please try again',
    errPhoto: 'Some photos couldn’t be read. Try another one.',
    errNoPrice: name => `“${name}” has no price yet`
  }
}

const ERRORS_EN: Record<string, string> = {
  '导入码是 6 位': 'The import code is 6 characters.',
  '请先贴链接、文字或选照片': 'Paste a link or text, or add photos first.',
  '导入服务还没配置好': 'The import service isn’t set up yet.',
  '服务出错了': 'Something went wrong on our side.',
  '连不上导入服务，请稍后重试': 'Can’t reach the import service. Please try again later.',
  '导入码不对、已过期或已经提交过': 'This code is wrong, expired, or already used.',
  '这个导入码的整理次数用完了，请在小程序里重新生成': 'This code has no AI runs left. Generate a new one in the mini program.',
  '没有可导入的商品': 'There are no items to import.',
  '未知操作': 'Unknown action.',
  '链接格式不对': 'That doesn’t look like a valid link.',
  '外卖平台的页面读不了，请打开商家自己的菜单页，或者复制菜单文字、拍照上传':
    'Delivery platform pages can’t be read. Use the restaurant’s own menu page, or paste the menu text or upload photos.',
  '这个链接不是网页，PDF 或图片请截图后用「拍照」上传':
    'That link isn’t a web page. For a PDF or image, take a screenshot and upload it under “Photo / screenshot”.',
  '网页太大了，请复制菜单文字粘贴进来': 'That page is too large. Copy the menu text and paste it in instead.',
  '这个网页上读不到菜单内容，请复制文字或拍照上传': 'Couldn’t find a menu on that page. Paste the text or upload photos instead.',
  '打不开这个网页，请复制菜单文字或拍照上传': 'Couldn’t open that page. Paste the menu text or upload photos instead.',
  'AI 服务还没配置好': 'The AI service isn’t set up yet.',
  '没有收到菜单内容': 'No menu content received.',
  'AI 整理失败，请稍后重试': 'AI processing failed. Please try again later.',
  '没认出菜品，换一张更清楚的照片或直接贴文字试试': 'No dishes recognized. Try a clearer photo, or paste the text.',
  'AI 整理超时或失败，请重试；菜单很长的话可以分几次': 'AI timed out or failed. Please retry. For a long menu, send it in several parts.'
}

export function localizeError(message: string, lang: Lang): string {
  if (lang === 'zh') return message
  const hit = ERRORS_EN[message]
  if (hit) return hit
  const m = message.match(/^打不开这个网页（(\d+)）$/)
  if (m) return `Couldn’t open that page (${m[1]}).`
  return message
}
