import {lua_dump, LUA_OK, lua_tojsstring} from '../src/lua.js';
import {luaL_loadstring, luaL_newstate} from '../src/lauxlib.js';
import {to_luastring} from '../src/fengaricore.js';

export const toByteCode = function(luaCode) {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    if (luaL_loadstring(L, to_luastring(luaCode)) !== LUA_OK)
        throw Error(lua_tojsstring(L, -1));

    let b = [];
    if (lua_dump(L, function(L, b, size, B) {
        B.push(...b.slice(0, size));
        return 0;
    }, b, false) !== 0)
        throw Error('unable to dump given function');
    return Uint8Array.from(b);
};
