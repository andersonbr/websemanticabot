const {SparqlClient, SPARQL} = require('sparql-client-2');

module.exports = {
  client: new SparqlClient('http://localhost:8890/sparql/').register({
    drugs: 'http://www.linkedmed.com.br/ontology/drugs/',
    dc: 'http://purl.org/dc/elements/1.1/'
  }),
  numeroResultados: function (termo,callback) {
    var query = SPARQL`
        SELECT (COUNT(DISTINCT ?s) as ?qtd) FROM <http://localhost:8890/DAV/drugs> WHERE{
          {
            ?s dc:title ?title.
          }
          UNION{
            ?s rdfs:label ?title.
          }
          FILTER(regex(str(?title),${termo},"i"))
        }
      `;
      // console.log(query);
    return this.client.query(query)
    .execute(function(error,response){
      // console.log(response);
      callback(response.results);
    })
  },
  numeroResultadosExato: function (termo,callback) {
    var query = SPARQL`
        SELECT  (COUNT( DISTINCT ?s) as ?qtd) FROM <http://localhost:8890/DAV/drugs> WHERE{
          {
            ?s dc:title ?title.
          }
          UNION{
            ?s rdfs:label ?title.
          }
          FILTER(LCASE(str(?title))=${termo})
        }
      `;
    // console.log(query);
    return this.client.query(query)
    .execute(function(error,response){
      // console.log(response);
      callback(response.results);
    })
  },
  definicoes: function (uri,callback) {
    var query = SPARQL`
        SELECT DISTINCT  ?uri  (GROUP_CONCAT(DISTINCT LCASE(str(?title));separator=" ou ") AS ?titles) (GROUP_CONCAT(DISTINCT LCASE(str(?classe));separator=" e ") AS ?classes) (str(?commentU) AS ?commento) FROM <http://localhost:8890/DAV/drugs> WHERE{
          BIND(<`+uri+`> as ?uri)
          {
            ?uri dc:title ?title.
          }
          UNION{
            ?uri rdfs:label ?title.
          }
          ?uri a ?classeU.
          OPTIONAL{ ?classeU rdfs:label ?classe. }
          OPTIONAL{?uri rdfs:comment ?commentU}
        }`;
        //console.log("URI:"+uri)
        // console.log(query);
    return this.client.query(query)
    .execute(function(error,response){
      // console.log(response.results.bindings);
      callback(response.results);
    })
    
  },
  getURI: function (termo,callback) {
    var query = SPARQL`
        SELECT DISTINCT ?uri FROM <http://localhost:8890/DAV/drugs> WHERE{
          {
            ?uri dc:title ?title.
          }
          UNION{
            ?uri rdfs:label ?title.
          }
          FILTER(LCASE(str(?title)) = ${termo})          
        }ORDER BY ?uri
        LIMIT 1
      `;
    // console.log(query);
    return this.client.query(query)
    .execute(function(error,response){
      //console.log(response);
      callback(response.results);
    })
  },
  list: function (termo,limit,offset,callback) {
    var query = SPARQL`
        SELECT DISTINCT ?uri (GROUP_CONCAT(DISTINCT LCASE(str(?title));separator=" ou ") AS ?titles) FROM <http://localhost:8890/DAV/drugs> WHERE{
          {
            ?uri dc:title ?title.
          }
          UNION{
            ?uri rdfs:label ?title.
          }
          FILTER(regex(str(?title), ${termo},"i"))
          ?uri a ?classeU.
        }ORDER BY ?uri
      `;
      // console.log(query);
    return this.client.query(query)
    .execute(function(error,response){
      //console.log(response);
      callback(response.results);
    })
  },
  types: function (uri,callback) {
    var query = SPARQL`
        SELECT DISTINCT  ?types FROM <http://localhost:8890/DAV/drugs> WHERE{
          BIND(<`+uri+`> as ?uri)
          ?uri a ?types
        }
      `;//AQUI
      // console.log(query);
    return this.client.query(query)
    .execute(function(error,response){
      //console.log(response);
      //console.log(response);
      callback(response.results);
    })
  },
  moreClass: function (uri,callback) {
    var query = SPARQL`
        SELECT DISTINCT ?termo ?title ?types  FROM <http://localhost:8890/DAV/drugs> WHERE{
          BIND(<`+uri+`> as ?uri)
          {
            ?uri rdfs:subClassOf ?termo.
            {?termo rdfs:label ?title} UNION {?termo dc:title ?title}
            BIND(0 as ?types)
            #SuperClass
          }
          UNION{
            ?termo rdfs:subClassOf ?uri.
            {?termo rdfs:label ?title} UNION {?termo dc:title ?title}
            BIND(1 as ?types)
            #SubClass
          }
          UNION{
            
            {?termo a owl:ObjectProperty}UNION{?termo a owl:DatatypeProperty}
              ?termo rdfs:domain ?uri.
            {?termo rdfs:label ?title} UNION {?termo dc:title ?title}
            BIND(2 as ?types)
            #Prop
          }
          
        } ORDER BY ?types
      `;
      // console.log(query);
    return this.client.query(query)
    .execute(function(error,response){
      //console.log(response.results.bindings);
      callback(response.results);
    })
  },
  moreProp: function (uri,callback) {
    var query = SPARQL`
        SELECT DISTINCT ?termo ?title ?types  FROM <http://localhost:8890/DAV/drugs> WHERE{
            BIND(<`+uri+`> as ?uri)
            {
              ?uri rdfs:domain ?termo.
              BIND(0 as ?types)
            }UNION{
              ?uri rdfs:range ?termo.
              BIND(1 as ?types)
            }
            {?termo rdfs:label ?title} UNION {?termo dc:title ?title}
        } ORDER BY ?types
      `;
      // console.log(query);
    return this.client.query(query)
    .execute(function(error,response){
      //console.log(response.results.bindings);
      callback(response.results);
    })
  },
  queryTerm: function (uri,callback) {
    var query = SPARQL`
       SELECT DISTINCT ?p (LCASE(str(?titleP)) as ?titleProp) ?types ?v (LCASE(str(?titleV)) as ?titleValue) FROM <http://localhost:8890/DAV/drugs> WHERE{
          BIND(<`+uri+`> as ?uri)
          ?uri ?p ?v.
          OPTIONAL{
            {?p rdfs:label ?titleP}UNION{?p dc:title ?titleP}
            FILTER(lang(?titleP) = "pt")
          }
          OPTIONAL{
            {?v rdfs:label ?titleV}UNION{?v dc:title ?titleV} 
            FILTER(lang(?titleV) = "pt")
          }
          {
            ?p a owl:ObjectProperty.
            BIND( 0 as ?types)
          }UNION{
            ?p a owl:DatatypeProperty.
            BIND( 1 as ?types)
          }
        } 
      `;
      // console.log(query);
    return this.client.query(query)
    .execute(function(error,response){
      //console.log(response);
      callback(response.results);
    })
  }, comp_fetchMedicamentos: function(medicamento,callback){
        const query = SPARQL`
            PREFIX drugs: <http://www.linkedmed.com.br/ontology/drugs/>
            SELECT DISTINCT ?uri ?name FROM <http://localhost:8890/DAV/drugs> WHERE{
                ?uri a drugs:Medicamento;
                    dc:title ?name.
                FILTER(REGEX(STR(?name),${medicamento},"i"))
            }ORDER BY STRLEN(?name)`;
            // console.log(query);
        return this.client.query(query)
            .execute(function(error,response){
            // console.log(response);
            callback(response.results);
            });
    }, comp_fetchMedicamentosSimilares: function(uri,callback){
        const query = SPARQL`
            SELECT DISTINCT ?name FROM <http://localhost:8890/DAV/drugs> WHERE{
                BIND(<`+uri+`> as ?uri)
                ?uri drugs:substancia ?principio_ativo.
                ?medicamento a drugs:Medicamento;
                    dc:title ?name;
                    drugs:substancia ?principio_ativo.
                FILTER(?uri != ?medicamento)
            }`;
            // console.log(query);
        return this.client.query(query)
            .execute(function(error,response){
            // console.log(response);
            callback(response.results);
            });
    }
}