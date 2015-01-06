//     telegram-tl-node
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     https://github.com/enricostara/telegram-tl-node

//     TypeBuilder class
//
// This class can build dynamically a `TypeObject` concrete sub-class
// parsing `TL-Schema` for both `MTProto` and `Telegram API`

/*jshint evil:true */

// Export the class
module.exports = exports = TypeBuilder;

// Export the method
exports.buildTypes = buildTypes;
exports.inheritsTlSchema = inheritsTlSchema;

// Import dependencies
var util = require('util');
var getLogger = require('get-log');
var logger = getLogger('TypeBuilder');
var TypeObject = require('./type-object');


// Compile a reg exp to resolve Type declaration in TL-Schema
var typeResolver = /^(\w+)(<(\w+)>)?$/;

// The constructor requires the following params:
//      `module`: the module name where add this new Type (class or function),
//      `tlSchema`: the TypeLanguage schema that describes the Type (class or function),
//      `messageWrapperType`: message-wrapper type to be used by the Type function, undefined in case of Type class
function TypeBuilder(module, tlSchema, messageWrapperType) {
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

    // Check if is required creating a function
    if (messageWrapperType) {
        this._type = this.buildTypeFunction(messageWrapperType);
    } else {
        this._type = this.buildTypeConstructor();
    }
}

// Return the built type
TypeBuilder.prototype.getType = function() {
    return this._type;
};

// This function builds a new `TypeLanguage` function parsing the `TL-Schema method`
TypeBuilder.prototype.buildTypeFunction = function(messageWrapperType) {
    var methodName = this.tlSchema.method;
    // Start creating the body of the new Type function
    var body =
        '\tvar start = new Date().getTime();\n' +
        '\tvar self = arguments.callee;\n' +
        '\tvar callback = options.callback;\n' +
        '\tvar conn = options.conn;\n' +
        '\tif (!conn) {\n' +
        '\t\tvar msg = \'The \\\'conn\\\' option is missing, it\\\'s mandatory\';\n' +
        '\t\tself.logger.warn(msg);\n' +
        '\t\tif(callback) callback(new TypeError(msg));\n' +
        '\t\treturn;\n' +
        '\t}\n';
    body +=
        '\tvar reqPayload = new self.PayloadType(options);\n' +
        '\tvar reqMsg = new self.MessageWrapperType({message: reqPayload.serialize()});\n';
    body +=
        '\tconn.connect(function (ex1) {\n' +
        '\t\tif(ex1) {\n' +
        '\t\t\tself.logger.error(\'Unable to connect: %s \', ex1);\n' +
        '\t\t\tif(callback) callback(ex1);\n' +
        '\t\t\treturn;\n' +
        '\t\t}\n' +
        '\t\tconn.write(reqMsg.serialize(), function (ex2) {\n' +
        '\t\t\tif(ex2) {\n' +
        '\t\t\t\tself.logger.error(\'Unable to write: %s \', ex2);\n' +
        '\t\t\t\tif(callback) callback(ex2);\n' +
        '\t\t\t\treturn;\n' +
        '\t\t\t}\n' +
        '\t\t\tconn.read(function (ex3, response) {\n' +
        '\t\t\t\tif(ex3) {\n' +
        '\t\t\t\t\tself.logger.error(\'Unable to read: %s \', ex3);\n' +
        '\t\t\t\t\tif(callback) callback(ex3);\n' +
        '\t\t\t\t\treturn;\n' +
        '\t\t\t\t}\n' +
        '\t\t\t\ttry {\n' +
        '\t\t\t\t\tvar resMsg = new self.MessageWrapperType({buffer: response}).deserialize().body;\n' +
        //'\t\t\t\t\tresMsg = resMsg.body;\n' +
        '\t\t\t\t\tvar Type = self.requireTypeFromBuffer(resMsg);\n' +
        '\t\t\t\t\tvar resObj = new Type({buffer: resMsg});\n' +
        '\t\t\t\t\tresObj.deserialize();\n' +
        '\t\t\t\t\tvar duration = new Date().getTime() - start;\n' +
        '\t\t\t\t\tif(self.logger.isDebugEnabled()) self.logger.debug(\'Executed in %sms\', duration);\n' +
        '\t\t\t\t\tif(callback) callback(null, resObj, duration);\n' +
        '\t\t\t\t} catch(ex4) {\n' +
        '\t\t\t\t\tself.logger.error(\'Unable to deserialize response due to %s \', ex4);\n' +
        '\t\t\t\t\tif(callback) callback(ex4);\n' +
        '\t\t\t\t}\n' +
        '\t\t\t});\n' +
        '\t\t});\n' +
        '\t});';
    if (logger.isDebugEnabled()) {
        logger.debug('Body for %s type function:', methodName);
        logger.debug('\n' + body);
    }
    /*jshint evil:true */
    // Create the new Type function
    var typeFunction = new Function('options', body);
    typeFunction.requireTypeFromBuffer = requireTypeFromBuffer;
    // Create the function payload class re-calling TypeBuilder constructor.
    typeFunction.PayloadType = new TypeBuilder(this.module, this.tlSchema).getType();
    typeFunction.MessageWrapperType = messageWrapperType;
    typeFunction.logger = getLogger(this.module + '.' + methodName);
    return typeFunction;
};

