require('should');
require('requirish')._(module);
var tl = require('lib/builder/type-builder');
var ConstructorBuilder = require('lib/builder/constructor-builder');
var TypeObject = require('lib/type-object');
var TypeVector = require('lib/type-vector');

describe('TypeBuilder', function () {

    describe('# type X', function () {
        it('should build a reqPQ Type function', function (done) {
            var reqPQ = tl.buildTypeFunction('namespace', {
                "id": "1615239032", "method": "req_pq", "params": [
                    {"name": "nonce", "type": "int128"}
                ], "type": "ResPQ"
            });
            var invokeWithLayer = tl.buildTypeFunction('namespace', {
                "id": "-627372787",
                "method": "invokeWithLayer",
                "params": [{
                    "name": "layer",
                    "type": "int"
                }, {
                    "name": "query",
                    "type": "!X"
                }],
                "type": "X"
            });
            reqPQ.should.be.an.instanceof(Function);
            reqPQ.Type.should.be.an.instanceof(Function);
            reqPQ._name.should.be.eql('req_pq');
            invokeWithLayer.should.be.an.instanceof(Function);
            var nonce = '0xf67b7768bf4854bb15fa840ec843875f';
            var channel = {
                callMethod: function (method, callback) {
                    var buffer = method.serialize();
                    var Type = tl.requireTypeFromBuffer(buffer);
                    var resObj = new Type({buffer: buffer});
                    var response = resObj.deserialize();
                    callback(null, response);
                }
            };
            var query = new reqPQ.Type({
                props: {
                    nonce: nonce
                }
            });
            query.should.be.ok;
            query.should.be.an.instanceof(TypeObject);
            query.nonce.should.be.eql(nonce);
            invokeWithLayer({
                props: {
                    layer: 23,
                    query: query.serialize()
                },
                channel: channel,
                callback: function (ex, response) {
                    if (ex) console.warn(ex);
                    var resPQ = new reqPQ.Type({buffer: response.query}).deserialize();
                    resPQ.nonce.should.be.eql(nonce);
                    done();
                }
            });

        })
    });

    describe('#buildTypes()', function () {
        it('should build both types and functions', function () {
            var api = {
                "constructors": [{
                    "id": "85337187",
                    "predicate": "auth.resPQ",
                    "params": [{
                        "name": "nonce",
                        "type": "int128"
                    }, {
                        "name": "server_nonce",
                        "type": "int128"
                    }, {
                        "name": "pq",
                        "type": "bytes"
                    }, {
                        "name": "server_public_key_fingerprints",
                        "type": "Vector<long>"
                    }],
                    "type": "auth.ResPQ"
                }, {
                    "id": "8768",
                    "predicate": "auth.other.",
                    "params": [],
                    "type": 'auth.Other'
                }, {
                    "id": "4352",
                    "predicate": ".auth.other2",
                    "params": [],
                    "type": 'auth.Other'
                }],
                "methods": [{
                    "id": "1615239032",
                    "method": "auth.req_pq",
                    "params": [{
                        "name": "nonce",
                        "type": "int128"
                    }],
                    "type": "auth.ResPQ"
                }]
            };
            var type = {_id: 'type'};
            var constructors = ['auth.ResPQ', 'auth.Other', 'auth.Other2'];
            tl.buildTypes(api.constructors, constructors, type);
            type.should.be.ok;
            type.auth.should.be.ok;
            type.auth.should.have.properties(['ResPQ', 'Other', 'Other2']);
            type.auth.ResPQ.typeName.should.be.equal('type.auth.ResPQ');

            var service = {_id: 'service'};
            var methods = ['auth.req_pq'];
            tl.buildTypes(api.methods, methods, service, true);
            service.should.be.ok;
            service.auth.should.be.ok;
            service.auth.should.have.properties(['req_pq']);
        })
    });
});