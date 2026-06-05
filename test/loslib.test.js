import {
    lua_call,
    lua_isinteger,
    lua_isnumber,
    lua_isstring,
    LUA_OK,
    lua_tointeger,
    lua_tojsstring
} from '../src/lua.js';
import {luaL_loadstring, luaL_newstate} from '../src/lauxlib.js';
import {luaL_openlibs} from '../src/lualib.js';
import {to_luastring} from '../src/fengaricore.js';

test('os.time', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return os.time()
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_isinteger(L, -1)).toBe(true);
});


test('os.time (with format)', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return os.time({
            day = 8,
            month = 2,
            year = 2015
        })
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tointeger(L, -1))
        .toBe(new Date(2015, 1, 8, 12, 0, 0, 0).getTime() / 1000);
});


test('os.difftime', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local t1 = os.time()
        local t2 = os.time()
        return os.difftime(t2, t1)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_isnumber(L, -1)).toBe(true);
});


test('os.date', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return os.date('%Y-%m-%d', os.time({
            day = 8,
            month = 2,
            year = 2015
        }))
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('2015-02-08');
});


test('os.date normalisation', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return os.date('%Y-%m-%d', os.time({
            day = 0,
            month = 0,
            year = 2014
        }))
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('2013-11-30');
});


test('os.time normalisation of table', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local t = {
            day = 20,
            month = 2,
            year = 2018
        }
        os.time(t)
        assert(t.day == 20, "unmodified day")
        assert(t.month == 2, "unmodified month")
        assert(t.year == 2018, "unmodified year")
        assert(t.wday == 3, "correct wday")
        assert(t.yday == 51, "correct yday")
    `;
    luaL_openlibs(L);
    expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
    lua_call(L, 0, 0);
});


test('os.setlocale', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        assert("C" == os.setlocale())
        assert("C" == os.setlocale(""))
        assert("C" == os.setlocale("C"))
        assert("C" == os.setlocale("POSIX"))
        assert(nil == os.setlocale("any_other_locale"))
    `;
    luaL_openlibs(L);
    expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
    lua_call(L, 0, 0);
});


test('os.getenv', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return os.getenv('PATH')
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_isstring(L, -1)).toBe(true);
});
