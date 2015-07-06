//     telegram-tl-node
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     https://github.com/enricostara/telegram-tl-node

/*jshint evil:true */

//     ConstructorBuilder class
//
// This class can build dynamically a `TypeObject` concrete sub-class
// parsing `TL-Schema` for both `MTProto` and `Telegram API`

// Export the class
module.exports = exports = ConstructorBuilder;
exports.registerTypeById = registerTypeById;
exports.requireTypeById = requireTypeById;
exports.requireTypeFromBuffer = requireTypeFromBuffer;
exports.registerTypeByName = registerTypeByName;
exports.requireTypeByName = requireTypeByName;

// Import dependencies
var TypeObject = require('../type-object');
var util = require('util');
var utility = require('../utility');
var getLogger = require('get-log');
var logger = getLogger('ConstructorBuilder');

// Compile a reg exp to resolve Type declaration in TL-Schema
var typeResolver = /^([!%\.\w]+)(<([%\.\w]+)>)?$/;

// The constructor requires the following params:
//      `module`: the module name where add this new Type,
//      `tlSchema`: the TypeLanguage schema that describes the Type (class or function),
function ConstructorBuilder(module, tlSchema, notRegisterByName) {
    this.module = module;
    if (!this.module) {
        logger.warn(' Target \'module\' parameter is mandatory!');
        console.trace();
        return;
    }
    this.tlSchema = tlSchema;
    if (!this.tlSchema) {
        logger.warn('\'tlSchema\' parameter is mandatory!');
        return;
    }
    this._methods = [];
    this._type = build.call(this);
    registerTypeById(this._type);
    if (!notRegisterByName) {
        registerTypeByName(this._type);
    }
}

// Return the built type
ConstructorBuilder.prototype.getType = function () {
    return this._type;
};

// This function builds a new `TypeLanguage` class (a `TypeObject` sub-class)
// parsing the `TL-Schema constructor`
function build() {
    // Start creating the body of the new Type constructor, first calling super()
    var _ret = buildIdentity.call(this);
    var typeId = _ret.typeId;
    var typeName = _ret.typeName;
    var body =
        '\tvar opts = options ? options : {};\n' +
        '\tthis.constructor.util._extend(this, opts.props);\n' +
        '\tthis.constructor.super_.call(this, opts.buffer, opts.offset' +
        (typeId ? '' : ', true') +
        ');\n';
    // Init fields
    body += _ret.body;
    body += buildSerialize.call(this);
    body += buildDeserialize.call(this);
    // Add to body all the read/write methods
    for (var i = 0; i < this._methods.length; i++) {
        body += this._methods[i];
    }
    if (logger.isDebugEnabled()) {
        logger.debug('Body for %s type constructor:', typeName);
        logger.debug('\n' + body);
    }
    return createConstructor(body, typeId, typeName);
}

function buildIdentity() {
    var typeId = this.tlSchema.id;
    if (this.tlSchema.id) {
        var buffer = new Buffer(4);
        buffer.writeUInt32LE(this.tlSchema.id, 0, true);
        typeId = buffer.toString('hex');
    }
    var typeName = this.module + '.' + retrieveTypeName(this.tlSchema);
    var body =
        '\tthis.id = ' + (typeId ? '\'' + typeId + '\'' : typeId) + ';\n' +
        '\tthis.typeName = "' + typeName + '";\n';
    return {
        typeId: typeId,
        typeName: typeName,
        body: body
    };
}

function retrieveTypeName(tlSchema) {
    if (tlSchema.method) {
        return tlSchema.method;
    }
    var typeName = tlSchema.predicate;
    var idx = typeName.lastIndexOf('.') + 1;
    return typeName.substring(0, idx) +
        utility.capitalize(typeName.substring(idx));
}

function createConstructor(body, typeId, typeName) {
    var TypeConstructor = new Function('options', body);
    TypeConstructor.id = typeId;
    TypeConstructor.typeName = typeName;
    TypeConstructor.requireTypeByName = requireTypeByName;
    TypeConstructor.requireTypeFromBuffer = requireTypeFromBuffer;
    TypeConstructor.util = util;
    TypeConstructor.logger = getLogger(typeName);
    util.inherits(TypeConstructor, TypeObject);
    return TypeConstructor;
}

