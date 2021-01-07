/*
 *   The MIT License (MIT)
 *   Copyright (c) 2020. Nathanael Braun
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

/**
 * #  tweenAxis
 *
 * Scalable, multiscope, reversible, delta based, interpolation/tweening engine
 * @author Nathanael BRAUN
 * @contact n8tz.js@gmail.com
 * @licence AGPL-3.0
 */
import is        from "is";
import lineTypes from "./lines/(*).js";

const easingFN        = require("d3-ease"),
      slice           = Array.prototype.slice,
      push            = Array.prototype.push,
      abs             = Math.abs,
      ForkedTweenAxis = function ( cfg ) {
	      this.__cPos          = 0;
	      this.__cIndex        = 0;
	      this.onScopeUpdated  = false;
	      this.__activeProcess = [];
	      this.__outgoing      = [];
	      this.__incoming      = [];
      };

let
	// runner
	_live    = false,
	lastTm,
	_running = [];

export default class TweenAxis {
	
	static Runner = {
		run  : function ( tl, ctx, duration, cb ) {
			let apply = ( pos, size ) => tl.go(pos / size, ctx);
			_running.push({ apply, duration, cpos: 0, cb });
			tl.go(0, ctx, true);//reset tl
			
			if ( !_live ) {
				_live  = true;
				lastTm = Date.now();
				// console.log("TL runner On");
				setTimeout(this._tick, 16);
			}
		},
		_tick: function _tick() {
			let i  = 0, o, tm = Date.now(), delta = tm - lastTm;
			lastTm = tm;
			for ( ; i < _running.length; i++ ) {
				_running[i].cpos = Math.min(delta + _running[i].cpos, _running[i].duration);//cpos
				_running[i].apply(
					_running[i].cpos, _running[i].duration
				);
				// console.log("TL runner ",_running[i][3]);
				if ( _running[i].cpos == _running[i].duration ) {
					
					_running[i].cb && setTimeout(_running[i].cb);
					_running.splice(i, 1), i--;
				}
				
			}
			if ( _running.length )
				setTimeout(_tick, 16);
			else {
				// console.log("TL runner Off");
				_live = false;
			}
		}
	};
	
	constructor( cfg, scope ) {
		this.scope         = scope;
		cfg                = cfg || {};
		this.__marks       = [];
		this.__marksLength = [];
		this.__marksKeys   = [];
		this.__processors  = [];
		this.__config      = [];
		
		this.__activeForks   = [];
		this.__activeProcess = [];
		
		this.__activeProcess = [];
		this.__outgoing      = [];
		this.__incoming      = [];
		this.__cPos          = 0;
		this.__cIndex        = 0;
		this.__cMaxKey       = 1;
		if ( is.array(cfg) ) {
			this.localLength = 1;
			this.mount(cfg, scope);
		}
		else {
			//Object.assign(this, cfg);
			if ( cfg.TweenAxis )
				this.mount(cfg.TweenAxis, scope);
		}
	}
	
	destroy() {
	}
	
