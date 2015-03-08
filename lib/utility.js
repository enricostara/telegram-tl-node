//     telegram-tl-node
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     https://github.com/enricostara/telegram-tl-node

// Export utilities
exports.stringValue2Buffer = stringValue2Buffer;
exports.buffer2StringValue = buffer2StringValue;
exports.toPrintable = toPrintable;

// Import dependencies
require('colors');
var BigInteger = require('jsbn');

// Returns a printable state of the object
function toPrintable(exclude, noColor) {
    var str = '{ ';
    if(typeof exclude !== 'object') {
        noColor = exclude;
        exclude = {};
    }
    for (var prop in this) {
        if (this.hasOwnProperty(prop) && '_' !== prop.charAt(0) && exclude[prop] !== true) {
            var value = this[prop];
            switch (typeof value) {
                case 'number':
                    break;
                case 'function':
                    continue;
                case 'string':
                    value = '"' + value + '"';
                    break;
                default :
                    if(value instanceof Buffer) {
                        prop += '[' + value.length + ']';
                        value = '0x' + value.toString('hex');
                    } else if(typeof value === 'object' && typeof value.toPrintable === 'function') {
                        value = value.toPrintable(exclude[prop] || {}, noColor);
                    }
            }
            str = str === '{ ' ? str : str + ', ';
            str += (noColor ? prop : prop.bold.cyan) + ': ' + value;
        }
    }
    str += ' }';
    return str;
}

// Converts a string value to buffer
function stringValue2Buffer(stringValue, byteLength) {
    if ((stringValue).slice(0, 2) === '0x') {
        var input = stringValue.slice(2);
        var length = input.length;
        var buffers = [];
        var j = 0;
        for (var i = length; i > 0 && j < byteLength; i -= 2) {
            buffers.push(new Buffer(input.slice(i - 2, i), 'hex'));
            j++;
        }
        var buffer = Buffer.concat(buffers);
        var paddingLength = byteLength - buffer.length;
        if (paddingLength > 0) {
            var padding = new Buffer(paddingLength);
            padding.fill(0);
            buffer = Buffer.concat([buffer, padding]);
        }
        return buffer;
    }
    else {
        return bigInt2Buffer(new BigInteger(stringValue), byteLength);
    }
}
function bigInt2Buffer(bigInt, byteLength) {
    var byteArray = bigInt.toByteArray();
    var bArrayLength = byteArray.length;
    var buffer = new Buffer(byteLength);
    buffer.fill(0);
    var length = Math.min(bArrayLength, byteLength);
    for (var i = 0; i < length; i++) {
        var value = byteArray[bArrayLength - 1 - i];
        buffer[i] = value;
    }
    return buffer;
}

// Converts a buffer value to string
function buffer2StringValue(buffer) {
    var length = buffer.length;
    var output = '0x';
    for (var i = length; i > 0; i--) {
        output += buffer.slice(i - 1, i).toString('hex');
    }
    return output;
}