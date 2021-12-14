import cheerio from 'cheerio'

const javUrl = 'https://www.javbus.com'
const embedyUrl = 'https://embedy.cc'

let ajax_req = {
  headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:84.0) Gecko/20100101 Firefox/84.0",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.5"
  },
  method: "GET"
}

export async function reqJavbus(id) {
    const result = { title: '', cover: '', magnet: [], list: [] }

    let url = javUrl + '/' + id
    ajax_req.headers["Referer"] = javUrl
    let response = await fetch(url, ajax_req)
    let responseText = await response.text()

    let $ = cheerio.load(responseText)
    let $image = $('a.bigImage img')
    result.cover = javUrl + $image.attr('src')
    result.title = $image.attr('title')

    let gid = responseText.match(new RegExp(/gid.=.(\d*)/))[1]
    let img = responseText.match(new RegExp(/img.=.\'(.*)\'/))[1]
    let floor = Math.floor(Math.random() * 1e3 + 1)
    url = javUrl + `/ajax/uncledatoolsbyajax.php?gid=${gid}&img=${img}&lang=zh&uc=0&floor=${floor}`
    ajax_req.headers["Referer"] = javUrl + id
    response = await fetch(url, ajax_req)
    responseText = await response.text()

    $ = cheerio.load(responseText, {
      xmlMode: true,
      decodeEntities: true,
      normalizeWhitespace: true
    })

    let $tr = $('tr')
    if ($tr.length > 0) {
      for (let i = 0; i < $tr.length; i++) {
        let $a = $tr.eq(i).find('td:nth-child(2) a')
        let $a1 = $tr.eq(i).find('td:nth-child(3) a')
        let $subtitle = $tr.eq(i).find('a.btn-warning')
        let $hd = $tr.eq(i).find('a.btn-primary')
        if ($a.length === 0) continue
        result.magnet.push({
          link: decodeURI($a.attr('href').trim()),
          size: $a.text().trim(),
          dateTime: $a1.text().trim(),
          is_hd: $hd.text().trim(),
          has_subtitle: $subtitle.text().trim()
        })
      }
    }

    url = embedyUrl + '/video/' + id
    ajax_req.headers["Referer"] = embedyUrl
    response = await fetch(url, ajax_req)
    responseText = await response.text()

    $ = cheerio.load(responseText, {
      xmlMode: true,
      decodeEntities: true,
      normalizeWhitespace: true
    })
    let $div = $('div.thumb.c')
    if ($div.length > 0) {
      let list = []
      for (let i = 0; i < $div.length; i++) {
        let $a3 = $div.eq(i).find('a')
        let $t3 = $div.eq(i).find('span.title')
        let $d3 = $div.eq(i).find('span.duration')
        let $i3 = $div.eq(i).find('img')
        let $v3 = $div.eq(i).find('span.view')
        $v3.find(':nth-child(n)').remove()
        if ($a3.length === 0) continue
        list.push({
          title: $t3.text().trim(),
          duration: $d3.text().trim(),
          view: $v3.text().trim(),
          cover: decodeURI($i3.attr('src').trim()),
          link: embedyUrl + decodeURI($a3.attr('href').trim())
        })
      }
      result.list = list.splice(0, 5)
    }

    return result
}
