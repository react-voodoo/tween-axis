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

/**
 * #  tweenAxis
 *
 * Scalable, multiscope, reversible, delta based, interpolation/tweening engine
 * @author Nathanael BRAUN
 * @contact n8tz.js@gmail.com
 */
import defaultLineType from "./lines/Tween.js";
import Runner          from "./utils/Runner.js";

const slice = Array.prototype.slice,
      push  = Array.prototype.push,
      abs   = Math.abs,
      is    = {
	      array : ( obj ) => Array.isArray(obj),
	      number: ( obj ) => typeof obj === "number",
	      string: ( obj ) => typeof obj === "string"
      };


export default class TweenAxis {
	
	static Runner          = Runner;
	static center          = 10000000000;
	static LineTypes       = {
		Tween: defaultLineType
	};
	static EasingFunctions = {};
	
	constructor( cfg, scope ) {
		this.scope         = scope;
		cfg                = cfg || {};
		this.__marks       = [];
		this.__marksLength = [];
		this.__marksKeys   = [];
		this.__processors  = [];
		this.__config      = [];
		
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
		TweenAxis.Runner.push(
			{
				apply   : ( pos, max ) => {
					let x = (from + (easing(pos / max)) * length);
					this.goTo(x);
					tick && tick(x);
				},
				duration: tm,
				cpos    : 0,
				cb
			}
		)
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
				map[i] = { ...map[i], easeFn: TweenAxis.EasingFunctions[map[i].easeFn] || false };
			
			factory = TweenAxis.LineTypes[map[i].type || 'Tween'];
			
			if ( !factory ) {
				console.log('TweenAxis : Line type not found : ' + map[i].type, "\n Available : " + Object.keys(TweenAxis.LineTypes));
				continue;
			}
			if ( !is.number(map[i].from) ) {// no from so assume it's sync
				this.addProcess(
					d, d + map[i].duration, factory, map[i]
				);
				d += map[i].duration || 0;
			}
			else// have from so assume it's async
				this.addProcess(map[i].from, map[i].from + map[i].duration, factory, map[i])
					, max = Math.max(max, map[i].from + map[i].duration);
			
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
	addProcess( _from, _to, process, cfg ) {
		let i    = 0,
		    _ln  = process.localLength,
		    from = TweenAxis.center + _from,
		    to   = TweenAxis.center + _to,
		    ln   = (to - from) || 0,
		    key  = this.__cMaxKey++;
		
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
	goTo( initial_to, scope, reset, noEvents ) {
		scope = scope || this.scope;
		
		let to = TweenAxis.center + initial_to;
		
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
		    cPos               = TweenAxis.center + this.__cPos,
		    delta              = to - cPos;
		
		if ( reset ) {
			this.__activeProcess.length = 0;
			this.__outgoing.length      = 0;
			this.__incoming.length      = 0;
		}
		
		// 1st ajust period, knowing which process are involved / leaving
		// while my indice target a marker/time period inferior to my pos
		
		while ( currentMarkerIndex < maxMarkerIndex && to > this.__marks[currentMarkerIndex] || (delta >= 0 && this.__marks[currentMarkerIndex] === to) ) {
			
			// if next marker is ending an active process
			if ( (p = this.__activeProcess.indexOf(-this.__marksKeys[currentMarkerIndex])) !== -1 ) {
				this.__activeProcess.splice(p, 1);
				outgoing.push(this.__marksKeys[currentMarkerIndex]);
				//console.log("close " + this.__marksKeys[i]);
			}
				// if next marker is process ending a process who just start (direction has
			// change)
			else if ( (p = this.__activeProcess.indexOf(this.__marksKeys[currentMarkerIndex])) !== -1 ) {
				this.__activeProcess.splice(p, 1);
				outgoing.push(this.__marksKeys[currentMarkerIndex]);
				//console.log("close after dir change" + this.__marksKeys[i]);
			}
			// if next marker is process ending a process who just start
			else if ( (p = incoming.indexOf(-this.__marksKeys[currentMarkerIndex])) !== -1 ) {
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
			(currentMarkerIndex - 1) >= 0 && (to < this.__marks[currentMarkerIndex - 1] || ((delta < 0) && this.__marks[currentMarkerIndex - 1] === to))
			) {
			currentMarkerIndex--;
			
			if ( (p = this.__activeProcess.indexOf(-this.__marksKeys[currentMarkerIndex])) !== -1 ) {
				this.__activeProcess.splice(p, 1);
				outgoing.push(this.__marksKeys[currentMarkerIndex]);
				//console.log("left say out " + this.__marksKeys[i]);
				
			}// if next marker is process ending a process who just start (direction has
			 // change)
			else if ( (p = this.__activeProcess.indexOf(this.__marksKeys[currentMarkerIndex])) !== -1 ) {
				this.__activeProcess.splice(p, 1);
				outgoing.push(this.__marksKeys[currentMarkerIndex]);
				//console.log("close after dir change" + this.__marksKeys[i]);
			}
			else if ( (p = incoming.indexOf(-this.__marksKeys[currentMarkerIndex])) !== -1 ) {
				incoming.splice(p, 1);
				outgoing.push(this.__marksKeys[currentMarkerIndex]);
				//console.log("left say out from incoming " + this.__marksKeys[i]);
			}
			else {
				//console.log("left say in " + this.__marksKeys[currentMarkerIndex]);
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
					Math.max(cPos, this.__marks[p] - this.__marksLength[key])
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
					Math.min(cPos, this.__marks[p] + this.__marksLength[key])
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
			
			this.__processors[key](
				pos,
				d,
				scope,
				this.__config[key],
				this.__config[key].target || (this.__config[key].$target && this.__context &&
						this.__context[this.__config[key].$target]),
				noEvents
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
					Math.min(cPos + delta, this.__marks[p])
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
					Math.min(cPos + delta, this.__marks[p] + this.__marksLength[key])
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
			
			if ( !reset )
				this.__processors[key](
					pos,
					d,
					scope,
					this.__config[key],
					this.__config[key].target ||
						(
							this.__config[key].$target && this.__context &&
							this.__context[this.__config[key].$target]
						),
					noEvents
				);
		}
		// and those who where already there
		//if ( !reset )
		for ( currentMarkerIndex = 0, ln = this.__activeProcess.length; currentMarkerIndex < ln; currentMarkerIndex++ ) {
			p   = this._getIndex(this.__activeProcess[currentMarkerIndex]);
			key = abs(this.__activeProcess[currentMarkerIndex]);
			
			//d = (this.__cPos - diff)<this.__marks[p]?this.__cPos-this.__marks[p] : diff;
			pos = this.__activeProcess[currentMarkerIndex] < 0
			      ? cPos - (this.__marks[p] - this.__marksLength[key])
			      : (cPos - this.__marks[p]);
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
			if ( !reset )
				this.__processors[key](
					pos,
					d,
					scope,
					this.__config[key],
					this.__config[key].target ||
						(this.__config[key].$target && this.__context &&
							this.__context[this.__config[key].$target]),
					noEvents
				);
		}
		
		push.apply(this.__activeProcess, incoming);
		
		
		outgoing.length = 0;
		incoming.length = 0;
		
		this.__cPos = initial_to;
		this.onScopeUpdated && this.onScopeUpdated(this.__cPos, delta, scope);
		
		return scope;
	}
}


