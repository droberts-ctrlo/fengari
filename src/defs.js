/*
 * Fengari specific string conversion functions
 */

import { LUAI_MAXSTACK } from './common.js';

export { LUAI_MAXSTACK };

export const luastring_from = (typeof Uint8Array.from === "function") ?
    Uint8Array.from.bind(Uint8Array) :
    function (a) {
        let i = 0;
        let len = a.length;
        let r = new Uint8Array(len);
        while (len > i) r[i] = a[i++];
        return r;
    };

export const luastring_indexOf = (typeof (new Uint8Array().indexOf) === "function") ?
    function (s, v, i) {
        return s.indexOf(v, i);
    } :
    /* Browsers that don't support Uint8Array.indexOf seem to allow using Array.indexOf on Uint8Array objects e.g. IE11 */
    function (s, v, i) {
        let array_indexOf = [].indexOf;
        if (array_indexOf.call(new Uint8Array(1), 0) !== 0) throw Error("missing .indexOf");
        return array_indexOf.call(s, v, i);
    };


export const luastring_of = (typeof Uint8Array.of === "function") ?
    Uint8Array.of.bind(Uint8Array) :
    function () {
        return luastring_from(arguments);
    };

export function is_luastring(s) {
    return s instanceof Uint8Array;
};

/* test two lua strings for equality */
export function luastring_eq(a, b) {
    if (a !== b) {
        let len = a.length;
        if (len !== b.length) return false;
        /* XXX: Should this be a constant time algorithm? */
        for (let i = 0; i < len; i++)
            if (a[i] !== b[i]) return false;
    }
    return true;
};

const unicode_error_message = "cannot convert invalid utf8 to javascript string";
export function to_jsstring(value, from, to, replacement_char) {
    if (!is_luastring(value)) throw new TypeError("to_jsstring expects a Uint8Array");

    if (to === void 0) {
        to = value.length;
    } else {
        to = Math.min(value.length, to);
    }

    let str = "";
    for (let i = (from !== void 0 ? from : 0); i < to;) {
        let u0 = value[i++];
        if (u0 < 0x80) {
            /* single byte sequence */
            str += String.fromCharCode(u0);
        } else if (u0 < 0xC2 || u0 > 0xF4) {
            if (!replacement_char) throw RangeError(unicode_error_message);
            str += "�";
        } else if (u0 <= 0xDF) {
            /* two byte sequence */
            if (i >= to) {
                if (!replacement_char) throw RangeError(unicode_error_message);
                str += "�";
                continue;
            }
            let u1 = value[i++];
            if ((u1 & 0xC0) !== 0x80) {
                if (!replacement_char) throw RangeError(unicode_error_message);
                str += "�";
                continue;
            }
            str += String.fromCharCode(((u0 & 0x1F) << 6) + (u1 & 0x3F));
        } else if (u0 <= 0xEF) {
            /* three byte sequence */
            if (i + 1 >= to) {
                if (!replacement_char) throw RangeError(unicode_error_message);
                str += "�";
                continue;
            }
            let u1 = value[i++];
            if ((u1 & 0xC0) !== 0x80) {
                if (!replacement_char) throw RangeError(unicode_error_message);
                str += "�";
                continue;
            }
            let u2 = value[i++];
            if ((u2 & 0xC0) !== 0x80) {
                if (!replacement_char) throw RangeError(unicode_error_message);
                str += "�";
                continue;
            }
            let u = ((u0 & 0x0F) << 12) + ((u1 & 0x3F) << 6) + (u2 & 0x3F);
            if (u <= 0xFFFF) { /* BMP codepoint */
                str += String.fromCharCode(u);
            } else { /* Astral codepoint */
                u -= 0x10000;
                let s1 = (u >> 10) + 0xD800;
                let s2 = (u % 0x400) + 0xDC00;
                str += String.fromCharCode(s1, s2);
            }
        } else {
            /* four byte sequence */
            if (i + 2 >= to) {
                if (!replacement_char) throw RangeError(unicode_error_message);
                str += "�";
                continue;
            }
            let u1 = value[i++];
            if ((u1 & 0xC0) !== 0x80) {
                if (!replacement_char) throw RangeError(unicode_error_message);
                str += "�";
                continue;
            }
            let u2 = value[i++];
            if ((u2 & 0xC0) !== 0x80) {
                if (!replacement_char) throw RangeError(unicode_error_message);
                str += "�";
                continue;
            }
            let u3 = value[i++];
            if ((u3 & 0xC0) !== 0x80) {
                if (!replacement_char) throw RangeError(unicode_error_message);
                str += "�";
                continue;
            }
            /* Has to be astral codepoint */
            let u = ((u0 & 0x07) << 18) + ((u1 & 0x3F) << 12) + ((u2 & 0x3F) << 6) + (u3 & 0x3F);
            u -= 0x10000;
            let s1 = (u >> 10) + 0xD800;
            let s2 = (u % 0x400) + 0xDC00;
            str += String.fromCharCode(s1, s2);
        }
    }
    return str;
};

