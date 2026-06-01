import { toByteCode } from "./tests.js";

import { lua_pushnil, lua_pushnumber, lua_tonumber, lua_pushinteger, lua_tointeger, lua_pushliteral, lua_tojsstring, lua_pushboolean, lua_toboolean, lua_pushvalue, lua_pushjsclosure, lua_pushjsfunction, lua_call, lua_pushstring, lua_tostring, lua_upvalueindex, lua_pcall, LUA_OK, lua_pop, lua_load, lua_setglobal, lua_createtable, lua_istable, lua_newtable, lua_settable, lua_gettable, lua_pushcfunction, lua_atnativeerror, lua_touserdata, LUA_ERRRUN, lua_seti, lua_len } from '../src/lua.js';
import { luaL_newstate, luaL_typename, luaL_loadstring, luaL_error } from "../src/lauxlib.js";
import { to_luastring } from "../src/fengaricore.js";


test('luaL_newstate, lua_pushnil, luaL_typename', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        lua_pushnil(L);
    }

    expect(luaL_typename(L, -1))
        .toEqual(to_luastring("nil"));
});


test('lua_pushnumber', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        lua_pushnumber(L, 10.5);
    }

    expect(luaL_typename(L, -1))
        .toEqual(to_luastring("number"));

    expect(lua_tonumber(L, -1))
        .toBe(10.5);
});


test('lua_pushinteger', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        lua_pushinteger(L, 10);
    }

    expect(luaL_typename(L, -1))
        .toEqual(to_luastring("number"));

    expect(lua_tointeger(L, -1))
        .toBe(10);
});


test('lua_pushliteral', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        lua_pushliteral(L, "hello");
    }

    expect(luaL_typename(L, -1))
        .toEqual(to_luastring("string"));

    expect(lua_tojsstring(L, -1))
        .toBe("hello");
});


test('lua_pushboolean', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        lua_pushboolean(L, true);
    }

    expect(luaL_typename(L, -1))
        .toEqual(to_luastring("boolean"));

    expect(lua_toboolean(L, -1))
        .toBe(true);
});


test('lua_pushvalue', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        lua_pushliteral(L, "hello");
        lua_pushvalue(L, -1);
    }

    expect(luaL_typename(L, -1))
        .toEqual(to_luastring("string"));

    expect(luaL_typename(L, -2))
        .toEqual(to_luastring("string"));

    expect(lua_tojsstring(L, -1))
        .toBe("hello");

    expect(lua_tojsstring(L, -2))
        .toBe("hello");
});


test('lua_pushjsclosure', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        let fn = function(L) {
            return 0;
        };
        lua_pushliteral(L, "a value associated to the C closure");
        lua_pushjsclosure(L, fn, 1);
    }

    expect(luaL_typename(L, -1))
        .toEqual(to_luastring("function"));
});


test('lua_pushjsfunction', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        let fn = function(L) {
            return 0;
        };
        lua_pushjsfunction(L, fn);
    }

    expect(luaL_typename(L, -1))
        .toEqual(to_luastring("function"));
});


test('lua_call (calling a light JS function)', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        let fn = function(L) {
            lua_pushliteral(L, "hello");
            return 1;
        };
        lua_pushjsfunction(L, fn);
        lua_call(L, 0, 1);
    }

    expect(lua_tojsstring(L, -1))
        .toBe("hello");
});


test('lua_call (calling a JS closure)', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        let fn = function(L) {
            lua_pushstring(L, lua_tostring(L, lua_upvalueindex(1)));
            return 1;
        };
        lua_pushliteral(L, "upvalue hello!");
        lua_pushjsclosure(L, fn, 1);
        lua_call(L, 0, 1);
    }

    expect(lua_tojsstring(L, -1))
        .toBe("upvalue hello!");
});


test('lua_pcall (calling a light JS function)', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        let fn = function(L) {
            lua_pushliteral(L, "hello");
            return 1;
        };
        lua_pushjsfunction(L, fn);
        expect(lua_pcall(L, 0, 1, 0)).toBe(LUA_OK);
    }

    expect(lua_tojsstring(L, -1))
        .toBe("hello");
});


test('lua_pcall that breaks', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        let fn = function(L) {
            return "undefined_value";
        };
        lua_pushjsfunction(L, fn);
        expect(lua_pcall(L, 0, 1, 0)).not.toBe(LUA_OK);
    }
});


test('lua_pop', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        lua_pushliteral(L, "hello");
        lua_pushliteral(L, "world");
        lua_pop(L, 1);
    }

    expect(lua_tojsstring(L, -1))
        .toBe("hello");
});


