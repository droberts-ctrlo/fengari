import * as defs from './defs.js';
import * as ljstype from './ljstype.js';
import * as ldebug from './ldebug.js';
import * as ldo from './ldo.js';
import * as lstate from './lstate.js';
import * as lstring from './lstring.js';
import * as ltable from './ltable.js';
import * as luaconf from './luaconf.js';
import * as lvm from './lvm.js';
import * as llimits from './llimits.js';
import * as ltm from './ltm.js';

export const {
    LUA_NUMTAGS,
    LUA_TBOOLEAN,
    LUA_TCCL,
    LUA_TFUNCTION,
    LUA_TLCF,
    LUA_TLCL,
    LUA_TLIGHTUSERDATA,
    LUA_TLNGSTR,
    LUA_TNIL,
    LUA_TNUMBER,
    LUA_TNUMFLT,
    LUA_TNUMINT,
    LUA_TSHRSTR,
    LUA_TSTRING,
    LUA_TTABLE,
    LUA_TTHREAD,
    LUA_TUSERDATA
} = defs.constant_types;

export const LUA_TPROTO = LUA_NUMTAGS;
export const LUA_TDEADKEY = LUA_NUMTAGS + 1;

export class TValue {

    constructor(type, value) {
        this.type = type;
        this.value = value;
    }

    /* type tag of a TValue (bits 0-3 for tags + variant bits 4-5) */
    ttype() {
        return this.type & 0x3F;
    }

    /* type tag of a TValue with no variants (bits 0-3) */
    ttnov() {
        return this.type & 0x0F;
    }

    checktag(t) {
        return this.type === t;
    }

    checktype(t) {
        return this.ttnov() === t;
    }

    ttisnumber() {
        return this.checktype(LUA_TNUMBER);
    }

    ttisfloat() {
        return this.checktag(LUA_TNUMFLT);
    }

    ttisinteger() {
        return this.checktag(LUA_TNUMINT);
    }

    ttisnil() {
        return this.checktag(LUA_TNIL);
    }

    ttisboolean() {
        return this.checktag(LUA_TBOOLEAN);
    }

    ttislightuserdata() {
        return this.checktag(LUA_TLIGHTUSERDATA);
    }

    ttisstring() {
        return this.checktype(LUA_TSTRING);
    }

    ttisshrstring() {
        return this.checktag(LUA_TSHRSTR);
    }

    ttislngstring() {
        return this.checktag(LUA_TLNGSTR);
    }

    ttistable() {
        return this.checktag(LUA_TTABLE);
    }

    ttisfunction() {
        return this.checktype(LUA_TFUNCTION);
    }

    ttisclosure() {
        return (this.type & 0x1F) === LUA_TFUNCTION;
    }

    ttisCclosure() {
        return this.checktag(LUA_TCCL);
    }

    ttisLclosure() {
        return this.checktag(LUA_TLCL);
    }

    ttislcf() {
        return this.checktag(LUA_TLCF);
    }

    ttisfulluserdata() {
        return this.checktag(LUA_TUSERDATA);
    }

    ttisthread() {
        return this.checktag(LUA_TTHREAD);
    }

    ttisdeadkey() {
        return this.checktag(LUA_TDEADKEY);
    }

    l_isfalse() {
        return this.ttisnil() || (this.ttisboolean() && this.value === false);
    }

    setfltvalue(x) {
        this.type = LUA_TNUMFLT;
        this.value = x;
    }

    chgfltvalue(x) {
        llimits.lua_assert(this.type === LUA_TNUMFLT);
        this.value = x;
    }

    setivalue(x) {
        this.type = LUA_TNUMINT;
        this.value = x;
    }

    chgivalue(x) {
        llimits.lua_assert(this.type === LUA_TNUMINT);
        this.value = x;
    }

    setnilvalue() {
        this.type = LUA_TNIL;
        this.value = null;
    }

    setfvalue(x) {
        this.type = LUA_TLCF;
        this.value = x;
    }

    setpvalue(x) {
        this.type = LUA_TLIGHTUSERDATA;
        this.value = x;
    }

    setbvalue(x) {
        this.type = LUA_TBOOLEAN;
        this.value = x;
    }

    setsvalue(x) {
        this.type = LUA_TLNGSTR; /* LUA_TSHRSTR? */
        this.value = x;
    }

    setuvalue(x) {
        this.type = LUA_TUSERDATA;
        this.value = x;
    }

