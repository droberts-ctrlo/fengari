import { lua_pop } from './lua.js';
import { luaL_requiref } from './lauxlib.js';
import { to_luastring } from "./fengaricore.js";

const loadedlibs = {};

/* export before requiring lualib.js */
const luaL_openlibs = function(L) {
    /* "require" functions from 'loadedlibs' and set results to global table */
    for (let lib in loadedlibs) {
        luaL_requiref(L, to_luastring(lib), loadedlibs[lib], 1);
        lua_pop(L, 1); /* remove lib */
    }
};
const _luaL_openlibs = luaL_openlibs;
export { _luaL_openlibs as luaL_openlibs };

import { LUA_LOADLIBNAME, LUA_COLIBNAME, LUA_TABLIBNAME, LUA_OSLIBNAME, LUA_STRLIBNAME, LUA_MATHLIBNAME, LUA_UTF8LIBNAME, LUA_DBLIBNAME, LUA_IOLIBNAME, LUA_FENGARILIBNAME } from './lualib.js';
import { luaopen_base } from './lbaselib.js';
import { luaopen_coroutine } from './lcorolib.js';
import { luaopen_debug } from './ldblib.js';
import { luaopen_math } from './lmathlib.js';
import { luaopen_package } from './loadlib.js';
import { luaopen_os } from './loslib.js';
import { luaopen_string } from './lstrlib.js';
import { luaopen_table } from './ltablib.js';
import { luaopen_utf8 } from './lutf8lib.js';

loadedlibs["_G"] = luaopen_base,
loadedlibs[LUA_LOADLIBNAME] = luaopen_package;
loadedlibs[LUA_COLIBNAME] = luaopen_coroutine;
loadedlibs[LUA_TABLIBNAME] = luaopen_table;
loadedlibs[LUA_OSLIBNAME] = luaopen_os;
loadedlibs[LUA_STRLIBNAME] = luaopen_string;
loadedlibs[LUA_MATHLIBNAME] = luaopen_math;
loadedlibs[LUA_UTF8LIBNAME] = luaopen_utf8;
loadedlibs[LUA_DBLIBNAME] = luaopen_debug;
if (typeof process !== "undefined")
    loadedlibs[LUA_IOLIBNAME] = require('./liolib.js').luaopen_io;

/* Extension: fengari library */
import { luaopen_fengari } from './fengarilib.js';
loadedlibs[LUA_FENGARILIBNAME] = luaopen_fengari;