/* bytes allowed unescaped in a uri */
const uri_allowed = (";,/?:@&=+$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,-_.!~*'()#").split('').reduce(function (uri_allowed, c) {
    uri_allowed[c.charCodeAt(0)] = true;
    return uri_allowed;
}, {});

/* utility function to convert a lua string to a js string with uri escaping */
export function to_uristring(a) {
    if (!is_luastring(a)) throw new TypeError("to_uristring expects a Uint8Array");
    let s = "";
    for (let i = 0; i < a.length; i++) {
        let v = a[i];
        if (uri_allowed[v]) {
            s += String.fromCharCode(v);
        } else {
            s += "%" + (v < 0x10 ? "0" : "") + v.toString(16);
        }
    }
    return s;
};

const to_luastring_cache = {};

export function to_luastring(str, cache) {
    if (typeof str !== "string") throw new TypeError("to_luastring expects a javascript string");

    if (cache) {
        let cached = to_luastring_cache[str];
        if (is_luastring(cached)) return cached;
    }

    let len = str.length;
    let outU8Array = Array(len); /* array is at *least* going to be length of string */
    let outIdx = 0;
    for (let i = 0; i < len; ++i) {
        let u = str.charCodeAt(i);
        if (u <= 0x7F) {
            outU8Array[outIdx++] = u;
        } else if (u <= 0x7FF) {
            outU8Array[outIdx++] = 0xC0 | (u >> 6);
            outU8Array[outIdx++] = 0x80 | (u & 63);
        } else {
            /* This part is to work around possible lack of String.codePointAt */
            if (u >= 0xD800 && u <= 0xDBFF && (i + 1) < len) {
                /* is first half of surrogate pair */
                let v = str.charCodeAt(i + 1);
                if (v >= 0xDC00 && v <= 0xDFFF) {
                    /* is valid low surrogate */
                    i++;
                    u = (u - 0xD800) * 0x400 + v + 0x2400;
                }
            }
            if (u <= 0xFFFF) {
                outU8Array[outIdx++] = 0xE0 | (u >> 12);
                outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
                outU8Array[outIdx++] = 0x80 | (u & 63);
            } else {
                outU8Array[outIdx++] = 0xF0 | (u >> 18);
                outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
                outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
                outU8Array[outIdx++] = 0x80 | (u & 63);
            }
        }
    }
    outU8Array = luastring_from(outU8Array);

    if (cache) to_luastring_cache[str] = outU8Array;

    return outU8Array;
};

export function from_userstring(str) {
    if (!is_luastring(str)) {
        if (typeof str === "string") {
            str = to_luastring(str);
        } else {
            throw new TypeError("expects an array of bytes or javascript string");
        }
    }
    return str;
};

/* mark for precompiled code ('<esc>Lua') */
export const LUA_SIGNATURE = to_luastring("\x1bLua");

export const LUA_VERSION_MAJOR = "5";
export const LUA_VERSION_MINOR = "3";
export const LUA_VERSION_NUM = 503;
export const LUA_VERSION_RELEASE = "4";

export const LUA_VERSION = "Lua " + LUA_VERSION_MAJOR + "." + LUA_VERSION_MINOR;
export const LUA_RELEASE = LUA_VERSION + "." + LUA_VERSION_RELEASE;
export const LUA_COPYRIGHT = LUA_RELEASE + "  Copyright (C) 1994-2017 Lua.org, PUC-Rio";
export const LUA_AUTHORS = "R. Ierusalimschy, L. H. de Figueiredo, W. Celes";

