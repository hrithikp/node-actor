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
    'name': {value: name, writable: false},
    'play': {value: play, writable: false},
    'send': {value: _.partial(send, actor), writable: false}
  })
  store[name] = fire(getHook('actor', 'make'), actor)
  if (_.isFunction(play)) actor.on('message', _.partial(play, actor))
  return actor
}
exports.make = make
function send (dst, msg, src) {
  dst = isActor(dst) ? dst : store['system']
  src = actor(src)
  return dst.emit('message', fire(getHook('actor', 'send'), msg), src)
}
exports.send = send
exports.system = make('system', function (self, msg, src) {
  var type = msg.type || 'handle'
  var data = msg.data || msg
  fire(getHook('system', type), data, src)
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
function isValid (label, check, empty) {
  return function (store) {
    return check(_.get(store, label, empty))
  }
}
exports.isValid = isValid
function checks (info) {
  return _.map(info, function (pred, key) {
    return _.isFunction(pred) ? isValid(key, pred, false) : _.partialRight(_.has, key)
  })
}
exports.checks = checks
function getHook (name, hook) {
  return _.values(arguments).join(':')
}
exports.getHook = getHook
