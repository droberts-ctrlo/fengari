import * as lua from './lua.js';
import * as lauxlib from './lauxlib.js';
import * as fengaricore from './fengaricore.js';
import * as fengarilib from './fengarilib.js';
import * as lbaselib from './lbaselib.js';
import * as lcorolib from './lcorolib.js';
import * as ldblib from './ldblib.js';
import * as liolib from './liolib.js';
import * as lmathlib from './lmathlib.js';
import * as loadlib from './loadlib.js';
import * as loslib from './loslib.js';
import * as lstrlib from './lstrlib.js';
import * as ltablib from './ltablib.js';
import * as lutf8lib from './lutf8lib.js';

const LUA_COLIBNAME = 'coroutine';
const LUA_TABLIBNAME = 'table';
const LUA_IOLIBNAME = 'io';
const LUA_OSLIBNAME = 'os';
const LUA_STRLIBNAME = 'string';
const LUA_MATHLIBNAME = 'math';
const LUA_UTF8LIBNAME = 'utf8';
const LUA_DBLIBNAME = 'debug';
const LUA_LOADLIBNAME = 'package';
const LUA_FENGARILIBNAME = 'fengari';

const loadedlibs = {};

/* export before requiring lualib.js */
export const luaL_openlibs = function(L) {
    /* "require" functions from 'loadedlibs' and set results to global table */
    for (let lib in loadedlibs) {
        lauxlib.luaL_requiref(L, fengaricore.to_luastring(lib), loadedlibs[lib], 1);
        lua.lua_pop(L, 1); /* remove lib */
    }
};

loadedlibs['_G'] = lbaselib.luaopen_base,
loadedlibs[LUA_LOADLIBNAME] = loadlib.luaopen_package;
loadedlibs[LUA_COLIBNAME] = lcorolib.luaopen_coroutine;
loadedlibs[LUA_TABLIBNAME] = ltablib.luaopen_table;
loadedlibs[LUA_OSLIBNAME] = loslib.luaopen_os;
loadedlibs[LUA_STRLIBNAME] = lstrlib.luaopen_string;
loadedlibs[LUA_MATHLIBNAME] = lmathlib.luaopen_math;
loadedlibs[LUA_UTF8LIBNAME] = lutf8lib.luaopen_utf8;
loadedlibs[LUA_DBLIBNAME] = ldblib.luaopen_debug;
if (typeof process !== 'undefined')
    loadedlibs[LUA_IOLIBNAME] = liolib.luaopen_io;

/* Extension: fengari library */
loadedlibs[LUA_FENGARILIBNAME] = fengarilib.luaopen_fengari;
