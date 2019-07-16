'use strict'





const rp = require('request-promise')
const cheerio = require('cheerio')


const scrapList = async function(medicamento){
    var itens = [];
    const base = "https://consultaremedios.com.br"
    const options = {
      uri: 'https://consultaremedios.com.br/busca?termo='+medicamento+'&filter[with_offers]=Com%20ofertas',
      transform: function (body) {
        return cheerio.load(body)
      }
    };
    try{
        const $ = await rp(options);
        if($("#result-subtitle").text() == "Desculpe, mas não encontramos nenhum resultado para sua busca")
            return null;
        $('.product-block').each( async (i,item) => {
            const page = base + item['attribs']['data-link'];
            const name = $(item).find("div:nth-child(1) > div:nth-child(2) > h2:nth-child(1) > a:nth-child(1) > span:nth-child(1)").text().toLowerCase();
            itens.push({'page':page,'name':name});
        });
    }catch(err){
      return null;
    }
 return itens;
}



const scrapIten = async function(page,name){
    const base = "https://consultaremedios.com.br"
    const optionsInner = {
                uri: page,
                transform: function (body) {
                    return cheerio.load(body)
                }
            };
            try{
                const $ = await rp(optionsInner);
                
                var data = {'nome':name};
                

                const apresentacao = $("li.product-presentation__option--highlight:nth-child(2) > a:nth-child(1) > div:nth-child(1) > span:nth-child(1) > strong:nth-child(1)").text().toLowerCase().replace(name,""); 
                data['apresentacao'] = apresentacao;
                

                // console.log(apresentacao);

                await $(".presentation-offer__item[data-is-best-price='']").each( async(i,item2) => {

                  const loja = $(item2).find("div:nth-child(1) > a:nth-child(2)").attr("data-action");
                  data['loja'] = loja;
                  // console.log(loja);

                  const loja_link = base+$(item2).find("div:nth-child(1) > a:nth-child(2)").attr("href");
                  data['loja_link'] = loja_link;
                  // console.log(loja_link);

                  const preco = $(item2).find("div:nth-child(1) > a:nth-child(2) > div:nth-child(3) > strong:nth-child(4)").text(); 
                  data['preco'] = preco;
                  // console.log(preco);

                  // console.log(data)
                });
                // console.log(itens);
                // console.log(data)
                return [data,null];
            }catch(err) {
                console.log(err);
            }
}


const getMedicamentos = async function(medicamento){
    var itens = [];
    const list = await scrapList(medicamento);
    if(!list)
        return null;
    // console.log(list);
    for (var i in list){
        const item = list[i];
        
        itens.push(await scrapIten(item.page,item.name));
    }
    return itens;
}


async function test(){
    console.log(await getMedicamentos("neocopan"));
}
test();

















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


const queries = require('./queries.js')
const dialogManager = require('./dialogManager.js')(queries)
dialogManager.setPai();


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

//<<<<<<< HEAD
//bot.start((ctx) => ctx.reply('Olá Bem-vindo,\nSou o mediBot e posso responder algumas de suas perguntas sobre medicamentos. digite /ajuda para obter maiores informações.'))
//bot.help((ctx) => comandos.help(ctx))
bot.command("ajuda", (ctx) => {
  comandos.help(ctx);
});
bot.command("explorar", (ctx) => {
  dialogManager.interativo(ctx);
});
bot.command("consultar", (ctx) => {
  dialogManager.interativo(ctx);
});
bot.command("ajuda@websemantica_bot", (ctx) => {
  comandos.help(ctx);
});
bot.command("comparar_preco", (ctx) => {
  dialogManager.comparar(ctx);
});
//bot.on('sticker', (ctx) => ctx.reply('👍'))
//bot.hears('hi', (ctx) => ctx.reply('Hey there'))
//bot.hears(/buy/i, (ctx) => ctx.reply('Buy-buy'))
//=======
bot.start((ctx) => ctx.reply('Olá Bem-vindo,\nSou o mediBot e posso responder algumas de suas perguntas sobre medicamentos.'))
//bot.help((ctx) => comandos.help(ctx))

bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('E aí'))
bot.hears(/buy/i, (ctx) => ctx.reply('Buy-buy'))
//>>>>>>> caio
bot.on('text', (ctx) => {
    comandos.parseAndRun(ctx);
})

//bot.on('text', (ctx) => {
  //var context = getContext(ctx);
  //dialogManager.parseAndRun(context,ctx);
//})

bot.startPolling()
