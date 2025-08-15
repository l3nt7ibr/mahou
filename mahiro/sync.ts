import 'zx/globals'
import cheerio from 'cheerio'
import { join } from 'path'

const run = async () => {
  const getHtml = async () => {
    const cachePath = join(__dirname, './cache.html')
    if (fs.existsSync(cachePath)) {
      return fs.readFileSync(cachePath, 'utf-8')
    }
    const url = `https://bangumi.tv/calendar`
    const html = await (await fetch(url)).text()
    fs.writeFileSync(cachePath, html, 'utf-8')
    return html
  }
  const html = await getHtml()

  const selector = {
    sun: 'dd.Sun',
    mon: 'dd.Mon',
    tue: 'dd.Tue',
    wed: 'dd.Wed',
    thu: 'dd.Thu',
    fri: 'dd.Fri',
    sat: 'dd.Sat',
  }
  const result = {
    sun: [],
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
  }
  const html$ = cheerio.load(html)
  Object.keys(selector).forEach((key) => {
    const list = html$(`${(selector as any)[key]} ul li`)
    list.each((_, element) => {
      const cnTitle = html$(element).find('div div :nth-child(1) a')?.text().trim()
      const jpTitle = html$(element).find('div div :nth-child(2) a')?.text().trim()
      const title = cnTitle || jpTitle
      const bg = element.attribs.style
      
      // 旧代码：原始URL提取逻辑（无法匹配带额外样式的background属性）
      // const extractBg = bg.match(/background:url\('(.*?)'\)/)?.[1]
      // const urlWithoutProtocol = extractBg?.replace(
      //   'lain.bgm.tv/pic/cover/c',
      //   'lain.bgm.tv/r/400/pic/cover/l'
      // )

      // 新代码：修复URL提取逻辑
      // 1. 直接匹配url('...')部分，忽略background前缀的其他样式
      const extractBg = bg.match(/url\('(.*?)'\)/)?.[1]
      
      // 2. 优化URL替换逻辑（仅在原始URL是低分辨率时替换）
      // 检查原始URL是否包含低分辨率路径标识"pic/cover/c"
      const urlWithoutProtocol = extractBg 
        ? extractBg.includes('lain.bgm.tv/pic/cover/c')
          ? extractBg.replace('lain.bgm.tv/pic/cover/c', 'lain.bgm.tv/r/400/pic/cover/l')
          : extractBg  // 已是高分辨率URL则不替换
        : undefined

      const info = {
        // 处理可能的undefined，避免生成"https:undefined"无效URL
        cover: extractBg ? `https:${urlWithoutProtocol}` : '', 
        title: title?.length ? title : '无标题',
      }
      ;(result as any)[key].push(info)
    })
  })
  const writePath = join(__dirname, './bangumi.json')
  fs.writeFileSync(writePath, JSON.stringify(result, null, 2), 'utf-8')
}

run()
