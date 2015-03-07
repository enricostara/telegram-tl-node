//     telegram-tl-node
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     https://github.com/enricostara/telegram-tl-node

//     TypeObject class
//
// The `TypeObject` class is the implementation of the `TypeLanguage Object`, it provides
// read/write methods to serialize/de-serialize in the TypeLanguage binary format

/*jshint bitwise:false*/

// Import dependencies
require('colors');
var BigInteger = require('jsbn');

// The constructor may be called giving a `Buffer` with the binary image - eventually starting from an `offset` -
// in order to de-serialize a `TypeLanguage entity` via `read*` methods,
// otherwise you can call it without any argument and start serializing a new one via `write*` methods
function TypeObject(buffer, offset, noId) {
    if (buffer) {
        this._writeBuffers = null;
        this._readOffset = 0;
        buffer = Buffer.isBuffer(buffer) ? buffer : new Buffer(buffer);
        this._buffer = offset ? buffer.slice(offset) : buffer;
        this._noId = noId;
    } else {
        this._writeBuffers = [];
        this._writeOffset = 0;
    }
}

// The base method to de-serialize the object
TypeObject.prototype.deserialize = function(options) {
    var logger = this.constructor.logger;
    var isBare = options && options.isBare;
    if (!this.isReadonly()) {
        if (logger) {
            logger.warn('Unable to de-serialize, the buffer is undefined');
        }
        return false;
    }
    if (!this._noId && !isBare) {
        var id = this._readBytes(4).toString('hex');
        if (logger && logger.isDebugEnabled()) {
            logger.debug('read ID = %s', id);
        }
        if (this.id !== id) {
            if (logger) {
                logger.warn('Unable to de-serialize, (read id) %s != (this.id) %s', id, this.id);
            }
            return false;
        }
    }
    return this;
};

// The base method to serialize the object
TypeObject.prototype.serialize = function(options) {
    var logger = this.constructor.logger;
    var isBare = options && options.isBare;
    if (this.id && !isBare) {
        if (logger && logger.isDebugEnabled()) {
            logger.debug('write ID = %s', this.id);
        }
        return this._writeBytes(new Buffer(this.id, 'hex'));
    }
    return true;
};

// The method finalizes the serialization process and retrieves the `Buffer` image of the object,
// putting the instance in `readonly` state
TypeObject.prototype.retrieveBuffer = function() {
    if (!this._buffer) {
        this._buffer = Buffer.concat(this._writeBuffers);
    }
    this._writeBuffers = null;
    this._writeOffset = 0;
    this._readOffset = 0;
    return this._buffer;
};

TypeObject.prototype._addWriteBuffer = function(buffer) {
    this._writeBuffers.push(buffer);
    this._writeOffset += buffer.length;
    var logger = this.constructor.logger;
    if (logger && logger.isDebugEnabled()) {
        logger.debug('Write offset %s', this._writeOffset);
    }
};

// The method writes the `int` value given as argument
TypeObject.prototype.writeInt = function(intValue) {
    if (this.isReadonly()) {
        return false;
    }
    var buffer = new Buffer(4);
    buffer.writeUInt32LE(intValue, 0, true);
    var logger = this.constructor.logger;
    if (logger && logger.isDebugEnabled()) {
        logger.debug('intValue %s, intBuffer %s', intValue, buffer.toString('hex'));
    }
    this._addWriteBuffer(buffer);
    return true;
};

// The method writes the `BigInteger` value given as argument, you have to provide the value as `String` type
// and specify a `byte length`, where `length % 4 == 0`
TypeObject.prototype._writeBigInt = function(bigInteger, byteLength) {
    if (this.isReadonly() || (byteLength % 4) !== 0) {
        return false;
    }
    this._addWriteBuffer(stringValue2Buffer('' + bigInteger, byteLength));
    return true;
};

// The method writes the `byte[]` value given as argument,
// adding the bytes length at the beginning
// and adding padding at the end if needed
TypeObject.prototype.writeBytes = function(bytes, useWordLength) {
    if (this.isReadonly()) {
        return false;
    }
    var bLength = useWordLength ? bytes.length / 4 : bytes.length;
    var isShort = bLength < (useWordLength ? 0x7F : 0xFE);
    var buffer = new Buffer(isShort ? 1 : 4);
    var offset = 0;
    if (isShort) {
        buffer.writeUInt8(bLength, offset++);
    } else {
        buffer.writeUInt8((useWordLength ? 0x7F : 0xFE), offset++);
        buffer.writeUInt8(bLength & 0xFF, offset++);
        buffer.writeUInt8((bLength >> 8) & 0xFF, offset++);
        buffer.writeUInt8((bLength >> 16) & 0xFF, offset++);
    }
    this._addWriteBuffer(buffer);
    this._writeBytes(bytes);
    // add padding if needed
    if (!useWordLength) {
        var padding = (offset + bytes.length) % 4;
        if (padding > 0) {
            buffer = new Buffer(4 - padding);
            buffer.fill(0);
            this._addWriteBuffer(buffer);
        }
    }
    return true;
};

