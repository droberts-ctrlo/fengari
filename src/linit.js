import { lua_pop } from './lua.js';
import { luaL_requiref } from './lauxlib.js';
import { to_luastring } from "./fengaricore.js";
import { luaopen_fengari } from './fengarilib.js';
import { luaopen_base } from './lbaselib.js';
import { luaopen_coroutine } from './lcorolib.js';
import { luaopen_debug } from './ldblib.js';
import { luaopen_io } from './liolib.js';
import { luaopen_math } from './lmathlib.js';
import { luaopen_package } from './loadlib.js';
import { luaopen_os } from './loslib.js';
import { luaopen_string } from './lstrlib.js';
import { luaopen_table } from './ltablib.js';
import { luaopen_utf8 } from './lutf8lib.js';

const LUA_COLIBNAME = "coroutine";
const LUA_TABLIBNAME = "table";
const LUA_IOLIBNAME = "io";
const LUA_OSLIBNAME = "os";
const LUA_STRLIBNAME = "string";
const LUA_MATHLIBNAME = "math";
const LUA_UTF8LIBNAME = "utf8";
const LUA_DBLIBNAME = "debug";
const LUA_LOADLIBNAME = "package";
const LUA_FENGARILIBNAME = "fengari";

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
    loadedlibs[LUA_IOLIBNAME] = luaopen_io;

/* Extension: fengari library */
loadedlibs[LUA_FENGARILIBNAME] = luaopen_fengari;
