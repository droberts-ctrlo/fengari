/* Fengari specific functions
 *
 * This file includes fengari-specific data or and functionality for users to
 * manipulate fengari's string type.
 * The fields are exposed to the user on the 'fengari' entry point; however to
 * avoid a dependency on defs.js from lauxlib.js they are defined in this file.
 */

import { LUA_COPYRIGHT } from './defs.js';

export { LUA_COPYRIGHT, is_luastring, luastring_eq, luastring_from, luastring_indexOf, luastring_of, to_jsstring, to_luastring, to_uristring, from_userstring } from './defs.js';

const FENGARI_VERSION_MAJOR   = '0';
const FENGARI_VERSION_MINOR   = '1';
const FENGARI_VERSION_NUM     = 1;
const FENGARI_VERSION_RELEASE = '5';
const FENGARI_VERSION         = 'Fengari ' + FENGARI_VERSION_MAJOR + '.' + FENGARI_VERSION_MINOR;
const FENGARI_RELEASE         = FENGARI_VERSION + '.' + FENGARI_VERSION_RELEASE;
const FENGARI_AUTHORS         = 'B. Giannangeli, Daurnimator';
const FENGARI_COPYRIGHT       = FENGARI_RELEASE + '  Copyright (C) 2017-2019 ' + FENGARI_AUTHORS + '\nBased on: ' + LUA_COPYRIGHT;

const _FENGARI_AUTHORS = FENGARI_AUTHORS;
export { _FENGARI_AUTHORS as FENGARI_AUTHORS };
const _FENGARI_COPYRIGHT = FENGARI_COPYRIGHT;
export { _FENGARI_COPYRIGHT as FENGARI_COPYRIGHT };
const _FENGARI_RELEASE = FENGARI_RELEASE;
export { _FENGARI_RELEASE as FENGARI_RELEASE };
const _FENGARI_VERSION = FENGARI_VERSION;
export { _FENGARI_VERSION as FENGARI_VERSION };
const _FENGARI_VERSION_MAJOR = FENGARI_VERSION_MAJOR;
export { _FENGARI_VERSION_MAJOR as FENGARI_VERSION_MAJOR };
const _FENGARI_VERSION_MINOR = FENGARI_VERSION_MINOR;
export { _FENGARI_VERSION_MINOR as FENGARI_VERSION_MINOR };
const _FENGARI_VERSION_NUM = FENGARI_VERSION_NUM;
export { _FENGARI_VERSION_NUM as FENGARI_VERSION_NUM };
const _FENGARI_VERSION_RELEASE = FENGARI_VERSION_RELEASE;
export { _FENGARI_VERSION_RELEASE as FENGARI_VERSION_RELEASE };
