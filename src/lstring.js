import { is_luastring, luastring_eq, luastring_from, to_luastring } from './defs.js';
import { lua_assert } from "./llimits.js";

class TString {

    constructor(L, str) {
        this.hash = null;
        this.realstring = str;
    }

    getstr() {
        return this.realstring;
    }

    tsslen() {
        return this.realstring.length;
    }

}

const luaS_eqlngstr = function (a, b) {
    lua_assert(a instanceof TString);
    lua_assert(b instanceof TString);
    return a == b || luastring_eq(a.realstring, b.realstring);
};

/* converts strings (arrays) to a consistent map key
   make sure this doesn't conflict with any of the anti-collision strategies in ltable */
const luaS_hash = function (str) {
    lua_assert(is_luastring(str));
    let len = str.length;
    let s = "|";
    for (let i = 0; i < len; i++)
        s += str[i].toString(16);
    return s;
};

const luaS_hashlongstr = function (ts) {
    lua_assert(ts instanceof TString);
    if (ts.hash === null) {
        ts.hash = luaS_hash(ts.getstr());
    }
    return ts.hash;
};

/* variant that takes ownership of array */
const luaS_bless = function (L, str) {
    lua_assert(str instanceof Uint8Array);
    return new TString(L, str);
};

/* makes a copy */
const luaS_new = function (L, str) {
    return luaS_bless(L, luastring_from(str));
};

/* takes a js string */
const luaS_newliteral = function (L, str) {
    return luaS_bless(L, to_luastring(str));
};

const _luaS_eqlngstr = luaS_eqlngstr;
export { _luaS_eqlngstr as luaS_eqlngstr };
const _luaS_hash = luaS_hash;
export { _luaS_hash as luaS_hash };
const _luaS_hashlongstr = luaS_hashlongstr;
export { _luaS_hashlongstr as luaS_hashlongstr };
const _luaS_bless = luaS_bless;
export { _luaS_bless as luaS_bless };
const _luaS_new = luaS_new;
export { _luaS_new as luaS_new };
const _luaS_newliteral = luaS_newliteral;
export { _luaS_newliteral as luaS_newliteral };
const _TString = TString;
export { _TString as TString };
