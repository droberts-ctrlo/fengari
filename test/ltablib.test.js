import { LUA_OK, lua_call, lua_tojsstring, lua_topointer, lua_tointeger } from '../src/lua.js';
import { luaL_newstate, luaL_loadstring } from '../src/lauxlib.js';
import { luaL_openlibs } from '../src/lualib.js';
import { to_luastring } from '../src/fengaricore.js';

const inttable2array = function(t) {
    let a = [];
    t.strong.forEach(function (v, k) {
        if (v.key.ttisnumber())
            a[k - 1] = v.value;
    });
    return a.map(e => e.value);
};

test('table.concat', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return table.concat({1, 2, 3, 4, 5, 6, 7}, ",", 3, 5)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('3,4,5');
});


test('table.pack', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return table.pack(1, 2, 3)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect([...lua_topointer(L, -1).strong.entries()]
        .filter(e => e[1].key.ttisnumber()) // Filter out the 'n' field
        .map(e => e[1].value.value).reverse()
    ).toEqual([1, 2, 3]);
});


test('table.unpack', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return table.unpack({1, 2, 3, 4, 5}, 2, 4)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tointeger(L, -3)).toBe(2);
    expect(lua_tointeger(L, -2)).toBe(3);
    expect(lua_tointeger(L, -1)).toBe(4);
});


test('table.insert', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local t = {1, 3, 4}
        table.insert(t, 5)
        table.insert(t, 2, 2)
        return t
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(
        [...lua_topointer(L, -1).strong.entries()]
            .filter(e => e[1].key.ttisnumber())
            .map(e => e[1].value.value).sort()
    ).toEqual([1, 2, 3, 4, 5]);
});


test('table.remove', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local t = {1, 2, 3, 3, 4, 4}
        table.remove(t)
        table.remove(t, 3)
        return t
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(
        [...lua_topointer(L, -1).strong.entries()]
            .filter(e => e[1].key.ttisnumber())
            .map(e => e[1].value.value).sort()
    ).toEqual([1, 2, 3, 4]);
});


test('table.move', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local t1 = {3, 4, 5}
        local t2 = {1, 2, nil, nil, nil, 6}
        return table.move(t1, 1, #t1, 3, t2)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(
        [...lua_topointer(L, -1).strong.entries()]
            .filter(e => e[1].key.ttisnumber())
            .map(e => e[1].value.value).sort()
    ).toEqual([1, 2, 3, 4, 5, 6]);
});


test('table.sort (<)', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local t = {3, 1, 5, ['just'] = 'tofuckitup', 2, 4}
        table.sort(t)
        return t
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(inttable2array(lua_topointer(L, -1)))
        .toEqual([1, 2, 3, 4, 5]);
});


test('table.sort with cmp function', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local t = {3, 1, 5, ['just'] = 'tofuckitup', 2, 4}
        table.sort(t, function (a, b)
            return a > b
        end)
        return t
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(inttable2array(lua_topointer(L, -1)))
        .toEqual([5, 4, 3, 2, 1]);
});
