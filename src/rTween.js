/*
 * Copyright (c) 2019. Nathanael Braun.  All rights reserved.
 *
 * This File is part of Caipi. You can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *  This project is dual licensed under AGPL and Commercial Licence.
 *
 * @author : Nathanael Braun
 * @contact : n8tz.js@gmail.com
 */

/**
 * # Caipi rTween
 *
 * Scalable, multiscope, reversible, delta based, interpolation/tweening engine
 *
 * ## rTween what ?
 *
 * - Tweening engine allowing to apply forward and backward multiples tweens on same
 * properties and multiple objects
 * - Allow live composition of classic tweens, circle tweens, SVG Path tweens, other
 * rTweens, etc
 * - Equivalent to the GreenSocks TweenMax/TweenLite objects, minus specialized helpers.
 * - Purely Abstract, no Dom deps, rTween don't apply the CSS itself
 * - Work in node & webpack environment
 *
 * @author Nathanael BRAUN
 * @contact caipilabs@gmail.com
 * @licence AGPL-3.0
 */
var
	is           = require('is'),
	isArray      = is.array,
	isFunction   = is.fn,
	isNumber     = is.number,
	isString     = is.string,
	easingFN     = require('d3-ease'),
	merge        = require('merge'),
	slice        = Array.prototype.slice,
	push         = Array.prototype.push,
	abs          = Math.abs,
	forkedrTween = function ( cfg ) {
		this.__cPos          = 0;
		this.__cIndex        = 0;
		this.onScopeUpdated  = false;
		this.__activeProcess = [];
		this.__outgoing      = [];
		this.__incoming      = [];
	},
	// runner
	_live        = false,
	lastTm,
	_running     = [];

