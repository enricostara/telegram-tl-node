# telegram-tl-node
[![npm version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coverage-image]][coverage-url] [![Dependency Status][gemnasium-image]][gemnasium-url]

**Telegram TypeLanguage** (TL) library in pure **javascript** on the Node.js platform

[**TypeLanguage**](https://core.telegram.org/mtproto/TL)
_"serves to describe the used system of types, constructors, and existing functions"_ of the **Telegram Mobile Protocol** 
[(MTProto)](https://core.telegram.org/mtproto)

**telegram-tl-node** library implements the core TypeLanguage types (like the base `TypeObject` 
and others defined [here](https://core.telegram.org/mtproto/TL#example)) and therefore a layer for the
[binary data serialization](https://core.telegram.org/mtproto/serialize) of the instances.

This library also implements the `TypeBuilder` class that parses the TypeLanguage [schemas](https://core.telegram.org/schema) 
in [JSON format](https://core.telegram.org/schema/mtproto-json) and dynamically writes **Type classes and functions** in
pure javascript.

The [**telegram.link**](http://telegram.link) <img src="https://raw.githubusercontent.com/enricostara/telegram.link/master/telegram.link.png" 
width="25" /> main project has a dependency on this library.

## Installation

```bash
$ git clone --branch=master git://github.com/enricostara/telegram-tl-node.git
$ cd telegram-tl-node
$ npm install
```

## Unit Testing 

```bash
$ npm test
```

## License

The project is released under the [MIT](./LICENSE) 

[npm-url]: https://www.npmjs.org/package/telegram.link
[npm-image]: https://badge.fury.io/js/telegram-tl-node.svg

[travis-url]: https://travis-ci.org/enricostara/telegram-tl-node
[travis-image]: https://travis-ci.org/enricostara/telegram-tl-node.svg?branch=master

[coverage-url]: https://coveralls.io/r/enricostara/telegram-tl-node?branch=master
[coverage-image]: https://img.shields.io/coveralls/enricostara/telegram-tl-node.svg

[gemnasium-url]: https://gemnasium.com/enricostara/telegram-tl-node
[gemnasium-image]: https://gemnasium.com/enricostara/telegram-tl-node.svg