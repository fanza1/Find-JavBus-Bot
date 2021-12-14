import cheerio from 'cheerio'
const pornhubUrl = 'https://www.pornhub.com'

let ajax_req = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9'
  },
  method: 'GET'
}

export async function reqPornhub(id, bool) {
  const result = {
    list: []
  }

  let url = ''
  if (bool) {
    if (id) {
      url = pornhubUrl + '/video?o=' + id
    } else {
      url = pornhubUrl + '/video'
    }
  } else {
    url = pornhubUrl + '/video/search?search=' + encodeURI(id)
  }
  let response = await fetch(url, ajax_req)
  let responseText = await response.text()

  let $ = cheerio.load(responseText, {
    xmlMode: true,
    decodeEntities: true,
    normalizeWhitespace: true
  })

  let $div1 = $('div.wrap')
  if ($div1.length > 0) {
    let list = []
    for (let i = 0; i < $div1.length; i++) {
      let $a3 = $div1.eq(i).find('a.videoPreviewBg.videoPreviewBg')
      let $d3 = $div1.eq(i).find('var.duration')
      let $i3 = $div1.eq(i).find('img')
      let $title = $div1.eq(i).find('span.title a')
      let $views = $div1.eq(i).find('span.views var')
      let $good = $div1.eq(i).find('div.rating-container .value')
      if ($a3.length === 0) continue
      list.push({
        title: $title.html(),
        views: $views.html(),
        good: $good.html(),
        duration: decodeURI($d3.html()),
        cover: decodeURI($i3.attr('src').trim()),
        link: pornhubUrl + decodeURI($a3.attr('href').trim())
      })
    }
    result.list = list.splice(0, 5)
  }

  return result
}
