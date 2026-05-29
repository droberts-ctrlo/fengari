import {LUA_VERSION_MAJOR, LUA_VERSION_MINOR} from "./lua.js";

import linit from "./linit.js";
import {luaopen_fengari} from "./fengarilib.js";
import {luaopen_package} from "./loadlib.js";
import {luaopen_debug} from "./ldblib.js";
import {luaopen_math} from "./lmathlib.js";
import {luaopen_utf8} from "./lutf8lib.js";
import {luaopen_string} from "./lstrlib.js";
import {luaopen_os} from "./loslib.js";
import {luaopen_io} from "./liolib.js";
import {luaopen_table} from "./ltablib.js";
import {luaopen_coroutine} from "./lcorolib.js";
import {luaopen_base} from "./lbaselib.js";

const LUA_VERSUFFIX = '_' + LUA_VERSION_MAJOR + '_' + LUA_VERSION_MINOR;
const LUA_COLIBNAME = 'coroutine';
const LUA_TABLIBNAME = 'table';
const LUA_IOLIBNAME = 'io';
const LUA_OSLIBNAME = 'os';
const LUA_STRLIBNAME = 'string';
const LUA_UTF8LIBNAME = 'utf8';
const LUA_BITLIBNAME = 'bit32';
// module.exports.luaopen_bit32 = require("./lbitlib.js").luaopen_bit32;

const LUA_MATHLIBNAME = 'math';
const LUA_DBLIBNAME = 'debug';
const LUA_LOADLIBNAME = 'package';
const LUA_FENGARILIBNAME = 'fengari';
const luaL_openlibs = linit.luaL_openlibs;
