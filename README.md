# node-libactor

[![Build Status](https://travis-ci.org/hrithikp/node-libactor.svg?branch=master)](https://travis-ci.org/hrithikp/node-libactor)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Test Coverage](https://codeclimate.com/github/hrithikp/node-libactor/badges/coverage.svg)](https://codeclimate.com/github/hrithikp/node-libactor/coverage)
[![Code Climate](https://codeclimate.com/github/hrithikp/node-libactor/badges/gpa.svg)](https://codeclimate.com/github/hrithikp/node-libactor)
[![Issue Count](https://codeclimate.com/github/hrithikp/node-libactor/badges/issue_count.svg)](https://codeclimate.com/github/hrithikp/node-libactor)


A library for building and running actors based on the [Actor Model](https://en.wikipedia.org/wiki/Actor_model)

## Install

```bash
npm install --save libactor
```

## Test
```bash
npm test
```

## Usage

### Actor Basics

```javascript
var actor = require('libactor');
var langs = {'en': 'Hello %s', 'es': 'Hola %s'}
var greeter = actor.make('greeter', function (self, msg, src) {
	var lang = msg.data.lang || 'en'
	var name = msg.data.name || 'unknown'
	var greeting = langs[lang]
	console.log(greeting, name)
})
greeter.send({'name': 'John, Smith', 'lang': 'en'})
```

## Hooks Basics

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
	actor.fire('custom:process', msg)
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
