const crawler = require("./crawllers.js");

module.exports = function(sparql) {
	return {
		setPai:function(){
			pai = this;
		},
		parseAndRun: function(ctx,telegram) {

			if (telegram.message.text.match(/(.*)explor(.*)/) || telegram.message.text.match(/(.*)consult(.*)/)){
				ctx.state = 0;
				return pai.state0(ctx,telegram);
			}
			switch(ctx.state){
				case 0:
					pai.state0(ctx,telegram);
				break;
				case 1:
					pai.state1(ctx,telegram);
				break;
				case 2:
					pai.state2(ctx,telegram);
				break;
				case 3:
					pai.state3(ctx,telegram);
				break;
				case 4:
					pai.state4(ctx,telegram);
				break;
				case 5:
					pai.state5(ctx,telegram);
				break;
				case 6:
					pai.state6(ctx,telegram);
				break;
				case 7:
					pai.state7(ctx,telegram);
				break;
				case 8:
					pai.state8(ctx,telegram);
				break;
				case 9:
					pai.state9(ctx,telegram);
				break;
				case 10:
					pai.state10(ctx,telegram);
				break;
				default:
					pai.stateD(ctx,telegram);
			}
			//saveContext(ctx);
			
		},

		state0: function(ctx,telegram){
			//Definir tipo da tarefa
			//console.log("\nEstado 0!\n");

			const text = telegram.message.text.replace(/(|\.|\?|\!|\"|\')$/, "").toLowerCase().trim();

			//Tarefa de exploração
			const exploracaoRegex = /(.*)explor[^ ]* (.*)/;
			const exploracaoDuvidaRegex = /(.*)explor[^ ]*/;
			var match = text.match(exploracaoRegex);
			if(match){
				ctx.state = 2;
				ctx.termo = match[2];
				ctx.taskList = 0;
				pai.state2(ctx,telegram);
			}else if(text.match(exploracaoDuvidaRegex)){
				//Termo não encontrado na entrada
				ctx.state= 1;
				telegram.reply(`Você quer a definição sobre qual termo?`);
			}else{
				//Tarefa de consulta
				const consultaRegex = /(.*)consult[^ ]* (.*)/;
				const consultaDuvidaRegex = /(.*)consult[^ ]*/;
				match = text.match(consultaRegex);
				if(match){
					ctx.state= 2;
					ctx.termo = match[2];
					ctx.taskList = 1;
					pai.state2(ctx,telegram);
				}else if(text.match(consultaDuvidaRegex)){
					//Termo não encontrado na entrada
					ctx.state = 8;
					telegram.reply(`Você quer consultar qual termo?`)
				}else{
					telegram.reply(`Desculpe. não entendi sua intenção.\n\nVocê tentar os modos interativos pelo menu de comandos do chat...`);
				}
			}
		},
		state1: function(ctx,telegram){
			//Recebe termo buscado

			//console.log("\nEstado 1!\n");

			ctx.state = 2;
			ctx.taskList = 0;
			ctx.termo = telegram.message.text.replace(/(|\.|\?|\!|\"|\')$/, "").toLowerCase();
			pai.state2(ctx,telegram);
		},
		state2: function(ctx,telegram){
			//Busca termo
			//console.log("\nEstado 2!\n");
			
			telegram.reply(`Certo. Vou procurar os resultados para o termo exato ${ctx.termo}`);
			// var termo = ctx.termo.replace(/[^a-zA-Z0-9]/g,'\\W+'); //substitur caracteres especiais (WINDOWS)
			var termo = ctx.termo;
			sparql
				.numeroResultadosExato(termo,function(result){
					const retorno = result.bindings.reduce(function(acc, cur, i) {							
						const resultado = cur.qtd.value;
						acc.push(resultado)
						return acc
					},[]);

					const qtd = parseInt(retorno[0]);
					if(qtd >= 1){
						sparql
							.getURI(termo,function(result2){
								const retornoURI = result2.bindings.reduce(function(acc, cur, i) {							
									const resultadoUri = cur.uri.value;
									acc.push(resultadoUri)
									return acc
								},[]);
								uri = retornoURI[0];
								//console.log("selected URI:"+uri)
								ctx.uri_selected = uri;
								if(ctx.taskList == 0){
									ctx.state = 3;
									pai.state3(ctx,telegram);
								}else if(ctx.taskList == 1){
									ctx.state = 7;
									pai.state7(ctx,telegram);
								}
							})
					}else{
						telegram.reply(`Não encontrei nehum resultado para o termo exato, mas vou procurar para o termos parecidos ao termo ${ctx.termo}`);
						sparql
							.numeroResultados(termo,function(result2){
								const retornoSem = result2.bindings.reduce(function(acc, cur, i) {							
									const resultadoSem = cur.qtd.value;
									acc.push(resultadoSem)
									return acc
								},[]);
								const qtdSem = parseInt(retornoSem[0]);
								if(qtdSem == 0){
									telegram.reply(`Desculpe, mas também não encontrei termos parecidos`);
									ctx.state = 0;
									ctx.termo = null;
								}else{
									//Apresentar lista
									ctx.state = 4;
									pai.state4(ctx,telegram);
								}
							})
					}
				});
		},
		state3: function(ctx,telegram){
			//Exibe resultados definição

			//console.log("\nEstado 3!\n");
			
			var termo = ctx.uri_selected;
			var textoDefinicao = ""
			sparql
				.definicoes(termo,function(result){
					const processa = result.bindings.reduce(function(acc, cur, i) {
						const titles = valor(cur.titles);
						const types = valor(cur.classes);
						const definicao = valor(cur.commento);
						textoDefinicao = "É conhecido como " + titles;
						if(types != ""){
							textoDefinicao = textoDefinicao+".\nAlém disso é dos tipos: " + types;
						}
						if(definicao != ""){
							textoDefinicao = textoDefinicao+".\nPode ser descrito como: " + definicao;	
						}
						return acc;
					},[])
					telegram.reply(`${textoDefinicao}`);
					ctx.state = 6;
					sparql
						.types(ctx.uri_selected,function(result2){
							const retornoURI = result2.bindings.reduce(function(acc, cur, i) {							
								const resultadoURI = valor(cur.types);
								acc.push(resultadoURI)
								return acc
							},[]);

							//console.log(retornoURI);
							if(retornoURI.includes('http://www.w3.org/2002/07/owl#Class')){
								//É uma classe
								ctx.type_selected = 0;
							}else if(retornoURI.includes("http://www.w3.org/2002/07/owl#ObjectProperty") || retornoURI.includes("http://www.w3.org/2002/07/owl#DatatypeProperty")){
								//É objectProperty ou datatypeProperty
								ctx.type_selected = 1;
							}else{
								//É instância
								ctx.type_selected = 2;
							}

							pai.state6(ctx,telegram);
						});
				})
				

		},
		state4: function(ctx,telegram){
			//exibe lista exploração

			//console.log("\nEstado 4!\n");

			// var termo = ctx.termo.replace(/[^a-zA-Z0-9]/g,'\\W+'); ////substitur caracteres especiais (WINDOWS)
			var termo = ctx.termo;
			var listaStr = "";
			
			sparql
				.list(termo,limit,ctx.offset,function(result){
					const lista = result.bindings.reduce(function(acc, cur, i) {
						var resultado = [valor(cur.uri),valor(cur.titles)];
						acc.push(resultado);
						listaStr = listaStr + "\n("+i+") "+valor(cur.titles);
						return acc;
					}, []);
					ctx.listOptions = lista;
					//if(ctx.offset + limit <= ctx.maxTermos)
					//	listaStr ="\n(" + lista.length + ") Mais";
					//const final = ctx.offset + lista.length;
					//ctx.listString = `Esses são os resultados ${ctx.offset} - ${final} de ${ctx.maxTermos}:\n${listaStr}.\n\n É só digitar o número da opção`;
					ctx.listString = `Esses são os resultados:\n${listaStr}.\n\n É só digitar o número da opção`;
					pai.apresentarLista(ctx,telegram);
				});
		},
		state5:function(ctx,telegram){
			//Recebe seleção da lista

			//console.log("\nEstado 5!\n");

			const text = telegram.message.text.replace(/(|\.|\?|\!|\"|\')$/, "").toLowerCase();
			if(text.includes("sair"))
				return pai.sair(ctx,telegram);
			numExp = /(\d)*/;
			const number = text.match(numExp);
			if(number){
				op = parseInt(number[0]);
				if(!ctx.listOptions[op]){
					telegram.reply(`Essa não é uma opção válida...`);
					pai.apresentarLista(ctx,telegram);	
				}else{
					ctx.uri_selected = ctx.listOptions[op][0];
					const termo = ctx.listOptions[op][1];
					ctx.listOptions = null;
					ctx.maxTermos = 0;
					ctx.offset = 0;
					ctx.listString = null;
					if(ctx.taskList == 0){
						//Seleciona termo definição
						ctx.state = 3;
						pai.state3(ctx,telegram);
					}else if(ctx.taskList == 1){
						//Seleciona termo para consulta
						ctx.state = 7;
						pai.state7(ctx,telegram);
					}else if(ctx.taskList == 2){
						//Seleciona propriedade para consulta
						ctx.state = 9;
						pai.state9(ctx,telegram);
					}
					else if(ctx.taskList == 3){
						//Seleciona medicamento para comparação
						ctx.state = 11;
						ctx.termo = termo;
						pai.state11(ctx,telegram);
					}

				}
			}else{
				telegram.reply(`Não entendi sua resposta. Digite o número da opção desejada`);
				pai.apresentarLista(ctx,telegram);
			}
		},
		state6: function(ctx,telegram){
			//Mais informações


			//console.log("\nEstado 6!\n");

			var listaStr = "";
			
			var tipo = -1;
			switch(ctx.type_selected){
				case 0:
					//Classe
					sparql
						.moreClass(ctx.uri_selected,function(result){
							const lista = result.bindings.reduce(function(acc, cur, i) {
								var resultado = [valor(cur.termo),valor(cur.title)];
								//console.log(resultado);
								const tipoR = parseInt(cur.types.value);
								acc.push(resultado);
								var cabecalho = ""
								if(tipo != tipoR){
									//mudou tipo de itens
									switch(tipoR){
										case 0:
											cabecalho = "Classes mais genéricas:\n";
											tipo = tipoR;
										break;
										case 1:
											cabecalho = "Classes mais específicas:\n";
											tipo = tipoR;
										break;
										case 2:
											cabecalho = "Propriedades:\n";
											tipo = tipoR;
										break;
										default:

									}
								}
								listaStr = listaStr + "\n" + cabecalho + "("+i+") "+resultado[1];
								return acc;
							}, []);
							ctx.maxTermos = lista.length;
							ctx.listOptions = lista;
							ctx.listString = `Esses são alguns termos relacionados que você pode ter interesse:\n${listaStr}.\n\n É só digitar o número da opção`;
							pai.apresentarLista(ctx,telegram);
						})
				break;
				case 1:
					//ObjectPro //DataType
					sparql
						.moreProp(ctx.uri_selected,function(result){
							const lista = result.bindings.reduce(function(acc, cur, i) {
								var resultado = [valor(cur.termo),valor(cur.title)];
								const tipoR = parseInt(cur.types.value);
								acc.push(resultado);
								var cabecalho = ""
								if(tipo != tipoR){
									//mudou tipo de itens
									switch(tipoR){
										case 0:
											cabecalho = "Dono da propriedade:\n";
											tipo = tipoR;
										break;
										case 1:
											cabecalho = "Valor da proriedade:\n";
											tipo = tipoR;
										break;
									}
								}
								listaStr = listaStr + "\n" + cabecalho + "("+i+") "+resultado[1];
								return acc;
							}, []);
							ctx.maxTermos = lista.length;
							ctx.listOptions = lista;
							ctx.listString = `Esses são alguns termos relacionados que você pode ter interesse:\n${listaStr}.\n\n É só digitar o número da opção`;
							pai.apresentarLista(ctx,telegram);
						})
				break;
				case 2:
					//Instance
					ctx.state = 7;
					pai.state7(ctx,telegram);
				break;
				default:
					//Erro
					pai.stateD(ctx,telegram);
			}
		},
		state7: function(ctx,telegram){
			//Processa resultado da tarefa de consulta


			//console.log("\nEstado 7!\n");

			
			resultado = {};
			var strin = "";
			sparql
				.queryTerm(ctx.uri_selected,function(result){
					const lista = result.bindings.reduce(function(acc, cur, i) {
						var label = valor(cur.titleProp);
						if(label == "")
							label = cur.p.value.split("/")[cur.p.value.split("/").length-1];
						var indexProp = cur.p.value.replace(/\./g,"*");
						if(!resultado[indexProp]){
							resultado[indexProp] = {"title" : label,'uri':cur.p.value,'typeProp':cur.types.value,'values':[]};
							//Adiciona prop na lista de escolha
							var listaOps =[cur.p.value,label];
							acc.push(listaOps);
							strin=strin+"("+(acc.length-1)+")"+label+"\n";
						}

						var valueProp = valor(cur.titleValue);
						if(valueProp == ""){
							if(parseInt(cur.types.value)== 0){
								valueProp = cur.v.value.split("/")[cur.v.value.split("/").length-1];
							}else //É datatype
								valueProp = cur.v.value;
						}
						
						
						resultado[indexProp]['values'].push({"valueProp" : valueProp,'uri':cur.v.value});
						return acc;
					},[]);
					//console.log(resultado)
					ctx.listOptions = lista;
					ctx.maxTermos= lista.length;
      				ctx.offset= 0;
      				ctx.queryTerm = resultado;
      				ctx.taskList = 2;
					ctx.listString = "Esse objeto possui as seguintes propriedades:\n"+strin+"\n Deseja ver o valor de alguma?";
					pai.apresentarLista(ctx,telegram);
				})
		},
		state8: function(ctx,telegram){
			//Pede confirmação de termo da consulta

			//console.log("\nEstado 8!\n");

			ctx.state = 2;
			ctx.termo = telegram.message.text.replace(/(|\.|\?|\!|\"|\')$/, "").toLowerCase().trim();
			ctx.taskList = 1;
			pai.state2(ctx,telegram);
		},
		state9: function(ctx,telegram){
			//Mostra lista de valores propriedade

			//console.log("\nEstado 9!\n");

			var prop = ctx.queryTerm[ctx.uri_selected.replace(/\./g,"*")];
			//console.log(prop);
			if(prop.typeProp == 1){
				//É datatypeprop

				var valores = "";
				prop.values.forEach(function(val){
					valores = valores+val.valueProp+"\n";
				});
				//console.log("valores da família tradicional:"+valores);
				telegram.reply(valores);
				pai.sair(ctx,telegram);
			}else{
				// É objectProp
				var lista = [];
				var strin = "";
				var ind = 0;
				prop.values.forEach(function(val){
					const ele = [val.uri,val.valueProp];
					lista.push(ele);
					strin =strin+"("+ind+")"+val.valueProp+"\n";
					ind = ind + 1;
				});
				ctx.listOptions = lista;
				ctx.maxTermos= lista.length;
  				ctx.offset= 0;
  				ctx.taskList = 1;
				ctx.listString = "Esta propriedade possui os seguintes valores:\n"+strin+"\nDeseja ver informações sobre algum deles?";
				pai.apresentarLista(ctx,telegram);
			}
		},
		stateD: function(ctx,telegram) {
			// Estado desconhecido

			//console.log("\nEstado D!\n");

			ctx.state  = 0;
			ctx.maxTermos = 0;
			ctx.offset = 0;
			ctx.type_selected = -1;
			ctx.taskList = -1;
			ctx.uri_selected = null;
      		ctx.definitionConcept = null;
      		ctx.listOptions = null;
      		ctx.listString = null;
      		ctx.termo = null;

      		telegram.reply(`Me desculpe, ${ctx.first_name}. Eu sei que meio vergonhoso, mas acho que a idade está começado a fazer efeito. Você pode recomeçar?`);
      		saveContext(ctx);
		},
		limparContexto(ctx,telegram){
			ctx.user_id = telegram.from.id;
		    ctx.first_name =telegram.from.first_name;
		    ctx.last_name =telegram.from.last_name;
		    ctx.username =telegram.from.username;
		    ctx.language_code =telegram.from.language_code;
		    ctx.message = telegram.message.text;
		    ctx.timestamp = telegram.message.date;
		    ctx.state = 0;
		    ctx.taskList =-1;
		    ctx.listOptions = null;
		    ctx.listString = null;
		    ctx.termo = null;
		    ctx.queryTerm = null;
		    ctx.uri_selected = null;
		    ctx.maxTermos = 0;
		    ctx.offset = 0;
		    ctx.type_selected = -1;
		},
		sair:function(ctx,telegram){
			
			pai.limparContexto(ctx,telegram);
  			telegram.reply(`${ctx.first_name}. Até a próxima`);
  			saveContext(ctx);
  		},
		apresentarLista: function(ctx,telegram){
			telegram.reply(ctx.listString +"\nou diga 'sair' para cancelar a operação. sair sem aspas ^^.");
			ctx.state = 5;
			saveContext(ctx);
		},
		callbackInterativo(ctx,telegram){
			
			pai.limparContexto(ctx,telegram);
		  	saveContext(ctx);
		  	pai.parseAndRun(ctx,telegram);
		},
		interativo: function(telegram){
		  	getContext(telegram,pai.callbackInterativo);
		},
		comparar: function(telegram){
			getContext(telegram,pai.callbackComparar);
		},
		callbackComparar: function(ctx,telegram){
			pai.limparContexto(ctx,telegram);
			telegram.reply("Qual o nome do medicamento que você gostaria de comparar os preços?");
			ctx.state = 10;
		  	saveContext(ctx);

		},
		state10: async function(ctx,telegram){
			const text = telegram.message.text.replace(/(|\.|\?|\!|\"|\')$/, "").toLowerCase().trim();
			sparql.comp_fetchMedicamentos(text, async function(result){
				listaStr = "";
				const lista = result.bindings.reduce(function(acc, cur, i) {
						var resultado = [valor(cur.uri),valor(cur.name)];
						acc.push(resultado);
						listaStr = listaStr + "\n("+i+") "+valor(cur.name);
						return acc;
					}, []);
					if(lista.length == 0){
						await telegram.reply("Desculpe, não encontrei o medicamento na minha memória.");
						return pai.sair(ctx,telegram);
					}
					ctx.listOptions = lista;
					ctx.taskList = 3;
					ctx.listString = `Por favor, selecione o medicamento:\n${listaStr}.\n\n É só digitar o número da opção`;
					pai.apresentarLista(ctx,telegram);
			})
		},
		state11: async function(ctx,telegram){
			// console.log(ctx.uri_selected+"\n\n");
			telegram.reply("Só um momento, estou buscando os medicamentos similares...");
			sparql.comp_fetchMedicamentosSimilares(ctx.uri_selected, async function(result){
				listaStr = "";
				const lista = result.bindings.reduce(function(acc, cur, i) {
						var resultado = valor(cur.name);
						acc.push(resultado);
						return acc;
					}, []);

				// console.log(lista);

			    telegram.reply("Vou buscar os preços na WEB, isso pode demorar um pouco...");

			    const threshold = 5;
			    const precos = await crawler.compararPrecos(ctx.termo,lista,threshold);
			    for (i in precos){
			    	const item = precos[i];	
			    	const nomeO = item[0]['nome'] + item[0]['apresentacao'];

			    	// console.log(item);
			    	await telegram.reply("O medicamento:\n"+nomeO+"\n\n\nEstá com o menor preço de \nR$:"+item[0]['preco']+".\nnas farmácias "+item[0]['loja'] + "\nlink:"+item[0]['loja_link']+"\n\n"+item[0]['descri']+"\n"+item[0]['usar']);
			    	if(item[1] != null){
			    		const nomeS = item[1]['nome'] + item[1]['apresentacao'];
			    		await telegram.reply("Uma alternativa similar pode ser:");
			    		await telegram.reply("O medicamento:\n"+nomeS+"\n\n\nEstá com o menor preço de\n R$:"+item[1]['preco']+".\nnas farmácias "+item[1]['loja'] + "\nlink:"+item[1]['loja_link']+"\n\n"+item[1]['descri']+"\n"+item[1]['usar']);
			    	}
			    	await telegram.reply("Vou procurar uma outra apresentação do medicamento original...");

			    }
			    await telegram.reply("Essas foram todas as melhores opções que encontrei");
				pai.limparContexto(ctx,telegram);
		  		saveContext(ctx);
		  		console.log("terminou comparação");
			})
			
		}

	}
}