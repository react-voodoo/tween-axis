/*
 *
 * Copyright (C) 2019 Nathanael Braun
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var cache = {}, buildPath, getPoint;
if ( typeof document == "undefined" ) {
    buildPath = function ( P ) {
        return cache[P] || require("point-at-length")(P);
    };
    getPoint  = function ( P, p ) {

        return cache[P].at(p);
    };
} else {
    buildPath = function ( P ) {
        var p = cache[P];
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
module.exports           =
    function ( _scope, cfg, target ) { // @todo incremental path reader

        var
            axe1 = cfg.axes && cfg.axes[0] || 'x',// should factorise better....
            axe2 = cfg.axes && cfg.axes[1] || 'y',
            lastPtsPos, lastPts;
        buildPath(cfg.path);
        return function ( lastPos, update, scope, cfg, target ) {
            var p1 = (lastPtsPos == lastPos) ? lastPts : getPoint(cfg.path, cfg.reverse ? 1 - lastPos : lastPos),
                p2 = lastPts = getPoint(cfg.path, cfg.reverse ? 1 - (lastPos + update) : (lastPos + update));
            lastPtsPos = lastPos + update;
            scope[axe1] += (p2.x - p1.x) * 4;
            scope[axe2] += (p2.y - p1.y) * 4;
        };
    };
module.exports.isFactory = true;