TypeBuilder.prototype.buildTypeConstructor = function() {
    // This function builds a new `TypeLanguage` class (a `TypeObject` sub-class)
    // parsing the `TL-Schema constructor`

    // Start creating the body of the new Type constructor, first calling super()
    var __ret = this._buildIdentity();
    var typeId = __ret.typeId;
    var schemaTypeName = __ret.schemaTypeName;
    var fullTypeName = __ret.fullTypeName;
    var body =
        '\tvar opts = options ? options : {};\n' +
        '\tthis.constructor.util._extend(this, opts.props);\n' +
        '\tthis.constructor.super_.call(this, opts.buffer, opts.offset' +
        (typeId ? '' : ', true') +
        ');\n';
    // Init fields
    body += __ret.body;
    body += this._buildSerialize();
    body += this._buildDeserialize();
    // Add to body all the read/write methods
    for (var i = 0; i < this._methods.length; i++) {
        body += this._methods[i];
    }
    if (logger.isDebugEnabled()) {
        logger.debug('Body for %s type constructor:', fullTypeName);
        logger.debug('\n' + body);
    }
    var typeConstructor = this.createTypeConstructor(body, typeId, fullTypeName);
    return registerTypeById(registerTypeByName(schemaTypeName, typeConstructor));
};

TypeBuilder.prototype._buildIdentity = function() {
    var typeName = this.tlSchema.method ?
        this.tlSchema.method : toUpperCase(this.tlSchema.predicate);
    var typeId = this.tlSchema.id;
    if (this.tlSchema.id) {
        var buffer = new Buffer(4);
        buffer.writeUInt32LE(this.tlSchema.id, 0, true);
        typeId = buffer.toString('hex');
    }
    var fullTypeName = this.module + '.' + typeName;
    var body =
        '\tthis.id = ' + (typeId ? '\'' + typeId + '\'' : typeId) + ';\n' +
        '\tthis.typeName = "' + fullTypeName + '";\n';
    return {
        typeId: typeId,
        schemaTypeName: typeName,
        fullTypeName: fullTypeName,
        body: body
    };
};

// Create the new Type sub-class of TypeObject
TypeBuilder.prototype.createTypeConstructor = function(body, typeId, fullTypeName) {
    var TypeConstructor = new Function('options', body);
    TypeConstructor.id = typeId;
    TypeConstructor.typeName = fullTypeName;
    TypeConstructor.requireTypeByName = requireTypeByName;
    TypeConstructor.util = require('util');
    TypeConstructor.logger = getLogger(fullTypeName);
    util.inherits(TypeConstructor, TypeObject);
    return TypeConstructor;
};

// Create the `serialize()` method
TypeBuilder.prototype._buildSerialize = function() {
    var body =
        '\tthis.serialize = function serialize () {\n' +
        '\t\tvar super_serialize = this.constructor.super_.prototype.serialize.bind(this);\n' +
        '\t\tif (!super_serialize()) {\n' +
        '\t\t\treturn false;\n' +
        '\t\t}\n';
    // Parse the `TL-Schema params`
    if (this.tlSchema.params) {
        for (var i = 0; i < this.tlSchema.params.length; i++) {
            var param = this.tlSchema.params[i];
            var type = param.type.match(typeResolver);
            var typeName = type[1];
            // Manage Object type
            if (typeName.charAt(0) === typeName.charAt(0).toUpperCase()) {
                body +=
                    '\t\tthis._writeBytes(this.' + param.name +
                    ('Object' === typeName ? '' : '.serialize()') + ');\n';
            }
            // Manage primitive type
            else {
                typeName = toUpperCase(typeName);
                body +=
                    '\t\tthis.' + this._buildWriteProperty(param.name, typeName) + '();\n';
            }
        }
    }
    body +=
        '\t\treturn this.retrieveBuffer();\n' +
        '\t}\n';
    return body;
};

// Create the `write[property]()` method
TypeBuilder.prototype._buildWriteProperty = function(propertyName, typeName) {
    var functionName = 'write' + toUpperCase(propertyName);
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
};

