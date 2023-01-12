/*
 *   The MIT License (MIT)
 *   Copyright (c) 2023. Nathanael Braun
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 *
 *   @author : Nathanael Braun
 *   @contact : n8tz.js@gmail.com
 */

import TweenAxis from "tween-axis";

let isBrowserSide = (new Function("try {return this===window;}catch(e){ return false;}"))(),
    cache         = {}, buildPath, getPoint;

if ( !isBrowserSide ) {
	buildPath = function ( P ) {
		return cache[P] || require("point-at-length")(P);
	};
	getPoint  = function ( P, p ) {
		return cache[P].at(p);
	};
}
else {
	buildPath = function ( P ) {
		let p = cache[P];
		if ( !p ) {
			cache[P] = p = document.createElementNS("http://www.w3.org/2000/svg", "path");
			
			p.setAttribute('d', P);
		}
		;
	};
	getPoint  = function ( P, p ) {
		return cache[P].getPointAtLength(p * cache[P].getTotalLength());
	};
}
/**
 * Register SVGPath to be accessible by Tasks with type:"SVGPath"
 * @param _scope
 * @param cfg
 * @param target
 * @returns {(function(*, *, *, *, *): void)|*}
 * @constructor
 */
TweenAxis.LineTypes.SVGPath           =
	function ( _scope, cfg, target ) {
		let
			axe1 = cfg.axes && cfg.axes[0] || 'x',
			axe2 = cfg.axes && cfg.axes[1] || 'y',
			lastPtsPos, lastPts;
		buildPath(cfg.path);
		return function ( lastPos, update, scope, cfg, target ) {
			let p1     = (lastPtsPos == lastPos) ? lastPts : getPoint(cfg.path, cfg.reverse ? 1 - lastPos : lastPos),
			    p2     = lastPts = getPoint(cfg.path, cfg.reverse ? 1 - (lastPos + update) : (lastPos + update));
			lastPtsPos = lastPos + update;
			scope[axe1] += (p2.x - p1.x) * 4;
			scope[axe2] += (p2.y - p1.y) * 4;
		};
	};
TweenAxis.LineTypes.SVGPath.isFactory = true;
