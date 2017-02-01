"use strict";

var cache = {},
    buildPath,
    getPoint;
if (typeof document == "undefined") {
    buildPath = function buildPath(P) {
        return cache[P] || require("point-at-length")(P);
    };
    getPoint = function getPoint(P, p) {

        return cache[P].at(p);
    };
} else {
    buildPath = function buildPath(P) {
        var p = cache[P];
        if (!p) {
            cache[P] = p = document.createElementNS("http://www.w3.org/2000/svg", "path");

            p.setAttribute('d', P);
        }
        ;
    };
    getPoint = function getPoint(P, p) {
        return cache[P].getPointAtLength(p * cache[P].getTotalLength());
    };
}
module.exports = function (_scope, cfg, target) {
    // @todo incremental path reader

    var axe1 = cfg.axes && cfg.axes[0] || 'x',
        // should factorise better....
    axe2 = cfg.axes && cfg.axes[1] || 'y',
        lastPtsPos,
        lastPts;
    buildPath(cfg.path);
    return function (lastPos, update, scope, cfg, target) {
        var p1 = lastPtsPos == lastPos ? lastPts : getPoint(cfg.path, cfg.reverse ? 1 - lastPos : lastPos),
            p2 = lastPts = getPoint(cfg.path, cfg.reverse ? 1 - (lastPos + update) : lastPos + update);
        lastPtsPos = lastPos + update;
        scope[axe1] += (p2.x - p1.x) * 4;
        scope[axe2] += (p2.y - p1.y) * 4;
    };
};
module.exports.isFactory = true;