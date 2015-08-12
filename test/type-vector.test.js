require('should');
require('requirish')._(module);
var TypeVector = require('lib/type-vector');
var TypeObject = require('lib/type-object');
var tl = require('lib/builder/type-builder');

describe('TypeVector', function () {


    describe('#init()', function () {
        it('should return an instance', function (done) {
            var list = new TypeVector();
            list.should.be.ok;
            list.should.be.an.instanceof(TypeVector);
            list.should.be.an.instanceof(TypeObject);
            list.should.have.properties({_typeId: '15c4b51c', type: 'Int'});
            list.isReadonly().should.be.false;

            var list = new TypeVector({type: 'long', buffer: new Buffer('15C4B51C01000000216BE86C022BB4C3', 'hex')});
            list.should.have.properties({_typeId: '15c4b51c', type: 'Long'});
            list.isReadonly().should.be.true;

            var list = new TypeVector({type: 'long', list: [1, 2, 3]});
            list.should.have.properties({_typeId: '15c4b51c', type: 'Long'});
            list.isReadonly().should.be.false;
            list.getList().should.be.eql([1, 2, 3]);

            done();
        })
    });
    describe('#deserialize()', function () {
        it('should de-serialize the list', function (done) {
            var list = new TypeVector({type: 'long', buffer: new Buffer('15C4B51C01000000216BE86C022BB4C3', 'hex')});
            list.deserialize().should.be.ok;
            list.getList().length.should.be.equal(1);
            list.getList().pop().should.be.equal('0xc3b42b026ce86b21');
            done();
        })
    });

    describe('#deserialize()', function () {
        it('should not de-serialize the list cause type id mismatch', function (done) {
            var list = new TypeVector({type: 'long', buffer: new Buffer('25C4B51C01000000216BE86C022BB4C3', 'hex')});
            try {
                list.deserialize()
            } catch (e) {
                done();
            }
        })
    });

    describe('#serialize()', function () {
        it('should serialize the list', function (done) {
            var list = new TypeVector({type: 'long', list: ['0xc3b42b026ce86b21']});
            var buffer = list.serialize();
            buffer.should.be.ok;
            buffer.toString('hex').should.be.equal('15c4b51c01000000216be86c022bb4c3');
            done();
        })
    });


    var Message = tl.buildType('namespace', {
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
    });
    var Body = tl.buildType('namespace', {
        "id": "66667",
        "predicate": "Body",
        "params": [
            {
                "name": "key",
                "type": "int"
            }
        ],
        "type": "Body"
    });

    describe('#serialize()', function () {
        it('should serialize the list with a bare Message ', function (done) {
            var message1 = new Message({
                props: {
                    msg_id: '1',
                    seqno: 1,
                    body: new Body({
                        props: {
                            key: 6666
                        }
                    })
                }
            });
            var message2 = new Message({
                props: {
                    msg_id: '2',
                    seqno: 3,
                    body: new Body({
                        props: {
                            key: 7777
                        }
                    })
                }
            });
            try {
                var list = new TypeVector({module: 'namespace', type: '%Message', list: [message1, message2]});
                //test double serialization
                list.serialize();
                var buffer = list.serialize();
            } catch (e) {
                console.log('error: ', e);
                throw e;
            }
            buffer.should.be.ok;
            buffer.toString('hex').should.be.equal('15c4b51c02000000010000000000000001000000080000006b0401000a1a0000020000000000000003000000080000006b040100611e0000');
            done();
        })
    });

    describe('#deserialize()', function () {
        it('should de-serialize the list with a bare Message', function (done) {
            var list = new TypeVector({
                module: 'namespace',
                type: '%Message',
                buffer: new Buffer('15c4b51c02000000010000000000000001000000080000006b0401000a1a0000020000000000000003000000080000006b040100611e0000', 'hex')
            });
            try {
                list.deserialize().should.be.ok;
            } catch (e) {
                console.log('error :', e.stack);
                throw e;
            }
            list.getList().length.should.be.equal(2);

            var message = list.getList()[0];
            message.should.have.properties({
                msg_id: '0x0000000000000001',
                seqno: 1,
                bytes: 8
            });
            message.body.key.should.be.equal(6666);

            message = list.getList()[1];
            message.should.have.properties({
                msg_id: '0x0000000000000002',
                seqno: 3,
                bytes: 8
            });
            message.body.key.should.be.equal(7777);
            done();
        })
    });


    var Type1 = tl.buildType('namespace', {
        "id": "66668",
        "predicate": "Type1",
        "params": [
            {
                "name": "key",
                "type": "int"
            }
        ],
        "type": "AType"
    });

    var Type2 = tl.buildType('namespace', {
        "id": "66669",
        "predicate": "Type2",
        "params": [
            {
                "name": "key",
                "type": "int"
            }
        ],
        "type": "AType"
    });

    describe('#serialize()', function () {
        it('should serialize the list with a polymorfic type ', function (done) {
            var message1 =  new Type1({
                        props: {
                            key: 6666
                        }
                    });
            var message2 = new Type2({
                        props: {
                            key: 7777
                        }
                    });
            try {
                var list = new TypeVector({module: 'namespace', type: 'AType', list: [message1, message2]});
                //test double serialization
                list.serialize();
                var buffer = list.serialize();
            } catch (e) {
                console.log('error: ', e);
                throw e;
            }
            buffer.should.be.ok;
            console.log(buffer.toString('hex'));
            buffer.toString('hex').should.be.equal('15c4b51c020000006c0401000a1a00006d040100611e0000');
            done();
        })
    });


    describe('#deserialize()', function () {
        it('should de-serialize the list with a polymorfic Message', function (done) {
            var list = new TypeVector({
                module: 'namespace',
                type: 'AType',
                buffer: new Buffer('15c4b51c020000006c0401000a1a00006d040100611e0000', 'hex')
            });
            try {
                list.deserialize().should.be.ok;
            } catch (e) {
                console.log('error :', e.stack);
                throw e;
            }
            list.getList().length.should.be.equal(2);
            var obj1 = list.getList()[0];
            obj1.should.have.properties({
                "_typeId": "6c040100",
                "key": 6666
            });
            var obj2 = list.getList()[1];
            obj2.should.have.properties({
                "_typeId": "6d040100",
                "key": 7777
            });

            done();
        })
    });
});