    setthvalue(x) {
        this.type = LUA_TTHREAD;
        this.value = x;
    }

    setclLvalue(x) {
        this.type = LUA_TLCL;
        this.value = x;
    }

    setclCvalue(x) {
        this.type = LUA_TCCL;
        this.value = x;
    }

    sethvalue(x) {
        this.type = LUA_TTABLE;
        this.value = x;
    }

    setdeadvalue() {
        this.type = LUA_TDEADKEY;
        this.value = null;
    }

    setfrom(tv) { /* in lua C source setobj2t is often used for this */
        this.type = tv.type;
        this.value = tv.value;
    }

    tsvalue() {
        llimits.lua_assert(this.ttisstring());
        return this.value;
    }

    svalue() {
        return this.tsvalue().getstr();
    }

    vslen() {
        return this.tsvalue().tsslen();
    }

    jsstring(from, to) {
        return defs.to_jsstring(this.svalue(), from, to, true);
    }
}

export const pushobj2s = function (L, tv) {
    L.stack[L.top++] = new TValue(tv.type, tv.value);
};
export const pushsvalue2s = function (L, ts) {
    L.stack[L.top++] = new TValue(LUA_TLNGSTR, ts);
};
/* from stack to (same) stack */
export const setobjs2s = function (L, newidx, oldidx) {
    L.stack[newidx].setfrom(L.stack[oldidx]);
};
/* to stack (not from same stack) */
export const setobj2s = function (L, newidx, oldtv) {
    L.stack[newidx].setfrom(oldtv);
};
export const setsvalue2s = function (L, newidx, ts) {
    L.stack[newidx].setsvalue(ts);
};

const luaO_nilobject = new TValue(LUA_TNIL, null);
Object.freeze(luaO_nilobject);

export { luaO_nilobject };

export class LClosure {

    constructor(L, n) {
        this.id = L.l_G.id_counter++;

        this.p = null;
        this.nupvalues = n;
        this.upvals = new Array(n); /* list of upvalues. initialised in luaF_initupvals */
    }

}

export class CClosure {

    constructor(L, f, n) {
        this.id = L.l_G.id_counter++;

        this.f = f;
        this.nupvalues = n;
        this.upvalue = new Array(n); /* list of upvalues as TValues */
        while (n--) {
            this.upvalue[n] = new TValue(LUA_TNIL, null);
        }
    }

}

export class Udata {

    constructor(L, size) {
        this.id = L.l_G.id_counter++;

        this.metatable = null;
        this.uservalue = new TValue(LUA_TNIL, null);
        this.len = size;
        this.data = Object.create(null); // ignores size argument
    }

}

/*
** Description of a local variable for function prototypes
** (used for debug information)
*/
export class LocVar {
    constructor() {
        this.varname = null;
        this.startpc = NaN;  /* first point where variable is active */
        this.endpc = NaN;    /* first point where variable is dead */
    }
}

export const RETS = defs.to_luastring('...');
export const PRE = defs.to_luastring('[string "');
export const POS = defs.to_luastring('"]');

export const luaO_chunkid = function (source, bufflen) {
    let l = source.length;
    let out;
    if (source[0] === 61 /* ('=').charCodeAt(0) */) {  /* 'literal' source */
        if (l < bufflen) {  /* small enough? */
            out = new Uint8Array(l - 1);
            out.set(source.subarray(1));
        } else {  /* truncate it */
            out = new Uint8Array(bufflen);
            out.set(source.subarray(1, bufflen + 1));
        }
    } else if (source[0] === 64 /* ('@').charCodeAt(0) */) {  /* file name */
        if (l <= bufflen) {  /* small enough? */
            out = new Uint8Array(l - 1);
            out.set(source.subarray(1));
        } else {  /* add '...' before rest of name */
            out = new Uint8Array(bufflen);
            out.set(RETS);
            bufflen -= RETS.length;
            out.set(source.subarray(l - bufflen), RETS.length);
        }
    } else {  /* string; format as [string "source"] */
        out = new Uint8Array(bufflen);
        let nli = defs.luastring_indexOf(source, 10 /* ('\n').charCodeAt(0) */);  /* find first new line (if any) */
        out.set(PRE);  /* add prefix */
        let out_i = PRE.length;
        bufflen -= PRE.length + RETS.length + POS.length;  /* save space for prefix+suffix */
        if (l < bufflen && nli === -1) {  /* small one-line source? */
            out.set(source, out_i);  /* keep it */
            out_i += source.length;
        } else {
            if (nli !== -1) l = nli;  /* stop at first newline */
            if (l > bufflen) l = bufflen;
            out.set(source.subarray(0, l), out_i);
            out_i += l;
            out.set(RETS, out_i);
            out_i += RETS.length;
        }
        out.set(POS, out_i);
        out_i += POS.length;
        out = out.subarray(0, out_i);
    }
    return out;
};