	/**
	 * Run this tween line from 0 to his duration using linear
	 * @param target
	 * @param cb
	 * @param tm
	 */
	run( target, cb, tm ) {
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
	runTo( to, tm, easing = x => x, tick, cb ) {
		let from   = this.__cPos,
		    length = to - from;
		
		_running.push(
			{
				apply   : ( pos, max ) => {
					let x = (from + (easing(pos / max)) * length);
					this.goTo(x);
					tick && tick(x);
				},
				duration: tm,
				cpos    : 0,
				cb
			})
		;
		
		if ( !_live ) {
			_live  = true;
			lastTm = Date.now();
			// console.log("TL runner On");
			setTimeout(TweenAxis.Runner._tick, 16);
		}
	}
	
	/**
	 * Map process descriptors to get a runnable timeline
	 * @method mount
	 * @param map
	 */
	mount( map, scope ) {
		let i, ln, d = this.duration || 0, p = 0, max = 0, factory;
		for ( i = 0, ln = map.length; i < ln; i++ ) {
			if ( is.string(map[i].easeFn) )
				map[i] = { ...map[i], easeFn: easingFN[map[i].easeFn] || false };
			if ( map[i].type == "Subline" ) {
				factory = map[i].apply.fork(null, map[i], map[i].easeFn);
			}
			else {
				factory = lineTypes[map[i].type || 'Tween'];
			}
			if ( !factory ) {
				console.log('TweenAxis : Anim not found : ' + map[i].type);
				continue;
			}
			if ( !is.number(map[i].from) )
				// no from so assume it's sync
				this.addProcess(
					d, d + map[i].duration, factory, map[i]
				), d += map[i].duration || 0;
			else// have from so assume it's async
				this.addProcess(map[i].from, map[i].from + map[i].duration, factory, map[i])
					, max = Math.max(max, map[i].from + map[i].duration);
			
		}
		
		this.duration = Math.max(d, max);
		return this;
	}
	
	/**
	 * Clone this TweenAxis
	 * @method fork
	 * @param fn
	 * @param ctx
	 * @param easeFn
	 * @returns {ForkedTweenAxis}
	 */
	fork( cfg ) {
		this._masterLine          = this._masterLine || this;
		ForkedTweenAxis.prototype = this._masterLine;// todo: this should not work
		return new ForkedTweenAxis(cfg);
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
	addProcess( from, to, process, cfg ) {
		let i    = 0,
		    _ln  = process.localLength,
		    ln   = (to - from) || 0,
		    key  = this.__cMaxKey++,
		    isTl = process instanceof TweenAxis;
		
		if ( isTl )
			process = process.fork(null, cfg);
		
		this.__activeForks[key] = true;
		this.__processors[key]  = process.isFactory
		                          ? process(null, cfg, cfg.target)
		                          : process;
		this.__marksLength[key] = ln;
		this.__config[key]      = cfg;
		
		// put start marker in the ordered marker list
		while ( i <= this.__marks.length && this.__marks[i] < from ) i++;
		this.__marks.splice(i, 0, from);
		this.__marksKeys.splice(i, 0, key);
		
		// put end marker in the ordered marker list
		while ( i <= this.__marks.length && this.__marks[i] <= to ) i++;
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
	_getIndex( key ) {
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
	go( to, scope, reset, noEvents ) {
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
	goTo( to, scope, reset, noEvents ) {
		scope = scope || this.scope;
		if ( this.window )
			to = this.window.start + (to / this.duration) * this.window.length;
		
		if ( !this._started ) {
			this._started = true;
			this.__cIndex = this.__cPos = 0;
		}
		
		let currentMarkerIndex = this.__cIndex,
		    p,
		    ln,
		    outgoing           = this.__outgoing,
		    incoming           = this.__incoming,
		    pos, _from, _to,
		    d, key,
		    maxMarkerIndex     = this.__marks.length,
		    delta              = to - this.__cPos;
		if ( reset ) {
			this.__activeProcess.length = 0;
			this.__outgoing.length      = 0;
			this.__incoming.length      = 0;
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
		
		while ( currentMarkerIndex < maxMarkerIndex && to > this.__marks[currentMarkerIndex] || (delta >= 0 && this.__marks[currentMarkerIndex] == to) ) {
			
			// if next marker is ending an active process
			if ( (p = this.__activeProcess.indexOf(-this.__marksKeys[currentMarkerIndex])) != -1 ) {
				this.__activeProcess.splice(p, 1);
				outgoing.push(this.__marksKeys[currentMarkerIndex]);
				//console.log("close " + this.__marksKeys[i]);
			}
				// if next marker is process ending a process who just start (direction has
			// change)
			else if ( (p = this.__activeProcess.indexOf(this.__marksKeys[currentMarkerIndex])) != -1 ) {
				this.__activeProcess.splice(p, 1);
				outgoing.push(this.__marksKeys[currentMarkerIndex]);
				//console.log("close after dir change" + this.__marksKeys[i]);
			}
			// if next marker is process ending a process who just start
			else if ( (p = incoming.indexOf(-this.__marksKeys[currentMarkerIndex])) != -1 ) {
				incoming.splice(p, 1);
				outgoing.push(this.__marksKeys[currentMarkerIndex]);
				//console.log("close starting " + this.__marksKeys[i]);
			}
			else {
				incoming.push(this.__marksKeys[currentMarkerIndex]);
				//console.log("right say in " + this.__marksKeys[i]);
			}
			currentMarkerIndex++;
		}
		
		// while my indice-1 target a marker/time period superior to my pos
		while (
			(currentMarkerIndex - 1) >= 0 && (to < this.__marks[currentMarkerIndex - 1] || ((delta < 0) && this.__marks[currentMarkerIndex - 1] == to))
			) {
			currentMarkerIndex--;
			
			if ( (p = this.__activeProcess.indexOf(-this.__marksKeys[currentMarkerIndex])) != -1 ) {
				this.__activeProcess.splice(p, 1);
				outgoing.push(this.__marksKeys[currentMarkerIndex]);
				//console.log("left say out " + this.__marksKeys[i]);
				
			}// if next marker is process ending a process who just start (direction has
			 // change)
			else if ( (p = this.__activeProcess.indexOf(this.__marksKeys[currentMarkerIndex])) != -1 ) {
				this.__activeProcess.splice(p, 1);
				outgoing.push(this.__marksKeys[currentMarkerIndex]);
				//console.log("close after dir change" + this.__marksKeys[i]);
			}
			else if ( (p = incoming.indexOf(-this.__marksKeys[currentMarkerIndex])) != -1 ) {
				incoming.splice(p, 1);
				outgoing.push(this.__marksKeys[currentMarkerIndex]);
				//console.log("left say out from incoming " + this.__marksKeys[i]);
			}
			else {
				//console.log("left say in " + this.__marksKeys[i]);
				incoming.push(this.__marksKeys[currentMarkerIndex]);
			}
		}
		
		// now dispatching deltas
		//console.log(incoming, outgoing, this.__activeProcess);
		
		this.__cIndex = currentMarkerIndex;
		// those leaving subline
		for ( currentMarkerIndex = 0, ln = outgoing.length; currentMarkerIndex < ln; currentMarkerIndex++ ) {
			p   = this._getIndex(outgoing[currentMarkerIndex]);
			key = abs(outgoing[currentMarkerIndex]);
			if ( outgoing[currentMarkerIndex] < 0 ) {
				_from = Math.min(
					this.__marks[p],
					Math.max(this.__cPos, this.__marks[p] - this.__marksLength[key])
				) - (this.__marks[p] - this.__marksLength[key]);
				_to   = this.__marksLength[key];
				pos   = _from;
				d     = _to - _from;
				pos   = (this.localLength || 1) * (pos) / this.__marksLength[key];
				d     = (this.localLength || 1) * (d) / this.__marksLength[key];
			}
			else {
				_from = Math.max(
					this.__marks[p],
					Math.min(this.__cPos, this.__marks[p] + this.__marksLength[key])
				) - this.__marks[p];
				_to   = 0;
				pos   = _from;
				d     = _to - _from;
				
				pos = (this.localLength || 1) * (pos) / this.__marksLength[key];
				d   = (this.localLength || 1) * (d) / this.__marksLength[key];
			}
			//
			//console.log("out " + this.__marksKeys[p] + " " + this.__marksLength[p]+
			//            '\npos:'+this.__cPos+
			//            '\nmark:'+this.__marks[p]+
			//            '\ninnerpos:'+pos+
			//            '\ndelta:'+d
			//);
			
			if ( noEvents && this.__config[key].type === "Event" )
				continue;
			if ( this.__processors[key].go ) {
				this.__processors[key].go(
					pos + d,
					scope,
					reset
				);
			}
			else
				this.__processors[key](
					pos,
					d,
					scope,
					this.__config[key],
					this.__config[key].target || (this.__config[key].$target && this.__context &&
						this.__context[this.__config[key].$target])
				);
		}
		
		// those entering subline
		for ( currentMarkerIndex = 0, ln = incoming.length; currentMarkerIndex < ln; currentMarkerIndex++ ) {
			p   = this._getIndex(incoming[currentMarkerIndex]);
			key = abs(incoming[currentMarkerIndex]);
			
			if ( incoming[currentMarkerIndex] < 0 ) {
				
				_from = this.__marksLength[key];
				_to   = Math.max(
					this.__marks[p] - this.__marksLength[key],
					Math.min(this.__cPos + delta, this.__marks[p])
				) - (this.__marks[p] - this.__marksLength[key]);
				
				pos = _from;
				d   = _to - _from;
				pos = (this.localLength || 1) * (pos) / this.__marksLength[key];
				d   = (this.localLength || 1) * (d) / this.__marksLength[key];
			}
			else {
				_from = 0;
				_to   = Math.max(
					this.__marks[p],
					Math.min(this.__cPos + delta, this.__marks[p] + this.__marksLength[key])
				) - this.__marks[p];
				pos   = _from;
				d     = _to - _from;
				
				pos = (this.localLength || 1) * (pos) / this.__marksLength[key];
				d   = (this.localLength || 1) * (d) / this.__marksLength[key];
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
			
			if ( noEvents && this.__config[key].type === "Event" )
				continue;
			if ( this.__processors[key].go ) {
				//console.log("in " + pos, d);
				this.__processors[key].go(pos, 0, true);//reset local fork
				this.__processors[key].go(
					pos + d,
					scope
				);
			}
			else if ( !reset )
				this.__processors[key](
					pos,
					d,
					scope,
					this.__config[key],
					this.__config[key].target || (this.__config[key].$target && this.__context &&
						this.__context[this.__config[key].$target])
				);
		}
		// and those who where already there
		//if ( !reset )
		for ( currentMarkerIndex = 0, ln = this.__activeProcess.length; currentMarkerIndex < ln; currentMarkerIndex++ ) {
			p   = this._getIndex(this.__activeProcess[currentMarkerIndex]);
			key = abs(this.__activeProcess[currentMarkerIndex]);
			
			//d = (this.__cPos - diff)<this.__marks[p]?this.__cPos-this.__marks[p] : diff;
			pos = this.__activeProcess[currentMarkerIndex] < 0
			      ? this.__cPos - (this.__marks[p] - this.__marksLength[key])
			      : (this.__cPos - this.__marks[p]);
			pos = (this.localLength || 1) * (pos) / this.__marksLength[key];
			d   = (delta * (this.localLength || 1)) / this.__marksLength[key];
			//console.log("active " + p + " " + this.__marksLength[p]
			//            +'\nto:'+to
			//            +'\npos:'+this.__cPos
			//            +'\nmark:'+this.__marks[p]+
			//            '\ngdiff:'+diff68786k
			//            +'\ninnerpos:'+(pos * (this.localLength || 1)) /
			// abs(this.__marksLength[p]) +'\ndelta:'+(diff * (this.localLength || 1)) /
			// abs(this.__marksLength[p]) );
			if ( noEvents && this.__config[key].type === "Event" )
				continue;
			if ( this.__processors[key].go ) {
				
				this.__processors[key].go(
					pos + d,
					scope
				);
			}
			else if ( !reset )
				this.__processors[key](
					pos,
					d,
					scope,
					this.__config[key],
					this.__config[key].target ||
						(this.__config[key].$target && this.__context &&
							this.__context[this.__config[key].$target])
				);
		}
		
		push.apply(this.__activeProcess, incoming);
		
		
		outgoing.length = 0;
		incoming.length = 0;
		
		this.__cPos = to;
		this.onScopeUpdated && this.onScopeUpdated(to, delta, scope);
	}
}


