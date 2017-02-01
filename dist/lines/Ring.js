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