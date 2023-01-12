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
const isValidKey = /^[a-zA-Z\d\-\_]*$/;

module.exports           = function ( _scope, cfg, target ) {
	let fn = `
	if (!noEvents){
	`;
	if ( cfg.entering )// only add code if the functions exists for perfs purpose
		fn += `
		if ( lastPos === 0 || lastPos === 1 )
			cfg.entering(update);
		`;
	if ( cfg.moving )
		fn += `
			cfg.moving(lastPos + update, lastPos, update);
		`;
	if ( cfg.leaving )
		fn += `
		if ( lastPos !== 0 && lastPos !== 1 && (lastPos + update === 0 || lastPos + update === 1) )
				cfg.leaving(update);
		`;
	fn +=
		`
	}
	`;
	
	target && (fn += "scope = scope['" + target + "'];\n");
	if ( cfg.apply )
		for ( var k in cfg.apply )
			if ( cfg.apply.hasOwnProperty(k) && isValidKey.test(k) ) {
				
				_scope && (_scope[k] = _scope[k] || 0);
				
				fn += "scope." + k + "+=(" +
					(
						cfg.easeFn ?
						"cfg.easeFn(lastPos+update)" +
							"- cfg.easeFn(lastPos)"
						           :
						"update"
					) + ") * cfg.apply." + k + ";";
			}
	return new Function("lastPos, update, scope, cfg, target, noEvents", fn);
};
module.exports.isFactory = true;
