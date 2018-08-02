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
  ,
  fetchMedicamento: function (medicamento) {
    return this.client.query(SPARQL`
      PREFIX drugs: <http://www.arida.ufc.br/ontology/drugs/>
      PREFIX dc: <http://purl.org/dc/elements/1.1/>
      PREFIX owl: <http://www.w3.org/2002/07/owl#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>  
      SELECT DISTINCT ?title ?laboratorio ?quantidade_apresentacoes ?tipos ?classeTerapeutica ?nomes_principio_Ativo ?indicacoes WHERE{
        ?medicamento a drugs:Medicamento;
          dc:title ?title.
        OPTIONAL{
          {
            SELECT DISTINCT ?medicamento (GROUP_CONCAT( DISTINCT LCASE(?principioAtivo);separator=" OU ") as ?nomes_principio_Ativo ) WHERE{
              ?medicamento drugs:substancia ?substancia.
              ?substancia dc:title ?principioAtivo.
            
            }GROUP BY ?medicamento
          }
          
        }
        OPTIONAL {
          {
            SELECT DISTINCT ?medicamento (GROUP_CONCAT( DISTINCT LCASE(?indicacao);separator=" ; ") AS ?indicacoes)  WHERE{
              ?medicamento drugs:substancia ?substancia.
              ?substancia drugs:indicacao ?indic.
              ?indic dc:title ?indicacao
            
            }GROUP BY ?medicamento
          }
        }
        OPTIONAL{
          ?medicamento drugs:temClasseTerapeutica ?classe.
          ?classe dc:title ?classeTerapeutica.
        }
        OPTIONAL{
          ?medicamento drugs:produtor ?produtor.
          ?produtor dc:title ?laboratorio

        }
        OPTIONAL{
          {
            SELECT DISTINCT ?medicamento (GROUP_CONCAT( DISTINCT LCASE(?auxTipo);separator=" ; ") as ?tipos ) WHERE{
              ?medicamento a _:tipo.
              _:tipo rdfs:label ?auxTipo.
            }GROUP BY ?medicamento
          }
          
        }
        {
          SELECT DISTINCT ?medicamento ( count(?apresentacao) as ?quantidade_apresentacoes) WHERE{
            ?medicamento drugs:temApresentacao ?apresentacao
          } GROUP BY ?medicamento
        }
        
        FILTER(REGEX(str(?title),${medicamento},"i"))
      }GROUP BY ?medicamento `)
    .execute()
    .then(response => Promise.resolve(response.results)).catch(function(error){
      console.log("EPPAAAA!!!!!\n\n\n"+error)
    });
  },
  fetchRiscos: function (medicamento) {
      return this.client.query(SPARQL`
      PREFIX drugs: <http://www.arida.ufc.br/ontology/drugs/>
      PREFIX dc: <http://purl.org/dc/elements/1.1/>
      PREFIX owl: <http://www.w3.org/2002/07/owl#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>  
      SELECT DISTINCT ?title ?efeitos_colaterais_en ?efeitos_colaterais_pt ?risco_gravidez ?uso_aleitamento ?aplicacao WHERE{
        ?medicamento a drugs:Medicamento;
          dc:title ?title.

        OPTIONAL {
          {
            SELECT ?medicamento (GROUP_CONCAT( DISTINCT LCASE(?efeitoColateral);separator=" ; ") as ?efeitos_colaterais_en ) WHERE{
              ?medicamento drugs:substancia ?substancia.
              ?substancia drugs:efeitoColateral ?efeito.
              ?efeito dc:title ?efeitoColateral
              FILTER(lang(?efeitoColateral) = "en")
            }GROUP BY ?medicamento
          }
        }
        OPTIONAL {
          {
            SELECT ?medicamento ( GROUP_CONCAT( DISTINCT LCASE(?efeitoColateral);separator=" ; ") as ?efeitos_colaterais_pt ) WHERE{
              ?medicamento drugs:substancia ?substancia.
              ?substancia drugs:efeitoColateral ?efeito.
              ?efeito dc:title ?efeitoColateral
              FILTER(lang(?efeitoColateral) = "pt")
            }GROUP BY ?medicamento
          }
        }

        OPTIONAL{
          ?medicamento drugs:substancia ?substancia.
          ?substancia drugs:risco ?risco.
          OPTIONAL{
            ?risco drugs:temCategoriaRiscoGravidez ?gravidez.
            ?gravidez rdfs:label ?categoria;
              rdfs:comment ?definicao.
            OPTIONAL{
              ?risco drugs:observacaoRisco ?observacao.
            }
            BIND(CONCAT("Categoria:\\n",str(?categoria),"\\nDescrição:\\n",str(?definicao),"\\nObservação:\\n",str(?observacao)) as ?risco_gravidez)
          }
          OPTIONAL{
            ?risco drugs:usoAleitamento ?aleitamento.
            ?aleitamento rdfs:label ?categoriaA;
              rdfs:comment ?definicaoA.
            
            BIND(CONCAT("Categoria:\\n",str(?categoriaA),"\\nDescrição:\\n",str(?definicaoA),"\\nObservação:\\n") as ?uso_aleitamento)
          }
          OPTIONAL{
            ?risco drugs:observacaoAplicacao ?aplicacao.
          }
        }
        
        FILTER(REGEX(str(?title),${medicamento},"i"))
      }GROUP BY ?medicamento `)
    .execute()
    .then(response => Promise.resolve(response.results));
  }
}