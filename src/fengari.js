/**
@license MIT

Copyright © 2017-2019 Benoit Giannangeli
Copyright © 2017-2019 Daurnimator
Copyright © 1994–2017 Lua.org, PUC-Rio.
*/

"use strict";

import { FENGARI_AUTHORS, FENGARI_COPYRIGHT, FENGARI_RELEASE, FENGARI_VERSION, FENGARI_VERSION_MAJOR, FENGARI_VERSION_MINOR, FENGARI_VERSION_NUM, FENGARI_VERSION_RELEASE, luastring_eq, luastring_indexOf, luastring_of, to_jsstring, to_luastring, to_uristring } from "./fengaricore.js";

export const FENGARI_AUTHORS         = FENGARI_AUTHORS;
export const FENGARI_COPYRIGHT       = FENGARI_COPYRIGHT;
export const FENGARI_RELEASE         = FENGARI_RELEASE;
export const FENGARI_VERSION         = FENGARI_VERSION;
export const FENGARI_VERSION_MAJOR   = FENGARI_VERSION_MAJOR;
export const FENGARI_VERSION_MINOR   = FENGARI_VERSION_MINOR;
export const FENGARI_VERSION_NUM     = FENGARI_VERSION_NUM;
export const FENGARI_VERSION_RELEASE = FENGARI_VERSION_RELEASE;

export const luastring_eq      = luastring_eq;
export const luastring_indexOf = luastring_indexOf;
export const luastring_of      = luastring_of;
export const to_jsstring       = to_jsstring;
export const to_luastring      = to_luastring;
export const to_uristring      = to_uristring;

import luaconf from './luaconf.js';
import lua from './lua.js';
import lauxlib from './lauxlib.js';
import lualib from './lualib.js';

const _luaconf = luaconf;
export { _luaconf as luaconf };
const _lua = lua;
export { _lua as lua };
const _lauxlib = lauxlib;
export { _lauxlib as lauxlib };
const _lualib = lualib;
export { _lualib as lualib };
