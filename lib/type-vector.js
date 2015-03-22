//     telegram-tl-node
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     https://github.com/enricostara/telegram-tl-node

//     TypeVector class
//
// This class is the `TypeLanguage` List implementation, a sub-class of the `TypeObject` class

// Import dependencies
var util = require('util');
var TypeObject = require('./type-object');
var TypeBuilder = require('./type-builder');

// TypeVector extends TypeObject
util.inherits(TypeVector, TypeObject);

// To get an instance for `serialization`:
//
//      new TypeVector({type: 'long', list: [1,2,3]});
// Provide the `list` property to fill the vector and the type of the content, `int` is the default:
//
// To get an instance for `de-serialization`:
//
//      new TypeVector({type: 'int128', buffer: myBuffer, offset: currentPosition});
// Provide a `buffer` and eventually an `offset` where start
//
// The `constructor`:
function TypeVector(options) {
    var opts = util._extend({ type: 'int'}, options);
    this.constructor.super_.call(this, opts.buffer, opts.offset);
    this.id = '15c4b51c';
    manageType.call(this, opts.type);
    this.list = !opts.list ? [] : opts.list;
    this.constructor.logger = require('get-log')('TypeVector');
}

function manageType (type) {
    var isBare = type.charAt(0) === '%';
    type = isBare ? type.slice(1) : type;
    if(type.charAt(0) === type.charAt(0).toUpperCase()) {
        // Manage Object type
        this.type = type;
        this['write' + type] = function(obj) {
            this._writeBytes(obj.serialize({isBare: isBare}));
        };
        this['read' + type] = function() {
            var Type = TypeBuilder.requireTypeByName(type);
            return new Type({buffer: this._buffer, offset: this.getReadOffset()}).deserialize({isBare: isBare}, true);
        };
    } else {
        // Manage primitive type
        this.type = type.charAt(0).toUpperCase() + type.slice(1);
    }
}

// The method de-serializes the list starting from the initialized buffer
TypeVector.prototype.deserialize = function (options) {
    if (!this.constructor.super_.prototype.deserialize.call(this, options)) {
        return false;
    }
    var listLength = this.readInt();
    if(TypeVector.logger.isDebugEnabled()) {
        TypeVector.logger.debug('read \'%s\' = %s , offset = %s', 'length', listLength, this.getReadOffset());
    }
    for (var i = 0; i < listLength; i++) {
        this.list[i] = this['read' + this.type]();
    }
    return this;
};

// The method serializes the list starting from the initialized buffer
TypeVector.prototype.serialize = function (options) {
    if (!this.constructor.super_.prototype.serialize.call(this, options)) {
        return false;
    }
    var listLength = this.list.length;
    this.writeInt(listLength);
    for (var i = 0; i < listLength; i++) {
        this['write' + this.type](this.list[i]);
    }
    return this.retrieveBuffer();
};

// The method retrieves a copy of the internal list
TypeVector.prototype.getList = function () {
    return this.list.slice();
};

// Export the class
module.exports = exports = TypeVector;

