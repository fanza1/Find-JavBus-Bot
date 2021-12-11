/** Telegram机器人的Token */
const token = '机器人的Token'
const robotName = '@寻龙'

const TelegramBot = require('node-telegram-bot-api')
const cheerio = require('cheerio')
const axios = require('axios')
const fs = require('fs')
const moment = require('moment')
moment.locale('zh-cn')
const vm = require('vm')
const siteUrl = 'https://www.javbus.com'
const embedyUrl = 'https://embedy.cc'
const xvideoUrl = 'https://www.xvideos.com'
const bestUrl = 'https://xhamster.com/best/monthly'
// const videoUrl = 'https://watchjavonline.com'

const http = axios.create({
  baseURL: siteUrl,
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9'
  }
})

// const httpV = axios.create({
//   baseURL: videoUrl,
//   timeout: 15000,
//   headers: {
//     'User-Agent':
//       'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36',
//     Accept:
//       'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
//     'Accept-Language': 'zh-CN,zh;q=0.9'
//   }
// })

const httpE = axios.create({
  baseURL: embedyUrl,
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9'
  }
})

const httpX = axios.create({
  baseURL: xvideoUrl,
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9'
  }
})

const httpB = axios.create({
  baseURL: bestUrl,
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9'
  }
})

const bot = new TelegramBot(token, { polling: true })

//开始入口
bot.onText(/\/start/, msg => {
  bot.sendMessage(msg.chat.id, '欢迎使用番号机器人\n请输入 /av + 番号 查询 ')
})

//简单保存工作状态
const state = { start: Date.now(), date: {} }

bot.onText(/\/state/, msg => {
  //最近5天工作状态
  let buffer = drawState(5)
  return bot.sendMessage(msg.chat.id, buffer)
})
bot.onText(/\/state (\d+)/, (msg, match) => {
  //工作状态
  let days = parseInt(match[1].trim()) // the captured "whatever"
  let buffer = drawState(days)

  return bot.sendMessage(msg.chat.id, buffer)
})

function drawState(range) {
  let now = moment()
  let earlyDay = moment().subtract(range, 'day')
  let date = [],
    data = []
  while (earlyDay.diff(now) <= 0) {
    let dateKey = earlyDay.format('YYYY-MM-DD')
    date.push(dateKey)
    if (state.date[dateKey]) data.push(state.date[dateKey])
    else data.push(0)
    earlyDay = earlyDay.add(1, 'day')
  }
  let message =
    '从 ' +
    moment(state.start).fromNow() +
    ' 开始工作\n\n       日期       : 查询车牌号次数'
  date.forEach((d, i) => {
    message += '\n' + d + ' : ' + data[i]
  })
  return message
}
let idRegex = /^([a-z]+)(?:-|_|\s)?([0-9]+)$/

bot.onText(/\/av (.+)/, async (msg, match) => {
  const today = moment().format('YYYY-MM-DD')
  if (state.date[today]) state.date[today]++
  else state.date[today] = 1
  const chatId = msg.chat.id
  let chartType = msg.chat.type
  let isPrivate = chartType === 'private'
  let id = match[1].trim() // the captured "whatever"
  console.log('请求番号', id)
  if (idRegex.test(id)) {
    id = id.match(idRegex)
    id = id[1] + '-' + id[2]
  }
  if (isPrivate) bot.sendMessage(chatId, `开始查找车牌号：${id} ……`)
  try {
    let result = await parseHtml(id)
    if (result.cover) {
      await bot.sendPhoto(chatId, result.cover + '?random=64')
    }
    let max = isPrivate ? 10 : 3
    let title = '[' + id + '] '
    if (result.magnet.length > 0 || result.list.length > 0) {
      let message = result.title
      if (result.magnet.length) {
        result.magnet.every((magnet, i) => {
          message +=
            '\n-----------\n日期: ' +
            magnet.dateTime +
            '\n大小: ' +
            magnet.size +
            '\n链接: ' +
            '\n' +
            magnet.link.substring(0, 60)
          return i + 1 < max
        })
      }
      if (result.list.length) {
        result.list.every((list, i) => {
          message +=
            '\n-----------\n<h1>直接观看请点击:</h1> ' +
            '\n标题: ' +
            list.title +
            '\n时长: ' +
            list.duration +
            '\n地址: ' +
            '\n' +
            list.link
          return i + 1 < max
        })
      }
      if (!isPrivate && result.magnet.length > max) {
        message += `\n-----------\n在群聊中发车，还有 ${result.magnet.length -
          max} 个Magnet链接没有显示\n与 ${robotName} 机器人单聊可以显示所有链接`
      }
      bot.sendMessage(chatId, message)
    } else {
      bot.sendMessage(chatId, title + '还没有Magnet链接')
    }
  } catch (e) {
    console.error(id, e.message)
    if (e.message.indexOf('timeout') !== -1)
      return bot.sendMessage(chatId, '机器人查询番号超时，请重试')
    bot.sendMessage(chatId, `找不到 ${id}！`)
  }
})

