export { luaL_openlibs } from './linit.js';
import { luaopen_io } from './liolib.js';
export { luaopen_io };
export { luaopen_table } from './ltablib.js';
export { luaopen_coroutine } from './lcorolib.js';
export { luaopen_os } from './loslib.js';
export { luaopen_string } from './lstrlib.js';
export { luaopen_utf8 } from './lutf8lib.js';
export { luaopen_math } from './lmathlib.js';
export { luaopen_debug } from './ldblib.js';
export { luaopen_package } from './loadlib.js';
export { luaopen_fengari } from './fengarilib.js';
import { LUA_VERSION_MAJOR, LUA_VERSION_MINOR } from './lua.js';

export const LUA_VERSUFFIX = '_' + LUA_VERSION_MAJOR + '_' + LUA_VERSION_MINOR;

export function lua_assert(_c) { }

export { luaopen_base } from './lbaselib.js';

export const LUA_COLIBNAME = 'coroutine';

export const LUA_TABLIBNAME = 'table';

export const LUA_IOLIBNAME = 'io';

export const LUA_OSLIBNAME = 'os';

export const LUA_STRLIBNAME = 'string';

export const LUA_UTF8LIBNAME = 'utf8';

export const LUA_BITLIBNAME = 'bit32';
// module.exports.luaopen_bit32 = require("./lbitlib.js").luaopen_bit32;

export const LUA_MATHLIBNAME = 'math';

export const LUA_DBLIBNAME = 'debug';

export const LUA_LOADLIBNAME = 'package';

export const LUA_FENGARILIBNAME = 'fengari';
