require('should');
require('requirish')._(module);
var ConstructorBuilder = require('lib/builder/constructor-builder');
var TypeObject = require('lib/type-object');
var TypeVector = require('lib/type-vector');

describe('ConstructorBuilder', function () {

    describe('#new ConstructorBuilder(.., {P_Q_inner_data})', function () {
        it('should return a P_Q_inner_data', function (done) {
            var P_Q_inner_data = new ConstructorBuilder('namespace', {
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

    var ResPQ = new ConstructorBuilder('namespace', {
        "id": "85337187", "predicate": "resPQ", "params": [
            {"name": "nonce", "type": "int128"},
            {"name": "server_nonce", "type": "int128"},
            {"name": "pq", "type": "bytes"},
            {"name": "server_public_key_fingerprints", "type": "Vector<long>"}
        ], "type": "ResPQ"
    }).getType();

    describe('#new ConstructorBuilder({ResPQ}).serialize()', function () {
        it('should build and serialize an instance of ResPQ', function (done) {
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

    describe('#new ConstructorBuilder({ResPQ}).deserialize()', function () {
        it('should build and de-serialize an instance of ResPQ', function (done) {
            ResPQ.should.be.an.instanceof(Function);
            var obj = new ResPQ({
                buffer: new Buffer(
                    '632416053E0549828CCA27E966B301A48FECE2FCA5CF4D33F4A11EA877BA4AA5739073300817ED48941A08F98100000015C4B51C01000000216BE86C022BB4C3',
                    'hex')
            });
            obj.should.be.an.instanceof(ResPQ);
            obj.should.be.an.instanceof(TypeObject);
            try {
                obj.deserialize();
            } catch (e) {
                console.log('error: ', e.stack);
                throw e;
            }
            obj.should.have.properties({
                id: '63241605',
                typeName: 'namespace.ResPQ',
                nonce: '0xfce2ec8fa401b366e927ca8c8249053e',
                server_nonce: '0x30739073a54aba77a81ea1f4334dcfa5'
            });
            obj.server_public_key_fingerprints.should.have.properties({
                id: '15c4b51c',
                type: 'Long',
                list: ['0xc3b42b026ce86b21']
            });
            done();
        })
    });

    describe('compositeType', function () {

        var Message = new ConstructorBuilder('namespace', {
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

        var ModelType = new ConstructorBuilder('namespace', {
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

        var Body = new ConstructorBuilder('namespace', {
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
                        bytes: 8,
                        body: new Body({
                            props: {
                                key: 6666
                            }
                        })
                    }
                })
            }
        };

        describe('#init()', function () {
            it('should return an instance', function (done) {
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
                msg.payload.bytes.should.be.equal(8);
                msg.payload.body.should.be.an.instanceof(Body);
                msg.payload.body.key.should.be.equal(6666);
                done();
            })
        });

        describe('#serialize()', function () {
            it('should serialize the msg', function (done) {
                var msg = new ModelType(model);
                var buffer = msg.serialize();
                buffer.should.be.ok;
                buffer.toString('hex').should.be.equal('66b301a48fece2fc77ba4aa57373907784ba4aa57390738400000000080000006a0401000a1a0000');
                done();
            })
        });

        describe('#deserialize()', function () {
            it('should de-serialize the msg', function (done) {
                var msg = new ModelType({
                    buffer: new Buffer('66b301a48fece2fc77ba4aa57373907784ba4aa57390738400000000080000006a0401000a1a0000', 'hex')
                });
                try {
                    console.log('type: ', ModelType);
                    msg.deserialize();
                } catch (e) {
                    console.log('error: ', e.stack);
                    throw e;
                }
                msg.should.be.an.instanceof(ModelType);
                msg.should.have.properties({
                    server_salt: '0xfce2ec8fa401b366',
                    session_id: '0x77907373a54aba77'
                });
                msg.payload.should.be.an.instanceof(ConstructorBuilder.requireTypeByName('namespace.Message'));
                msg.payload.bytes.should.be.equal(8);
                msg.payload.body.should.be.an.instanceof(Body);
                msg.payload.body.key.should.be.equal(6666);
                done();
            })
        });

    });
});