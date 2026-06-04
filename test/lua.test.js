import { LUA_OK, lua_call } from '../src/lua.js';
import { luaL_newstate, luaL_loadstring } from '../src/lauxlib.js';
import { luaL_openlibs } from '../src/lualib.js';
import { to_luastring } from '../src/fengaricore.js';

// TODO: remove
test.skip('locals.lua', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        _soft = true
        require = function(lib) return _G[lib] end  -- NYI
        return dofile("tests/lua-tests/locals.lua")
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }
});


test.skip('constructs.lua', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        _soft = true
        require = function(lib) return _G[lib] end  -- NYI
        return dofile("tests/lua-tests/constructs.lua")
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }
});


test.skip('strings.lua', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return dofile("tests/lua-tests/strings.lua")
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }
});


test('__newindex leaves nils', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local x = setmetatable({}, {
          __newindex = function(t,k,v)
            rawset(t,'_'..k,v)
          end
        })
        x.test = 4
        for k,v in pairs(x) do
          assert(k ~= "test", "found phantom key")
        end
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }
});
