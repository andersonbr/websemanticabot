const {SparqlClient, SPARQL} = require('sparql-client-2');

module.exports = {
  client: new SparqlClient('http://localhost:8890/sparql').register({
    drugs: 'http://www.arida.ufc.br/ontology/drugs/',
    dc: 'http://purl.org/dc/elements/1.1/'
  }),
  fetchMedicamentos: function (principioAtivo,callback) {
    const query = SPARQL`
      SELECT distinct ?nomeMedicamento
      WHERE {
        ?s ?p ?o .
        ?s dc:title ?nomeMedicamento .
        ?s drugs:substancia ?substancia .
        ?substancia dc:title ?tituloSubstanciaPt .
        FILTER(regex(str(?tituloSubstanciaPt), ${principioAtivo}, "i"))
        FILTER (lang(?tituloSubstanciaPt) = 'pt')
      }`;
    return this.client.query(query)
      .execute(function(error,response){
        //console.log(response);
        callback(response.results);
      });
  },
  fetchDefinicao: function (termo,callback) {
    const query = SPARQL`
     SELECT  DISTINCT (GROUP_CONCAT(DISTINCT LCASE(?auxLabel);separator="\\nOU\\n") AS ?titles) (GROUP_CONCAT( DISTINCT LCASE(?auxTipo);separator=" ; ") as ?types) (GROUP_CONCAT(DISTINCT LCASE(?auxComment);separator=" . ") as ?comments) WHERE{
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
      }GROUP BY ?termo`;
    return this.client.query(query)
      .execute(function(error,response){
        //console.log(response);
        callback(response.results);
      });
  }
  ,
  fetchMedicamento: function (medicamento,callback) {
    const query = SPARQL`
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
            SELECT DISTINCT ?medicamento (GROUP_CONCAT( DISTINCT LCASE(?indicacao);separator=" , ") AS ?indicacoes)  WHERE{
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
            SELECT DISTINCT ?medicamento (GROUP_CONCAT( DISTINCT LCASE(?auxTipo);separator=" , ") as ?tipos ) WHERE{
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
      }GROUP BY ?medicamento `;
    return this.client.query(query)
      .execute(function(error,response){
        //console.log(response);
        callback(response.results);
      });
  },
  fetchRiscos: function (medicamento,callback) {
    const query = SPARQL`
        PREFIX drugs: <http://www.arida.ufc.br/ontology/drugs/>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>  
        SELECT DISTINCT ?title ?efeitos_colaterais_en ?efeitos_colaterais_pt ?risco_gravidez ?uso_aleitamento ?aplicacao WHERE{
          ?medicamento a drugs:Medicamento;
            dc:title ?title.

          OPTIONAL {
            {
              SELECT ?medicamento (GROUP_CONCAT( DISTINCT LCASE(?efeitoColateral);separator=" , ") as ?efeitos_colaterais_en ) WHERE{
                ?medicamento drugs:substancia ?substancia.
                ?substancia drugs:efeitoColateral ?efeito.
                ?efeito dc:title ?efeitoColateral
                FILTER(lang(?efeitoColateral) = "en")
              }GROUP BY ?medicamento
            }
          }
          OPTIONAL {
            {
              SELECT DISTINCT ?medicamento ( GROUP_CONCAT( DISTINCT LCASE(?efeitoColateral);separator=" , ") as ?efeitos_colaterais_pt ) WHERE{
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
              BIND(STR(CONCAT(str(?categoria),", o que significa que \\n",str(?definicao),"\\n\\tObservacao:\\n",str(?observacao))) as ?risco_gravidez)
            }
            OPTIONAL{
              ?risco drugs:usoAleitamento ?aleitamento.
              ?aleitamento rdfs:label ?categoriaA;
                rdfs:comment ?definicaoA.
              
              BIND(STR(CONCAT(str(?categoriaA),", o que significa que \\n",str(?definicaoA),"\\n\\tObservacao:\\n")) as ?uso_aleitamento)
            }
            OPTIONAL{
              ?risco drugs:observacaoAplicacao ?aplicacao.
            }
          }
          
          FILTER(REGEX(str(?title),${medicamento},"i"))
        }GROUP BY ?medicamento `;
        //console.log(query);
    return this.client.query(query)
        .execute(function(error,response){
        //console.log(response);
        callback(response.results);
        });
  },
    fetchApresentacao: function (medicamento,callback) {
        const query = SPARQL`
            PREFIX drugs: <http://www.arida.ufc.br/ontology/drugs/>
            PREFIX dc: <http://purl.org/dc/elements/1.1/>
            PREFIX owl: <http://www.w3.org/2002/07/owl#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>  

            SELECT DISTINCT ?title ?laboratorio ?apresentacoes WHERE{
            ?medicamento a drugs:Medicamento;
              dc:title ?title.
            OPTIONAL{
              ?medicamento drugs:produtor ?produtor.
              ?produtor dc:title ?laboratorio

            }
            OPTIONAL{
              {
                SELECT ?medicamento (GROUP_CONCAT(DISTINCT LCASE(CONCAT("\\t(Código de Barras: ",?ean," ) ",?titleApresentacao)); separator=".\\n\\n") as ?apresentacoes) WHERE{
                  ?medicamento drugs:temApresentacao ?apresentacao.
                  ?apresentacao dc:title ?titleApresentacao;
                    drugs:ean ?ean.
                }GROUP BY ?medicamento
              }
            }

            FILTER(REGEX(str(?title),${medicamento},"i"))
            }`;
        return this.client.query(query)
            .execute(function(error,response){
            //console.log(response);
            callback(response.results);
            });
  },fetchInfoApresentacao: function (ean,callback) {
    const query = SPARQL`
      PREFIX drugs: <http://www.arida.ufc.br/ontology/drugs/>
      PREFIX dc: <http://purl.org/dc/elements/1.1/>
      PREFIX owl: <http://www.w3.org/2002/07/owl#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>  
      SELECT DISTINCT ?titleApresentacao ?titleMedicamento ?ean ?tarja ?restricao ?valorFabricaSemImposto ?valorGovernoSemImposto ?valorConsumidorSemImposto WHERE{
        ?apresentacao a drugs:Apresentacao;
          dc:title ?titleApresentacao;
          drugs:ean ?ean;
          drugs:restricaoHospitalar ?restricao.
        OPTIONAL{
          ?medicamento drugs:temApresentacao ?apresentacao;
            dc:title ?titleMedicamento.
        }

        {
          SELECT ?apresentacao (GROUP_CONCAT(DISTINCT ?tarjaX ; separator=".\\n") as ?tarja){
            ?apresentacao drugs:tarja ?tarjaAux.
            ?tarjaAux rdfs:label ?titleTarja;
              rdfs:comment ?comentTarja.
            BIND(STR(CONCAT('\\"',str(?titleTarja),'\\"',", logo \\n",str(?comentTarja))) as ?tarjaX)
          }
        }
        OPTIONAL{
          ?apresentacao drugs:preco ?preco1.
          ?preco1 a drugs:PrecoFabricaSemImposto;
            drugs:valorPreco ?valorFabricaSemImposto.
        }
        OPTIONAL{
          ?apresentacao drugs:preco ?preco2.
          ?preco2 a drugs:PrecoAoGovernoSemImposto;
            drugs:valorPreco ?valorGovernoSemImposto.
        }
        OPTIONAL{
          ?apresentacao drugs:preco ?preco3.
          ?preco3 a drugs:PrecoAoConsumidorSemImposto;
            drugs:valorPreco ?valorConsumidorSemImposto.
        }


        FILTER(REGEX(str(?ean),${ean},"i"))
      }`;
    return this.client.query(query)
        .execute(function(error,response){
        //console.log(response);
        callback(response.results);
        });
  },fetchPreco: function (ean,localidade,callback) {
        const query = SPARQL`
            PREFIX drugs: <http://www.arida.ufc.br/ontology/drugs/>
            PREFIX dc: <http://purl.org/dc/elements/1.1/>
            PREFIX owl: <http://www.w3.org/2002/07/owl#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>  
            SELECT DISTINCT ?titleApresentacao ?titleMedicamento (?ean as ?codigoBarras) ?ICMS  ?valorFabricaComImposto ?valorConsumidorComImposto ?valorGovernoComImposto ?valorFabricaComImpostoALC ?valorConsumidorComImpostoALC ?valorGovernoComImpostoALC WHERE{
            ?apresentacao a drugs:Apresentacao;
              dc:title ?titleApresentacao;
              drugs:ean ?ean;
              drugs:restricaoHospitalar ?restricao;
              drugs:tarja ?tarjaAux.
            OPTIONAL{
              ?medicamento drugs:temApresentacao ?apresentacao;
                dc:title ?titleMedicamento.
            }


            ?carga drugs:cargaTributaria ?icmsP.
            BIND(CONCAT(str(?icmsP),"%") as ?ICMS)

            ?localidade drugs:cargaICMS ?carga;
              rdfs:label ?local.
            OPTIONAL{
              ?apresentacao drugs:preco ?preco.
              ?preco a drugs:PrecoFabricaComImposto;
                drugs:valorPreco ?valorFabricaComImposto.
              ?preco drugs:tributacao ?carga.
              FILTER NOT EXISTS {?preco a drugs:PrecoFabricaComImpostoALC}
            }
            OPTIONAL{
              ?apresentacao drugs:preco ?preco1.
              ?preco1 a drugs:PrecoAoConsumidorComImposto;
                drugs:valorPreco ?valorConsumidorComImposto.
              ?preco1 drugs:tributacao ?carga.
              FILTER NOT EXISTS {?preco1 a drugs:PrecoAoConsumidorComImpostoALC}
            }
            OPTIONAL{
              ?apresentacao drugs:preco ?preco2.
              ?preco2 a drugs:PrecoAoGovernoComImposto;
                drugs:valorPreco ?valorGovernoComImposto.
              ?preco2 drugs:tributacao ?carga.
              FILTER NOT EXISTS {?preco2 a drugs:PrecoAoGovernoComImpostoALC}
            }


            OPTIONAL{
              ?apresentacao drugs:preco ?preco3.
              ?preco3 a drugs:PrecoFabricaComImpostoALC;
                drugs:valorPreco ?valorFabricaComImpostoALC.
              ?preco3 drugs:tributacao ?carga.
              
            }
            OPTIONAL{
              ?apresentacao drugs:preco ?preco4.
              ?preco4 a drugs:PrecoAoConsumidorComImpostoALC;
                drugs:valorPreco ?valorConsumidorComImpostoALC.
              ?preco4 drugs:tributacao ?carga.

            }
            OPTIONAL{
              ?apresentacao drugs:preco ?preco5.
              ?preco5 a drugs:PrecoAoGovernoComImpostoALC;
                drugs:valorPreco ?valorGovernoComImpostoALC.
              ?preco5 drugs:tributacao ?carga.

            }
            FILTER(REGEX(str(?ean),${ean},"i") && REGEX(str(?local),${localidade},"i"))
            }`;
        return this.client.query(query)
            .execute(function(error,response){
            //console.log(response);
            callback(response.results);
            });
  }
}