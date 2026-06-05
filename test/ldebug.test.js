import {LUA_OK, lua_pcall, lua_tojsstring} from '../src/lua.js';
import {luaL_loadstring, luaL_newstate} from '../src/lauxlib.js';
import {luaL_openlibs} from '../src/lualib.js';
import {to_luastring} from '../src/fengaricore.js';

test('luaG_typeerror', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local a = true
        return #a
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_pcall(L, 0, -1, 0);
    }

    expect(lua_tojsstring(L, -1))
        .toMatch('attempt to get length of a boolean value (local \'a\')');
});


test('luaG_typeerror', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local a = true
        return a.yo
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_pcall(L, 0, -1, 0);
    }

    expect(lua_tojsstring(L, -1))
        .toMatch('attempt to index a boolean value (local \'a\')');
});


test('luaG_typeerror', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local a = true
        return a.yo
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_pcall(L, 0, -1, 0);
    }

    expect(lua_tojsstring(L, -1))
        .toMatch('attempt to index a boolean value (local \'a\')');
});


test('luaG_typeerror', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local a = true
        a.yo = 1
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_pcall(L, 0, -1, 0);
    }

    expect(lua_tojsstring(L, -1))
        .toMatch('attempt to index a boolean value (local \'a\')');
});


test('luaG_concaterror', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return {} .. 'hello'
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_pcall(L, 0, -1, 0);
    }

    expect(lua_tojsstring(L, -1))
        .toMatch('attempt to concatenate a table value');
});


test('luaG_opinterror', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return {} + 'hello'
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_pcall(L, 0, -1, 0);
    }

    expect(lua_tojsstring(L, -1))
        .toMatch('attempt to perform arithmetic on a table value');
});


test('luaG_tointerror', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return 123.5 & 12
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_pcall(L, 0, -1, 0);
    }

    expect(lua_tojsstring(L, -1))
        .toMatch('number has no integer representation');
});