export const thread_status = {
    LUA_OK: 0,
    LUA_YIELD: 1,
    LUA_ERRRUN: 2,
    LUA_ERRSYNTAX: 3,
    LUA_ERRMEM: 4,
    LUA_ERRGCMM: 5,
    LUA_ERRERR: 6
};

const constant_types = {
    LUA_TNONE: -1,
    LUA_TNIL: 0,
    LUA_TBOOLEAN: 1,
    LUA_TLIGHTUSERDATA: 2,
    LUA_TNUMBER: 3,
    LUA_TSTRING: 4,
    LUA_TTABLE: 5,
    LUA_TFUNCTION: 6,
    LUA_TUSERDATA: 7,
    LUA_TTHREAD: 8,
    LUA_NUMTAGS: 9
};

constant_types.LUA_TSHRSTR = constant_types.LUA_TSTRING | (0 << 4);  /* short strings */
constant_types.LUA_TLNGSTR = constant_types.LUA_TSTRING | (1 << 4);  /* long strings */

constant_types.LUA_TNUMFLT = constant_types.LUA_TNUMBER | (0 << 4);  /* float numbers */
constant_types.LUA_TNUMINT = constant_types.LUA_TNUMBER | (1 << 4);  /* integer numbers */

constant_types.LUA_TLCL = constant_types.LUA_TFUNCTION | (0 << 4);  /* Lua closure */
constant_types.LUA_TLCF = constant_types.LUA_TFUNCTION | (1 << 4);  /* light C function */
constant_types.LUA_TCCL = constant_types.LUA_TFUNCTION | (2 << 4);  /* C closure */

export { constant_types };

/*
** Comparison and arithmetic functions
*/

export const LUA_OPADD = 0;   /* ORDER TM, ORDER OP */
export const LUA_OPSUB = 1;
export const LUA_OPMUL = 2;
export const LUA_OPMOD = 3;
export const LUA_OPPOW = 4;
export const LUA_OPDIV = 5;
export const LUA_OPIDIV = 6;
export const LUA_OPBAND = 7;
export const LUA_OPBOR = 8;
export const LUA_OPBXOR = 9;
export const LUA_OPSHL = 10;
export const LUA_OPSHR = 11;
export const LUA_OPUNM = 12;
export const LUA_OPBNOT = 13;

export const LUA_OPEQ = 0;
export const LUA_OPLT = 1;
export const LUA_OPLE = 2;

export const LUA_MINSTACK = 20;

export const LUA_REGISTRYINDEX = -LUAI_MAXSTACK - 1000;

export function lua_upvalueindex(i) {
    return LUA_REGISTRYINDEX - i;
};

/* predefined values in the registry */
export const LUA_RIDX_MAINTHREAD = 1;
export const LUA_RIDX_GLOBALS = 2;
export const LUA_RIDX_LAST = LUA_RIDX_GLOBALS;

export class lua_Debug {
    constructor() {
        this.event = NaN;
        this.name = null;           /* (n) */
        this.namewhat = null;       /* (n) 'global', 'local', 'field', 'method' */
        this.what = null;           /* (S) 'Lua', 'C', 'main', 'tail' */
        this.source = null;         /* (S) */
        this.currentline = NaN;     /* (l) */
        this.linedefined = NaN;     /* (S) */
        this.lastlinedefined = NaN; /* (S) */
        this.nups = NaN;            /* (u) number of upvalues */
        this.nparams = NaN;         /* (u) number of parameters */
        this.isvararg = NaN;        /* (u) */
        this.istailcall = NaN;      /* (t) */
        this.short_src = null;      /* (S) */
        /* private part */
        this.i_ci = null;           /* active function */
    }
}

/*
** Event codes
*/
export const LUA_HOOKCALL = 0;
export const LUA_HOOKRET = 1;
export const LUA_HOOKLINE = 2;
export const LUA_HOOKCOUNT = 3;
export const LUA_HOOKTAILCALL = 4;


/*
** Event masks
*/
export const LUA_MASKCALL = (1 << LUA_HOOKCALL);
export const LUA_MASKRET = (1 << LUA_HOOKRET);
export const LUA_MASKLINE = (1 << LUA_HOOKLINE);
export const LUA_MASKCOUNT = (1 << LUA_HOOKCOUNT);

export const LUA_MULTRET = -1;
