"use strict";

module.exports = function (_scope, cfg, target) {
    var fn = "";

    target && (fn += "scope = scope['" + target + "'];\n");

    for (var k in cfg.apply) {
        if (cfg.apply.hasOwnProperty(k)) {

            _scope && (_scope[k] = _scope[k] || 0);

            fn += "scope." + k + "+=" + (cfg.easeFn ? "cfg.easeFn(0, lastPos+update, 0, cfg.apply." + k + ", 1)" + "- cfg.easeFn(0, lastPos, 0, cfg.apply." + k + ", 1);" : "cfg.apply." + k + "*update;");
        }
    }return new Function("lastPos, update, scope, cfg, target", fn);
};
module.exports.isFactory = true;