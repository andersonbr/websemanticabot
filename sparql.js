const {SparqlClient, SPARQL} = require('sparql-client-2');

module.exports = {
  client: new SparqlClient('http://localhost:3030/webanvisa/sparql').register({
    ado: 'http://www.arida.ufc.br/ontology/drugs/',
    purl: 'http://purl.org/dc/elements/1.1/'
  }),
  fetchMedicamentos: function (principioAtivo) {
    return this.client.query(SPARQL`
      SELECT distinct ?nomeMedicamento
      WHERE {
        ?s ?p ?o .
        ?s purl:title ?nomeMedicamento .
        ?s ado:substancia ?substancia .
        ?substancia purl:title ?tituloSubstanciaPt .
        FILTER(regex(str(?tituloSubstanciaPt), ${principioAtivo}, "i"))
        FILTER (lang(?tituloSubstanciaPt) = 'pt')
      }`)
    .execute()
    .then(response => Promise.resolve(response.results));
  }
}