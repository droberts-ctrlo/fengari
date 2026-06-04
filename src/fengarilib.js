import * as lua from './lua.js';
import * as lauxlib from './lauxlib.js';
import * as fengaricore from './fengaricore.js';

export const luaopen_fengari = function(L) {
    lauxlib.luaL_newlib(L, {});
    lua.lua_pushliteral(L, fengaricore.FENGARI_AUTHORS);
    lua.lua_setfield(L, -2, fengaricore.to_luastring('AUTHORS'));
    lua.lua_pushliteral(L, fengaricore.FENGARI_COPYRIGHT);
    lua.lua_setfield(L, -2, fengaricore.to_luastring('COPYRIGHT'));
    lua.lua_pushliteral(L, fengaricore.FENGARI_RELEASE);
    lua.lua_setfield(L, -2, fengaricore.to_luastring('RELEASE'));
    lua.lua_pushliteral(L, fengaricore.FENGARI_VERSION);
    lua.lua_setfield(L, -2, fengaricore.to_luastring('VERSION'));
    lua.lua_pushliteral(L, fengaricore.FENGARI_VERSION_MAJOR);
    lua.lua_setfield(L, -2, fengaricore.to_luastring('VERSION_MAJOR'));
    lua.lua_pushliteral(L, fengaricore.FENGARI_VERSION_MINOR);
    lua.lua_setfield(L, -2, fengaricore.to_luastring('VERSION_MINOR'));
    lua.lua_pushinteger(L, fengaricore.FENGARI_VERSION_NUM);
    lua.lua_setfield(L, -2, fengaricore.to_luastring('VERSION_NUM'));
    lua.lua_pushliteral(L, fengaricore.FENGARI_VERSION_RELEASE);
    lua.lua_setfield(L, -2, fengaricore.to_luastring('VERSION_RELEASE'));
    return 1;
};