export const luaO_hexavalue = function (c) {
    if (ljstype.lisdigit(c)) return c - 48;
    else return (c & 0xdf) - 55;
};

export const UTF8BUFFSZ = 8;

export const luaO_utf8esc = function (buff, x) {
    let n = 1;  /* number of bytes put in buffer (backwards) */
    llimits.lua_assert(x <= 0x10FFFF);
    if (x < 0x80)  /* ascii? */
        buff[UTF8BUFFSZ - 1] = x;
    else {  /* need continuation bytes */
        let mfb = 0x3f;  /* maximum that fits in first byte */
        do {
            buff[UTF8BUFFSZ - (n++)] = 0x80 | (x & 0x3f);
            x >>= 6;  /* remove added bits */
            mfb >>= 1;  /* now there is one less bit available in first byte */
        } while (x > mfb);  /* still needs continuation byte? */
        buff[UTF8BUFFSZ - n] = (~mfb << 1) | x;  /* add first byte */
    }
    return n;
};

/* maximum number of significant digits to read (to avoid overflows
   even with single floats) */
export const MAXSIGDIG = 30;

/*
** convert an hexadecimal numeric string to a number, following
** C99 specification for 'strtod'
*/
export const lua_strx2number = function (s) {
    let i = 0;
    let r = 0.0;  /* result (accumulator) */
    let sigdig = 0;  /* number of significant digits */
    let nosigdig = 0;  /* number of non-significant digits */
    let e = 0;  /* exponent correction */
    let neg;  /* 1 if number is negative */
    let hasdot = false;  /* true after seen a dot */
    while (ljstype.lisspace(s[i])) i++;  /* skip initial spaces */
    if ((neg = (s[i] === 45 /* ('-').charCodeAt(0) */))) i++;  /* check signal */
    else if (s[i] === 43 /* ('+').charCodeAt(0) */) i++;
    if (!(s[i] === 48 /* ('0').charCodeAt(0) */ && (s[i + 1] === 120 /* ('x').charCodeAt(0) */ || s[i + 1] === 88 /* ('X').charCodeAt(0) */)))  /* check '0x' */
        return null;  /* invalid format (no '0x') */
    for (i += 2; ; i++) {  /* skip '0x' and read numeral */
        if (s[i] === 46 /* ('.').charCodeAt(0) i.e. dot/lua_getlocaledecpoint(); */) {
            if (hasdot) break;  /* second dot? stop loop */
            else hasdot = true;
        } else if (ljstype.lisxdigit(s[i])) {
            if (sigdig === 0 && s[i] === 48 /* ('0').charCodeAt(0) */)  /* non-significant digit (zero)? */
                nosigdig++;
            else if (++sigdig <= MAXSIGDIG)  /* can read it without overflow? */
                r = (r * 16) + luaO_hexavalue(s[i]);
            else e++; /* too many digits; ignore, but still count for exponent */
            if (hasdot) e--;  /* decimal digit? correct exponent */
        } else break;  /* neither a dot nor a digit */
    }

    if (nosigdig + sigdig === 0)  /* no digits? */
        return null;  /* invalid format */
    e *= 4;  /* each digit multiplies/divides value by 2^4 */
    if (s[i] === 112 /* ('p').charCodeAt(0) */ || s[i] === 80 /* ('P').charCodeAt(0) */) {  /* exponent part? */
        let exp1 = 0;  /* exponent value */
        let neg1;  /* exponent signal */
        i++;  /* skip 'p' */
        if ((neg1 = (s[i] === 45 /* ('-').charCodeAt(0) */))) i++;  /* signal */
        else if (s[i] === 43 /* ('+').charCodeAt(0) */) i++;
        if (!ljstype.lisdigit(s[i]))
            return null;  /* invalid; must have at least one digit */
        while (ljstype.lisdigit(s[i]))  /* read exponent */
            exp1 = exp1 * 10 + s[i++] - 48 /* ('0').charCodeAt(0) */;
        if (neg1) exp1 = -exp1;
        e += exp1;
    }
    if (neg) r = -r;
    return {
        n: luaconf.ldexp(r, e),
        i: i
    };
};