// create the `deserialize()` method
TypeBuilder.prototype._buildDeserialize = function() {
    var body =
        '\tthis.deserialize = function deserialize () {\n' +
        '\t\tvar super_deserialize = this.constructor.super_.prototype.deserialize.bind(this);\n' +
        '\t\tif (!super_deserialize()) {\n' +
        '\t\t\treturn false;\n' +
        '\t\t}\n';
    // Parse the `TL-Schema params`
    if (this.tlSchema.params) {
        for (var i = 0; i < this.tlSchema.params.length; i++) {
            var param = this.tlSchema.params[i];
            var type = param.type.match(typeResolver);
            var typeName = type[1];
            if (!type[3]) {
                // Manage Object type
                if (typeName.charAt(0) === typeName.charAt(0).toUpperCase()) {
                    if ('Object' !== typeName) {
                        body +=
                            '\t\tvar ' + typeName + ' = this.constructor.requireTypeByName(\'' + typeName + '\');\n' +
                            '\t\tvar obj = new ' + typeName + '({buffer: this._buffer, offset: this.getReadOffset()}).deserialize();\n' +
                            '\t\tif (obj) {\n' +
                            '\t\t\tthis.' + param.name + ' = obj;\n' +
                            '\t\t\tthis._readOffset += obj.getReadOffset()\n' +
                            '\t\t}\n';
                    } else {
                        body += '\t\tthis.' + param.name + ' = this._readBytes(this.bytes);\n';
                    }
                }
                // Manage primitive type
                else {
                    typeName = toUpperCase(typeName);
                    body +=
                        '\t\tthis.' + this._buildReadProperty(param.name, typeName) + '();\n';
                }
            }
            // Manage generic type
            else {
                var typeParam = type[3];
                body +=
                    '\t\tvar ' + typeName + ' = this.constructor.requireTypeByName(\'' + typeName + '\');\n' +
                    '\t\tvar obj = new ' + typeName + '({type: \'' + typeParam + '\', ' +
                    'buffer: this._buffer, offset: this.getReadOffset()}).deserialize();\n' +
                    '\t\tif (obj) {\n' +
                    '\t\t\tthis.' + param.name + ' = obj;\n' +
                    '\t\t\tthis._readOffset += obj.getReadOffset();\n' +
                    '\t\t}\n';
            }
        }
    }
    // check if all the buffer has been read
    body +=
        '\t\tif(this._readOffset !== this._buffer.length) {\n' +
        '\t\t\tthrow new Error(\'De-serialization failed! readOffset(\' + this._readOffset + \') ' +
        '!= buffer.length(\' + this._buffer.length + \')\');\n' +
        '\t\t}\n';

    body +=
        '\t\treturn this;\n' +
        '\t}\n';
    return body;
};

// Create the `read[property]()` method
TypeBuilder.prototype._buildReadProperty = function(propertyName, typeName) {
    var functionName = 'read' + toUpperCase(propertyName);
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
};

function toUpperCase(str) {
    return (str.charAt(0).toUpperCase() + str.slice(1));
}

function inheritsTlSchema(constructor, superTlSchema) {
    var NewType = new TypeBuilder('abstract', superTlSchema).getType();
    util.inherits(constructor, NewType);
    constructor.s_ = NewType;
    constructor.super_ = NewType.super_;
    constructor.util = NewType.util;
    constructor.requireTypeByName = NewType.requireTypeByName;
    constructor.logger = NewType.logger;
}

// Type register by id
var typeById = {};

// Register a Type constructor by id
function registerTypeById(type) {
    if (logger.isDebugEnabled()) {
        logger.debug('Register Type \'%s\' with id [%s]', type.typeName, type.id);
    }
    typeById[type.id] = type;
    return type;
}

// Retrieve a Type constructor reading the id from buffer
function requireTypeFromBuffer(buffer) {
    var typeId = buffer.slice(0, 4).toString('hex');
    var type = typeById[typeId];
    if (logger.isDebugEnabled()) {
        logger.debug('Retrive Type \'%s\' with id [%s]', type.typeName, typeId);
    }
    return type;
}

// Type register by name
var typeByName = {
    'Vector': require('./type-vector')
};

// Register a Type constructor by name
function registerTypeByName(name, type) {
    if (logger.isDebugEnabled()) {
        logger.debug('Retrive Type \'%s\' with name [%s]', type.typeName, name);
    }
    typeByName[name] = type;
    return type;
}

// Return the required internal module/class
function requireTypeByName(name) {
    return typeByName[name];
}

// Types function builder
function buildTypes(schemas, types, targetModule, isMethodType) {
    for (var i = 0; i < schemas.length; i++) {
        var type = schemas[i];
        if (types.lastIndexOf(type[isMethodType ? 'method' : 'type']) >= 0) {
            var typeName = isMethodType ? type.method : toUpperCase(type.predicate);
            var builder = new TypeBuilder(targetModule._id, type, isMethodType);
            targetModule[typeName] = builder.getType();
        }
    }
}
