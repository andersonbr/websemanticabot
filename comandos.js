module.exports = function(sparql) {
	return {
		parseAndRun: function(ctx) {

			if (!this.checkRemediosDoPrincipioAtivo(ctx)) 
				if (!this.checkDefinicaoTermo(ctx)) 
					if (!this.checkRiscos(ctx)) 
						if (!this.checkPreco(ctx)) 
							if (!this.checkPrecoMedicamento(ctx)) 
								if (!this.checkInfoApresentacao(ctx)) 
									if (!this.checkApresentacao(ctx)) 
										if (!this.checkMedicamento(ctx))
											if (!this.help(ctx)){
												const queries = require('./queries.js');
												const dialogManager = require('./dialogManager.js')(queries);
												dialogManager.setPai();
												var context = getContext(ctx,dialogManager.parseAndRun);

											}
		},
		help: function(ctx){
		  	const txt = ctx.message.text.replace(/(|\.|\?|\!)$/, "")
			const ajudaRegex = /(.*)(ajudar|ajuda|ajude|perguntas|pergunta|perguntar)(.*)/
			if (ajudaRegex.test(txt)) {
				ctx.reply(`Olá ${ctx.message.from.first_name}, Eu sou o MediBot. Sou um chatbot feito com a finalidade de lhe ajudar a tirar dúvidas sobre medicamentos e seus riscos.
							\nPosso lhe ajudar de duas formas:
							\n\tRespondendo algumas perguntas rápidas como:\n1) Os medicamentos com um determinado princípio ativos.\nEx.:Quais são os remédios com o princípio ativo dipirona?\n\n2)Posso definir alguns termos do domínio de medicamentos.\nEx.:Defina tarja preta\n\n3)Dar informações para algum medicamento.\nEx.:Fale sobre o medicamento buscopan\n\n4)Indicar os riscos de um medicamento.\nEx.:Quais os riscos do medicamento reopro?\n\n5)Listar as apresentações de um medicamento.\nEx:Quais as apresentações do medicamento reopro?\n\n6)Dizer o preço de uma apresentação.\nEx:Dê informações sobre a apresentação de código de barras 7896382701801\n\n7)Dizer o preço de uma apresentação com imposto ICMS em um Estado.\nEx:Qual o preço com ICMS da apresentação 7896382701801 no estado do Ceará.\n\n 8)Dizer os preços de um medicamento.\nEx:Quais os preços do medicamento Buscopan?
							\n----------------------------------------
							\nAlém disso, posso responder suas perguntas de maneira interativa em dois modos:
							\n\t\t(1) Navegando sobre os coceitos definidos em minha ontologia de conhecimento. Posso lhe falar definições e relacionamentos dos conceitos que conheço.\nPara iniciar este modo digite:\nExplore "termo"
							\n\t\t(2) Consultando os dados em menu conhecimento. Posso lhe falar valores de propriedades de objetos (medicamentos,apresentações, princípios ativos, etc.) que conheço.\nPara iniciar este modo digite:\nConsulte "termo"
					`);			

				return true;
			}
		    return false
		},
		checkRemediosDoPrincipioAtivo: function(ctx) {
			const txt = ctx.message.text.replace(/( existem| existentes|)(|\.|\?|\!)$/, "").toLowerCase()
			const principioativoRegex = /(quero|saber|quais|diga|dize|fala).*rem[^ ]+dio(|s).* princ[^ ]+ ativo (.*)/
			const principioativoMatch = txt.match(principioativoRegex)
			if (principioativoMatch) {
				const principioAtivo = principioativoMatch[3]
				sparql
					.fetchMedicamentos( principioAtivo.replace(/[^a-zA-Z0-9]/g,'\\W+')
						, function(result){
						const remedios = result.bindings.reduce(function(acc, cur, i) {
							acc.push(cur.nomeMedicamento.value)
							return acc
						}, []).join(", ");
						ctx.reply(`${ctx.message.from.first_name}, aqui estão:\n ${remedios}`)
					});
				return ctx.reply(`${ctx.message.from.first_name}, vou buscar remédios com princípio ativo ${principioAtivo}, aguarde um pouco...`)
			}
			return false;
		},
		checkDefinicaoTermo:  function(ctx) {
			const txt = ctx.message.text.replace(/(|\.|\?|\!|\"|\')$/, "").toLowerCase()
			const definicaoRegex = /(.*)((o que [^ ])|(defin|significa)([^ ]*)( de)?)( um(a?))? (.*)/i
			const definicaoMatch = txt.match(definicaoRegex)
			if (definicaoMatch) {
				const termo = definicaoMatch[9]
				sparql
					.fetchDefinicao( termo.replace(/[^a-zA-Z0-9]/g,'\\W+')
						,async function(result){
						//console.log(result.bindings);
						await ctx.reply(`Conheço ${result.bindings.length} termos parecedios com "${termo}"`);
						//console.log(result.bindings.length);
						result.bindings.forEach(function(cur,i,array){
							//console.log(cur);
							var response = "";
							if(cur.titles)
								response = response + "Nomes conhechidos:\n\t"+valor(cur.titles)+"\n\n";
							if(cur.comments)
								response = response + "significando:\n\t"+ valor(cur.comments)+"\n\n";
							if(cur.types)
								response = response + "Na ontologia tem o(s) tipo(s):\n\t"+valor(cur.types);
							if(response != "")
								ctx.reply(response);
						});
						//const definicoes = result.bindings.reduce(function(acc, cur, i) {							
						//	const resultado = "\n-Nomes conhechidos:\n"+valor(cur.titles)+"\n\n-Tipos:\n"+valor(cur.types)+"\n\n-Definição:\n"+valor(cur.comments)
						//	acc.push(resultado)
						//	return acc
						//}, []).join("\n\n----------------------------------------\n\n");
						//ctx.reply(`${ctx.message.from.first_name}, aqui estão: \n${definicoes}`)
					});
				return ctx.reply(`${ctx.message.from.first_name}, vou buscar a definição de ${termo}, aguarde um pouco...`)
			}
			return false;
		},
		checkMedicamento: function(ctx) {
			const txt = ctx.message.text.replace(/(|\.|\?|\!|\"|\')$/, "").toLowerCase()
			const medicamentoRegex = /(.*)(medicamento|rem[^ ]dio) (.*)/i
			const medicamentoMatch = txt.match(medicamentoRegex)
			if (medicamentoMatch) {
				const termo = medicamentoMatch[3]
				sparql
					.fetchMedicamento( termo.replace(/[^a-zA-Z0-9]/g,'\\W+')
						 ,async function(result){


						await ctx.reply(`Conheço ${result.bindings.length} medicamentos com nomes parecedios com "${termo}"`);
						//console.log(result.bindings.length);
						result.bindings.forEach(function(cur,i,array){
							//console.log(cur);
							var response = "";
							if(cur.title)
								response = `O "${valor(cur.title)}"\n`;
							if(cur.tipos)
								response = `${response}É um ${valor(cur.tipos)}.\n`;
							if(cur.classeTerapeutica)
								response = `${response}Da classe terapêutica "${valor(cur.classeTerapeutica)}".\n`;
							if(cur.laboratorio)
								response = `${response}Seu produtor é o laboratório "${valor(cur.laboratorio)}".\n`;
							if(cur.quantidade_apresentacoes)
								response = `${response}Ele tem ${valor(cur.quantidade_apresentacoes)} apresentaçoes diferentes.\n`;
							if(cur.nomes_principio_Ativo)
								response = `${response}Tem o princípio ativo "${valor(cur.nomes_principio_Ativo)}" .\n`;
							if(cur.indicacoes)
								response = `${response}Com indicações para: ${valor(cur.indicacoes)}.\n`;
							if(response != "")
								ctx.reply(response);
						});

						//const definicoes = result.bindings.reduce(function(acc, cur, i) {
						//	var resultado = "\n-Nomes conhechidos:\n"+valor(cur.title)+"\n\n-Laboratório:\n"+valor(cur.laboratorio)+"\n\n-Quantidade de apresentações:\n"+valor(cur.quantidade_apresentacoes)+"\n\n-Tipos:\n"+valor(cur.tipos)+"\n\n-Classe terapêutica:\n"+valor(cur.classeTerapeutica)+"\n\n-Principios ativos:\n"+valor(cur.nomes_principio_Ativo)+"\n\n-Indicações:\n"+valor(cur.indicacoes)
						//	acc.push(resultado)
						//	return acc
						//}, []).join("\n\n----------------------------------------\n\n");
						//ctx.reply(`${ctx.message.from.first_name}, aqui estão: \n${definicoes}`)
					});
				return ctx.reply(`${ctx.message.from.first_name}, vou buscar a informações sobre o medicamento ${termo}, aguarde um pouco...`)
			}
			return false;
		},
		checkRiscos: function(ctx) {
			const txt = ctx.message.text.replace(/(|\.|\?|\!|\"|\')$/, "").toLowerCase()
			const riscosRegex = /(.*)risco(s?) d(.) (medicamento |rem[^]dio )?(.*)/i
			const riscosMatch = txt.match(riscosRegex)
			if (riscosMatch) {
				const termo = riscosMatch[5]
				sparql
					.fetchRiscos( termo.replace(/[^a-zA-Z0-9]/g,'\\W+')
						 , async function(result){
						


						await ctx.reply(`Conheço ${result.bindings.length} medicamentos com nomes parecedios com "${termo}"`);
						//console.log(result.bindings.length);
						result.bindings.forEach(function(cur,i,array){
							//console.log(cur);
							var response = "";
							if(cur.title)
								response = `O medicamento "${valor(cur.title)}"\n`;
							if(cur.efeitos_colaterais_pt)
								response = `${response}Pode causar os efeitos colaterais "${valor(cur.efeitos_colaterais_pt)}".\n\n`;
							if(cur.risco_gravidez)
								response = `${response}Cuidado! esse remédio possui riscos na gravidez porque ele é ${valor(cur.risco_gravidez)}.\n`;
							if(cur.uso_aleitamento)
								response = `${response}Ele também possui riscos na amamentação como ${valor(cur.uso_aleitamento)}.\n`;
							if(cur.aplicacao)
								response = `${response}Tem indicações na aplicação ${valor(cur.aplicacao)}.\n`;
							
							if(response != "")
								ctx.reply(response);
						});

						//const definicoes = result.bindings.reduce(function(acc, cur, i) {
						//	var resultado = "\n-Nomes conhechidos:\n"+valor(cur.title)+"\n\n-Efeitos colaterais:\n"+valor(cur.efeitos_colaterais_pt)+"\n\n-Risco na gravidez:\n"+valor(cur.risco_gravidez)+"\n\n-Recomendação de uso na amamentação:\n"+valor(cur.uso_aleitamento)+"\n\n-Tipo de aplicação:\n"+valor(cur.aplicacao)
						//	acc.push(resultado)
						//	return acc
						//}, []).join("\n\n----------------------------------------\n\n");
						//ctx.reply(`${ctx.message.from.first_name}, aqui estão: \n${definicoes}`)
					});
				return ctx.reply(`${ctx.message.from.first_name}, vou buscar riscos do medicamento ${termo}, aguarde um pouco...`)
			}
			return false;
		},
		checkApresentacao: function(ctx) {
			const txt = ctx.message.text.replace(/(|\.|\?|\!|\"|\')$/, "").toLowerCase()
			const apresentacaoRegex = /(.*)apresenta[^ ]([^ ]o|[^ ]es)( d[^ ](s)?)?( medicamento(s)?| rem[^ ]dio(s)?)? (.*)/i
			const apresentacaoMatch = txt.match(apresentacaoRegex)
			if (apresentacaoMatch) {
				const termo = apresentacaoMatch[8]
				sparql
					.fetchApresentacao( termo.replace(/[^a-zA-Z0-9]/g,'\\W+')
						,async function(result){



						await ctx.reply(`Conheço ${result.bindings.length} medicamentos com nomes parecedios com "${termo}"`);
						//console.log(result.bindings.length);
						result.bindings.forEach(function(cur,i,array){
							//console.log(cur);
							var response = "";
							if(cur.title)
								response = `O medicamento "${valor(cur.title)}"\n`;
							if(cur.laboratorio)
								response = `${response}Do laboratório "${valor(cur.laboratorio)}".\n`;
							if(cur.apresentacoes)
								response = `${response}Tem as apresentações:\n${valor(cur.apresentacoes)}\n`;
							
							if(response != "")
								ctx.reply(response);
						});


						//const definicoes = result.bindings.reduce(function(acc, cur, i) {
						//	var resultado = "\n-Nomes conhechidos:\n"+valor(cur.title)+"\n\n-Laboratório:\n"+valor(cur.laboratorio)+"\n\n-Apresentação:\n"+valor(cur.apresentacoes)
						//	acc.push(resultado)
						//	return acc
						//}, []).join("\n\n----------------------------------------\n\n");
						//ctx.reply(`${ctx.message.from.first_name}, aqui estão: \n${definicoes}`)
					});
				return ctx.reply(`${ctx.message.from.first_name}, vou buscar as apresentações do medicamento ${termo}, aguarde um pouco...`)
			}
			return false;
		},
		checkInfoApresentacao: function(ctx) {
			const txt = ctx.message.text.replace(/(|\.|\?|\!|\"|\')$/, "").toLowerCase()
			const infoApresentacaoRegex = /(.*)(c[^ ]digo de barra(s)?|ean) (.*)/i
			const infoApresentacaoMatch = txt.match(infoApresentacaoRegex)
			if (infoApresentacaoMatch) {
				const termo = infoApresentacaoMatch[4]
				sparql
					.fetchInfoApresentacao( termo.replace(/[^a-zA-Z0-9]/g,'\\W+')
						 ,async function(result){
						
						await ctx.reply(`Conheço ${result.bindings.length} medicamentos com nomes parecedios com "${termo}"`);
						//console.log(result.bindings.length);
						result.bindings.forEach(function(cur,i,array){
							//console.log(cur);
							var response = "";
							if(cur.titleApresentacao)
								response = `A apresentação "${valor(cur.titleApresentacao)}"\n`;
							if(cur.titleMedicamento)
								response = `${response}Do medicamento "${valor(cur.titleMedicamento)}".\n`;
							if(cur.tarja)
								response = `${response}Possui a classificação de ${valor(cur.tarja)}.\n`;
							if(cur.restricao && valor(cur.restricao) != "f")
								response = `${response}Esta apresentação possui restrições hospitalares!\n`;
							if(cur.valorFabricaSemImposto)
								response = `${response}Essa apresentação tem o preço máximo de fábrica sem impostos permitido de R$${valor(cur.valorFabricaSemImposto)}\n`;
							if(cur.valorConsumidorSemImposto)
								response = `${response}E tem o preço máximo ao consumidor sem impostos permitido de R$${valor(cur.valorConsumidorSemImposto)}\n`;
							if(cur.valorGovernoSemImposto)
								response = `${response}E tem o preço máximo ao governo sem impostos permitido de R$${valor(cur.valorGovernoSemImposto)}\n`;
							
							if(response != "")
								ctx.reply(response);
						});

						//const definicoes = result.bindings.reduce(function(acc, cur, i) {
						//	var resultado = "\n-Apresentação:\n"+valor(cur.titleApresentacao)+"\n-Medicamento:\n"+valor(cur.titleMedicamento)+"\n-Tarja:\n"+valor(cur.tarja)+"\n-Restrito para uso hospitalar:\n"+valor(cur.restricao)+"\n-Valor de fábrica máximo 0% ICMS:\nR$ "+valor(cur.valorFabricaSemImposto)+"\n-Valor ao consumidor máximo 0% ICMS:\nR$ "+valor(cur.valorConsumidorSemImposto)+"\n-Valor ao governo máximo 0% ICMS:\nR$ "+valor(cur.valorGovernoSemImposto)
						//	acc.push(resultado)
						//	return acc
						//}, []).join("\n\n----------------------------------------\n\n");
						//ctx.reply(`${ctx.message.from.first_name}, aqui estão: \n${definicoes}`)
					});
				return ctx.reply(`${ctx.message.from.first_name}, vou buscar as informações da apresentação do medicamento de código de barras ${termo}, aguarde um pouco...`)
			}
			return false;
		},
		checkPreco: function(ctx) {
			const txt = ctx.message.text.replace(/(|\.|\?|\!|\"|\')$/, "").toLowerCase()
			const precoRegex = /(.*)(pre[^ ]o com icms|valor com icms)(.*)(c[^ ]digo de barra(s)?|ean) (.*) (em|n(o|a)) (.*)/i
			const precoMatch = txt.match(precoRegex)
			if (precoMatch) {
				const ean = precoMatch[6]
				const localidade = precoMatch[9]
				sparql
					.fetchPreco( ean.replace(/[^a-zA-Z0-9]/g,'\\W+')
						 ,  localidade.replace(/[^a-zA-Z0-9]/g,'\\W+')
						,function(result) {
						

						result.bindings.forEach(function(cur,i,array){
							//console.log(cur);
							var resultado = "\n-Apresentação:\n"+valor(cur.titleApresentacao)+"\n-Medicamento:\n"+valor(cur.titleMedicamento)+"\n-ICMS:\n"+valor(cur.ICMS)+"\n-Valor de fábrica máximo com ICMS:\nR$ "+valor(cur.valorFabricaComImposto)+"\n-Valor ao consumidor máximo com ICMS:\nR$ "+valor(cur.valorConsumidorComImposto)+"\n-Valor ao governo máximo com ICMS:\nR$ "+valor(cur.valorGovernoComImposto)     +"\n-Valor de fábrica máximo com ICMS em area de livre comércio:\nR$ "+valor(cur.valorFabricaComImpostoALC)+"\n-Valor ao consumidor máximo com ICMS em área de livre comércio:\nR$ "+valor(cur.valorConsumidorComImpostoALC)+"\n-Valor ao governo máximo com ICMS em area de livre comércio:\nR$ "+valor(cur.valorGovernoComImpostoALC);
							
							if(resultado != "")
								ctx.reply(resultado);
						});


						//const definicoes = result.bindings.reduce(function(acc, cur, i) {
						//	var resultado = "\n-Apresentação:\n"+valor(cur.titleApresentacao)+"\n-Medicamento:\n"+valor(cur.titleMedicamento)+"\n-ICMS:\n"+valor(cur.ICMS)+"\n-Valor de fábrica máximo com ICMS:\nR$ "+valor(cur.valorFabricaComImposto)+"\n-Valor ao consumidor máximo com ICMS:\nR$ "+valor(cur.valorConsumidorComImposto)+"\n-Valor ao governo máximo com ICMS:\nR$ "+valor(cur.valorGovernoComImposto)     +"\n-Valor de fábrica máximo com ICMS em area de livre comércio:\nR$ "+valor(cur.valorFabricaComImpostoALC)+"\n-Valor ao consumidor máximo com ICMS em área de livre comércio:\nR$ "+valor(cur.valorConsumidorComImpostoALC)+"\n-Valor ao governo máximo com ICMS em area de livre comércio:\nR$ "+valor(cur.valorGovernoComImpostoALC)
						//	acc.push(resultado)
						//	return acc
						//}, []).join("\n\n----------------------------------------\n\n");
						//ctx.reply(`${ctx.message.from.first_name}, aqui estão: \n${definicoes}`)
					});
				return ctx.reply(`${ctx.message.from.first_name}, vou buscar o preço com ICMS da apresentação do medicamento de código de barras ${ean}, aguarde um pouco...`)
			}
			return false;
		},
		checkPrecoMedicamento: function(ctx) {
			const txt = ctx.message.text.replace(/(|\.|\?|\!|\"|\')$/, "").toLowerCase()
			const precoRegex = /(.*)(pre[^ ]o(s)?)( d(.*)|( para (o|a)?))?( medica(.*)| rem[^ ]dio(s)?)? (.*)/i
			const precoMatch = txt.match(precoRegex)
			if (precoMatch) {
				const medicamento = precoMatch[11]
				sparql
					.fetchPrecoMedicamento( medicamento.replace(/[^a-zA-Z0-9]/g,'\\W+')
						,function(result) {
						

						result.bindings.forEach(function(cur,i,array){
							//console.log(cur);
							var resultado = "\n-Apresentação:\n"+valor(cur.title)+" - "+valor(cur.titleApresentacao)+"\n-Valor ao consumidor sem impostos:\nR$:\n"+valor(cur.precoVal);
							
							if(resultado != "")
								ctx.reply(resultado);
							else
								ctx.reply("Desculpe não encontrei nenhum preço para o medicamento.");
						});


						//const definicoes = result.bindings.reduce(function(acc, cur, i) {
						//	var resultado = "\n-Apresentação:\n"+valor(cur.titleApresentacao)+"\n-Medicamento:\n"+valor(cur.titleMedicamento)+"\n-ICMS:\n"+valor(cur.ICMS)+"\n-Valor de fábrica máximo com ICMS:\nR$ "+valor(cur.valorFabricaComImposto)+"\n-Valor ao consumidor máximo com ICMS:\nR$ "+valor(cur.valorConsumidorComImposto)+"\n-Valor ao governo máximo com ICMS:\nR$ "+valor(cur.valorGovernoComImposto)     +"\n-Valor de fábrica máximo com ICMS em area de livre comércio:\nR$ "+valor(cur.valorFabricaComImpostoALC)+"\n-Valor ao consumidor máximo com ICMS em área de livre comércio:\nR$ "+valor(cur.valorConsumidorComImpostoALC)+"\n-Valor ao governo máximo com ICMS em area de livre comércio:\nR$ "+valor(cur.valorGovernoComImpostoALC)
						//	acc.push(resultado)
						//	return acc
						//}, []).join("\n\n----------------------------------------\n\n");
						//ctx.reply(`${ctx.message.from.first_name}, aqui estão: \n${definicoes}`)
					});
				return ctx.reply(`${ctx.message.from.first_name}, vou buscar os preços para o medicamento ${medicamento}, aguarde um pouco...`)
			}
			return false;
		}

	}
}
