'use strict'

const mongo = require('mongodb');
const urlMongo = "mongodb://localhost:27017/";
global.getContext = function(telegramCTX,callback){
  //Busca no mongo
  //console.log("\nVai buscar!\n");
  var newUser = {
                  'user_id': telegramCTX.from.id,
                  'first_name':telegramCTX.from.first_name,
                  'last_name':telegramCTX.from.last_name,
                  'username':telegramCTX.from.username,
                  'language_code':telegramCTX.from.language_code,
                  'message' : telegramCTX.message.text,
                  'timestamp' : telegramCTX.message.date,
                  'state' : 0,
                  'taskList':-1,
                  'listOptions': null,
                  'listString': null,
                  'termo': null,
                  'queryTerm': null,
                  'uri_selected': null,
                  'maxTermos': 0,
                  'offset': 0,
                  'type_selected': -1
                };
  mongo.connect(urlMongo, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mediBot");
    //console.log("\nDatabase accessed Para Buscar!\n");
    dbo.collection("users").findOne({'user_id': telegramCTX.from.id}, function(err,result){
      if (err) throw err;
      //console.log("FInd:\n");
      //console.log(result);
      if(result){
        //console.log("\nusuário recuperado\n");
        newUser = result;
        db.close();
        callback(newUser, telegramCTX);
      }else{
        
        dbo.collection("users").insertOne(newUser,function(err,result){
          if(err) throw err;

          db.close();
          callback(newUser, telegramCTX);
        });
        console.log("\ncriado novo usuário\n");
      }
    });

  });
}

global.pai = null;

global.saveContext = function(ctx){
  //Busca no mongo

  //console.log("\n\n\n\n\n\nVai Salvar!\n\n\n\n\n");
  mongo.connect(urlMongo, function(err, db) {
    if (err) throw err;
    //console.log("\nDatabase accessed Para Salvar!\n");
    var dbo = db.db("mediBot");
    dbo.collection("users").deleteOne({'user_id':ctx.user_id},function(err,result){
      if(err) throw err;
      dbo.collection("users").insertOne(ctx,function(err,result){
        if(err) throw err;
        //console.log("\nusuário atualizado\n");
        db.close();
        
      });
      
    });
  });
}

global.valor = function(vari){
					if(vari)
						return vari.value
					return ""
				}
global.limit = 10;


const Telegraf = require('telegraf')
const bot = new Telegraf(process.env.TELEGRAMTOKEN)
const sparql = require('./sparql.js')
const comandos = require('./comandos.js')(sparql)
//const queries = require('./queries.js')
//const dialogManager = require('./dialogManager.js')(queries)

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

bot.start((ctx) => ctx.reply('Olá Bem-vindo,\nSou o mediBot e posso responder algumas de suas perguntas sobre medicamentos.'))
bot.help((ctx) => comandos.help(ctx))

bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.hears(/buy/i, (ctx) => ctx.reply('Buy-buy'))
bot.on('text', (ctx) => {
    comandos.parseAndRun(ctx);
})

//bot.on('text', (ctx) => {
  //var context = getContext(ctx);
  //dialogManager.parseAndRun(context,ctx);
//})

bot.startPolling()
