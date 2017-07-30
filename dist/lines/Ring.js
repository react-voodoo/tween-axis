/*
 * Copyright (c) 2017.  Caipi Labs.  All rights reserved.
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
 * @contact : caipilabs@gmail.com
 */

'use strict';

var PI = Math.PI,
    isNumber = require('isnumber'),
    sin = Math.sin,
    cos = Math.cos;

module.exports =
//function () {
function (scope, cfg, target) {
    target && scope && (scope = scope[target] = scope[target] || {}); // !

    var fn = "var _2PI=2*Math.PI,",
        axe1 = cfg.axes && cfg.axes[0] || 'x',
        // should factorise....
    axe2 = cfg.axes && cfg.axes[1] || 'y',
        factor1 = (cfg.factors && cfg.factors[0] || 1) * cfg.radius,
        // should factorise....
    factor2 = (cfg.factors && cfg.factors[1] || 1) * cfg.radius,
        startPos = (cfg.startPos || 0) * 2 * PI,
        length = isNumber(cfg.length) ? cfg.length : 1;
    fn += "pos1=(" + startPos + "+((lastPos+update)*_2PI)*" + length + " )%(_2PI)," + "pos2 = (" + startPos + "+(lastPos)*_2PI*" + length + " )%(_2PI);";
    fn += "scope." + axe1 + "+=" + factor1 + "*(Math.cos(pos1)-Math.cos(pos2));" + // ! optims
    "scope." + axe2 + " += " + factor2 + "*(Math.sin(pos1)-Math.sin(pos2));";

    return new Function("lastPos, update, scope, cfg, target", fn);
};
module.exports.isFactory = true;