import {lua_pop} from "./lua.js";
import {luaL_requiref} from "./lauxlib.js";
import {to_luastring} from "./fengaricore.js";
import * as lualib from "./lualib.js";
import {luaopen_base} from "./lbaselib.js";
import {luaopen_coroutine} from "./lcorolib.js";
import {luaopen_debug} from "./ldblib.js";
import {luaopen_math} from "./lmathlib.js";
import {luaopen_package} from "./loadlib.js";
import {luaopen_os} from "./loslib.js";
import {luaopen_string} from "./lstrlib.js";
import {luaopen_table} from "./ltablib.js";
import {luaopen_utf8} from "./lutf8lib.js";
import {luaopen_io} from "./liolib.js";
import {luaopen_fengari} from "./fengarilib.js";

const loadedlibs = {};

/* export before requiring lualib.js */
const luaL_openlibs = function(L) {
    /* "require" functions from 'loadedlibs' and set results to global table */
    for (let lib in loadedlibs) {
        luaL_requiref(L, to_luastring(lib), loadedlibs[lib], 1);
        lua_pop(L, 1); /* remove lib */
    }
};

loadedlibs['_G'] = luaopen_base;
loadedlibs[lualib.LUA_LOADLIBNAME] = luaopen_package;
loadedlibs[lualib.LUA_COLIBNAME] = luaopen_coroutine;
loadedlibs[lualib.LUA_TABLIBNAME] = luaopen_table;
loadedlibs[lualib.LUA_OSLIBNAME] = luaopen_os;
loadedlibs[lualib.LUA_STRLIBNAME] = luaopen_string;
loadedlibs[lualib.LUA_MATHLIBNAME] = luaopen_math;
loadedlibs[lualib.LUA_UTF8LIBNAME] = luaopen_utf8;
loadedlibs[lualib.LUA_DBLIBNAME] = luaopen_debug;
if (typeof process !== 'undefined')
    loadedlibs[lualib.LUA_IOLIBNAME] = luaopen_io.luaopen_io;
loadedlibs[lualib.LUA_FENGARILIBNAME] = luaopen_fengari;
