//       telegram-tl-node
//
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the Simplified BSD License
//       https://github.com/enricostara/telegram-tl-node

//      TypeVector class
//
// This class is the `TypeLanguage` List implementation, a sub-class of the `TypeObject` class

// Import dependencies
var util = require('util');
var TypeObject = require('./type-object');
var Builder = require('./builder');

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
    var super_ = this.constructor.super_.bind(this);
    var opts = util._extend({ type: 'int'}, options);
    super_(opts.buffer, opts.offset);
    this.id = '15c4b51c';
    this.type = opts.type.charAt(0).toUpperCase() + opts.type.slice(1);
    this._list = !opts.list ? [] : opts.list;
    this.constructor.logger = require('get-log')('type_language.TypeVector');
}

// The method de-serializes the list starting from the initialized buffer
TypeVector.prototype.deserialize = function () {
    var super_deserialize = this.constructor.super_.prototype.deserialize.bind(this);
    if (!super_deserialize()) {
        return false;
    }
    var listLength = this.readInt();
    for (var i = 0; i < listLength; i++) {
        this._list[i] = this['read' + this.type]();
    }
    return this;
};

// The method serializes the list starting from the initialized buffer
TypeVector.prototype.serialize = function () {
    var super_serialize = this.constructor.super_.prototype.serialize.bind(this);
    if (!super_serialize()) {
        return false;
    }
    var listLength = this._list.length;
    this.writeInt(listLength);
    for (var i = 0; i < listLength; i++) {
        this['write' + this.type](this._list[i]);
    }
    return this.retrieveBuffer();
};

// The method retrieves a copy of the internal list
TypeVector.prototype.getList = function () {
    return this._list.slice();
};

// Export the class
module.exports = exports = TypeVector;