async function parseHtml(id) {
  const result = { title: '', cover: '', magnet: [], list: [] }
  let response = await http.get('/' + id)
  let $ = cheerio.load(response.data)
  let $image = $('a.bigImage img')
  result.cover = siteUrl + $image.attr('src')
  result.title = $image.attr('title')

  let ajax = { gid: '', uc: '', img: '' }
  const context = new vm.createContext(ajax)
  let $script = $('body > script:nth-child(9)')
  new vm.Script($script.html()).runInContext(context)
  let floor = Math.floor(Math.random() * 1e3 + 1)
  let url = `/ajax/uncledatoolsbyajax.php?gid=${ajax.gid}&uc=${ajax.uc}&img=${ajax.img}&lang=zh&floor=${floor}`
  response = await http({
    method: 'get',
    url,
    headers: { referer: siteUrl + id }
  })
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
      if ($a.length === 0) continue
      result.magnet.push({
        link: decodeURI($a.attr('href').trim()),
        size: $a.text().trim(),
        dateTime: $a1.text().trim()
      })
    }
  }

  //   response = await httpV.get('/?s=' + id)
  //   $ = cheerio.load(response.data, {
  //     xmlMode: true,
  //     decodeEntities: true,
  //     normalizeWhitespace: true
  //   })
  //   let $div = $('div.entry-featured-media')
  //   if ($div.length > 0) {
  //     for (let i = 0; i < $div.length; i++) {
  //       let $a2 = $div.eq(i).find('a.g1-frame')
  //       if ($a2.length === 0) continue
  //       const link = decodeURI($a2.attr('href').trim())
  //       result.list.push(link)
  //     }
  //   }

  response = await httpE.get('/video/' + id)
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
      if ($a3.length === 0) continue
      list.push({
        title: $t3.text().trim(),
        duration: $d3.text().trim(),
        cover: decodeURI($i3.attr('src').trim()),
        link: embedyUrl + decodeURI($a3.attr('href').trim())
      })
    }
    result.list = list.splice(0, 5)
  }

  //   console.log('最终结果', result)
  return result
}

bot.onText(/\/xv (.+)/, async (msg, match) => {
  const today = moment().format('YYYY-MM-DD')
  if (state.date[today]) state.date[today]++
  else state.date[today] = 1
  const chatId = msg.chat.id
  let chartType = msg.chat.type
  let isPrivate = chartType === 'private'
  let id = match[1].trim()
  console.log('请求黄片', id)
  if (isPrivate) bot.sendMessage(chatId, `开始查找黄片：${id} ……`)
  try {
    let result = await parseXtml(id)
    let max = isPrivate ? 10 : 3
    let title = '[' + id + '] '
    if (result.list.length > 0) {
      let message = result.title
      result.list.every((list, i) => {
        message +=
          '\n-----------\n直接观看请点击: ' +
          '\n标题: ' +
          list.title +
          '\n分辨率: ' +
          list.duration +
          '\n地址: ' +
          '\n' +
          list.link
        return i + 1 < max
      })
      if (!isPrivate && result.list.length > max) {
        message += `\n-----------\n在群聊中发车，还有 ${result.magnet.length -
          max} 个Magnet链接没有显示\n与 ${robotName} 机器人单聊可以显示所有链接`
      }
      bot.sendMessage(chatId, message)
    } else {
      bot.sendMessage(chatId, title + '还没有视频链接')
    }
  } catch (e) {
    console.error(id, e.message)
    if (e.message.indexOf('timeout') !== -1)
      return bot.sendMessage(chatId, '机器人查询黄片超时，请重试')
    bot.sendMessage(chatId, `找不到 ${id}！`)
  }
})

async function parseXtml(id) {
  const result = { title: '', cover: '', magnet: [], list: [] }
  let response = await httpX.get('/?k=' + encodeURI(id))
  let $ = cheerio.load(response.data, {
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
    result.list = list.splice(0, 5)
  }

  console.log('最终结果', result)
  return result
}

bot.onText(/\/hot/, async msg => {
  const today = moment().format('YYYY-MM-DD')
  if (state.date[today]) state.date[today]++
  else state.date[today] = 1
  const chatId = msg.chat.id
  let chartType = msg.chat.type
  let isPrivate = chartType === 'private'
  if (isPrivate) bot.sendMessage(chatId, `开始推荐 ……`)
  try {
    let result = await parseBtml()
    let max = isPrivate ? 10 : 3
    if (result.list.length > 0) {
      let message = result.title
      result.list.every((list, i) => {
        message +=
          '\n-----------\n直接观看请点击: ' +
          '\n标题: ' +
          list.title +
          '\n地址: ' +
          '\n' +
          list.link
        return i + 1 < max
      })
      if (!isPrivate && result.list.length > max) {
        message += `\n-----------\n在群聊中发车，还有 ${result.magnet.length -
          max} 个Magnet链接没有显示\n与 ${robotName} 机器人单聊可以显示所有链接`
      }
      bot.sendMessage(chatId, message)
    } else {
      bot.sendMessage(chatId, title + '还没有视频链接')
    }
  } catch (e) {
    console.error(e.message)
    if (e.message.indexOf('timeout') !== -1)
      return bot.sendMessage(chatId, '机器人查询黄片超时，请重试')
    bot.sendMessage(chatId, `找不到 ！`)
  }
})

async function parseBtml() {
  const result = { title: '', cover: '', magnet: [], list: [] }
  let response = await httpB.get()
  let $ = cheerio.load(response.data, {
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
      if ($a3.length === 0) continue
      list.push({
        title: decodeURI($d3.html().trim()),
        cover: decodeURI($i3.attr('src').trim()),
        link: decodeURI($a3.attr('href').trim())
      })
    }
    result.list = list.splice(0, 5)
  }

  console.log('最终结果', result)
  return result
}
