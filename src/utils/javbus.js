import axios from 'axios'
import axiosCloudflare from 'axios-cloudflare'
import cheerio from 'cheerio'
import vm from 'vm'

const javUrl = 'https://www.javbus.com'
const embedyUrl = 'https://embedy.cc'
const xvideoUrl = 'https://www.xvideos.com'
const xhamsterUrl = 'https://xhamster.com'

axiosCloudflare(axios);
const httpGet = config => {
    return new Promise((resolve, reject) => {
        const instance = axios.create({
            method: 'get',
            timeout: 5000,
            headers: {
                'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36',
                Accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9'
            }
        })
        instance(config).then(res => {
            resolve(res);
        }).catch(err => {
            reject(err);
        })
    })
}

export async function reqJavbus(id) {
    const result = { title: '', cover: '', magnet: [], list: [] }

    let response = await httpGet({ baseURL: javUrl, url:'/' + id })
    let $ = cheerio.load(response.data)
    let $image = $('a.bigImage img')
    result.cover = javUrl + $image.attr('src')
    result.title = $image.attr('title')
    let ajax = { gid: '', uc: '', img: '' }
    const context = new vm.createContext(ajax)
    let $script = $('body > script:nth-child(9)')
    new vm.Script($script.html()).runInContext(context)
    let floor = Math.floor(Math.random() * 1e3 + 1)

    let url = `/ajax/uncledatoolsbyajax.php?gid=${ajax.gid}&uc=${ajax.uc}&img=${ajax.img}&lang=zh&floor=${floor}`
    response = await httpGet({ baseURL: javUrl, url, headers: { referer: javUrl + id }})
    $ = cheerio.load(response.data, {
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

    response = await httpGet({ baseURL: embedyUrl, url: '/video/' + id})
    $ = cheerio.load(response.data, {
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
