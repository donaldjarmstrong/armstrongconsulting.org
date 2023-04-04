'use strict'

const path = require('path')
const fs = require('fs')
const pkg = require('./package')
const Koa = require('koa')
const Router = require('koa-router')
const serve = require('koa-static')
const logger = require('koa-pino-logger')()

const app = new Koa()
const router = new Router()

app.use(logger)
app.use(router.routes())
app.use(router.allowedMethods())
app.use(serve('./artifacts'))

const readFile = (fileName) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, fileName), { encoding: 'utf8' }, (err, data) => {
      if (err) reject(err)
      resolve(data)
    })
  })
}

router.get(['/', '/(index|resume)(.*)'], async function resume (ctx, next) {
  ctx.body = await readFile('/resume.html')
})

router.get('/robots.txt', async function robots (ctx, next) {
  ctx.type = 'text/plain'
  ctx.body = 'User-agent: *\nDisallow: /'
})

app.use(async (ctx, next) => {
  try {
    await next()
    const status = ctx.status || 404
    if (status === 404) {
      ctx.throw(404)
    }
  } catch (err) {
    if (err.status === 404) {
      // 404 handler
      ctx.status = 404
      ctx.body = await readFile('/404.html')
      return
    }

    ctx.status = err.status
    ctx.body = err.message
    app.emit('error', err, ctx)
  }
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`${pkg.name} v${pkg.version} listening on port ${port}`)
})