function buildSerialize() {
    var body =
        '\tthis.serialize = function serialize (options) {\n' +
        '\t\tif (!this.constructor.super_.prototype.serialize.call(this, options)) {\n' +
        '\t\t\treturn this.retrieveBuffer();\n' +
        '\t\t}\n';
    // Parse the `TL-Schema params`
    if (this.tlSchema.params) {
        for (var i = 0; i < this.tlSchema.params.length; i++) {
            var param = this.tlSchema.params[i];
            var type = param.type.match(typeResolver);
            var typeName = type[1];
            // Slice types with name starts with '!'
            if ('!' === typeName.charAt(0)) {
                typeName = typeName.slice(1);
            }
            var isBareCheck = checkIfTypeIsBare(typeName);
            var isBare = isBareCheck.isBare;
            typeName = isBareCheck.typeName;
            // Manage Object type
            if (typeName.charAt(0) === typeName.charAt(0).toUpperCase()) {
                body += buildWriteObjectProperty.call(this, param.name, typeName, isBare);
            }
            // Manage primitive type
            else {
                if (typeName === 'int' && param.name === 'bytes') {
                    continue;
                }
                typeName = utility.capitalize(typeName);
                body +=
                    '\t\tthis.' + buildWriteProperty.call(this, param.name, typeName) + '();\n';
            }
        }
    }
    body +=
        '\t\treturn this.retrieveBuffer();\n' +
        '\t};\n';
    return body;
}

function buildWriteObjectProperty(propertyName, typeName, isBare) {
    var body = '\t\tvar ' + propertyName + 'Bytes = this.' + propertyName +
        (('X' === typeName) ? '' : '.serialize({isBare: ' + isBare + '})') + ';\n';
    if ('Object' === typeName) {
        body += '\t\tthis.bytes = ' + propertyName + 'Bytes.length;\n';
        body += '\t\tthis.' + buildWriteProperty.call(this, 'bytes', 'Int') + '();\n';
    }
    body += '\t\tthis._writeBytes(' + propertyName + 'Bytes);\n';
    return body;
}

function buildWriteProperty(propertyName, typeName) {
    var functionName = 'write' + utility.capitalize(propertyName);
    var body =
        '\tthis.' + functionName + ' = function ' + functionName + '() {\n';
    body +=
        '\t\tif(this.constructor.logger.isDebugEnabled()) {\n' +
        '\t\t\tthis.constructor.logger.debug(\'write \\\'%s\\\' = %s\', \'' + propertyName + '\', this.' + propertyName +
        ('Bytes' === typeName ? '.toString(\'hex\')' : '') + ');\n' +
        '\t\t}\n';
    body +=
        '\t\tthis.write' + typeName + '(this.' + propertyName + ');\n';
    body +=
        '\t};\n';
    this._methods.push(body);
    return functionName;
}

function buildDeserialize() {
    var body =
        '\tthis.deserialize = function deserialize (options) {\n' +
        '\t\tif (!this.constructor.super_.prototype.deserialize.call(this, options)) {\n' +
        '\t\t\treturn false;\n' +
        '\t\t}\n';
    // Parse the `TL-Schema params`
    if (this.tlSchema.params) {
        for (var i = 0; i < this.tlSchema.params.length; i++) {
            var param = this.tlSchema.params[i];
            var type = param.type.match(typeResolver);
            var typeName = type[1];
            var isBareCheck = checkIfTypeIsBare(typeName);
            var isBare = isBareCheck.isBare;
            typeName = isBareCheck.typeName;
            if (!type[3]) {
                // Slice types with name starts with '!'
                if ('!' === typeName.charAt(0)) {
                    typeName = typeName.slice(1);
                }
                // Manage Object type
                if (typeName.charAt(0) === typeName.charAt(0).toUpperCase()) {
                    body += buildReadObjectProperty.call(this, param.name, typeName, isBare);
                }
                // Manage primitive type
                else {
                    typeName = utility.capitalize(typeName);
                    body +=
                        '\t\tthis.' + buildReadProperty.call(this, param.name, typeName) + '();\n';
                }
            }
            // Manage generic type
            else {
                var typeParam = type[3];
                body +=
                    '\t\tvar ' + typeName + ' = this.constructor.requireTypeByName(\'' + typeName + '\');\n' +
                    buildDeserializeObjectProperty.call(this, param.name, typeName, typeParam, isBare);
            }
        }
    }
    body +=
        '\t\treturn this;\n' +
        '\t};\n';
    return body;
}

function checkIfTypeIsBare(typeName) {
    var isBare = false;
    if (typeName.charAt(0) === '%') {
        isBare = true;
        typeName = isBare ? typeName.slice(1) : typeName;
    } else if ('vector' === typeName) {
        isBare = true;
        typeName = 'Vector';
    }
    return {
        isBare: isBare,
        typeName: typeName
    };
}

