"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _Tween = _interopRequireDefault(require("./lines/Tween.js"));
var _Runner = _interopRequireDefault(require("./utils/Runner.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var slice = Array.prototype.slice,
  push = Array.prototype.push,
  abs = Math.abs,
  is = {
    array: function array(obj) {
      return Array.isArray(obj);
    },
    number: function number(obj) {
      return typeof obj === "number";
    },
    string: function string(obj) {
      return typeof obj === "string";
    }
  };
var TweenAxis = /*#__PURE__*/function () {
  function TweenAxis(cfg, scope) {
    _classCallCheck(this, TweenAxis);
    this.scope = scope;
    cfg = cfg || {};
    this.__marks = [];
    this.__marksLength = [];
    this.__marksKeys = [];
    this.__processors = [];
    this.__config = [];
    this.__activeProcess = [];
    this.__activeProcess = [];
    this.__outgoing = [];
    this.__incoming = [];
    this.__cPos = 0;
    this.__cIndex = 0;
    this.__cMaxKey = 1;
    if (is.array(cfg)) {
      this.localLength = 1;
      this.mount(cfg, scope);
    } else {
      if (cfg.TweenAxis) this.mount(cfg.TweenAxis, scope);
    }
  }
  _createClass(TweenAxis, [{
    key: "destroy",
    value: function destroy() {}

    /**
     * Run this tween line from 0 to his duration using linear
     * @param target
     * @param cb
     * @param tm
     */
  }, {
    key: "run",
    value: function run(target, cb, tm) {
      TweenAxis.Runner.run(this, target, tm || this.duration, cb);
    }

    /**
     * Tween this tween line to 'to' during 'tm' ms using easing fn
     * @param to {int}
     * @param tm {int} duration in ms
     * @param easing {function} easing fn
     * @param tick {function} fn called at each tick
     * @param cb {function} fn called on complete
     */
  }, {
    key: "runTo",
    value: function runTo(to, tm) {
      var _this = this;
      var easing = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function (x) {
        return x;
      };
      var tick = arguments.length > 3 ? arguments[3] : undefined;
      var cb = arguments.length > 4 ? arguments[4] : undefined;
      var from = this.__cPos,
        length = to - from;
      TweenAxis.Runner.push({
        apply: function apply(pos, max) {
          var x = from + easing(pos / max) * length;
          _this.goTo(x);
          tick && tick(x);
        },
        duration: tm,
        cpos: 0,
        cb: cb
      });
    }

    /**
     * Map process descriptors to get a runnable timeline
     * @method mount
     * @param map
     */
  }, {
    key: "mount",
    value: function mount(map, scope) {
      var i,
        ln,
        d = this.duration || 0,
        p = 0,
        max = 0,
        factory;
      for (i = 0, ln = map.length; i < ln; i++) {
        if (is.string(map[i].easeFn)) map[i] = _objectSpread(_objectSpread({}, map[i]), {}, {
          easeFn: TweenAxis.EasingFunctions[map[i].easeFn] || false
        });
        factory = TweenAxis.LineTypes[map[i].type || 'Tween'];
        if (!factory) {
          console.log('TweenAxis : Line type not found : ' + map[i].type, "\n Available : " + Object.keys(TweenAxis.LineTypes));
          continue;
        }
        if (!is.number(map[i].from)) {
          // no from so assume it's sync
          this.addProcess(d, d + map[i].duration, factory, map[i]);
          d += map[i].duration || 0;
        } else
          // have from so assume it's async
          this.addProcess(map[i].from, map[i].from + map[i].duration, factory, map[i]), max = Math.max(max, map[i].from + map[i].duration);
      }
      this.duration = Math.max(d, max);
      return this;
    }

    /**
     * Map a process descriptor
     * @method addProcess
     * @param from
     * @param to
     * @param process
     * @param cfg
     * @returns {TweenAxis}
     */
  }, {
    key: "addProcess",
    value: function addProcess(_from, _to, process, cfg) {
      var i = 0,
        _ln = process.localLength,
        from = TweenAxis.center + _from,
        to = TweenAxis.center + _to,
        ln = to - from || 0,
        key = this.__cMaxKey++;
      this.__processors[key] = process.isFactory ? process(null, cfg, cfg.target) : process;
      this.__marksLength[key] = ln;
      this.__config[key] = cfg;

      // put start marker in the ordered marker list
      while (i <= this.__marks.length && this.__marks[i] < from) i++;
      this.__marks.splice(i, 0, from);
      this.__marksKeys.splice(i, 0, key);

      // put end marker in the ordered marker list
      while (i <= this.__marks.length && this.__marks[i] <= to) i++;
      this.__marks.splice(i, 0, to);
      this.__marksKeys.splice(i, 0, -key);
      return this;
    }

    /**
     *
     * @param key
     * @returns {*}
     * @private
     */
  }, {
    key: "_getIndex",
    value: function _getIndex(key) {
      return (key = this.__marksKeys.indexOf(key)) !== -1 ? key : false;
    }

    /**
     * apply to scope or this.scope the delta of the process mapped from cPos to 'to'
     * using a TweenAxis length of 1
     * @method go
     * @param to
     * @param scope
     * @param reset
     */
  }, {
    key: "go",
    value: function go(to, scope, reset, noEvents) {
      this.goTo(to * this.duration, scope, reset, noEvents);
      this.__cRPos = to;
      return scope || this.scope;
    }

    /**
     * apply to scope or this.scope the delta of the process mapped from cPos to 'to'
     * using the mapped TweenAxis length
     * @method goTo
     * @param to
     * @param scope
     * @param reset
     */
  }, {
    key: "goTo",
    value: function goTo(initial_to, scope, reset, noEvents) {
      scope = scope || this.scope;
      var to = TweenAxis.center + initial_to;
      if (!this._started) {
        this._started = true;
        this.__cIndex = this.__cPos = 0;
      }
      var currentMarkerIndex = this.__cIndex,
        p,
        ln,
        outgoing = this.__outgoing,
        incoming = this.__incoming,
        pos,
        _from,
        _to,
        d,
        key,
        maxMarkerIndex = this.__marks.length,
        cPos = TweenAxis.center + this.__cPos,
        delta = to - cPos;
      if (reset) {
        this.__activeProcess.length = 0;
        this.__outgoing.length = 0;
        this.__incoming.length = 0;
        // reset forks
        //console.log('reset ', to);
        //for ( i = 0, ln = this.__processors.length ; i < ln ; i++ ) {
        //    if (this.__processors[i] instanceof TweenAxis){
        //        this.__processors[i].goTo(0,0,true);
        //    }
        //}
      }

      // 1st ajust period, knowing which process are involved / leaving
      // while my indice target a marker/time period inferior to my pos

      while (currentMarkerIndex < maxMarkerIndex && to > this.__marks[currentMarkerIndex] || delta >= 0 && this.__marks[currentMarkerIndex] === to) {
        // if next marker is ending an active process
        if ((p = this.__activeProcess.indexOf(-this.__marksKeys[currentMarkerIndex])) !== -1) {
          this.__activeProcess.splice(p, 1);
          outgoing.push(this.__marksKeys[currentMarkerIndex]);
          //console.log("close " + this.__marksKeys[i]);
        }
        // if next marker is process ending a process who just start (direction has
        // change)
        else if ((p = this.__activeProcess.indexOf(this.__marksKeys[currentMarkerIndex])) !== -1) {
          this.__activeProcess.splice(p, 1);
          outgoing.push(this.__marksKeys[currentMarkerIndex]);
          //console.log("close after dir change" + this.__marksKeys[i]);
        }
        // if next marker is process ending a process who just start
        else if ((p = incoming.indexOf(-this.__marksKeys[currentMarkerIndex])) !== -1) {
          incoming.splice(p, 1);
          outgoing.push(this.__marksKeys[currentMarkerIndex]);
          //console.log("close starting " + this.__marksKeys[i]);
        } else {
          incoming.push(this.__marksKeys[currentMarkerIndex]);
          //console.log("right say in " + this.__marksKeys[i]);
        }

        currentMarkerIndex++;
      }

      // while my indice-1 target a marker/time period superior to my pos
      while (currentMarkerIndex - 1 >= 0 && (to < this.__marks[currentMarkerIndex - 1] || delta < 0 && this.__marks[currentMarkerIndex - 1] === to)) {
        currentMarkerIndex--;
        if ((p = this.__activeProcess.indexOf(-this.__marksKeys[currentMarkerIndex])) !== -1) {
          this.__activeProcess.splice(p, 1);
          outgoing.push(this.__marksKeys[currentMarkerIndex]);
          //console.log("left say out " + this.__marksKeys[i]);
        } // if next marker is process ending a process who just start (direction has
        // change)
        else if ((p = this.__activeProcess.indexOf(this.__marksKeys[currentMarkerIndex])) !== -1) {
          this.__activeProcess.splice(p, 1);
          outgoing.push(this.__marksKeys[currentMarkerIndex]);
          //console.log("close after dir change" + this.__marksKeys[i]);
        } else if ((p = incoming.indexOf(-this.__marksKeys[currentMarkerIndex])) !== -1) {
          incoming.splice(p, 1);
          outgoing.push(this.__marksKeys[currentMarkerIndex]);
          //console.log("left say out from incoming " + this.__marksKeys[i]);
        } else {
          //console.log("left say in " + this.__marksKeys[i]);
          incoming.push(this.__marksKeys[currentMarkerIndex]);
        }
      }

      // now dispatching deltas
      //console.log(incoming, outgoing, this.__activeProcess);

      this.__cIndex = currentMarkerIndex;
      // those leaving subline
      for (currentMarkerIndex = 0, ln = outgoing.length; currentMarkerIndex < ln; currentMarkerIndex++) {
        p = this._getIndex(outgoing[currentMarkerIndex]);
        key = abs(outgoing[currentMarkerIndex]);
        if (outgoing[currentMarkerIndex] < 0) {
          _from = Math.min(this.__marks[p], Math.max(cPos, this.__marks[p] - this.__marksLength[key])) - (this.__marks[p] - this.__marksLength[key]);
          _to = this.__marksLength[key];
          pos = _from;
          d = _to - _from;
          pos = (this.localLength || 1) * pos / this.__marksLength[key];
          d = (this.localLength || 1) * d / this.__marksLength[key];
        } else {
          _from = Math.max(this.__marks[p], Math.min(cPos, this.__marks[p] + this.__marksLength[key])) - this.__marks[p];
          _to = 0;
          pos = _from;
          d = _to - _from;
          pos = (this.localLength || 1) * pos / this.__marksLength[key];
          d = (this.localLength || 1) * d / this.__marksLength[key];
        }
        //
        //console.log("out " + this.__marksKeys[p] + " " + this.__marksLength[p]+
        //            '\npos:'+this.__cPos+
        //            '\nmark:'+this.__marks[p]+
        //            '\ninnerpos:'+pos+
        //            '\ndelta:'+d
        //);

        if (this.__processors[key].go) {
          this.__processors[key].go(pos + d, scope, reset, noEvents);
        } else this.__processors[key](pos, d, scope, this.__config[key], this.__config[key].target || this.__config[key].$target && this.__context && this.__context[this.__config[key].$target], noEvents);
      }

      // those entering subline
      for (currentMarkerIndex = 0, ln = incoming.length; currentMarkerIndex < ln; currentMarkerIndex++) {
        p = this._getIndex(incoming[currentMarkerIndex]);
        key = abs(incoming[currentMarkerIndex]);
        if (incoming[currentMarkerIndex] < 0) {
          _from = this.__marksLength[key];
          _to = Math.max(this.__marks[p] - this.__marksLength[key], Math.min(cPos + delta, this.__marks[p])) - (this.__marks[p] - this.__marksLength[key]);
          pos = _from;
          d = _to - _from;
          pos = (this.localLength || 1) * pos / this.__marksLength[key];
          d = (this.localLength || 1) * d / this.__marksLength[key];
        } else {
          _from = 0;
          _to = Math.max(this.__marks[p], Math.min(cPos + delta, this.__marks[p] + this.__marksLength[key])) - this.__marks[p];
          pos = _from;
          d = _to - _from;
          pos = (this.localLength || 1) * pos / this.__marksLength[key];
          d = (this.localLength || 1) * d / this.__marksLength[key];
        }

        //console.log("in " + this.__marksKeys[p] + " " + this.__marksLength[p]+
        //            '\ndiff:'+diff+
        //            '\npos:'+this.__cPos+
        //            '\nmark:'+this.__marks[p]+
        //            '\n_from:'+_from+
        //            '\n_to:'+_to+
        //            '\ninnerpos:'+pos+
        //            '\ndelta:'+d
        //);

        if (this.__processors[key].go) {
          //console.log("in " + pos, d);
          this.__processors[key].go(pos, 0, true, noEvents); //reset local fork
          this.__processors[key].go(pos + d, scope, false, noEvents);
        } else if (!reset) this.__processors[key](pos, d, scope, this.__config[key], this.__config[key].target || this.__config[key].$target && this.__context && this.__context[this.__config[key].$target], noEvents);
      }
      // and those who where already there
      //if ( !reset )
      for (currentMarkerIndex = 0, ln = this.__activeProcess.length; currentMarkerIndex < ln; currentMarkerIndex++) {
        p = this._getIndex(this.__activeProcess[currentMarkerIndex]);
        key = abs(this.__activeProcess[currentMarkerIndex]);

        //d = (this.__cPos - diff)<this.__marks[p]?this.__cPos-this.__marks[p] : diff;
        pos = this.__activeProcess[currentMarkerIndex] < 0 ? cPos - (this.__marks[p] - this.__marksLength[key]) : cPos - this.__marks[p];
        pos = (this.localLength || 1) * pos / this.__marksLength[key];
        d = delta * (this.localLength || 1) / this.__marksLength[key];
        //console.log("active " + p + " " + this.__marksLength[p]
        //            +'\nto:'+to
        //            +'\npos:'+this.__cPos
        //            +'\nmark:'+this.__marks[p]+
        //            '\ngdiff:'+diff68786k
        //            +'\ninnerpos:'+(pos * (this.localLength || 1)) /
        // abs(this.__marksLength[p]) +'\ndelta:'+(diff * (this.localLength || 1)) /
        // abs(this.__marksLength[p]) );
        if (this.__processors[key].go) {
          this.__processors[key].go(pos + d, scope, false, noEvents);
        } else if (!reset) this.__processors[key](pos, d, scope, this.__config[key], this.__config[key].target || this.__config[key].$target && this.__context && this.__context[this.__config[key].$target], noEvents);
      }
      push.apply(this.__activeProcess, incoming);
      outgoing.length = 0;
      incoming.length = 0;
      this.__cPos = initial_to;
      this.onScopeUpdated && this.onScopeUpdated(this.__cPos, delta, scope);
      return scope;
    }
  }]);
  return TweenAxis;
}();
exports["default"] = TweenAxis;
_defineProperty(TweenAxis, "Runner", _Runner["default"]);
_defineProperty(TweenAxis, "center", 10000000000);
_defineProperty(TweenAxis, "LineTypes", {
  Tween: _Tween["default"]
});
_defineProperty(TweenAxis, "EasingFunctions", {});