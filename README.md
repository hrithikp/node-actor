# node-libactor

[![Build Status](https://travis-ci.org/hrithikp/node-libactor.svg?branch=master)](https://travis-ci.org/hrithikp/node-libactor)
[![Coverage Status](https://coveralls.io/repos/github/hrithikp/node-libactor/badge.svg?branch=master)](https://coveralls.io/github/hrithikp/node-libactor?branch=master)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)


A library for building and running actors based on the [Actor Model](https://en.wikipedia.org/wiki/Actor_model)

## Install

```bash
npm install --save libactor
```

## Makes and Sends

```javascript
var actor = require('libactor');
var langs = {'en': 'Hello %s', 'es': 'Hola %s'}
var greeter = actor.make('greeter', function (self, msg, src) {
	var lang = msg.lang || 'en'
	var name = msg.name || 'unknown'
	var greeting = langs[lang]
	console.log(greeting, name)
})

greeter.send({'name': 'John, Smith', 'lang': 'en'})
assert(greeter === actor('greeter'))
```

## Hooks and Fires

```javascript
var actor = require('libactor');
var system = actor()
// Hook into a custom:process when it's fired
actor.hook('custom:process', function (msg) {
	// do some custom processing
	return msg
})
// Hooks into handle for system.send
actor.hook('system:handle', function (msg, src) {
	// send message to another actor
	// can also actor.fire('custom:process', msg)
	return msg
})
system.send({}) // fires the system:handle
// Hooks into actor.make after actor is create
actor.hook('actor:create', function (actor) {
	return actor
})
// Hooks for default message system interface
actor.hook('system:init', function (data, src) {
	// do some thing here
})
system.send({type: 'init', data: {}}) // fires system:boot
```
