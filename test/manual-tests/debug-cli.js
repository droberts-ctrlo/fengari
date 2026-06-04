#!/usr/bin/env node

import { lua_call } from '../../src/lua.js';
import { luaL_newstate, luaL_loadstring } from '../../src/lauxlib.js';
import { luaL_openlibs } from '../../src/lualib.js';
import { to_luastring } from '../../src/fengaricore.js';

let luaCode = `
    a = "debug me"
    debug.debug()
`, L;

L = luaL_newstate();

luaL_openlibs(L);

luaL_loadstring(L, to_luastring(luaCode));

lua_call(L, 0, 0);