export const lua_str2number = function (s) {
    try {
        s = defs.to_jsstring(s);
    } catch (e) {
        return null;
    }
    /* use a regex to validate number and also to get length
       parseFloat ignores trailing junk */
    let r = /^[\t\v\f \n\r]*[+-]?(?:[0-9]+\.?[0-9]*|\.[0-9]*)(?:[eE][+-]?[0-9]+)?/.exec(s);
    if (!r)
        return null;
    let flt = parseFloat(r[0]);
    return !isNaN(flt) ? { n: flt, i: r[0].length } : null;
};

export const l_str2dloc = function (s, mode) {
    let result = mode === 'x' ? lua_strx2number(s) : lua_str2number(s); /* try to convert */
    if (result === null) return null;
    while (ljstype.lisspace(s[result.i])) result.i++;  /* skip trailing spaces */
    return (result.i === s.length || s[result.i] === 0) ? result : null;  /* OK if no trailing characters */
};

export const SIGILS = [
    46  /* (".").charCodeAt(0) */,
    120 /* ("x").charCodeAt(0) */,
    88  /* ("X").charCodeAt(0) */,
    110 /* ("n").charCodeAt(0) */,
    78  /* ("N").charCodeAt(0) */
];
export const modes = {
    [46]: '.',
    [120]: 'x',
    [88]: 'x',
    [110]: 'n',
    [78]: 'n'
};
export const l_str2d = function (s) {
    let l = s.length;
    let pmode = 0;
    for (let i = 0; i < l; i++) {
        let v = s[i];
        if (SIGILS.indexOf(v) !== -1) {
            pmode = v;
            break;
        }
    }
    let mode = modes[pmode];
    if (mode === 'n')  /* reject 'inf' and 'nan' */
        return null;
    // if (end === null) {   /* failed? may be a different locale */
    //     throw new Error("Locale not available to handle number"); // TODO
    // }
    return l_str2dloc(s, mode);
};

export const MAXBY10 = Math.floor(llimits.MAX_INT / 10);
export const MAXLASTD = llimits.MAX_INT % 10;

export const l_str2int = function (s) {
    let i = 0;
    let a = 0;
    let empty = true;
    let neg;

    while (ljstype.lisspace(s[i])) i++;  /* skip initial spaces */
    if ((neg = (s[i] === 45 /* ('-').charCodeAt(0) */))) i++;
    else if (s[i] === 43 /* ('+').charCodeAt(0) */) i++;
    if (s[i] === 48 /* ('0').charCodeAt(0) */ && (s[i + 1] === 120 /* ('x').charCodeAt(0) */ || s[i + 1] === 88 /* ('X').charCodeAt(0) */)) {  /* hex? */
        i += 2;  /* skip '0x' */
        for (; i < s.length && ljstype.lisxdigit(s[i]); i++) {
            a = (a * 16 + luaO_hexavalue(s[i])) | 0;
            empty = false;
        }
    } else {  /* decimal */
        for (; i < s.length && ljstype.lisdigit(s[i]); i++) {
            let d = s[i] - 48 /* ('0').charCodeAt(0) */;
            if (a >= MAXBY10 && (a > MAXBY10 || d > MAXLASTD + neg))  /* overflow? */
                return null;  /* do not accept it (as integer) */
            a = (a * 10 + d) | 0;
            empty = false;
        }
    }
    while (i < s.length && ljstype.lisspace(s[i])) i++;  /* skip trailing spaces */
    if (empty || (i !== s.length && s[i] !== 0)) return null;  /* something wrong in the numeral */
    else {
        return {
            n: (neg ? -a : a) | 0,
            i: i
        };
    }
};

export const luaO_str2num = function (s, o) {
    let s2i = l_str2int(s);
    if (s2i !== null) {   /* try as an integer */
        o.setivalue(s2i.n);
        return s2i.i + 1;
    } else {   /* else try as a float */
        s2i = l_str2d(s);
        if (s2i !== null) {
            o.setfltvalue(s2i.n);
            return s2i.i + 1;
        } else
            return 0;  /* conversion failed */
    }
};