function buildReadObjectProperty(propertyName, typeName, isBare) {
    var body = '';
    if ('X' === typeName) {
        body += '\t\tthis.' + propertyName + ' = this._readBytes(this.bytes);\n';
    } else {
        var fullTypeName = this.module + '.' + typeName;
        body += !isBare ?
        '\t\tvar bytes = this._buffer.slice(this.getReadOffset(), this.getReadOffset() + 4);\n' +
        '\t\tif(this.constructor.logger.isDebugEnabled()) {\n' +
        '\t\t\tthis.constructor.logger.debug(\'Retrieve type %s reading the bytes %s\', ' + typeName + ',  bytes.toString(\'hex\'));\n' +
        '\t\t}\n' +
        '\t\tvar ' + typeName + ' = this.constructor.requireTypeFromBuffer(bytes);\n' :
        '\t\tif(this.constructor.logger.isDebugEnabled()) {\n' +
        '\t\t\tthis.constructor.logger.debug(\'Retrieve BARE type by name %s\', \'' + fullTypeName + '\');\n' +
        '\t\t}\n' +
        '\t\tvar ' + typeName + ' = this.constructor.requireTypeByName(\'' + fullTypeName + '\');\n';
        body += buildDeserializeObjectProperty.call(this, propertyName, typeName, null, isBare);
    }
    return body;
}

function buildDeserializeObjectProperty(propertyName, typeName, typeParam, isBare) {
    return '\t\tif (' + typeName + ') {\n' +
        '\t\t\tvar obj = new ' + typeName + '({' +
        (typeParam ? 'module: \'' + this.module + '\', type: \'' + typeParam + '\', ' : '') +
        'buffer: this._buffer, offset: this.getReadOffset()}).' +
        'deserialize({isBare: ' + isBare + '});\n' +
        '\t\t\tif (obj) {\n' +
        '\t\t\t\tvar typeName = obj.typeName ? obj.typeName.substring(obj.typeName.lastIndexOf(\'.\') + 1) : \'\';\n' +
        '\t\t\t\tthis.' + propertyName + ' = (typeName == \'BoolTrue\') ? true : (typeName == \'BoolFalse\') ? false : obj;\n' +
        '\t\t\t\tthis._readOffset += obj.getReadOffset();\n' +
        '\t\t\t}\n' +
        '\t\t} else {\n' +
        '\t\t\tthrow new TypeError(\'Unable to retrieve the Type constructor for the type ' + typeName + ' and buffer:\' + this._buffer.toString(\'hex\'));\n' +
        '\t\t}\n';
}

function buildReadProperty(propertyName, typeName) {
    var functionName = 'read' + utility.capitalize(propertyName);
    var body =
        '\tthis.' + functionName + ' = function ' + functionName + '() {\n';
    body +=
        '\t\tthis.' + propertyName + ' = this.read' + typeName + '();\n';
    body +=
        '\t\tif(this.constructor.logger.isDebugEnabled()) {\n' +
        '\t\t\tthis.constructor.logger.debug(\'read \\\'%s\\\' = %s, offset = %s\', \'' + propertyName + '\', this.' + propertyName +
        ('Bytes' === typeName ? '.toString(\'hex\')' : '') + ', this._readOffset);\n' +
        '\t\t}\n';
    body +=
        '\t};\n';
    this._methods.push(body);
    return functionName;
}

var registryLogger = getLogger('ConstructorBuilder.registry');

// Types registered by id
var typeById = {};

// Register a Type constructor by id
function registerTypeById(type) {
    if (registryLogger.isDebugEnabled()) {
        registryLogger.debug('Register Type \'%s\' by id [%s]', type.typeName, type.id);
    }
    if(type.id) {
        typeById[type.id] = type;
    }
    return type;
}

// Retrieve a Type constructor by id
function requireTypeById(typeId) {
    var type = typeById[typeId];
    if (!type) {
        var msg = 'Unable to retrieve a Type by Id [' + typeId + ']';
        registryLogger.error(msg);
        throw new Error(msg);
    }
    if (registryLogger.isDebugEnabled()) {
        registryLogger.debug('Require Type \'%s\' by id', type.id);
    }
    return type;
}

// Retrieve a Type constructor reading the id from buffer
function requireTypeFromBuffer(buffer) {
    var typeId = buffer.slice(0, 4).toString('hex');
    var type = typeById[typeId];
    if (!type) {
        var msg = 'Unable to retrieve a Type by Id [' + typeId + ']';
        registryLogger.error(msg);
        throw new Error(msg);
    }
    if (registryLogger.isDebugEnabled()) {
        registryLogger.debug('Require Type \'%s\' by id [%s]', type.typeName, typeId);
    }
    return type;
}

// Types registered by name
var typeByName = {};

// Register a Type constructor by name
function registerTypeByName(type) {
    if (registryLogger.isDebugEnabled()) {
        registryLogger.debug('Register Type \'%s\' by name [%s]', type.id, type.typeName);
    }
    typeByName[type.typeName] = type;
    return type;
}

// Retrieve a Type constructor by name
function requireTypeByName(typeName) {
    var type = typeByName[typeName];
    if (!type) {
        var msg = 'Unable to retrieve a Type by Name [' + typeName + ']';
        registryLogger.error(msg);
        throw new Error(msg);
    }
    if (registryLogger.isDebugEnabled()) {
        registryLogger.debug('Require Type \'%s\' by name [%s]', type.id, typeName);
    }
    return type;
}