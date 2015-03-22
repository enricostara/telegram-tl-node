require('should');
var TypeObject = require('../lib/type-object');
var utility = require('../lib/utility');

describe('utility', function () {

    describe('#toPrintable()', function () {
        it('should return a printable ', function (done) {
            var obj = new TypeObject();
            obj.number = 1000;
            obj.exclude = 1000;
            obj.string = 'string value';
            obj.buffer = new Buffer('ffff', 'hex');
            obj.array = ['abc', 'def'];
            var arrayInnerObj1 = new TypeObject();
            arrayInnerObj1.number = 100;
            var arrayInnerObj2 = new TypeObject();
            arrayInnerObj2.number = 200;
            obj.array2 = [arrayInnerObj1, arrayInnerObj2];
            var innerObj = new TypeObject();
            innerObj.number = 2000;
            innerObj.exclude = 2000;
            innerObj.innerExclude = 2000;
            innerObj.buffer = new Buffer('eeeeee', 'hex');
            obj.innerObj = innerObj;

            obj.toPrintable(true).should.be.equal('{ number: 1000, exclude: 1000, string: "string value", buffer[2]: 0xffff, ' +
            'array: ["abc", "def"], array2: [{ number: 100 }, { number: 200 }], ' +
            'innerObj: { number: 2000, exclude: 2000, innerExclude: 2000, buffer[3]: 0xeeeeee } }');
            obj.toPrintable({
                exclude: true,
                innerObj: {innerExclude: true}
            }, true).should.be.equal('{ number: 1000, string: "string value", buffer[2]: 0xffff, ' +
                'array: ["abc", "def"], array2: [{ number: 100 }, { number: 200 }], ' +
                'innerObj: { number: 2000, exclude: 2000, buffer[3]: 0xeeeeee } }');
            console.log(obj.toPrintable({
                exclude: true,
                innerObj: {innerExclude: true}
            }));
            var obj = {
                number: 1000,
                toPrintable: utility.toPrintable
            };
            obj.toPrintable(true).should.be.equal('{ number: 1000 }');

            done();
        })
    });

});