export const luaO_tostring = function (L, obj) {
    let buff;
    if (obj.ttisinteger())
        buff = defs.to_luastring(luaconf.lua_integer2str(obj.value));
    else {
        let str = luaconf.lua_number2str(obj.value);
        if (!luaconf.LUA_COMPAT_FLOATSTRING && /^[-0123456789]+$/.test(str)) {  /* looks like an int? */
            str += '.0'; /* adds '.0' to result: lua_getlocaledecpoint removed as optimisation */
        }
        buff = defs.to_luastring(str);
    }
    obj.setsvalue(lstring.luaS_bless(L, buff));
};

export const pushstr = function (L, str) {
    ldo.luaD_inctop(L);
    setsvalue2s(L, L.top - 1, lstring.luaS_new(L, str));
};

export const luaO_pushvfstring = function (L, fmt, argp) {
    let n = 0;
    let i = 0;
    let a = 0;
    let e;
    for (; ;) {
        e = defs.luastring_indexOf(fmt, 37 /* ('%').charCodeAt(0) */, i);
        if (e === -1) break;
        pushstr(L, fmt.subarray(i, e));
        switch (fmt[e + 1]) {
            case 115 /* ('s').charCodeAt(0) */: {
                let s = argp[a++];
                if (s === null) s = defs.to_luastring('(null)', true);
                else {
                    s = defs.from_userstring(s);
                    /* respect null terminator */
                    let i = defs.luastring_indexOf(s, 0);
                    if (i !== -1)
                        s = s.subarray(0, i);
                }
                pushstr(L, s);
                break;
            }
            case 99 /* ('c').charCodeAt(0) */: {
                let buff = argp[a++];
                if (ljstype.lisprint(buff))
                    pushstr(L, defs.luastring_of(buff));
                else
                    luaO_pushfstring(L, defs.to_luastring('<\\%d>', true), buff);
                break;
            }
            case 100 /* ('d').charCodeAt(0) */:
            case 73 /* ('I').charCodeAt(0) */:
                ldo.luaD_inctop(L);
                L.stack[L.top - 1].setivalue(argp[a++]);
                luaO_tostring(L, L.stack[L.top - 1]);
                break;
            case 102 /* ('f').charCodeAt(0) */:
                ldo.luaD_inctop(L);
                L.stack[L.top - 1].setfltvalue(argp[a++]);
                luaO_tostring(L, L.stack[L.top - 1]);
                break;
            case 112 /* ('p').charCodeAt(0) */: {
                let v = argp[a++];
                if (v instanceof lstate.lua_State ||
                    v instanceof ltable.Table ||
                    v instanceof Udata ||
                    v instanceof LClosure ||
                    v instanceof CClosure) {
                    pushstr(L, defs.to_luastring('0x' + v.id.toString(16)));
                } else {
                    switch (typeof v) {
                        case 'undefined':
                            pushstr(L, defs.to_luastring('undefined'));
                            break;
                        case 'number':  /* before check object as null is an object */
                            pushstr(L, defs.to_luastring('Number(' + v + ')'));
                            break;
                        case 'string':  /* before check object as null is an object */
                            pushstr(L, defs.to_luastring('String(' + JSON.stringify(v) + ')'));
                            break;
                        case 'boolean':  /* before check object as null is an object */
                            pushstr(L, defs.to_luastring(v ? 'Boolean(true)' : 'Boolean(false)'));
                            break;
                        case 'object':
                            if (v === null) { /* null is special */
                                pushstr(L, defs.to_luastring('null'));
                                break;
                            }
                        /* fall through */
                        case 'function': {
                            let id = L.l_G.ids.get(v);
                            if (!id) {
                                id = L.l_G.id_counter++;
                                L.l_G.ids.set(v, id);
                            }
                            pushstr(L, defs.to_luastring('0x' + id.toString(16)));
                            break;
                        }
                        default:
                            /* user provided object. no id available */
                            pushstr(L, defs.to_luastring('<id NYI>'));
                    }
                }
                break;
            }
            case 85 /* ('U').charCodeAt(0) */: {
                let buff = new Uint8Array(UTF8BUFFSZ);
                let l = luaO_utf8esc(buff, argp[a++]);
                pushstr(L, buff.subarray(UTF8BUFFSZ - l));
                break;
            }
            case 37 /* ('%').charCodeAt(0) */:
                pushstr(L, defs.to_luastring('%', true));
                break;
            default:
                ldebug.luaG_runerror(L, defs.to_luastring('invalid option \'%%%c\' to \'lua_pushfstring\''), fmt[e + 1]);
        }
        n += 2;
        i = e + 2;
    }
    ldo.luaD_checkstack(L, 1);
    pushstr(L, fmt.subarray(i));
    if (n > 0) lvm.luaV_concat(L, n + 1);
    return L.stack[L.top - 1].svalue();
};

