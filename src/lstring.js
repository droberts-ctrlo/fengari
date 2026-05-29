import {is_luastring, luastring_eq, luastring_from, to_luastring} from "./defs.js";
import {lua_assert} from "./llimits.js";

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

export const luaS_eqlngstr = function(a, b) {
    lua_assert(a instanceof TString);
    lua_assert(b instanceof TString);
    return a == b || luastring_eq(a.realstring, b.realstring);
};

/* converts strings (arrays) to a consistent map key
   make sure this doesn't conflict with any of the anti-collision strategies in ltable */
const luaS_hash = function(str) {
    lua_assert(is_luastring(str));
    let len = str.length;
    let s = '|';
    for (let i=0; i<len; i++)
        s += str[i].toString(16);
    return s;
};

export const luaS_hashlongstr = function(ts) {
    lua_assert(ts instanceof TString);
    if(ts.hash === null) {
        ts.hash = luaS_hash(ts.getstr());
    }
    return ts.hash;
};

/* variant that takes ownership of array */
export const luaS_bless = function(L, str) {
    lua_assert(str instanceof Uint8Array);
    return new TString(L, str);
};

/* makes a copy */
export const luaS_new = function(L, str) {
    return luaS_bless(L, luastring_from(str));
};

/* takes a js string */
export const luaS_newliteral = function(L, str) {
    return luaS_bless(L, to_luastring(str));
};
