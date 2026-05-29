/* Fengari specific functions
 *
 * This file includes fengari-specific data or and functionality for users to
 * manipulate fengari's string type.
 * The fields are exposed to the user on the 'fengari' entry point; however to
 * avoid a dependency on defs.js from lauxlib.js they are defined in this file.
 */

export {
    LUA_COPYRIGHT,
    is_luastring,
    luastring_eq,
    luastring_from,
    luastring_indexOf,
    luastring_of,
    to_jsstring,
    to_luastring,
    to_uristring,
    from_userstring
} from './defs.js';

export const FENGARI_VERSION_MAJOR   = '0';
export const FENGARI_VERSION_MINOR   = '1';
export const FENGARI_VERSION_NUM     = 1;
export const FENGARI_VERSION_RELEASE = '4';
export const FENGARI_VERSION         = 'Fengari ' + FENGARI_VERSION_MAJOR + '.' + FENGARI_VERSION_MINOR;
export const FENGARI_RELEASE         = FENGARI_VERSION + '.' + FENGARI_VERSION_RELEASE;
export const FENGARI_AUTHORS         = 'B. Giannangeli, Daurnimator';
export const FENGARI_COPYRIGHT       = FENGARI_RELEASE + '  Copyright (C) 2017-2019 ' + FENGARI_AUTHORS + '\nBased on: ' + LUA_COPYRIGHT;