export const luaO_pushfstring = function (L, fmt, ...argp) {
    return luaO_pushvfstring(L, fmt, argp);
};


/*
** converts an integer to a "floating point byte", represented as
** (eeeeexxx), where the real value is (1xxx) * 2^(eeeee - 1) if
** eeeee !== 0 and (xxx) otherwise.
*/
export const luaO_int2fb = function (x) {
    let e = 0;  /* exponent */
    if (x < 8) return x;
    while (x >= (8 << 4)) {  /* coarse steps */
        x = (x + 0xf) >> 4;  /* x = ceil(x / 16) */
        e += 4;
    }
    while (x >= (8 << 1)) {  /* fine steps */
        x = (x + 1) >> 1;  /* x = ceil(x / 2) */
        e++;
    }
    return ((e + 1) << 3) | (x - 8);
};

export const intarith = function (L, op, v1, v2) {
    switch (op) {
        case defs.LUA_OPADD: return (v1 + v2) | 0;
        case defs.LUA_OPSUB: return (v1 - v2) | 0;
        case defs.LUA_OPMUL: return lvm.luaV_imul(v1, v2);
        case defs.LUA_OPMOD: return lvm.luaV_mod(L, v1, v2);
        case defs.LUA_OPIDIV: return lvm.luaV_div(L, v1, v2);
        case defs.LUA_OPBAND: return (v1 & v2);
        case defs.LUA_OPBOR: return (v1 | v2);
        case defs.LUA_OPBXOR: return (v1 ^ v2);
        case defs.LUA_OPSHL: return lvm.luaV_shiftl(v1, v2);
        case defs.LUA_OPSHR: return lvm.luaV_shiftl(v1, -v2);
        case defs.LUA_OPUNM: return (0 - v1) | 0;
        case defs.LUA_OPBNOT: return (~0 ^ v1);
        default: llimits.lua_assert(0);
    }
};


export const numarith = function (L, op, v1, v2) {
    switch (op) {
        case defs.LUA_OPADD: return v1 + v2;
        case defs.LUA_OPSUB: return v1 - v2;
        case defs.LUA_OPMUL: return v1 * v2;
        case defs.LUA_OPDIV: return v1 / v2;
        case defs.LUA_OPPOW: return Math.pow(v1, v2);
        case defs.LUA_OPIDIV: return Math.floor(v1 / v2);
        case defs.LUA_OPUNM: return -v1;
        case defs.LUA_OPMOD: return llimits.luai_nummod(L, v1, v2);
        default: llimits.lua_assert(0);
    }
};

export const luaO_arith = function (L, op, p1, p2, p3) {
    let res = (typeof p3 === 'number') ? L.stack[p3] : p3;  /* FIXME */

    switch (op) {
        case defs.LUA_OPBAND: case defs.LUA_OPBOR: case defs.LUA_OPBXOR:
        case defs.LUA_OPSHL: case defs.LUA_OPSHR:
        case defs.LUA_OPBNOT: {  /* operate only on integers */
            let i1, i2;
            if ((i1 = lvm.tointeger(p1)) !== false && (i2 = lvm.tointeger(p2)) !== false) {
                res.setivalue(intarith(L, op, i1, i2));
                return;
            }
            else break;  /* go to the end */
        }
        case defs.LUA_OPDIV: case defs.LUA_OPPOW: {  /* operate only on floats */
            let n1, n2;
            if ((n1 = lvm.tonumber(p1)) !== false && (n2 = lvm.tonumber(p2)) !== false) {
                res.setfltvalue(numarith(L, op, n1, n2));
                return;
            }
            else break;  /* go to the end */
        }
        default: {  /* other operations */
            let n1, n2;
            if (p1.ttisinteger() && p2.ttisinteger()) {
                res.setivalue(intarith(L, op, p1.value, p2.value));
                return;
            }
            else if ((n1 = lvm.tonumber(p1)) !== false && (n2 = lvm.tonumber(p2)) !== false) {
                res.setfltvalue(numarith(L, op, n1, n2));
                return;
            }
            else break;  /* go to the end */
        }
    }
    /* could not perform raw operation; try metamethod */
    llimits.lua_assert(L !== null);  /* should not fail when folding (compile time) */
    ltm.luaT_trybinTM(L, p1, p2, p3, (op - defs.LUA_OPADD) + ltm.TMS.TM_ADD);
};
