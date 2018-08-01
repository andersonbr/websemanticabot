const {SparqlClient, SPARQL} = require('sparql-client-2');

module.exports = {
  client: new SparqlClient('http://localhost:8890/sparql').register({
    drugs: 'http://www.arida.ufc.br/ontology/drugs/',
    dc: 'http://purl.org/dc/elements/1.1/'
  }),
  fetchMedicamentos: function (principioAtivo) {
    return this.client.query(SPARQL`
      SELECT distinct ?nomeMedicamento
      WHERE {
        ?s ?p ?o .
        ?s dc:title ?nomeMedicamento .
        ?s drugs:substancia ?substancia .
        ?substancia dc:title ?tituloSubstanciaPt .
        FILTER(regex(str(?tituloSubstanciaPt), ${principioAtivo}, "i"))
        FILTER (lang(?tituloSubstanciaPt) = 'pt')
      }`)
    .execute()
    .then(response => Promise.resolve(response.results));
  },
  fetchDefinicao: function (termo) {
    return this.client.query(SPARQL`
     SELECT  DISTINCT (GROUP_CONCAT(DISTINCT LCASE(?auxLabel);separator=" OU ") AS ?titles) (GROUP_CONCAT( DISTINCT LCASE(?auxTipo);separator=" ; ") as ?types) (GROUP_CONCAT(DISTINCT LCASE(?auxComment);separator=" . ") as ?comments) WHERE{
        {?termo rdfs:label ?auxLabel}UNION
        {?termo dc:title ?auxLabel}
        OPTIONAL{
          ?termo rdfs:comment ?auxComment
        }
        OPTIONAL{
          ?termo a _:tipo.
          _:tipo rdfs:label ?auxTipo.
        }
        FILTER(REGEX(str(?auxLabel),${termo} , "i"))
      }GROUP BY ?termo`)
    .execute()
    .then(response => Promise.resolve(response.results)).catch(function(error){
      console.log("EPPAAAA!!!!!\n\n\n"+error)
    });
  }
}