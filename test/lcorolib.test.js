import { LUA_OK, lua_call, lua_tonumber, lua_tojsstring, lua_toboolean, lua_tothread } from '../src/lua.js';
import { luaL_newstate, luaL_loadstring } from '../src/lauxlib.js';
import { luaL_openlibs } from '../src/lualib.js';
import { lua_State } from '../src/lstate.js';
import { to_luastring } from "../src/fengaricore.js";

test('coroutine.create, coroutine.yield, coroutine.resume', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local co = coroutine.create(function (start)
            local b = coroutine.yield(start * start);
            coroutine.yield(b * b)
        end)

        local success, pow = coroutine.resume(co, 5)
        success, pow = coroutine.resume(co, pow)

        return pow
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tonumber(L, -1))
        .toBe(625);
});


test('coroutine.status', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local co = coroutine.create(function (start)
            local b = coroutine.yield(start * start);
            coroutine.yield(b * b)
        end)

        local s1 = coroutine.status(co)

        local success, pow = coroutine.resume(co, 5)
        success, pow = coroutine.resume(co, pow)

        coroutine.resume(co, pow)

        local s2 = coroutine.status(co)

        return s1, s2
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -2))
        .toBe("suspended");

    expect(lua_tojsstring(L, -1))
        .toBe("dead");
});


test('coroutine.isyieldable', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local co = coroutine.create(function ()
            coroutine.yield(coroutine.isyieldable());
        end)

        local succes, yieldable = coroutine.resume(co)

        return yieldable, coroutine.isyieldable()
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_toboolean(L, -2)).toBe(true);
    expect(lua_toboolean(L, -1)).toBe(false);
});


test('coroutine.running', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local running, ismain

        local co = coroutine.create(function ()
            running, ismain = coroutine.running()
        end)

        coroutine.resume(co)

        return running, ismain
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tothread(L, -2)).toBeInstanceOf(lua_State);
    expect(lua_toboolean(L, -1)).toBe(false);
});


test('coroutine.wrap', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local co = coroutine.wrap(function (start)
            local b = coroutine.yield(start * start);
            coroutine.yield(b * b)
        end)

        pow = co(5)
        pow = co(pow)

        return pow
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tonumber(L, -1))
        .toBe(625);
});
