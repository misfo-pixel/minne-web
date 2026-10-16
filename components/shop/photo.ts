'use client'

// 商品照片在浏览器里先压成 JPEG：长边 1280px，再按需要降质量，压到 600KB 以内。
// 云函数那边微信图片审核单张上限 1MB，请求太大也过不了 Vercel 和 HTTP 访问服务。
// 一律转 JPEG（PNG、HEIC 截图、WebP 都转），云函数只收 JPEG。
const MAX_SIDE = 1280
const MAX_BYTES = 600 * 1024

function load(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export async function compressPhoto(file: File): Promise<string> {
  const img = await load(file)
  let side = MAX_SIDE
  try {
    for (let round = 0; round < 6; round++) {
      const scale = Math.min(1, side / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      // 透明的 PNG 转 JPEG 会变黑，先铺白底
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      for (const q of [0.85, 0.75, 0.65]) {
        const url = canvas.toDataURL('image/jpeg', q)
        // base64 每 4 个字符 3 个字节
        if ((url.length - url.indexOf(',') - 1) * 0.75 <= MAX_BYTES) return url
      }
      side = Math.round(side * 0.75)
    }
    throw new Error('too big')
  } finally {
    URL.revokeObjectURL(img.src)
  }
}
