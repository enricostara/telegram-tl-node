# telegram-tl-node
[![npm version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coverage-image]][coverage-url] [![Dependency Status][gemnasium-image]][gemnasium-url]

Telegram TL (TypeLanguage) Node.js implementation

[Type Language](https://core.telegram.org/mtproto/TL)
serves to describe the used system of types, constructors, and existing functions in Telegram Messanger protocol 
[(MTProto)](https://core.telegram.org/mtproto/TL)

This is the javascript pure implementation in node.js platform.

This library also implements the **TypeBuilder** class that  writes dynamically **Type classes and functions** in
javascript, parsing the TypeLanguage [schemas](https://core.telegram.org/schema) 
in [JSON format](https://core.telegram.org/schema/mtproto-json)

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

The project is released under the [Simplified BSD license](./LICENSE) 

[npm-url]: https://www.npmjs.org/package/telegram.link
[npm-image]: https://badge.fury.io/js/telegram-tl-node.svg

[travis-url]: https://travis-ci.org/enricostara/telegram-tl-node
[travis-image]: https://travis-ci.org/enricostara/telegram-tl-node.svg?branch=master

[coverage-url]: https://coveralls.io/r/enricostara/telegram-tl-node?branch=master
[coverage-image]: https://img.shields.io/coveralls/enricostara/telegram-tl-node.svg

[gemnasium-url]: https://gemnasium.com/enricostara/telegram-tl-node
[gemnasium-image]: https://gemnasium.com/enricostara/telegram-tl-node.svg

