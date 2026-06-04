import { LUA_OK, lua_call, lua_istable, lua_tojsstring } from '../src/lua.js';
import { luaL_newstate, luaL_loadstring } from '../src/lauxlib.js';
import { luaL_openlibs } from '../src/lualib.js';
import { to_luastring } from '../src/fengaricore.js';

test('require an existing module', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return require('os')
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_istable(L, -1)).toBe(true);
});


test('require a file', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return require('test.module-hello')()
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('hello from module');
});


test('package.loadlib', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return package.loadlib('./test/lib-hello.js.mod', 'hello')()
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('hello from js lib');
});


test('package.searchpath', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return package.searchpath('module-hello', './?.lua;./test/?.lua')
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('./test/module-hello.lua');
});
