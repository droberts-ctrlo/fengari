import { LUA_OK, lua_call, lua_tointeger, lua_tojsstring } from '../src/lua.js';
import { luaL_newstate, luaL_loadstring } from '../src/lauxlib.js';
import { luaL_openlibs } from '../src/lualib.js';
import { to_luastring } from '../src/fengaricore.js';

test('utf8.offset', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return utf8.offset("( ͡° ͜ʖ ͡° )", 5)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tointeger(L, -1)).toBe(7);
});


test('utf8.codepoint', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return utf8.codepoint("( ͡° ͜ʖ ͡° )", 5, 8)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tointeger(L, -3)).toBe(176);
    expect(lua_tointeger(L, -2)).toBe(32);
    expect(lua_tointeger(L, -1)).toBe(860);
});


test('utf8.char', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return utf8.char(40, 32, 865, 176, 32, 860, 662, 32, 865, 176, 32, 41)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('( ͡° ͜ʖ ͡° )');
});


test('utf8.len', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return utf8.len("( ͡° ͜ʖ ͡° )")
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tointeger(L, -1)).toBe(12);
});


test('utf8.codes', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local s = "( ͡° ͜ʖ ͡° )"
        local results = ""
        for p, c in utf8.codes(s) do
            results = results .. "[" .. p .. "," .. c .. "] "
        end
        return results
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('[1,40] [2,32] [3,865] [5,176] [7,32] [8,860] [10,662] [12,32] [13,865] [15,176] [17,32] [18,41] ');
});
