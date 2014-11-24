require('should');
var TypeBuilder = require('../lib/type-builder');
var TypeObject = require('../lib/type-object');
var TypeVector = require('../lib/type-vector');

describe('TypeBuilder', function () {

    function WrapperMessage(param) {
        this.serialize = function () {
            return param.message;
        };
        this.deserialize = function () {
            return {
                getMessage: function () {
                    return param.buffer;
                }
            };
        };
    }

    describe('#buildTypeConstructor({P_Q_inner_data})', function () {
        it('should return a P_Q_inner_data', function (done) {
            var P_Q_inner_data = new TypeBuilder('namespace', {"id": "-2083955988", "predicate": "p_q_inner_data", "params": [
                {"name": "pq", "type": "bytes"},
                {"name": "p", "type": "bytes"},
                {"name": "q", "type": "bytes"},
                {"name": "nonce", "type": "int128"},
                {"name": "server_nonce", "type": "int128"},
                {"name": "new_nonce", "type": "int256"}
            ], "type": "P_Q_inner_data"}).getType();
            P_Q_inner_data.should.be.an.instanceof(Function);
            var obj = new P_Q_inner_data();
            obj.should.be.an.instanceof(P_Q_inner_data);
            obj.should.be.an.instanceof(TypeObject);
            obj.id.should.be.eql('ec5ac983');
            obj.typeName.should.be.eql('namespace.P_q_inner_data');
            done();
        })
    });

    describe('#buildTypeConstructor({ResPQ}).deserialize()', function () {
        it('should build and de-serialize an instance of ResPQ', function (done) {
            var ResPQ = new TypeBuilder('namespace', {"id": "85337187", "predicate": "resPQ", "params": [
                {"name": "nonce", "type": "int128"},
                {"name": "server_nonce", "type": "int128"},
                {"name": "pq", "type": "bytes"},
                {"name": "server_public_key_fingerprints", "type": "Vector<long>"}
            ], "type": "ResPQ"}).getType();
            ResPQ.should.be.an.instanceof(Function);
            var obj = new ResPQ({buffer: new Buffer(
                '632416053E0549828CCA27E966B301A48FECE2FCA5CF4D33F4A11EA877BA4AA5739073300817ED48941A08F98100000015C4B51C01000000216BE86C022BB4C3',
                'hex')});
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

    describe('#buildTypeConstructor({ResPQ}).serialize()', function () {
        it('should build and serialize an instance of ResPQ', function (done) {
            var ResPQ = new TypeBuilder('namespace', {"id": "85337187", "predicate": "resPQ", "params": [
                {"name": "nonce", "type": "int128"},
                {"name": "server_nonce", "type": "int128"},
                {"name": "pq", "type": "bytes"},
                {"name": "server_public_key_fingerprints", "type": "Vector<long>"}
            ], "type": "ResPQ"}).getType();
            ResPQ.should.be.an.instanceof(Function);
            var obj = new ResPQ({props: {
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

    describe('#buildTypeFunction({reqPQ}).serialize()', function () {
        it('should build a reqPQ Type function', function (done) {
            var reqPQ = new TypeBuilder('namespace', {"id": "1615239032", "method": "req_pq", "params": [
                {"name": "nonce", "type": "int128"}
            ], "type": "ResPQ"}, WrapperMessage).getType();
            reqPQ.should.be.an.instanceof(Function);
            var nonce = '0xf67b7768bf4854bb15fa840ec843875f';
            var conn = {
                connect: function (callback) {
                    callback();
                },
                write: function (buffer, callback) {
                    this.buffer = buffer;
                    callback();
                },
                read: function (callback) {
                    callback(null, this.buffer);
                }
            };
            reqPQ({
                props: {
                    nonce: nonce
                },
                conn: conn,
                callback: function (ex, response) {
                    if (ex) console.warn(ex);
                    response.nonce.should.be.eql(nonce);
                    done();
                }
            });
        })
    });

    describe('#buildTypes()', function () {
        it('should build both types and functions', function () {
            var api = {
                "constructors": [
                    {
                        "id": "85337187",
                        "predicate": "resPQ",
                        "params": [
                            {
                                "name": "nonce",
                                "type": "int128"
                            },
                            {
                                "name": "server_nonce",
                                "type": "int128"
                            },
                            {
                                "name": "pq",
                                "type": "bytes"
                            },
                            {
                                "name": "server_public_key_fingerprints",
                                "type": "Vector<long>"
                            }
                        ],
                        "type": "ResPQ"
                    }
                ],
                "methods": [
                    {
                        "id": "1615239032",
                        "method": "req_pq",
                        "params": [
                            {
                                "name": "nonce",
                                "type": "int128"
                            }
                        ],
                        "type": "ResPQ"
                    }
                ]
            };
            var type = { _id: 'type'};
            var constructors = ['ResPQ'];
            TypeBuilder.buildTypes(api.constructors, constructors, type);
            type.should.be.ok;
            type.should.have.properties(['ResPQ']);

            var service = { _id: 'service'};
            var methods = ['req_pq'];
            TypeBuilder.buildTypes(api.methods, methods, service, WrapperMessage);
            service.should.be.ok;
            service.should.have.properties(['req_pq']);
        })
    });
});

