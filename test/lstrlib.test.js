import { LUA_OK, lua_call, lua_tointeger, lua_tojsstring, lua_tostring, lua_load, lua_toboolean, lua_gettop } from '../src/lua.js';
import { luaL_newstate, luaL_loadstring } from '../src/lauxlib.js';
import { luaL_openlibs } from '../src/lualib.js';
import { to_luastring } from '../src/fengaricore.js';

test('string.len', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local a = "world"
        return string.len("hello"), a:len()
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tointeger(L, -2)).toBe(5);
    expect(lua_tointeger(L, -1)).toBe(5);
});


test('string.char', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return string.char(104, 101, 108, 108, 111)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('hello');
});


test('string.upper, string.lower', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return string.upper("hello"), string.lower("HELLO")
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -2)).toBe('HELLO');
    expect(lua_tojsstring(L, -1)).toBe('hello');
});


test('string.rep', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return string.rep("hello", 3, ", ")
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('hello, hello, hello');
});


test('string.reverse', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return string.reverse("olleh")
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('hello');
});


test('string.byte', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return string.byte("hello", 2, 4)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tointeger(L, -3)).toBe(101);
    expect(lua_tointeger(L, -2)).toBe(108);
    expect(lua_tointeger(L, -1)).toBe(108);
});


test('string.format', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return string.format("%%%d %010d", 10, 23)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('%10 0000000023');
});


test('string.format', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return string.format("%07X", 0xFFFFFFF)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('FFFFFFF');
});


test('string.format', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return string.format("%q", 'a string with "quotes" and \\n new line')
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('"a string with \\"quotes\\" and \\\n new line"',
        'Correct element(s) on the stack'
    );
});


test('string.sub', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return string.sub("123456789",2,4),  -- "234"
            string.sub("123456789",7),       -- "789"
            string.sub("123456789",7,6),     --  ""
            string.sub("123456789",7,7),     -- "7"
            string.sub("123456789",0,0),     --  ""
            string.sub("123456789",-10,10),  -- "123456789"
            string.sub("123456789",1,9),     -- "123456789"
            string.sub("123456789",-10,-20), --  ""
            string.sub("123456789",-1),      -- "9"
            string.sub("123456789",-4),      -- "6789"
            string.sub("123456789",-6, -4)   -- "456"
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -11)).toBe('234');
    expect(lua_tojsstring(L, -10)).toBe('789');
    expect(lua_tojsstring(L, -9)).toBe('');
    expect(lua_tojsstring(L, -8)).toBe('7');
    expect(lua_tojsstring(L, -7)).toBe('');
    expect(lua_tojsstring(L, -6)).toBe('123456789');
    expect(lua_tojsstring(L, -5)).toBe('123456789');
    expect(lua_tojsstring(L, -4)).toBe('');
    expect(lua_tojsstring(L, -3)).toBe('9');
    expect(lua_tojsstring(L, -2)).toBe('6789');
    expect(lua_tojsstring(L, -1)).toBe('456');
});


test('string.dump', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local todump = function()
            local s = "hello"
            local i = 12
            local f = 12.5
            local b = true

            return s .. i .. f
        end

        return string.dump(todump)
    `;
    {
        luaL_openlibs(L);
        luaL_loadstring(L, to_luastring(luaCode.trim()));
        lua_call(L, 0, -1);
        let str = lua_tostring(L, -1);
        lua_load(L, function(L, s) {
            let r = s.str;
            s.str = null;
            return r;
        }, {str: str}, to_luastring('test'), to_luastring('binary'));
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -1)).toBe('hello1212.5');
});


test('string.pack/unpack/packsize', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local s1, n, s2 = "hello", 2, "you"
        local packed = string.pack("c5jc3", s1, n, s2)
        local us1, un, us2 = string.unpack("c5jc3", packed)
        return string.packsize("c5jc3"), s1 == us1 and n == un and s2 == us2
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tointeger(L, -2)).toBe(12);
    expect(lua_toboolean(L, -1)).toBe(true);
});


test('string.find without pattern', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return string.find("hello to you", " to ")
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tointeger(L, -2)).toBe(6);
    expect(lua_tointeger(L, -1)).toBe(9);
});


test('string.find with special pattern (issue #185)', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return string.find("-", "-")
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_gettop(L)).toBe(2);
    expect(lua_tointeger(L, -2)).toBe(1);
    expect(lua_tointeger(L, -1)).toBe(1);
});


test('string.match', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return string.match("foo: 123 bar: 456", "(%a+):%s*(%d+)")
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -2)).toBe('foo');
    expect(lua_tojsstring(L, -1)).toBe('123');
});


test('string.find', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return string.find("foo: 123 bar: 456", "(%a+):%s*(%d+)")
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tointeger(L, -4)).toBe(1);
    expect(lua_tointeger(L, -3)).toBe(8);
    expect(lua_tojsstring(L, -2)).toBe('foo');
    expect(lua_tojsstring(L, -1)).toBe('123');
});


test('string.gmatch', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local s = "hello world from Lua"
        local t = {}

        for w in string.gmatch(s, "%a+") do
            table.insert(t, w)
        end

        return table.unpack(t)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -4)).toBe('hello');
    expect(lua_tojsstring(L, -3)).toBe('world');
    expect(lua_tojsstring(L, -2)).toBe('from');
    expect(lua_tojsstring(L, -1)).toBe('Lua');
});


test('string.gsub', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return string.gsub("hello world", "(%w+)", "%1 %1")
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -2)).toBe('hello hello world world');
    expect(lua_tointeger(L, -1)).toBe(2);
});


test('string.gsub (number)', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return string.gsub("hello world", "%w+", "%0 %0", 1)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -2)).toBe('hello hello world');
    expect(lua_tointeger(L, -1)).toBe(1);
});


test('string.gsub (pattern)', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return string.gsub("hello world from Lua", "(%w+)%s*(%w+)", "%2 %1")
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -2)).toBe('world hello Lua from');
    expect(lua_tointeger(L, -1)).toBe(2);
});


test('string.gsub (function)', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        return string.gsub("4+5 = $return 4+5$", "%$(.-)%$", function (s)
            return load(s)()
        end)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -2)).toBe('4+5 = 9');
    expect(lua_tointeger(L, -1)).toBe(1);
});



test('string.gsub (table)', () => {
    let L = luaL_newstate();
    if (!L) throw Error('failed to create lua state');

    let luaCode = `
        local t = {name="lua", version="5.3"}
        return string.gsub("$name-$version.tar.gz", "%$(%w+)", t)
    `;
    {
        luaL_openlibs(L);
        expect(luaL_loadstring(L, to_luastring(luaCode))).toBe(LUA_OK);
        lua_call(L, 0, -1);
    }

    expect(lua_tojsstring(L, -2)).toBe('lua-5.3.tar.gz');
    expect(lua_tointeger(L, -1)).toBe(2);
});
