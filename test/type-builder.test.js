require('should');
var TypeBuilder = require('../lib/type-builder');
var TypeObject = require('../lib/type-object');
var TypeVector = require('../lib/type-vector');

describe('TypeBuilder', function() {

    describe('#buildTypeConstructor({P_Q_inner_data})', function() {
        it('should return a P_Q_inner_data', function(done) {
            var P_Q_inner_data = new TypeBuilder('namespace', {
                "id": "-2083955988", "predicate": "p_q_inner_data", "params": [
                    {"name": "pq", "type": "bytes"},
                    {"name": "p", "type": "bytes"},
                    {"name": "q", "type": "bytes"},
                    {"name": "nonce", "type": "int128"},
                    {"name": "server_nonce", "type": "int128"},
                    {"name": "new_nonce", "type": "int256"}
                ], "type": "P_Q_inner_data"
            }).getType();
            P_Q_inner_data.should.be.an.instanceof(Function);
            var obj = new P_Q_inner_data();
            obj.should.be.an.instanceof(P_Q_inner_data);
            obj.should.be.an.instanceof(TypeObject);
            obj.id.should.be.eql('ec5ac983');
            obj.typeName.should.be.eql('namespace.P_q_inner_data');
            done();
        })
    });

    describe('#buildTypeConstructor({ResPQ}).deserialize()', function() {
        it('should build and de-serialize an instance of ResPQ', function(done) {
            var ResPQ = new TypeBuilder('namespace', {
                "id": "85337187", "predicate": "resPQ", "params": [
                    {"name": "nonce", "type": "int128"},
                    {"name": "server_nonce", "type": "int128"},
                    {"name": "pq", "type": "bytes"},
                    {"name": "server_public_key_fingerprints", "type": "Vector<long>"}
                ], "type": "ResPQ"
            }).getType();
            ResPQ.should.be.an.instanceof(Function);
            var obj = new ResPQ({
                buffer: new Buffer(
                    '632416053E0549828CCA27E966B301A48FECE2FCA5CF4D33F4A11EA877BA4AA5739073300817ED48941A08F98100000015C4B51C01000000216BE86C022BB4C3',
                    'hex')
            });
            obj.should.be.an.instanceof(ResPQ);
            obj.should.be.an.instanceof(TypeObject);
            obj.deserialize();
            obj.should.have.properties({
                id: '63241605',
                typeName: 'namespace.ResPQ',
                nonce: '0xfce2ec8fa401b366e927ca8c8249053e',
                server_nonce: '0x30739073a54aba77a81ea1f4334dcfa5'
            });
            obj.server_public_key_fingerprints.should.have.properties({
                id: '15c4b51c',
                type: 'Long',
                _list: ['0xc3b42b026ce86b21']
            });
            done();
        })
    });

    describe('#buildTypeConstructor({ResPQ}).serialize()', function() {
        it('should build and serialize an instance of ResPQ', function(done) {
            var ResPQ = new TypeBuilder('namespace', {
                "id": "85337187", "predicate": "resPQ", "params": [
                    {"name": "nonce", "type": "int128"},
                    {"name": "server_nonce", "type": "int128"},
                    {"name": "pq", "type": "bytes"},
                    {"name": "server_public_key_fingerprints", "type": "Vector<long>"}
                ], "type": "ResPQ"
            }).getType();
            ResPQ.should.be.an.instanceof(Function);
            var obj = new ResPQ({
                props: {
                    nonce: '0xfce2ec8fa401b366e927ca8c8249053e',
                    server_nonce: '0x30739073a54aba77a81ea1f4334dcfa5',
                    pq: new Buffer('17ed48941a08f981', 'hex'),
                    server_public_key_fingerprints: new TypeVector({type: 'long', list: ['0xc3b42b026ce86b21']})
                }
            });
            var objBuffer = obj.serialize();
            objBuffer.toString('hex').toUpperCase().should.be.
                eql('632416053E0549828CCA27E966B301A48FECE2FCA5CF4D33F4A11EA877BA4AA5739073300817ED48941A08F98100000015C4B51C01000000216BE86C022BB4C3');
            var obj2 = new ResPQ({buffer: objBuffer});
            obj2.id.should.be.eql('63241605');
            done();
        })
    });

    describe('#buildTypeFunction({reqPQ}).serialize()', function() {
        it('should build a reqPQ Type function', function(done) {
            var reqPQ = new TypeBuilder('namespace', {
                "id": "1615239032", "method": "req_pq", "params": [
                    {"name": "nonce", "type": "int128"}
                ], "type": "ResPQ"
            }, true).getType();
            var invokeWithLayer =  new TypeBuilder('namespace', {
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
            }, true).getType();
            reqPQ.should.be.an.instanceof(Function);
            reqPQ.Type.should.be.an.instanceof(Function);
            invokeWithLayer.should.be.an.instanceof(Function);
            var nonce = '0xf67b7768bf4854bb15fa840ec843875f';
            var channel = {
                callMethod: function(method, callback) {
                    var buffer = method.serialize();
                    var Type = TypeBuilder.requireTypeFromBuffer(buffer);
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
                callback: function(ex, response) {
                    if (ex) console.warn(ex);
                    var resPQ = new reqPQ.Type({buffer: response.query}).deserialize();
                    resPQ.nonce.should.be.eql(nonce);
                    done();
                }
            });
        })
    });

    describe('#buildTypes()', function() {
        it('should build both types and functions', function() {
            var api = {
                "constructors": [{
                    "id": "85337187",
                    "predicate": "resPQ",
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
                    "type": "ResPQ"
                }],
                "methods": [{
                    "id": "1615239032",
                    "method": "req_pq",
                    "params": [{
                        "name": "nonce",
                        "type": "int128"
                    }],
                    "type": "ResPQ"
                }]
            };
            var type = {_id: 'type'};
            var constructors = ['ResPQ'];
            TypeBuilder.buildTypes(api.constructors, constructors, type);
            type.should.be.ok;
            type.should.have.properties(['ResPQ']);

            var service = {_id: 'service'};
            var methods = ['req_pq'];
            TypeBuilder.buildTypes(api.methods, methods, service, true);
            service.should.be.ok;
            service.should.have.properties(['req_pq']);
        })
    });



    describe('compositeType', function() {

        var Message = new TypeBuilder('namespace', {
            "id": "1538843921",
            "predicate": "message",
            "params": [{
                "name": "msg_id",
                "type": "long"
            }, {
                "name": "seqno",
                "type": "int"
            }, {
                "name": "bytes",
                "type": "int"
            }, {
                "name": "body",
                "type": "Object"
            }],
            "type": "Message"
        }).getType();

        var ModelType = new TypeBuilder('namespace', {
            "predicate": "modelType",
            "params": [
                {
                    "name": "server_salt",
                    "type": "long"
                }, {
                    "name": "session_id",
                    "type": "long"
                }, {
                    "name": "payload",
                    "type": "%Message"
                }
            ],
            "type": "ModelType"
        }).getType();

        var Body = new TypeBuilder('namespace', {
            "id": "66666",
            "predicate": "body",
            "params": [
                {
                    "name": "key",
                    "type": "int"
                }
            ],
            "type": "Body"
        }).getType();

        var model = {
            props: {
                server_salt: '0xfce2ec8fa401b366',
                session_id: '0x77907373a54aba77',
                payload: new Message({
                    props: {
                        msg_id: '0x84739073a54aba84',
                        seqno: 0,
                        bytes: 2,
                        body: new Body({
                            props: {
                                key: 6666
                            }
                        })
                    }
                })
            }
        };

        describe('#init()', function() {
            it('should return an instance', function(done) {
                var msg = new ModelType();
                msg.should.be.ok;
                msg.should.be.an.instanceof(ModelType);
                msg.should.be.an.instanceof(TypeObject);
                msg.isReadonly().should.be.false;

                msg = new ModelType(model);
                msg.should.be.an.instanceof(ModelType);
                msg.should.have.properties({
                    server_salt: '0xfce2ec8fa401b366',
                    session_id: '0x77907373a54aba77'
                });
                msg.payload.should.be.an.instanceof(Message);
                msg.payload.bytes.should.be.equal(2);
                msg.payload.body.should.be.an.instanceof(Body);
                msg.payload.body.key.should.be.equal(6666);
                done();
            })
        });

        describe('#serialize()', function() {
            it('should serialize the msg', function(done) {
                var msg = new ModelType(model);
                var buffer = msg.serialize();
                buffer.should.be.ok;
                buffer.toString('hex').should.be.equal('66b301a48fece2fc77ba4aa57373907784ba4aa57390738400000000020000006a0401000a1a0000');
                done();
            })
        });

        describe('#deserialize()', function() {
            it('should de-serialize the msg', function(done) {
                var msg = new ModelType({
                    buffer: new Buffer('66b301a48fece2fc77ba4aa57373907784ba4aa57390738400000000020000006a0401000a1a0000', 'hex')
                });
                msg.deserialize().should.be.ok;
                msg.should.be.an.instanceof(ModelType);
                msg.should.have.properties({
                    server_salt: '0xfce2ec8fa401b366',
                    session_id: '0x77907373a54aba77'
                });
                msg.payload.should.be.an.instanceof(TypeBuilder.requireTypeByName('Message'));
                msg.payload.bytes.should.be.equal(2);
                msg.payload.body.should.be.an.instanceof(Body);
                msg.payload.body.key.should.be.equal(6666);
                done();
            })
        });

    });
});

