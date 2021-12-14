import cheerio from 'cheerio'
const xvideoUrl = 'https://www.xvideos.com'

let ajax_req = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36',
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9'
  },
  method: "GET"
}

export async function reqXVideo(id) {
    const result = { list: [] }

    let url = xvideoUrl + '/?k=' + encodeURI(id)
    let response = await fetch(url, ajax_req)
    let responseText = await response.text()

    let $ = cheerio.load(responseText, {
      xmlMode: true,
      decodeEntities: true,
      normalizeWhitespace: true
    })

    let $div = $('div.thumb-under')
    let $div1 = $('div.thumb-inside')
    if ($div.length > 0) {
      let list = []
      for (let i = 0; i < $div.length; i++) {
        let $d3 = $div1.eq(i).find('span.video-hd-mark')
        let $i3 = $div1.eq(i).find('img')
        let $a3 = $div.eq(i).find('a')
        if ($a3.length === 0) continue
        list.push({
          title: decodeURI($a3.attr('title').trim()),
          duration: decodeURI($d3.html()),
          cover: decodeURI($i3.attr('data-src').trim()),
          link: xvideoUrl + decodeURI($a3.attr('href').trim())
        })
      }
      result.list = list.splice(0, 8)
    }

    return result
}
