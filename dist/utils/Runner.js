"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
/*
 * Copyright (c) 2022-2023 Braun Nathanael
 *
 * This project is dual licensed under one of the following licenses:
 * - Creative Commons Attribution-NoDerivatives 4.0 International License.
 * - GNU AFFERO GENERAL PUBLIC LICENSE Version 3
 *
 * You should have received a copy of theses licenses along with this work.
 * If not, see <http://creativecommons.org/licenses/by-nd/4.0/> or <http://www.gnu.org/licenses/agpl-3.0.txt>.
 */

var
  // runner
  _live = false,
  lastTm,
  _running = [];
var Runner = {
  push: function push(task) {
    _running.push(task);
    if (!_live) {
      _live = true;
      lastTm = Date.now();
      // console.log("TL runner On");
      setTimeout(Runner._tick, 16);
    }
  },
  run: function run(tl, ctx, duration, cb) {
    var apply = function apply(pos, size) {
      return tl.go(pos / size, ctx);
    };
    _running.push({
      apply: apply,
      duration: duration,
      cpos: 0,
      cb: cb
    });
    tl.go(0, ctx, true); //reset tl

    if (!_live) {
      _live = true;
      lastTm = Date.now();
      // console.log("TL runner On");
      setTimeout(this._tick, 16);
    }
  },
  _tick: function _tick() {
    var i = 0,
      o,
      tm = Date.now(),
      delta = tm - lastTm;
    lastTm = tm;
    for (; i < _running.length; i++) {
      _running[i].cpos = Math.min(delta + _running[i].cpos, _running[i].duration); //cpos
      _running[i].apply(_running[i].cpos, _running[i].duration);
      // console.log("TL runner ",_running[i][3]);
      if (_running[i].cpos == _running[i].duration) {
        _running[i].cb && setTimeout(_running[i].cb);
        _running.splice(i, 1), i--;
      }
    }
    if (_running.length) setTimeout(_tick, 16);else {
      // console.log("TL runner Off");
      _live = false;
    }
  }
};
var _default = Runner;
exports["default"] = _default;