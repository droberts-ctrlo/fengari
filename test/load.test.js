import { toByteCode } from "./tests.js";

import { LUA_OK, lua_call, lua_tojsstring } from '../src/lua.js';
import { luaL_newstate, luaL_loadstring, luaL_loadbuffer } from '../src/lauxlib.js';
import { luaL_openlibs } from '../src/lualib.js';
import { to_luastring } from "../src/fengaricore.js";

test('luaL_loadstring', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local a = "hello world"
        return a
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }
    expect(lua_tojsstring(L, -1))
        .toBe("hello world");
});


test('load', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local f = load("return 'js running lua running lua'")
        return f()
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }
    expect(lua_tojsstring(L, -1))
        .toBe("js running lua running lua");
});


test('undump empty string', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        assert(load(string.dump(function()
            local str = ""
            return #str -- something that inspects the string
        end)))()
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, 0);
    }
});


test('luaL_loadbuffer', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local a = "hello world"
        return a
    `;
    {
        luaL_openlibs(L);
        let bc = toByteCode(luaCode);
        luaL_loadbuffer(L, bc, null, to_luastring("test"));
        lua_call(L, 0, -1);
    }
    expect(lua_tojsstring(L, -1))
        .toBe("hello world");
});

// TODO: test stdin
test('loadfile', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local f = assert(loadfile("test/loadfile-test.lua"))
        return f()
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }
    expect(lua_tojsstring(L, -1))
        .toBe("hello world");
});


test('loadfile (binary)', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local f = assert(loadfile("test/loadfile-test.bc"))
        return f()
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }
    expect(lua_tojsstring(L, -1))
        .toBe("hello world");
});


test('dofile', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return dofile("test/loadfile-test.lua")
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }
    expect(lua_tojsstring(L, -1))
        .toBe("hello world");
});
