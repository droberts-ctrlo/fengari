import { LUA_VERSION_MAJOR, LUA_VERSION_MINOR } from "./lua.js";

const LUA_VERSUFFIX = "_" + LUA_VERSION_MAJOR + "_" + LUA_VERSION_MINOR;
const _LUA_VERSUFFIX = LUA_VERSUFFIX;
export { _LUA_VERSUFFIX as LUA_VERSUFFIX };

export function lua_assert(c) { }

export const luaopen_base = require("./lbaselib.js").luaopen_base;

const LUA_COLIBNAME = "coroutine";
const _LUA_COLIBNAME = LUA_COLIBNAME;
export { _LUA_COLIBNAME as LUA_COLIBNAME };
export const luaopen_coroutine = require("./lcorolib.js").luaopen_coroutine;

const LUA_TABLIBNAME = "table";
const _LUA_TABLIBNAME = LUA_TABLIBNAME;
export { _LUA_TABLIBNAME as LUA_TABLIBNAME };
export const luaopen_table = require("./ltablib.js").luaopen_table;

if (typeof process !== "undefined") {
    const LUA_IOLIBNAME = "io";
    module.exports.LUA_IOLIBNAME = LUA_IOLIBNAME;
    module.exports.luaopen_io = require("./liolib.js").luaopen_io;
}

const LUA_OSLIBNAME = "os";
const _LUA_OSLIBNAME = LUA_OSLIBNAME;
export { _LUA_OSLIBNAME as LUA_OSLIBNAME };
export const luaopen_os = require("./loslib.js").luaopen_os;

const LUA_STRLIBNAME = "string";
const _LUA_STRLIBNAME = LUA_STRLIBNAME;
export { _LUA_STRLIBNAME as LUA_STRLIBNAME };
export const luaopen_string = require("./lstrlib.js").luaopen_string;

const LUA_UTF8LIBNAME = "utf8";
const _LUA_UTF8LIBNAME = LUA_UTF8LIBNAME;
export { _LUA_UTF8LIBNAME as LUA_UTF8LIBNAME };
export const luaopen_utf8 = require("./lutf8lib.js").luaopen_utf8;

const LUA_BITLIBNAME = "bit32";
const _LUA_BITLIBNAME = LUA_BITLIBNAME;
export { _LUA_BITLIBNAME as LUA_BITLIBNAME };
// module.exports.luaopen_bit32 = require("./lbitlib.js").luaopen_bit32;

const LUA_MATHLIBNAME = "math";
const _LUA_MATHLIBNAME = LUA_MATHLIBNAME;
export { _LUA_MATHLIBNAME as LUA_MATHLIBNAME };
export const luaopen_math = require("./lmathlib.js").luaopen_math;

const LUA_DBLIBNAME = "debug";
const _LUA_DBLIBNAME = LUA_DBLIBNAME;
export { _LUA_DBLIBNAME as LUA_DBLIBNAME };
export const luaopen_debug = require("./ldblib.js").luaopen_debug;

const LUA_LOADLIBNAME = "package";
const _LUA_LOADLIBNAME = LUA_LOADLIBNAME;
export { _LUA_LOADLIBNAME as LUA_LOADLIBNAME };
export const luaopen_package = require("./loadlib.js").luaopen_package;

const LUA_FENGARILIBNAME = "fengari";
const _LUA_FENGARILIBNAME = LUA_FENGARILIBNAME;
export { _LUA_FENGARILIBNAME as LUA_FENGARILIBNAME };
export const luaopen_fengari = require("./fengarilib.js").luaopen_fengari;

import { luaL_openlibs } from './linit.js';
export const luaL_openlibs = luaL_openlibs;
