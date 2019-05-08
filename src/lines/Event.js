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

module.exports           = function ( _scope, cfg, target ) {
	return ( lastPos, update, scope, cfg, target ) => {
		if ( cfg.entering ) {
			if ( lastPos === 0 || lastPos === 1 )
				cfg.entering(update);
		}
		if ( cfg.leaving ) {
			if ( lastPos !== 0 && lastPos !== 1 && (lastPos + update === 0 || lastPos + update === 1) )
				cfg.leaving(update);
		}
	};
};
module.exports.isFactory = true;