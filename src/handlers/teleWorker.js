import Telegram from '../utils/telegram'
import { BOT_TOKEN,ERRLOG_CHANNEL,ROBOT_NAME } from '../config'
import { reqJavbus } from '../utils/javbus'
import moment from 'moment'
moment.locale('zh-cn')


export default async request => {
  try {
    const body = await request.json()

    const MESSAGE = {
      chat_id: body.message.chat.id,
      chat_type: body.message.chat.type,
      message_id: body.message.message_id,
      first_name: body.message.chat.first_name,
      last_name: body.message.chat.last_name,
      text: body.message.text.toLowerCase()
    }

    const headers = new Headers({'content-type': 'application/json;charset=UTF-8'})
    const RETURN_FORBIDDEN = new Response('Oops...', {status: 403, statusText: 'Forbidden'})
    const RETURN_OK = new Response('working', {status: 200, headers: headers})

    const bot = new Telegram(BOT_TOKEN, MESSAGE)

    const help_text = "命令格式: 由 Cloudflare Worker 强力驱动"

    const state = { start: Date.now(), date: {} }

    const codeRegex = /^([a-z]+)(?:-|_|\s)?([0-9]+)$/;



    if (body.message.sticker) {
      bot.sendText(MESSAGE.chat_id,help_text)
      return RETURN_OK
    }

    if (MESSAGE.text.startsWith('/start')) {
      bot.sendText(MESSAGE.chat_id,help_text)
      return RETURN_OK
    }
    else if (MESSAGE.text == '/state') {
      let buffer = drawState(5)
      bot.sendText(MESSAGE.chat_id, buffer)
      return RETURN_OK
    }
    else if (MESSAGE.text.startsWith('/state')) {
      let days = MESSAGE.text.replace('/av','').trim()
      let buffer = drawState(days)
      bot.sendText(MESSAGE.chat_id, buffer)
      return RETURN_OK
    }
    else if (MESSAGE.text == '/av') {
      bot.sendText(MESSAGE.chat_id,help_text)
      return RETURN_OK
    }
    else if (MESSAGE.text.startsWith('/av')) {
      const today = moment().format('YYYY-MM-DD')
      if (state.date[today]) state.date[today]++
      else state.date[today] = 1

      let code = MESSAGE.text.replace('/av','').trim()
      if (codeRegex.test(code)) {
        code = code.match(codeRegex);
        code = code[1] + '-' + code[2];
      }

      let isPrivate = MESSAGE.chat_type === 'private';
      let max = isPrivate ? 10 : 3;

      try {
        if (isPrivate) bot.sendText(MESSAGE.chat_id, `开始查找车牌：${code} ……`)
        let {title, cover, magnet, list} = await reqJavbus(code)

        if (title) {
          await bot.sendText(MESSAGE.chat_id, `<b><i>${title}</i></b>`)
        }
        if (result.cover) {
          await bot.sendPhoto(MESSAGE.chat_id, cover + '?random=64')
        }

        let messageText = ''

        if (magnet.length > 0) {
          magnet.every((item, i) => {
            message += '\n----------------------\n日期: ' + item.dateTime
            message += '\n大小: ' + item.size
            if (item.is_hd) message += '\n分辨率: ' + item.is_hd
            if (item.has_subtitle) message += '\n字幕: 有' + item.has_subtitle
            message += '\n磁力链接: ' + '\n' + '<code>' + item.link + '</code>'
            return i + 1 < max
          })

          if (!isPrivate && magnet.length > max) {
            messageText += `\n-----------\n在群聊中发车，还有 ${magnet.length - max} 个Magnet链接没有显示\n与 ${ROBOT_NAME} 机器人单聊可以显示所有链接`;
          }

          bot.sendText(MESSAGE.chat_id, messageText)
        } else {
          bot.sendText(MESSAGE.chat_id, "还没有Magnet链接")
        }


      } catch (e) {
        bot.sendText(ERRLOG_CHANNEL,e.message)
      }
      return RETURN_OK

    } else {
      bot.sendText(MESSAGE.chat_id,help_text)
      return RETURN_OK
    }

    ///////////////// 绘制 ///////////////////////////////
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

  } catch (err) {
    return new Response(err.stack || err)
  }
}