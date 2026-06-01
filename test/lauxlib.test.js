import { lua_pushstring, LUA_REGISTRYINDEX, lua_rawgeti, lua_tojsstring } from '../src/lua.js';
import { luaL_newstate, luaL_ref, luaL_unref } from "../src/lauxlib.js";
import { to_luastring } from "../src/fengaricore.js";


test('luaL_ref, lua_rawgeti, luaL_unref, LUA_REGISTRYINDEX', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        lua_pushstring(L, to_luastring("hello references!"));

        let r = luaL_ref(L, LUA_REGISTRYINDEX); // pops a value, stores it and returns a reference
        lua_rawgeti(L, LUA_REGISTRYINDEX, r); // pushes a value associated with the reference
        luaL_unref(L, LUA_REGISTRYINDEX, r); // releases the reference
    }

    expect(lua_tojsstring(L, -1))
        .toBe("hello references!");
});