export default class RTween {
	
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
			var i  = 0, o, tm = Date.now(), delta = tm - lastTm;
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
		var me             = this;
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
		if ( isArray(cfg) ) {
			this.localLength = 1;
			this.mount(cfg, scope);
		}
		else {
			merge(this, cfg);
			if ( cfg.rTween )
				this.mount(cfg.rTween, scope);
		}
	}
	
	/**
	 * Run this tween line from 0 to his duration using linear
	 * @param target
	 * @param cb
	 * @param tm
	 */
	run( target, cb, tm ) {
		RTween.Runner.run(this, target, tm || this.duration, cb);
	}
	
	/**
	 * Tween this tween line to 'to' during 'tm' ms using easing fn
	 * @param to {int}
	 * @param tm {int} duration in ms
	 * @param easing {function} easing fn
	 * @param cb
	 */
	runTo( to, tm, easing = easingFN.easeLinear, cb ) {
		let from   = this.__cPos,
		    length = to - from;
		
		_running.push(
			{
				apply   : ( pos, max ) => {
					let x = easing(pos / max);
					this.goTo((from + (x) * length))
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
			setTimeout(RTween.Runner._tick, 16);
		}
	}
	
	/**
	 * Map process descriptors to get a runnable timeline
	 * @method mount
	 * @param map
	 */
	mount( map, scope ) {
		var i, ln, d = this.duration || 0, p = 0, me = this, max = 0, factory;
		for ( i = 0, ln = map.length; i < ln; i++ ) {
			if ( isString(map[i].easingFn) )
				map[i].easingFn = easingFN[map[i].easingFn] || false;
			if ( map[i].type == "Subline" ) {
				factory = map[i].apply.fork(null, map[i], map[i].easingFn);
			}
			else {
				factory = require('./lines/' + (map[i].type || 'Event'));
			}
			if ( !factory ) {
				console.log('rTween : Anim not found : ' + map[i].type);
				continue;
			}
			if ( !isNumber(map[i].from) )
			// no from so assume it's sync
				this.addProcess(
					d, d + map[i].duration, factory, map[i]
				), d += map[i].duration || 0;
			else// have from so assume it's async
				this.addProcess(map[i].from, map[i].from + map[i].duration, factory, map[i])
					, max = Math.max(max, map[i].from + map[i].duration);
			
		}
		
		this.duration = d = Math.max(d, max);
		return this;
	}
	
	/**
	 * Clone this rTween
	 * @method fork
	 * @param fn
	 * @param ctx
	 * @param easeFn
	 * @returns {forkedrTween}
	 */
	fork( cfg ) {
		this._masterLine       = this._masterLine || this;
		forkedrTween.prototype = this._masterLine;
		return new forkedrTween(cfg);
	}
	
	/**
	 * Map a process descriptor
	 * @method addProcess
	 * @param from
	 * @param to
	 * @param process
	 * @param cfg
	 * @returns {rTween}
	 */
	addProcess( from, to, process, cfg ) {
		var i    = 0,
		    _ln  = process.localLength,
		    ln   = (to - from) || 0,
		    key  = this.__cMaxKey++,
		    isTl = process instanceof RTween;
		
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
	 * using a rTween length of 1
	 * @method go
	 * @param to
	 * @param scope
	 * @param reset
	 */
	go( to, scope, reset ) {
		this.goTo(to * this.duration, scope, reset);
		this.__cRPos = to;
		return scope || this.scope;
	}
	
	getPosAt( to, scope ) {
		
		this.__activeProcess.length = 0;
		this.__outgoing.length      = 0;
		this.__incoming.length      = 0;
		this.__cPos                 = 0;
		this.__cIndex               = 0;
		return this.go(to, scope);
	}
	
	/**
	 * apply to scope or this.scope the delta of the process mapped from cPos to 'to'
	 * using the mapped rTween length
	 * @method goTo
	 * @param to
	 * @param scope
	 * @param reset
	 */
	goTo( to, scope, reset ) {
		scope = scope || this.scope;
		if ( this.window )
			to = this.window.start + (to / this.duration) * this.window.length;
		
		if ( !this._started ) {
			this._started = true;
			this.__cIndex = this.__cPos = 0;
		}
		
		var i        = this.__cIndex,
		    p,
		    ln,
		    outgoing = this.__outgoing,
		    incoming = this.__incoming,
		    pos, _from, _to,
		    d, key,
		    mLn      = this.__marks.length,
		    diff     = to - this.__cPos;
		if ( reset ) {
			this.__activeProcess.length = 0;
			this.__outgoing.length      = 0;
			this.__incoming.length      = 0;
			// reset forks
			//console.log('reset ', to);
			//for ( i = 0, ln = this.__processors.length ; i < ln ; i++ ) {
			//    if (this.__processors[i] instanceof rTween){
			//        this.__processors[i].goTo(0,0,true);
			//    }
			//}
		}
		
		// 1st ajust period, knowing which process are involved / leaving
		// while my indice target a marker/time period inferior to my pos
		
		while ( i < mLn && to > this.__marks[i] || (diff >= 0 && this.__marks[i] == to) ) {
			
			// if next marker is ending an active process
			if ( (p = this.__activeProcess.indexOf(-this.__marksKeys[i])) != -1 ) {
				this.__activeProcess.splice(p, 1);
				outgoing.push(this.__marksKeys[i]);
				//console.log("close " + this.__marksKeys[i]);
			}
			// if next marker is process ending a process who just start (direction has
			// change)
			else if ( (p = this.__activeProcess.indexOf(this.__marksKeys[i])) != -1 ) {
				this.__activeProcess.splice(p, 1);
				outgoing.push(this.__marksKeys[i]);
				//console.log("close after dir change" + this.__marksKeys[i]);
			}
			// if next marker is process ending a process who just start
			else if ( (p = incoming.indexOf(-this.__marksKeys[i])) != -1 ) {
				incoming.splice(p, 1);
				outgoing.push(this.__marksKeys[i]);
				//console.log("close starting " + this.__marksKeys[i]);
			}
			else {
				incoming.push(this.__marksKeys[i]);
				//console.log("right say in " + this.__marksKeys[i]);
			}
			i++;
		}
		
		// while my indice-1 target a marker/time period superior to my pos
		while (
			(i - 1) >= 0 && (to < this.__marks[i - 1] || ((diff < 0) && this.__marks[i - 1] == to))
			) {
			i--;
			
			if ( (p = this.__activeProcess.indexOf(-this.__marksKeys[i])) != -1 ) {
				this.__activeProcess.splice(p, 1);
				outgoing.push(this.__marksKeys[i]);
				//console.log("left say out " + this.__marksKeys[i]);
				
			}// if next marker is process ending a process who just start (direction has
			 // change)
			else if ( (p = this.__activeProcess.indexOf(this.__marksKeys[i])) != -1 ) {
				this.__activeProcess.splice(p, 1);
				outgoing.push(this.__marksKeys[i]);
				//console.log("close after dir change" + this.__marksKeys[i]);
			}
			else if ( (p = incoming.indexOf(-this.__marksKeys[i])) != -1 ) {
				incoming.splice(p, 1);
				outgoing.push(this.__marksKeys[i]);
				//console.log("left say out from incoming " + this.__marksKeys[i]);
			}
			else {
				//console.log("left say in " + this.__marksKeys[i]);
				incoming.push(this.__marksKeys[i]);
			}
		}
		
		// now dispatching deltas
		//console.log(incoming, outgoing, this.__activeProcess);
		
		this.__cIndex = i;
		// those leaving subline
		for ( i = 0, ln = outgoing.length; i < ln; i++ ) {
			p   = this._getIndex(outgoing[i]);
			key = abs(outgoing[i]);
			if ( outgoing[i] < 0 ) {
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
		for ( i = 0, ln = incoming.length; i < ln; i++ ) {
			p   = this._getIndex(incoming[i]);
			key = abs(incoming[i]);
			
			if ( incoming[i] < 0 ) {
				
				_from = this.__marksLength[key];
				_to   = Math.max(
					this.__marks[p] - this.__marksLength[key],
					Math.min(this.__cPos + diff, this.__marks[p])
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
					Math.min(this.__cPos + diff, this.__marks[p] + this.__marksLength[key])
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
		for ( i = 0, ln = this.__activeProcess.length; i < ln; i++ ) {
			p   = this._getIndex(this.__activeProcess[i]);
			key = abs(this.__activeProcess[i]);
			
			//d = (this.__cPos - diff)<this.__marks[p]?this.__cPos-this.__marks[p] : diff;
			pos = this.__activeProcess[i] < 0
			      ? this.__cPos - (this.__marks[p] - this.__marksLength[key])
			      : (this.__cPos - this.__marks[p]);
			pos = (this.localLength || 1) * (pos) / this.__marksLength[key];
			d   = (diff * (this.localLength || 1)) / this.__marksLength[key];
			//console.log("active " + p + " " + this.__marksLength[p]
			//            +'\nto:'+to
			//            +'\npos:'+this.__cPos
			//            +'\nmark:'+this.__marks[p]+
			//            '\ngdiff:'+diff68786k
			//            +'\ninnerpos:'+(pos * (this.localLength || 1)) /
			// abs(this.__marksLength[p]) +'\ndelta:'+(diff * (this.localLength || 1)) /
			// abs(this.__marksLength[p]) );
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
		this.onScopeUpdated && this.onScopeUpdated(to, diff, scope);
	}
}


