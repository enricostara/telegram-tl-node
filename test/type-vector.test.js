require('should');
var TypeVector = require('../lib/type-vector');
var TypeObject = require('../lib/type-object');
var TypeBuilder = require('../lib/type-builder');

describe('TypeVector', function() {

    describe('#init()', function() {
        it('should return an instance', function(done) {
            var list = new TypeVector();
            list.should.be.ok;
            list.should.be.an.instanceof(TypeVector);
            list.should.be.an.instanceof(TypeObject);
            list.should.have.properties({id: '15c4b51c', type: 'Int'});
            list.isReadonly().should.be.false;

            var list = new TypeVector({type: 'long', buffer: new Buffer('15C4B51C01000000216BE86C022BB4C3', 'hex')});
            list.should.have.properties({id: '15c4b51c', type: 'Long'});
            list.isReadonly().should.be.true;

            var list = new TypeVector({type: 'long', list: [1, 2, 3]});
            list.should.have.properties({id: '15c4b51c', type: 'Long'});
            list.isReadonly().should.be.false;
            list.getList().should.be.eql([1, 2, 3]);

            done();
        })
    });

    describe('#deserialize()', function() {
        it('should de-serialize the list', function(done) {
            var list = new TypeVector({type: 'long', buffer: new Buffer('15C4B51C01000000216BE86C022BB4C3', 'hex')});
            list.deserialize().should.be.ok;
            list.getList().length.should.be.equal(1);
            list.getList().pop().should.be.equal('0xc3b42b026ce86b21');
            done();
        })
    });

    describe('#deserialize()', function() {
        it('should not de-serialize the list cause type id mismatch', function(done) {
            var list = new TypeVector({type: 'long', buffer: new Buffer('25C4B51C01000000216BE86C022BB4C3', 'hex')});
            list.deserialize().should.not.be.ok;
            done();
        })
    });

    describe('#serialize()', function() {
        it('should serialize the list', function(done) {
            var list = new TypeVector({type: 'long', list: ['0xc3b42b026ce86b21']});
            var buffer = list.serialize();
            buffer.should.be.ok;
            buffer.toString('hex').should.be.equal('15c4b51c01000000216be86c022bb4c3');
            done();
        })
    });


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

    var Body = new TypeBuilder('namespace', {
        "id": "66667",
        "predicate": "Body",
        "params": [
            {
                "name": "key",
                "type": "int"
            }
        ],
        "type": "Body"
    }).getType();

    describe('#serialize()', function() {
        it('should serialize the list with a bare Message ', function(done) {
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
            var list = new TypeVector({type: '%Message', list: [message1, message2]});
            var buffer = list.serialize();
            buffer.should.be.ok;
            buffer.toString('hex').should.be.equal('15c4b51c02000000010000000000000001000000080000006b0401000a1a0000020000000000000003000000080000006b040100611e0000');
            done();
        })
    });

    describe('#deserialize()', function() {
        it('should de-serialize the list with a bare Message', function(done) {
            var list = new TypeVector({type: '%Message', buffer: new Buffer('15c4b51c02000000010000000000000001000000080000006b0401000a1a0000020000000000000003000000080000006b040100611e0000', 'hex')});
            list.deserialize().should.be.ok;
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
});
