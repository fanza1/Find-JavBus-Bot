import teleWorker from './src/handlers/teleWorker.js'
import Router from './router.js'

addEventListener('fetch', event => {
  return event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {

  const r = new Router()

  r.post('/teleworker', teleWorker)

  let response = await r.route(request)

  if (!response) {
    response = new Response('Not Found', { status: 404})
  }

  return response

}
