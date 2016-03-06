var _ = require('lodash')
var events = require('events')
var hooks = {}
var store = {}
exports = module.exports = actor
function hook (name, hook) {
  if (!_.isString(name) || !_.isFunction(hook)) return false
  var _hooks = _.get(hooks, name, [])
  _hooks.push(hook)
  hooks[name] = _hooks
  return _hooks
}
exports.hook = hook
function fire (name, data) {
  if (!_.isString(name)) return false
  var args = _.values(arguments).slice(1)
  var invokes = _.has(hooks, name) ? hooks[name] : []
  function reducer (acc, hook) {
    var ret = hook.apply(null, [acc].concat(args.slice(1)))
    return ret === acc ? ret : acc
  }
  return _.reduce(invokes, reducer, args[0])
}
exports.fire = fire
function make (name, play) {
  if (!_.isString(name) && !_.size(name)) throw new RangeError('name must be a non-empty string')
  if (_.has(store, name)) throw new RangeError('name is already in use')
  var actor = new events.EventEmitter()
  Object.defineProperties(actor, {
    'name': {value: name},
    'play': {value: play},
    'send': {value: _.partial(send, actor)}
  })
  store[name] = fire(getHook('actor', 'make'), actor)
  if (_.isFunction(play)) actor.on('message', _.partial(play, actor))
  return actor
}
exports.make = make
function take (type, data, done) {
  type = _.isString(type) ? type : 'raw'
  data = _.isEmpty(data) ? {} : data
  done = _.isFunction(done) ? done : _.noop
  return {type: type, data: data, done: done}
}
exports.take = take
function send (dst, msg, src) {
  dst = isActor(dst) ? dst : store['system']
  msg = msg || {}
  src = actor(src)
  return dst.emit('message', message(msg), src)
}
exports.send = send
exports.system = make('system', function (self, msg, src) {
  fire(getHook('system', msg.type), msg, src)
})
function find (name) {
  return isActor(name) ? name : _.get(store, name, store['system'])
}
exports.find = find
function actor (name) {
  return _.isEmpty(name) ? store['system'] : find(name)
}
exports.actor = actor
var model = {'name': _.isString, 'emit': _.isFunction, 'send': _.isFunction}
function isActor (obj) {
  return checks(model).every((check) => check(obj))
}
exports.isActor = isActor
function message (value) {
  var msg = {}
  msg.data = value.data || value
  msg.type = value.type || 'raw'
  msg.done = value.done || _.noop
  return take(msg.type, msg.data, msg.done)
}
exports.message = message
function isValid (label, check, empty) {
  return function (store) {
    return check(_.get(store, label, empty))
  }
}
exports.isValid = isValid
function checks (info) {
  return _.map(info, function (pred, key) {
    return _.isFunction(pred) ? isValid(key, pred, false) : (_.partialRight(_.has, key) || testFunction)
  })
}
exports.checks = checks
function getHook (name, hook) {
  return _.values(arguments).join(':')
}
exports.getHook = getHook
function testFunction () {
  return 'something'
}
