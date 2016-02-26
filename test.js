/* global describe it */
var _ = require('lodash')
var chai = require('chai')
var spies = require('chai-spies')
chai.use(spies)
var assert = chai.assert
var expect = chai.expect
var actor = require('./index')
function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}
describe('actor()', function () {
  it('returns system actor if no argument is passed', function () {
    expect(actor()).to.equal(actor.system)
  })
})
describe('actor(name)', function () {
  it('returns system actor if name is not found', function () {
    expect(actor('unknown')).to.equal(actor.system)
  })
  it('returns actor with the name if found', function () {
    var name = 'foo-' + getRandomInt(1, 10)
    var act = actor.make(name)
    expect(actor(name)).to.equal(act)
  })
})
describe('actor.make(name, [play])', function () {
  it('throws an error if name is not a string', function () {
    assert.throw(() => actor.make(), 'name must be a non-empty string')
  })
  it('throws an error if name is already present', function () {
    assert.throw(() => actor.make('system'), 'name is already in use')
  })
  it('returns a newly created actor with given name and play', function () {
    var name = 'foo-' + getRandomInt(10, 20)
    var spy = chai.spy(function (self, msg, src) {})
    var act = actor.make(name, spy)
    expect(actor(name)).to.have.property('name', name)
    act.send('hello')
    expect(spy).to.have.been.called.with(act, {type: 'raw', data: 'hello', done: _.noop}, actor.system)
  // expect(spy).to.have.been.called.with(act, 'hello', actor.system)
  })
})
describe('actor.send(dst, msg, src)', function () {
  it('Uses default actor interface when msg is not valid', function () {
    var nameSend = 'foo-' + getRandomInt(20, 30)
    var spySend = chai.spy(function (self, msg, src) {})
    var actSend = actor.make(nameSend, spySend)
    actSend.send()
    expect(spySend).to.have.been.called.with(actSend, {type: 'raw', data: {}, done: _.noop}, actor.system)
  })
  it('uses actor.message(msg) to proccess which uses actor.take', function () {
    var nameSend = 'foo-' + getRandomInt(30, 40)
    var spySend = chai.spy(function (self, msg, src) {})
    var actSend = actor.make(nameSend, spySend)
    var msg = actor.take(null, {}, null)
    actSend.send(msg)
    expect(spySend).to.have.been.called.with(actSend, msg, actor.system)
  })
})
var fooHook = chai.spy(function (x) {})
var barHook = chai.spy(function (x) { return x })
function _hook_fire_tester (func) {
  return function () {
    expect(func()).to.equal(false)
    expect(func({})).to.equal(false)
  }
}
describe('actor.hook(name, hook)', function () {
  it('returns false when no name is empty or not a string', _hook_fire_tester(actor.hook))
  it('returns false when no hook is empty or not a function', function () {
    expect(actor.hook('foo')).to.equal(false)
    expect(actor.hook('foo', {})).to.equal(false)
  })
  it('returns registered all hooks when all params are valid', function () {
    expect(actor.hook('foo', fooHook)).to.contain(fooHook)
  })
})
describe('actor.fire(name,acc,...args)', function () {
  it('returns false if name is empty or not a string', _hook_fire_tester(actor.fire))
  it('returns the acc object after applying all hooked reducers', function () {
    actor.hook('foo', barHook)
    var y = {}
    var z = actor.fire('foo', y)
    expect(fooHook).to.be.called()
    expect(barHook).to.be.called()
    expect(y).to.equal(z)
  })
})
describe('actor.find(name)', function () {
  it('returns default system actor when name is empty', function () {
    expect(actor.find()).to.equal(actor.system)
  })
  it('returns default system actor when name not found', function () {
    expect(actor.find('foo' + getRandomInt(100, 1000))).to.equal(actor.system)
  })
  it('returns name when name is an actor', function () {
    expect(actor.find(actor.system)).to.equal(actor.system)
  })
})
describe('actor.system', function () {
  it('should actor.fire(system:raw) when actor().send({}) ', function () {
    var spy = chai.spy(function (x, y, z) {
      return x
    })
    actor.hook('system:raw', spy)
    actor().send({})
    var msg = {type: 'raw', data: {}, done: _.noop}
    expect(spy).to.have.been.called.with(msg, actor.system)
  })
  it('should actor.fire(system:foo) when actor().send({type: "foo"}) ', function () {
    var spy = chai.spy(function (x, y, z) {
      return x
    })
    actor.hook('system:foo', spy)
    actor().send({type: 'foo'})
    expect(spy).to.have.been.called()
  })
})
describe('Misc usage checks', function () {
  it('actor.send(dst, msg, src) uses default system actor when dst is not an actor', function () {
    actor.send('foo', 'bar')
  })
  it('actor.checks(info) to fall back to _.has when no check function is given', function () {
    var checks = actor.checks({name: 'invalid'})
    expect(checks).to.have.length(1)
  })
})
