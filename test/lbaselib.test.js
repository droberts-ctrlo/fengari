import { LUA_OK, lua_call, lua_tojsstring, lua_istable, lua_toboolean, lua_pcall, lua_tointeger, lua_topointer, lua_isnil, lua_tonumber } from '../src/lua.js';
import { luaL_newstate, luaL_loadstring } from '../src/lauxlib.js';
import { luaL_openlibs } from '../src/lualib.js';
import { to_luastring } from '../src/fengaricore.js';


test('print', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        print("hello", "world", 123)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }
});


test('setmetatable, getmetatable', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local mt = {
            __index = function ()
                return "hello"
            end
        }

        local t = {}

        setmetatable(t, mt);

        return t[1], getmetatable(t)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -2))
        .toBe('hello');

    expect(lua_istable(L, -1)).toBe(true);
});


test('rawequal', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local mt = {
            __eq = function ()
                return true
            end
        }

        local t1 = {}
        local t2 = {}

        setmetatable(t1, mt);

        return rawequal(t1, t2), t1 == t2
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_toboolean(L, -2)).toBe(false);

    expect(lua_toboolean(L, -1)).toBe(true);
});


test('rawset, rawget', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local mt = {
            __newindex = function (table, key, value)
                rawset(table, key, "hello")
            end
        }

        local t = {}

        setmetatable(t, mt);

        t["yo"] = "bye"
        rawset(t, "yoyo", "bye")

        return rawget(t, "yo"), t["yo"], rawget(t, "yoyo"), t["yoyo"]
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -4))
        .toBe('hello');

    expect(lua_tojsstring(L, -3))
        .toBe('hello');

    expect(lua_tojsstring(L, -2))
        .toBe('bye');

    expect(lua_tojsstring(L, -1))
        .toBe('bye');
});


test('type', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return type(1), type(true), type("hello"), type({}), type(nil)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -5))
        .toBe('number');

    expect(lua_tojsstring(L, -4))
        .toBe('boolean');

    expect(lua_tojsstring(L, -3))
        .toBe('string');

    expect(lua_tojsstring(L, -2))
        .toBe('table');

    expect(lua_tojsstring(L, -1))
        .toBe('nil');
});


test('error', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        error("you fucked up")
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        expect(() => {
            lua_call(L, 0, -1);
        }).toThrow(/you fucked up/);
    }
});


test('error, protected', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        error("you fucked up")
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_pcall(L, 0, -1, 0);
    }

    expect(lua_tojsstring(L, -1)).toMatch(/you fucked up/);
});


test('pcall', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local willFail = function ()
            error("you fucked up")
        end

        return pcall(willFail)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toMatch(/you fucked up/);
});


test('xpcall', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local willFail = function ()
            error("you fucked up")
        end

        local msgh = function (err)
            return "Something's wrong: " .. err
        end

        return xpcall(willFail, msgh)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toMatch(/Something's wrong: .*you fucked up/);
});


test('ipairs', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local t = {1, 2, 3, 4, 5, ['yo'] = 'lo'}

        local sum = 0
        for i, v in ipairs(t) do
            sum = sum + v
        end

        return sum
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tointeger(L, -1)).toBe(15);
});


test('select', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return {select('#', 1, 2, 3)}, {select(2, 1, 2, 3)}, {select(-2, 1, 2, 3)}
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect([...lua_topointer(L, -3).strong.entries()].map(e => e[1].value.value))
        .toEqual([3]);

    expect([...lua_topointer(L, -2).strong.entries()].map(e => e[1].value.value).sort())
        .toEqual([2, 3]);

    expect([...lua_topointer(L, -1).strong.entries()].map(e => e[1].value.value).sort())
        .toEqual([2, 3]);
});


test('tonumber', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return tonumber('foo'),
            tonumber('123'),
            tonumber('12.3'),
            tonumber('az', 36),
            tonumber('10', 2)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_isnil(L, -5)).toBe(true);
    expect(lua_tonumber(L, -4)).toBe(123);
    expect(lua_tonumber(L, -3)).toBe(12.3);
    expect(lua_tonumber(L, -2)).toBe(395);
    expect(lua_tonumber(L, -1)).toBe(2);
});


test('assert', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        assert(1 < 0, "this doesn't makes sense")
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_pcall(L, 0, -1, 0);
    }

    expect(lua_tojsstring(L, -1)).toMatch(/this doesn't makes sense/);
});


test('rawlen', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return rawlen({1, 2, 3}), rawlen('hello')
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tonumber(L, -2)).toBe(3);
    expect(lua_tonumber(L, -1)).toBe(5);
});


test('next', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local total = 0
        local t = {
            1,
            two = 2,
            3,
            four = 4
        }

        for k,v in next, t, nil do
            total = total + v
        end

        return total
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tonumber(L, -1)).toBe(10);
});


test('pairs', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local total = 0
        local t = {
            1,
            two = 2,
            3,
            four = 4
        }

        for k,v in pairs(t) do
            total = total + v
        end

        return total
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tonumber(L, -1)).toBe(10);
});


test('pairs with __pairs', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local total = 0

        local mt = {
            __pairs = function(t)
                return next, {5, 6, 7, 8}, nil
            end
        }

        local t = {
            1,
            two = 2,
            3,
            four = 4
        }

        setmetatable(t, mt)

        for k,v in pairs(t) do
            total = total + v
        end

        return total
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tonumber(L, -1)).toBe(26);
});
