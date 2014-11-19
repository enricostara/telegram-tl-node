# telegram-tl-node

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