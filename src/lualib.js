export { luaL_openlibs } from './linit.js';
export { luaopen_io } from "./liolib.js";
export { luaopen_table } from "./ltablib.js";
export { luaopen_coroutine } from "./lcorolib.js";
export { luaopen_os } from "./loslib.js";
export { luaopen_string } from "./lstrlib.js";
export { luaopen_utf8 } from "./lutf8lib.js";
export { luaopen_math } from "./lmathlib.js";
export { luaopen_debug } from "./ldblib.js";
export { luaopen_package } from "./loadlib.js";
export { luaopen_fengari } from "./fengarilib.js";
import { LUA_VERSION_MAJOR, LUA_VERSION_MINOR } from "./lua.js";

const LUA_VERSUFFIX = "_" + LUA_VERSION_MAJOR + "_" + LUA_VERSION_MINOR;
const _LUA_VERSUFFIX = LUA_VERSUFFIX;
export { _LUA_VERSUFFIX as LUA_VERSUFFIX };

export function lua_assert(c) { }

export const luaopen_base = luaopen_base;

const LUA_COLIBNAME = "coroutine";
const _LUA_COLIBNAME = LUA_COLIBNAME;
export { _LUA_COLIBNAME as LUA_COLIBNAME };

const LUA_TABLIBNAME = "table";
const _LUA_TABLIBNAME = LUA_TABLIBNAME;
export { _LUA_TABLIBNAME as LUA_TABLIBNAME };

export const LUA_IOLIBNAME = "io";

const LUA_OSLIBNAME = "os";
const _LUA_OSLIBNAME = LUA_OSLIBNAME;
export { _LUA_OSLIBNAME as LUA_OSLIBNAME };

const LUA_STRLIBNAME = "string";
const _LUA_STRLIBNAME = LUA_STRLIBNAME;
export { _LUA_STRLIBNAME as LUA_STRLIBNAME };

const LUA_UTF8LIBNAME = "utf8";
const _LUA_UTF8LIBNAME = LUA_UTF8LIBNAME;
export { _LUA_UTF8LIBNAME as LUA_UTF8LIBNAME };

const LUA_BITLIBNAME = "bit32";
const _LUA_BITLIBNAME = LUA_BITLIBNAME;
export { _LUA_BITLIBNAME as LUA_BITLIBNAME };
// module.exports.luaopen_bit32 = require("./lbitlib.js").luaopen_bit32;

const LUA_MATHLIBNAME = "math";
const _LUA_MATHLIBNAME = LUA_MATHLIBNAME;
export { _LUA_MATHLIBNAME as LUA_MATHLIBNAME };

const LUA_DBLIBNAME = "debug";
const _LUA_DBLIBNAME = LUA_DBLIBNAME;
export { _LUA_DBLIBNAME as LUA_DBLIBNAME };

const LUA_LOADLIBNAME = "package";
const _LUA_LOADLIBNAME = LUA_LOADLIBNAME;
export { _LUA_LOADLIBNAME as LUA_LOADLIBNAME };

const LUA_FENGARILIBNAME = "fengari";
const _LUA_FENGARILIBNAME = LUA_FENGARILIBNAME;
export { _LUA_FENGARILIBNAME as LUA_FENGARILIBNAME };

