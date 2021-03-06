"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

/*<replacement>*/
var bufferShim = require('safe-buffer').Buffer;
/*</replacement>*/


var common = require('../common');

var assert = require('assert/');

var stream = require('../../');

var MyWritable =
/*#__PURE__*/
function (_stream$Writable) {
  _inherits(MyWritable, _stream$Writable);

  function MyWritable() {
    _classCallCheck(this, MyWritable);

    return _possibleConstructorReturn(this, _getPrototypeOf(MyWritable).apply(this, arguments));
  }

  _createClass(MyWritable, [{
    key: "_write",
    value: function _write(chunk, encoding, callback) {
      assert.notStrictEqual(chunk, null);
      callback();
    }
  }]);

  return MyWritable;
}(stream.Writable);

common.expectsError(function () {
  var m = new MyWritable({
    objectMode: true
  });
  m.write(null, function (err) {
    return assert.ok(err);
  });
}, {
  code: 'ERR_STREAM_NULL_VALUES',
  type: TypeError,
  message: 'May not write null values to stream'
});
{
  // Should not throw.
  var m = new MyWritable({
    objectMode: true
  }).on('error', assert);
  m.write(null, assert);
}
common.expectsError(function () {
  var m = new MyWritable();
  m.write(false, function (err) {
    return assert.ok(err);
  });
}, {
  code: 'ERR_INVALID_ARG_TYPE',
  type: TypeError
});
{
  // Should not throw.
  var _m = new MyWritable().on('error', assert);

  _m.write(false, assert);
}
{
  // Should not throw.
  var _m2 = new MyWritable({
    objectMode: true
  });

  _m2.write(false, assert.ifError);
}
{
  // Should not throw.
  var _m3 = new MyWritable({
    objectMode: true
  }).on('error', function (e) {
    assert.ifError(e || new Error('should not get here'));
  });

  _m3.write(false, assert.ifError);
}
;

(function () {
  var t = require('tap');

  t.pass('sync run');
})();

var _list = process.listeners('uncaughtException');

process.removeAllListeners('uncaughtException');

_list.pop();

_list.forEach(function (e) {
  return process.on('uncaughtException', e);
});