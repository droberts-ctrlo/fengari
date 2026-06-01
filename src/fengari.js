/**
@license MIT

Copyright © 2017-2019 Benoit Giannangeli
Copyright © 2017-2019 Daurnimator
Copyright © 1994–2017 Lua.org, PUC-Rio.
*/

"use strict";

export { FENGARI_AUTHORS, FENGARI_COPYRIGHT, FENGARI_RELEASE, FENGARI_VERSION, FENGARI_VERSION_MAJOR, FENGARI_VERSION_MINOR, FENGARI_VERSION_NUM, FENGARI_VERSION_RELEASE, luastring_eq, luastring_indexOf, luastring_of, to_jsstring, to_luastring, to_uristring } from "./fengaricore.js";

import * as luaconf from './luaconf.js';
import * as lua from './lua.js';
import * as lauxlib from './lauxlib.js';
import * as lualib from './lualib.js';

const _luaconf = luaconf;
export { _luaconf as luaconf };
const _lua = lua;
export { _lua as lua };
const _lauxlib = lauxlib;
export { _lauxlib as lauxlib };
const _lualib = lualib;
export { _lualib as lualib };
