module.exports = function(sparql) {
	return {
		parseAndRun: function(ctx) {
			if (!this.checkRemediosDoPrincipioAtivo(ctx)) {

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
		}
	}
}