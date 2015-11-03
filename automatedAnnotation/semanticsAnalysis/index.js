"use strict";

var database = require('../../database');

var client = require('./elasticsearch/client');
var es = require('./elasticsearch');

var makeIndexName = require('./makeIndexName');
var makeIndexConfig = require('./makeIndexConfig');
var findExpressionLanguage = require('./findExpressionLanguage');

var ELASTICSEARCH_ANALYSIS_HOST = "elasticanalysis:9200";
var MYWI_EXPRESSION_DOCUMENT_TYPE = require('./MYWI_EXPRESSION_DOCUMENT_TYPE');

var esapiP = client(ELASTICSEARCH_ANALYSIS_HOST).then(es);

module.exports = function(resource, territoireId){
    if(typeof resource.expression_id !== "number")
        return Promise.reject(new Error('Resource '+resource.id+' has no expression'))
    
    return database.Expressions.getExpressionsWithContent(new Set([resource.expression_id]))
    .then(function(expressions){
        var expression = expressions[0];
        var expressionLanguage = findExpressionLanguage(expression);
        
        console.log('expressionLanguage', expressionLanguage);
        
        var indexName = makeIndexName(territoireId, expressionLanguage);
        var documentId = String(resource.id);
        
        var document = expression;
        
        
        return esapiP
        .then(function(esapi){
            
            return esapi.deleteIndex(indexName).then(function(){
                console.log('Index', indexName, 'deleted');
                return esapi.createIndex(indexName, makeIndexConfig(expressionLanguage))
            })
            .catch(function(err){
                console.error('createIndex error', err);
                throw err;
            })
            .then(function(){
                console.log('Index', indexName, 'created');
                return esapi.indexDocument(indexName, MYWI_EXPRESSION_DOCUMENT_TYPE, document, documentId)
            })
            .then(function(){
                console.log('document indexed')
                return esapi.refreshIndex(indexName);
            })
            .then(function(){
                console.log('Index refreshed');
                var docKeys = Object.keys(document);
                
                var smallFields = docKeys.map(function(k){ return k+'.small' });
                var bigFields = docKeys.map(function(k){ return k+'.big' });
                
                var fields = [].concat(smallFields).concat(bigFields);
                
                return esapi.termvector(indexName, MYWI_EXPRESSION_DOCUMENT_TYPE, documentId, fields);
            })
            .then(function(result){
                //console.log('result', result);
                
                var termvectors = result.term_vectors;
                
                var termFreqByField = Object.create(null);
                    
                Object.keys(termvectors).forEach(function(nestedField){
                    var termvector = termvectors[nestedField];
                    
                    var terms = Object.keys(termvector.terms);
                    
                    var termsWithFreq = terms
                        .filter(function(t){
                            return termvector.terms[t].term_freq >= 2 && t.length >= 1;
                        })
                        .map(function(t){
                            return {
                                word: t,
                                freq: termvector.terms[t].term_freq
                            };
                        });
                    
                    var field = nestedField.slice(0, nestedField.indexOf('.'));
                    
                    var currentTermFreq = termFreqByField[field];
                    
                    if(currentTermFreq){
                        termsWithFreq = [].concat(currentTermFreq).concat(termsWithFreq);   
                    }
                    
                    termsWithFreq.sort(function(tf1, tf2){
                        return tf2.freq - tf1.freq;
                    });

                    termFreqByField[field] = termsWithFreq;
                });
                
                console.log(JSON.stringify(Object.keys(termFreqByField).map(function(f){
                    return {
                        field: f,
                        terms: termFreqByField[f].slice(0, 50)
                    } 
                }), null, 3))
                
            })
            
            
        })
    })
    .catch(function(err){
        console.error('Catch all', err, err.stack);
        
    })
    
    
};
