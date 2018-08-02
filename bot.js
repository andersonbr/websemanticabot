'use strict'
global.valor = function(vari){
					if(vari)
						return vari.value
					return ""
				}

const Telegraf = require('telegraf')
const bot = new Telegraf(process.env.TELEGRAMTOKEN)
const sparql = require('./sparql.js')
const comandos = require('./comandos.js')(sparql)

bot.context.db = {
  getScores: () => { return 42 }
}

bot.use((ctx, next) => {
  const start = new Date()
  if (ctx.message)
    console.log(ctx.message)
  return next(ctx).then(() => {
    const ms = new Date() - start
    console.log('Response time %sms', ms)
  })
})

bot.start((ctx) => ctx.reply('Welcome!'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.hears(/buy/i, (ctx) => ctx.reply('Buy-buy'))
bot.on('text', (ctx) => {
    comandos.parseAndRun(ctx);
})

bot.startPolling()
