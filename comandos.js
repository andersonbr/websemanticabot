module.exports = function(sparql) {
	return {
		parseAndRun: function(ctx) {
			if (!this.checkRemediosDoPrincipioAtivo(ctx)) {
				if (!this.checkDefinicaoTermo(ctx)) {

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
					.fetchMedicamentos(principioAtivo)
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
				console.log("\n\n"+termo+"\n\n")
				sparql
					.fetchDefinicao(termo)
					.then(result => {
						const definicoes = result.bindings.reduce(function(acc, cur, i) {
							const resultado = "-Nomes conhechidos:\n"+cur.titles.value+"\n\n-Tipos:\n"+cur.types.value+"\n\n-Definição:\n"+cur.comments.value
							acc.push(resultado)
							return acc
						}, []).join("\n\n----------------------------------------\n\n");
						ctx.reply(`${ctx.message.from.first_name}, aqui estão: \n${definicoes}`)
					});
				return ctx.reply(`${ctx.message.from.first_name}, vou buscar a definição de ${termo}, aguarde um pouco...`)
			}
			return false;
		}
	}
}