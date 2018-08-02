
module.exports = function(sparql) {
	return {
		parseAndRun: function(ctx) {
			if (!this.checkRemediosDoPrincipioAtivo(ctx)) {
				if (!this.checkDefinicaoTermo(ctx)) {
					if (!this.checkRiscos(ctx)) {
						if (!this.checkMedicamento(ctx)) {

						}
					}
				}
			}
		},
		checkRemediosDoPrincipioAtivo: function(ctx) {
			const txt = ctx.message.text.replace(/( existem| existentes|)(|\.|\?|\!)$/, "")
			const principioativoRegex = /(quero|saber|quais|diga|dize|fala).*rem[^ ]+dio(|s).* princ[^ ]+ ativo (.*)/
			const principioativoMatch = txt.match(principioativoRegex)
			if (principioativoMatch) {
				const principioAtivo = principioativoMatch[3]
				sparql
					.fetchMedicamentos(principioAtivo.replace(/[^a-zA-Z0-9]/g,'\\W+'))
					.then(result => {
						const remedios = result.bindings.reduce(function(acc, cur, i) {
							acc.push(cur.nomeMedicamento.value)
							return acc
						}, []).join(", ");
						ctx.reply(`${ctx.message.from.first_name}, aqui estão: ${remedios}`)
					});
				return ctx.reply(`${ctx.message.from.first_name}, vou buscar remédios com princípio ativo ${principioAtivo}, aguarde um pouco...`)
			}
			return false;
		},
		checkDefinicaoTermo: function(ctx) {
			const txt = ctx.message.text.replace(/(|\.|\?|\!|\"|\')$/, "")
			const definicaoRegex = /(.*)((o que [^ ])|(defin|significa)([^ ]*)( de)?)( um(a?))? (.*)/i
			const definicaoMatch = txt.match(definicaoRegex)
			if (definicaoMatch) {
				const termo = definicaoMatch[9]
				sparql
					.fetchDefinicao(termo.replace(/[^a-zA-Z0-9]/g,'\\W+'))
					.then(result => {
						const definicoes = result.bindings.reduce(function(acc, cur, i) {							
							const resultado = "\n-Nomes conhechidos:\n"+valor(cur.titles)+"\n\n-Tipos:\n"+valor(cur.types)+"\n\n-Definição:\n"+valor(cur.comments)
							acc.push(resultado)
							return acc
						}, []).join("\n\n----------------------------------------\n\n");
						ctx.reply(`${ctx.message.from.first_name}, aqui estão: \n${definicoes}`)
					});
				return ctx.reply(`${ctx.message.from.first_name}, vou buscar a definição de ${termo}, aguarde um pouco...`)
			}
			return false;
		},
		checkMedicamento: function(ctx) {
			const txt = ctx.message.text.replace(/(|\.|\?|\!|\"|\')$/, "")
			const medicamentoRegex = /(.*)(medicamento|rem[^ ]dio) (.*)/i
			const medicamentoMatch = txt.match(medicamentoRegex)
			if (medicamentoMatch) {
				const termo = medicamentoMatch[3]
				sparql
					.fetchMedicamento(termo.replace(/[^a-zA-Z0-9]/g,'\\W+'))
					.then(result => {
						const definicoes = result.bindings.reduce(function(acc, cur, i) {
							var resultado = "\n-Nomes conhechidos:\n"+valor(cur.title)+"\n\nLaboratório:\n"+valor(cur.laboratorio)+"\n\nQuantidade de apresentações:\n"+valor(cur.quantidade_apresentacoes)+"\n\n-Tipos:\n"+valor(cur.tipos)+"\n\n-Classe terapêutica:\n"+valor(cur.classeTerapeutica)+"\n\n-Principios ativos:\n"+valor(cur.nomes_principio_Ativo)+"\n\n-Indicações:\n"+valor(cur.indicacoes)
							acc.push(resultado)
							return acc
						}, []).join("\n\n----------------------------------------\n\n");
						ctx.reply(`${ctx.message.from.first_name}, aqui estão: \n${definicoes}`)
					});
				return ctx.reply(`${ctx.message.from.first_name}, vou buscar a informações sobre o medicamento ${termo}, aguarde um pouco...`)
			}
			return false;
		},
		checkRiscos: function(ctx) {
			const txt = ctx.message.text.replace(/(|\.|\?|\!|\"|\')$/, "")
			const riscosRegex = /(.*)risco(s?) d(.) (medicamento |rem[^]dio )?(.*)/i
			const riscosMatch = txt.match(riscosRegex)
			if (riscosMatch) {
				console.log("Deu risco")
				const termo = riscosMatch[5]
				sparql
					.fetchRiscos(termo.replace(/[^a-zA-Z0-9]/g,'\\W+'))
					.then(result => {
						const definicoes = result.bindings.reduce(function(acc, cur, i) {
							var resultado = "\n-Nomes conhechidos:\n"+valor(cur.title)+"\n\nefeitos colaterais:\n"+valor(cur.efeitos_colaterais_pt)+"\n\nRisco na gravidez:\n"+valor(cur.risco_gravidez)+"\n\n-Recomendação de uso na amamentação:\n"+valor(cur.uso_aleitamento)+"\n\n-Tipo de aplicação:\n"+valor(cur.aplicacao)
							acc.push(resultado)
							return acc
						}, []).join("\n\n----------------------------------------\n\n");
						ctx.reply(`${ctx.message.from.first_name}, aqui estão: \n${definicoes}`)
					});
				return ctx.reply(`${ctx.message.from.first_name}, vou buscar riscos do medicamento ${termo}, aguarde um pouco...`)
			}
			return false;
		}
	}
}