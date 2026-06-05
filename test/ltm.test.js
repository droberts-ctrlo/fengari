import {lua_call, lua_isnil, LUA_OK, lua_toboolean, lua_tointeger, lua_tojsstring} from '../src/lua.js';
import {luaL_loadstring, luaL_newstate} from '../src/lauxlib.js';
import {luaL_openlibs} from '../src/lualib.js';
import {to_luastring} from '../src/fengaricore.js';

test('__index, __newindex: with actual table', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local t = {yo=1}
        return t.yo, t.lo
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_isnil(L, -1)).toBe(true);
    expect(lua_tointeger(L, -2)).toBe(1);
});


test('__newindex: with non table', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local t = "a string"
        t.yo = "hello"
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
    }

    expect(() => {
        lua_call(L, 0, -1);
    }).toThrow();
});


test('__index function in metatable', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local mt = {
            __index = function (table, key)
                return "__index"
            end
        }

        local t = {}

        setmetatable(t, mt)

        return t.yo
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('__index');
});


test('__newindex function in metatable', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local mt = {
            __newindex = function (table, key, value)
                return "__newindex"
            end
        }

        local t = {}

        setmetatable(t, mt)

        t.yo = "hello"

        return t.yo
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_isnil(L, -1)).toBe(true);
});


test('__index table in metatable', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local mmt = {
            yo = "hello"
        }

        local mt = {
            __index = mmt
        }

        local t = {}

        setmetatable(t, mt)

        return t.yo
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('hello');
});


test('__newindex table in metatable', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local mmt = {
            yo = "hello"
        }

        local mt = {
            __newindex = mmt
        }

        local t = {}

        setmetatable(t, mt)

        t.yo = "world"

        return t.yo, mmt.yo
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('world');
    expect(lua_isnil(L, -2)).toBe(true);
});


test('__index table with own metatable', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local mmmt = {
            __index = function (t, k)
                return "hello"
            end
        }

        local mmt = {
            yoo = "bye"
        }

        setmetatable(mmt, mmmt)

        local mt = {
            __index = mmt
        }

        local t = {}

        setmetatable(t, mt)

        return t.yo
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('hello');
});


test('__newindex table with own metatable', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local up = nil

        local mmmt = {
            __newindex = function (t, k, v)
                up = v
            end
        }

        local mmt = {}

        setmetatable(mmt, mmmt)

        local mt = {
            __newindex = mmt
        }

        setmetatable(mt, mmt)

        local t = {}

        setmetatable(t, mt)

        t.yo = "hello"

        return t.yo, up
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('hello');
    expect(lua_isnil(L, -2)).toBe(true);
});


test('binary __xxx functions in metatable', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local mt = {
            __add = function (a, b)
                return "{} + " .. b
            end,

            __sub = function (a, b)
                return "{} - " .. b
            end,

            __mul = function (a, b)
                return "{} * " .. b
            end,

            __mod = function (a, b)
                return "{} % " .. b
            end,

            __pow = function (a, b)
                return "{} ^ " .. b
            end,

            __div = function (a, b)
                return "{} / " .. b
            end,

            __idiv = function (a, b)
                return "{} // " .. b
            end,

            __band = function (a, b)
                return "{} & " .. b
            end,

            __bor = function (a, b)
                return "{} | " .. b
            end,

            __bxor = function (a, b)
                return "{} ~ " .. b
            end,

            __shl = function (a, b)
                return "{} << " .. b
            end,

            __shr = function (a, b)
                return "{} >> " .. b
            end

        }

        local t = {}

        setmetatable(t, mt)

        return
            t + 1,
            t - 1,
            t * 1,
            t % 1,
            t ^ 1,
            t / 1,
            t // 1,
            t & 1,
            t | 1,
            t ~ 1,
            t << 1,
            t >> 1
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(L.stack.slice(L.top - 12, L.top).map(e => e.jsstring()))
        .toEqual([
            '{} + 1',
            '{} - 1',
            '{} * 1',
            '{} % 1',
            '{} ^ 1',
            '{} / 1',
            '{} // 1',
            '{} & 1',
            '{} | 1',
            '{} ~ 1',
            '{} << 1',
            '{} >> 1'
        ]);
});


test('__eq', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local mt = {
            __eq = function (a, b)
                return true
            end
        }

        local t = {}

        setmetatable(t, mt)

        return t == {}
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_toboolean(L, -1)).toBe(true);
});


test('__lt', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local mt = {
            __lt = function (a, b)
                return true
            end
        }

        local t = {}

        setmetatable(t, mt)

        return t < {}
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_toboolean(L, -1)).toBe(true);
});


test('__le', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local mt = {
            __le = function (a, b)
                return true
            end
        }

        local t = {}

        setmetatable(t, mt)

        return t <= {}
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_toboolean(L, -1)).toBe(true);
});


test('__le that uses __lt', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local mt = {
            __lt = function (a, b)
                return false
            end
        }

        local t = {}

        setmetatable(t, mt)

        return {} <= t
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_toboolean(L, -1)).toBe(true);
});


test('__unm, __bnot', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local mt = {
            __unm = function (a)
                return "hello"
            end,

            __bnot = function (a)
                return "world"
            end
        }

        local t = {}

        setmetatable(t, mt)

        return -t, ~t
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('world');
    expect(lua_tojsstring(L, -2)).toBe('hello');
});


test('__len', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local mt = {
            __len = function (a)
                return "hello"
            end
        }

        local t = {}

        setmetatable(t, mt)

        return #t
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('hello');
});


test('__concat', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local mt = {
            __concat = function (a)
                return "hello"
            end
        }

        local t = {}

        setmetatable(t, mt)

        return t .. " world"
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('hello');
});


test('__call', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local mt = {
            __call = function (a, ...)
                return "hello", ...
            end
        }

        local t = {}

        setmetatable(t, mt)

        return t("world","wow")
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(L.stack.slice(L.top - 3, L.top).map(e => e.jsstring()))
        .toEqual(['hello', 'world', 'wow']);
});