test('lua_load with no chunkname', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        lua_load(L, function(L, s) {
            let r = s.code;
            s.code = null;
            return r;
        }, {
            code: to_luastring("return 'hello'")
        }, null, null);
        lua_call(L, 0, 1);
    }

    expect(lua_tojsstring(L, -1))
        .toBe("hello");
});

test('lua_load and lua_call it', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        let luaCode = `
            local a = "JS > Lua > JS \\\\o/"
            return a
        `;
        let bc = toByteCode(luaCode);
        lua_load(L, function(L, s) {
            let r = s.bc;
            s.bc = null;
            return r;
        }, {bc: bc}, to_luastring("test-lua_load"), to_luastring("binary"));
        lua_call(L, 0, 1);
    }

    expect(lua_tojsstring(L, -1))
        .toBe("JS > Lua > JS \\o/");
});


test('lua script reads js upvalues', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        let luaCode = `
            return js .. " world"
        `;
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_pushliteral(L, "hello");
        lua_setglobal(L, to_luastring("js"));
        lua_call(L, 0, 1);
    }

    expect(lua_tojsstring(L, -1))
        .toBe("hello world");
});


test('lua_createtable', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        lua_createtable(L, 3, 3);
    }

    expect(lua_istable(L, -1)).toBe(true);
});


test('lua_newtable', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        lua_newtable(L);
    }

    expect(lua_istable(L, -1)).toBe(true);
});


test('lua_settable, lua_gettable', () => {
    let L = luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    {
        lua_newtable(L);

        lua_pushliteral(L, "key");
        lua_pushliteral(L, "value");

        lua_settable(L, -3);

        lua_pushliteral(L, "key");
        lua_gettable(L, -2);
    }

    expect(lua_tojsstring(L, -1))
        .toBe("value");
});

describe('lua_atnativeerror', () => {
    test('no native error handler', () => {
        let L = luaL_newstate();
        if (!L) throw Error("failed to create lua state");

        let errob = {};

        lua_pushcfunction(L, function(L) {
            throw errob;
        });
        // without a native error handler pcall should be -1
        expect(lua_pcall(L, 0, 0, 0)).toBe(-1);
    });

    test('native error handler returns string', () => {
        let L = luaL_newstate();
        if (!L) throw Error("failed to create lua state");

        let errob = {};

        lua_atnativeerror(L, function(L) {
            let e = lua_touserdata(L, 1);
            expect(e).toBe(errob);
            lua_pushstring(L, to_luastring("runtime error!"));
            return 1;
        });
        lua_pushcfunction(L, function(L) {
            throw errob;
        });
        expect(lua_pcall(L, 0, 0, 0)).toBe(LUA_ERRRUN);
        expect(lua_tojsstring(L, -1)).toBe("runtime error!");
    });

    test('native error handler rethrows lua error', () => {
        let L = luaL_newstate();
        if (!L) throw Error("failed to create lua state");

        let errob = {};

        lua_atnativeerror(L, function(L) {
            let e = lua_touserdata(L, 1);
            expect(e).toBe(errob);
            luaL_error(L, to_luastring("runtime error!"));
        });
        lua_pushcfunction(L, function(L) {
            throw errob;
        });
        expect(lua_pcall(L, 0, 0, 0)).toBe(LUA_ERRRUN);
        expect(lua_tojsstring(L, -1)).toBe("runtime error!");
    });
});


describe('lua_len', () => {
    test('table with two potential boundaries', () => {
        let L = luaL_newstate();
        if (!L) throw Error("failed to create lua state");

        {
            lua_createtable(L);
            for (let i=3; i<=8; i++) {
                lua_pushinteger(L, i);
                lua_seti(L, -2, i);
            }
            lua_len(L, -1);
        }

        // could be 0 or 8
        let len = lua_tointeger(L, -1);
        expect(len == 0 || len == 8).toBe(true);
    });

    test('pathological case', () => {
        let L = luaL_newstate();
        if (!L) throw Error("failed to create lua state");

        {
            lua_createtable(L);
            let i = 1;
            for (let j=1; j<=1023; j++) {
                lua_pushnumber(L, i);
                lua_pushnumber(L, i);
                lua_settable(L, -3);
                i *= 2;
            }
            lua_len(L, -1);
        }

        /* is allowed to be a power of 2 larger than 2
           however if the result ever changes from 2 then the pathological
           code path has probably moved */
        let len = lua_tointeger(L, -1);
        expect(len).toBe(2);
    });
});