// The method writes the `string` value given as argument
TypeObject.prototype.writeString = function(str) {
    return this.writeBytes(str);
};

// The method writes the `byte[]` value given as argument
TypeObject.prototype._writeBytes = function(bytes) {
    if (this.isReadonly()) {
        return false;
    }
    var buffer = !Buffer.isBuffer(bytes) ? new Buffer(bytes) : bytes;
    this._addWriteBuffer(buffer);
    return true;
};

// The method writes the `long` value given as argument
TypeObject.prototype.writeLong = function(bigInteger) {
    return this._writeIntN(bigInteger, 8);
};

// The method writes the `int128` value given as argument
TypeObject.prototype.writeInt128 = function(bigInteger) {
    return this._writeIntN(bigInteger, 16);
};

// The method writes the `int256` value given as argument
TypeObject.prototype.writeInt256 = function(bigInteger) {
    return this._writeIntN(bigInteger, 32);
};

TypeObject.prototype._writeIntN = function(bigInteger, byteLength) {
    return (typeof bigInteger === 'string' || typeof bigInteger === 'number') ? this._writeBigInt(bigInteger, byteLength) :
        this._writeBytes(bigInteger);
};

// The method reads an `int` value starting from the current position
TypeObject.prototype.readInt = function() {
    if (!this.isReadonly() || (this._readOffset + 4) > this._buffer.length) {
        return undefined;
    }
    var intValue = this._buffer.readUInt32LE(this._readOffset);
    // Reading position will be increased of 4
    this._readOffset += 4;
    return intValue;
};

// The method reads a `byte[]` value starting from the current position, using the first byte(s) to get the length
TypeObject.prototype.readBytes = function(useWordLength) {
    var start = this._readOffset;
    var bLength = this._buffer.readUInt8(this._readOffset++);
    var logger = this.constructor.logger;
    var isShort = bLength < 0x7F;
    if (!isShort) {
        bLength = this._buffer.readUInt8(this._readOffset++) +
        (this._buffer.readUInt8(this._readOffset++) << 8) +
        (this._buffer.readUInt8(this._readOffset++) << 16);
    }
    if (logger && logger.isDebugEnabled()) {
        logger.debug('bufferLength = %s', bLength);
    }
    var buffer = this._readBytes(useWordLength ? bLength * 4 : bLength);
    // consider padding if needed
    var padding = (this._readOffset - start) % 4;
    if (padding > 0) {
        this._readOffset += 4 - padding;
    }
    return buffer;
};


// The method reads a `string` value starting from the current position
TypeObject.prototype.readString = function() {
    return this.readBytes().toString('utf8');
};

// The method reads a `byte[]` value starting from the current position
TypeObject.prototype._readBytes = function(byteLength) {
    var end = byteLength ? this._readOffset + byteLength : this._buffer.length;
    if (!this.isReadonly() || end > this._buffer.length) {
        return undefined;
    }
    var buffer = this._buffer.slice(this._readOffset, end);
    this._readOffset = end;
    return buffer;
};

// The method reads a `BigInteger` value with a given byte length starting from the current position
TypeObject.prototype._readBigInt = function(byteLength) {
    var buffer = this._readBytes(byteLength);
    return buffer ? buffer2StringValue(buffer) : undefined;
};

// The method reads a `long` value with  starting from the current position
TypeObject.prototype.readLong = function() {
    return this._readBigInt(8);
};

// The method reads a `int128` value with  starting from the current position
TypeObject.prototype.readInt128 = function() {
    return this._readBigInt(16);
};

// The method reads a `int256` value with  starting from the current position
TypeObject.prototype.readInt256 = function() {
    return this._readBigInt(32);
};

// The method checks if the object has been already serialized and then it's `readonly`
TypeObject.prototype.isReadonly = function() {
    if (this._buffer) {
        return true;
    }
    return false;
};

// The method retrieves the current read position
TypeObject.prototype.getReadOffset = function() {
    return this._readOffset;
};

TypeObject.prototype.toPrintable = function(exclude, noColor) {
    return toPrintable.call(this, exclude, noColor);
};

// The method returns a printable state of the object
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

function buffer2StringValue(buffer) {
    var length = buffer.length;
    var output = '0x';
    for (var i = length; i > 0; i--) {
        output += buffer.slice(i - 1, i).toString('hex');
    }
    return output;
}

// Export the class
module.exports = exports = TypeObject;
exports.stringValue2Buffer = stringValue2Buffer;
exports.buffer2StringValue = buffer2StringValue;
exports.toPrintable = toPrintable;