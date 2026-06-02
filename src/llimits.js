const lua_assert = function (c) {
    if (!c) throw Error('assertion failed');
};
const _lua_assert = lua_assert;
export { _lua_assert as lua_assert };

const api_check = function (l, e, msg) {
    if (!e) throw Error(msg);
};
const _api_check = api_check;
export { _api_check as api_check };

const LUAI_MAXCCALLS = 200;
const _LUAI_MAXCCALLS = LUAI_MAXCCALLS;
export { _LUAI_MAXCCALLS as LUAI_MAXCCALLS };

/* minimum size for string buffer */
const LUA_MINBUFFER = 32;
const _LUA_MINBUFFER = LUA_MINBUFFER;
export { _LUA_MINBUFFER as LUA_MINBUFFER };

const luai_nummod = function (L, a, b) {
    let m = a % b;
    if ((m * b) < 0)
        m += b;
    return m;
};
const _luai_nummod = luai_nummod;
export { _luai_nummod as luai_nummod };

// If later integers are more than 32bit, LUA_MAXINTEGER will then be != MAX_INT
const MAX_INT = 2147483647;
const _MAX_INT = MAX_INT;
export { _MAX_INT as MAX_INT };
const MIN_INT = -2147483648;
const _MIN_INT = MIN_INT;
export { _MIN_INT as MIN_INT };
