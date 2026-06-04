export const lua_assert = function (c) {
    if (!c) throw Error('assertion failed');
};

export const api_check = function (l, e, msg) {
    if (!e) throw Error(msg);
};

export const LUAI_MAXCCALLS = 200;

/* minimum size for string buffer */
export const LUA_MINBUFFER = 32;

export const luai_nummod = function (L, a, b) {
    let m = a % b;
    if ((m * b) < 0)
        m += b;
    return m;
};

// If later integers are more than 32bit, LUA_MAXINTEGER will then be != MAX_INT
export const MAX_INT = 2147483647;
export const MIN_INT = -2147483648;
