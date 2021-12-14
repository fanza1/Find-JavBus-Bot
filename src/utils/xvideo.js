import cheerio from 'cheerio'
const xvideoUrl = 'https://www.xvideos.com'

let ajax_req = {
  headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:84.0) Gecko/20100101 Firefox/84.0",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.5"
  },
  method: "GET"
}

export async function reqXVideo(id) {
    const result = { list: [] }

    let url = xvideoUrl + '/?k=' + encodeURI(id)
    ajax_req.headers["Referer"] = xvideoUrl
    let response = await fetch(url, ajax_req)
    let responseText = await response.text()

    let $ = cheerio.load(responseText, {
      xmlMode: true,
      decodeEntities: true,
      normalizeWhitespace: true
    })

    let $div1 = $('div.thumb-inside')
    let $div = $('div.thumb-under')
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
