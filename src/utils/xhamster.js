
import cheerio from 'cheerio'
const xhamsterUrl = 'https://xhamster.com'

let ajax_req = {
  headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:84.0) Gecko/20100101 Firefox/84.0",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.5"
  },
  method: "GET"
}

export async function reqXHamster(id) {
    const result = { list: [] }

    let url = xhamsterUrl + '/' + encodeURI(id)
    ajax_req.headers["Referer"] = xhamsterUrl
    let response = await fetch(url, ajax_req)
    let responseText = await response.text()

    let $ = cheerio.load(responseText, {
      xmlMode: true,
      decodeEntities: true,
      normalizeWhitespace: true
    })
    let $div = $('div.thumb-list__item')
    if ($div.length > 0) {
      let list = []
      for (let i = 0; i < $div.length; i++) {
        let $a3 = $div.eq(i).find('a.video-thumb__image-container')
        let $d3 = $div.eq(i).find('a.video-thumb-info__name')
        let $i3 = $div.eq(i).find('img.thumb-image-container__image')
        let $t3 = $div.eq(i).find('div.thumb-image-container__duration span')
        if ($a3.length === 0) continue
        list.push({
          title: decodeURI($d3.html().trim()),
          cover: decodeURI($i3.attr('src').trim()),
          link: decodeURI($a3.attr('href').trim()),
          duration: decodeURI($t3.html().trim())
        })
      }
      result.list = list.splice(0, 8)
    }

    return result
}

