import * as defs from './defs.js';
import {
    LUA_MULTRET,
    LUA_OPBNOT,
    LUA_OPEQ,
    LUA_OPLE,
    LUA_OPLT,
    LUA_OPUNM,
    LUA_REGISTRYINDEX,
    LUA_RIDX_GLOBALS,
    LUA_VERSION_NUM,
    constant_types,
    thread_status,
    from_userstring,
    to_luastring
} from './defs.js';
import {api_check} from './llimits.js';
import {luaG_errormsg} from './ldebug.js';
import {luaD_growstack, adjust_top, luaD_callnoyield, luaD_protectedparser, luaD_call, luaD_pcall} from './ldo.js';
import {luaU_dump} from './ldump.js';
import {MAXUPVAL} from './lfunc.js';
import {
    TValue as _TValue,
    CClosure as _CClosure,
    luaO_nilobject,
    setobj2s,
    pushobj2s,
    setobjs2s,
    pushsvalue2s,
    luaO_pushvfstring,
    Udata,
    luaO_tostring,
    luaO_str2num,
    luaO_arith
} from './lobject.js';
import {EXTRA_STACK, lua_State, CIST_LUA, CIST_OAH, CIST_YPCALL} from './lstate.js';
import {luaS_bless, luaS_new, luaS_newliteral} from './lstring.js';
import {ttypename} from './ltm.js';
import {LUAI_MAXSTACK} from './luaconf.js';
import {
    settable,
    luaV_gettable,
    cvt2str,
    tointeger,
    tonumber,
    luaV_equalobj,
    luaV_lessthan,
    luaV_lessequal,
    luaV_concat,
    luaV_objlen
} from './lvm.js';
import {
    luaH_getint,
    luaH_setfrom,
    invalidateTMcache,
    luaH_setint,
    luaH_get,
    luaH_new,
    luaH_getn,
    luaH_next
} from './ltable.js';
import {ZIO} from './lzio.js';

const TValue = _TValue;
const CClosure = _CClosure;

const {LUA_OK} = thread_status;
const {
    LUA_NUMTAGS,
    LUA_TBOOLEAN,
    LUA_TCCL,
    LUA_TFUNCTION,
    LUA_TLCF,
    LUA_TLCL,
    LUA_TLIGHTUSERDATA,
    LUA_TLNGSTR,
    LUA_TNIL,
    LUA_TNONE,
    LUA_TNUMFLT,
    LUA_TNUMINT,
    LUA_TSHRSTR,
    LUA_TTABLE,
    LUA_TTHREAD,
    LUA_TUSERDATA
} = constant_types;

export const api_incr_top = function (L) {
    L.top++;
    api_check(L, L.top <= L.ci.top, 'stack overflow');
};

const api_checknelems = function (L, n) {
    api_check(L, n < (L.top - L.ci.funcOff), 'not enough elements in the stack');
};

const fengari_argcheck = function (c) {
    if (!c) throw TypeError('invalid argument');
};

const fengari_argcheckinteger = function (n) {
    fengari_argcheck(typeof n === 'number' && (n | 0) === n);
};

const isvalid = function (o) {
    return o !== luaO_nilobject;
};

const lua_version = function (L) {
    if (L === null) return LUA_VERSION_NUM;
    else return L.l_G.version;
};

const lua_atpanic = function (L, panicf) {
    let old = L.l_G.panic;
    L.l_G.panic = panicf;
    return old;
};

const lua_atnativeerror = function (L, errorf) {
    let old = L.l_G.atnativeerror;
    L.l_G.atnativeerror = errorf;
    return old;
};

// Return value for idx on stack
const index2addr = function (L, idx) {
    let ci = L.ci;
    if (idx > 0) {
        let o = ci.funcOff + idx;
        api_check(L, idx <= ci.top - (ci.funcOff + 1), 'unacceptable index');
        if (o >= L.top) return luaO_nilobject;
        else return L.stack[o];
    } else if (idx > LUA_REGISTRYINDEX) {
        api_check(L, idx !== 0 && -idx <= L.top, 'invalid index');
        return L.stack[L.top + idx];
    } else if (idx === LUA_REGISTRYINDEX) {
        return L.l_G.l_registry;
    } else { /* upvalues */
        idx = LUA_REGISTRYINDEX - idx;
        api_check(L, idx <= MAXUPVAL + 1, 'upvalue index too large');
        if (ci.func.ttislcf()) /* light C function? */
            return luaO_nilobject; /* it has no upvalues */
        else {
            return idx <= ci.func.value.nupvalues ? ci.func.value.upvalue[idx - 1] : luaO_nilobject;
        }
    }
};

// Like index2addr but returns the index on stack; doesn't allow pseudo indices
const index2addr_ = function (L, idx) {
    let ci = L.ci;
    if (idx > 0) {
        let o = ci.funcOff + idx;
        api_check(L, idx <= ci.top - (ci.funcOff + 1), 'unacceptable index');
        if (o >= L.top) return null;
        else return o;
    } else if (idx > LUA_REGISTRYINDEX) {
        api_check(L, idx !== 0 && -idx <= L.top, 'invalid index');
        return L.top + idx;
    } else { /* registry or upvalue */
        throw Error('attempt to use pseudo-index');
    }
};

const lua_checkstack = function (L, n) {
    let res;
    let ci = L.ci;
    api_check(L, n >= 0, 'negative \'n\'');
    if (L.stack_last - L.top > n) /* stack large enough? */
        res = true;
    else { /* no; need to grow stack */
        let inuse = L.top + EXTRA_STACK;
        if (inuse > LUAI_MAXSTACK - n)  /* can grow without overflow? */
            res = false;  /* no */
        else { /* try to grow stack */
            luaD_growstack(L, n);
            res = true;
        }
    }

    if (res && ci.top < L.top + n)
        ci.top = L.top + n;  /* adjust frame top */

    return res;
};

const lua_xmove = function (from, to, n) {
    if (from === to) return;
    api_checknelems(from, n);
    api_check(from, from.l_G === to.l_G, 'moving among independent states');
    api_check(from, to.ci.top - to.top >= n, 'stack overflow');
    from.top -= n;
    for (let i = 0; i < n; i++) {
        to.stack[to.top] = new _TValue();
        setobj2s(to, to.top, from.stack[from.top + i]);
        delete from.stack[from.top + i];
        to.top++;
    }
};

/*
** basic stack manipulation
*/

/*
** convert an acceptable stack index into an absolute index
*/
const lua_absindex = function (L, idx) {
    return (idx > 0 || idx <= LUA_REGISTRYINDEX)
        ? idx
        : (L.top - L.ci.funcOff) + idx;
};

const lua_gettop = function (L) {
    return L.top - (L.ci.funcOff + 1);
};

const lua_pushvalue = function (L, idx) {
    pushobj2s(L, index2addr(L, idx));
    api_check(L, L.top <= L.ci.top, 'stack overflow');
};

const lua_settop = function (L, idx) {
    let func = L.ci.funcOff;
    let newtop;
    if (idx >= 0) {
        api_check(L, idx <= L.stack_last - (func + 1), 'new top too large');
        newtop = func + 1 + idx;
    } else {
        api_check(L, -(idx + 1) <= L.top - (func + 1), 'invalid new top');
        newtop = L.top + idx + 1; /* 'subtract' index (index is negative) */
    }
    adjust_top(L, newtop);
};

const lua_pop = function (L, n) {
    lua_settop(L, -n - 1);
};

const reverse = function (L, from, to) {
    for (; from < to; from++, to--) {
        let fromtv = L.stack[from];
        let temp = new TValue(fromtv.type, fromtv.value);
        setobjs2s(L, from, to);
        setobj2s(L, to, temp);
    }
};

/*
** Let x = AB, where A is a prefix of length 'n'. Then,
** rotate x n === BA. But BA === (A^r . B^r)^r.
*/
const lua_rotate = function (L, idx, n) {
    let t = L.top - 1;
    let pIdx = index2addr_(L, idx);
    let p = L.stack[pIdx];
    api_check(L, isvalid(p) && idx > LUA_REGISTRYINDEX, 'index not in the stack');
    api_check(L, (n >= 0 ? n : -n) <= (t - pIdx + 1), 'invalid \'n\'');
    let m = n >= 0 ? t - n : pIdx - n - 1;  /* end of prefix */
    reverse(L, pIdx, m);
    reverse(L, m + 1, L.top - 1);
    reverse(L, pIdx, L.top - 1);
};

const lua_copy = function (L, fromidx, toidx) {
    let from = index2addr(L, fromidx);
    index2addr(L, toidx).setfrom(from);
};

const lua_remove = function (L, idx) {
    lua_rotate(L, idx, -1);
    lua_pop(L, 1);
};

const lua_insert = function (L, idx) {
    lua_rotate(L, idx, 1);
};

const lua_replace = function (L, idx) {
    lua_copy(L, -1, idx);
    lua_pop(L, 1);
};

/*
** push functions (JS -> stack)
*/

const lua_pushnil = function (L) {
    L.stack[L.top] = new TValue(LUA_TNIL, null);
    api_incr_top(L);
};

const lua_pushnumber = function (L, n) {
    fengari_argcheck(typeof n === 'number');
    L.stack[L.top] = new TValue(LUA_TNUMFLT, n);
    api_incr_top(L);
};

export const lua_pushinteger = function (L, n) {
    fengari_argcheckinteger(n);
    L.stack[L.top] = new TValue(LUA_TNUMINT, n);
    api_incr_top(L);
};

const lua_pushlstring = function (L, s, len) {
    fengari_argcheckinteger(len);
    let ts;
    if (len === 0) {
        s = to_luastring('', true);
        ts = luaS_bless(L, s);
    } else {
        s = from_userstring(s);
        api_check(L, s.length >= len, 'invalid length to lua_pushlstring');
        ts = luaS_new(L, s.subarray(0, len));
    }
    pushsvalue2s(L, ts);
    api_check(L, L.top <= L.ci.top, 'stack overflow');
    return ts.value;
};

const lua_pushstring = function (L, s) {
    if (s === undefined || s === null) {
        L.stack[L.top] = new TValue(LUA_TNIL, null);
        L.top++;
    } else {
        let ts = luaS_new(L, from_userstring(s));
        pushsvalue2s(L, ts);
        s = ts.getstr(); /* internal copy */
    }
    api_check(L, L.top <= L.ci.top, 'stack overflow');
    return s;
};

const lua_pushvfstring = function (L, fmt, argp) {
    fmt = from_userstring(fmt);
    return luaO_pushvfstring(L, fmt, argp);
};

const lua_pushfstring = function (L, fmt, ...argp) {
    fmt = from_userstring(fmt);
    return luaO_pushvfstring(L, fmt, argp);
};

/* Similar to lua_pushstring, but takes a JS string */
export const lua_pushliteral = function (L, s) {
    if (s === undefined || s === null) {
        L.stack[L.top] = new TValue(LUA_TNIL, null);
        L.top++;
    } else {
        fengari_argcheck(typeof s === 'string');
        let ts = luaS_newliteral(L, s);
        pushsvalue2s(L, ts);
        s = ts.getstr(); /* internal copy */
    }
    api_check(L, L.top <= L.ci.top, 'stack overflow');

    return s;
};

const lua_pushcclosure = function (L, fn, n) {
    fengari_argcheck(typeof fn === 'function');
    fengari_argcheckinteger(n);
    if (n === 0)
        L.stack[L.top] = new TValue(LUA_TLCF, fn);
    else {
        api_checknelems(L, n);
        api_check(L, n <= MAXUPVAL, 'upvalue index too large');
        let cl = new CClosure(L, fn, n);
        for (let i = 0; i < n; i++)
            cl.upvalue[i].setfrom(L.stack[L.top - n + i]);
        for (let i = 1; i < n; i++)
            delete L.stack[--L.top];
        if (n > 0)
            --L.top;
        L.stack[L.top].setclCvalue(cl);
    }
    api_incr_top(L);
};

const lua_pushjsclosure = lua_pushcclosure;

const lua_pushcfunction = function (L, fn) {
    lua_pushcclosure(L, fn, 0);
};

const lua_pushjsfunction = lua_pushcfunction;

const lua_pushboolean = function (L, b) {
    L.stack[L.top] = new TValue(LUA_TBOOLEAN, !!b);
    api_incr_top(L);
};

const lua_pushlightuserdata = function (L, p) {
    L.stack[L.top] = new TValue(LUA_TLIGHTUSERDATA, p);
    api_incr_top(L);
};

const lua_pushthread = function (L) {
    L.stack[L.top] = new TValue(LUA_TTHREAD, L);
    api_incr_top(L);
    return L.l_G.mainthread === L;
};

const lua_pushglobaltable = function (L) {
    lua_rawgeti(L, LUA_REGISTRYINDEX, LUA_RIDX_GLOBALS);
};

/*
** set functions (stack -> Lua)
*/

/*
** t[k] = value at the top of the stack (where 'k' is a string)
*/
const auxsetstr = function (L, t, k) {
    let str = luaS_new(L, from_userstring(k));
    api_checknelems(L, 1);
    pushsvalue2s(L, str); /* push 'str' (to make it a TValue) */
    api_check(L, L.top <= L.ci.top, 'stack overflow');
    settable(L, t, L.stack[L.top - 1], L.stack[L.top - 2]);
    /* pop value and key */
    delete L.stack[--L.top];
    delete L.stack[--L.top];
};

const lua_setglobal = function (L, name) {
    auxsetstr(L, luaH_getint(L.l_G.l_registry.value, LUA_RIDX_GLOBALS), name);
};

const lua_setmetatable = function (L, objindex) {
    api_checknelems(L, 1);
    let mt;
    let obj = index2addr(L, objindex);
    if (L.stack[L.top - 1].ttisnil())
        mt = null;
    else {
        api_check(L, L.stack[L.top - 1].ttistable(), 'table expected');
        mt = L.stack[L.top - 1].value;
    }

    switch (obj.ttnov()) {
        case LUA_TUSERDATA:
        case LUA_TTABLE: {
            obj.value.metatable = mt;
            break;
        }
        default: {
            L.l_G.mt[obj.ttnov()] = mt;
            break;
        }
    }

    delete L.stack[--L.top];
    return true;
};

const lua_settable = function (L, idx) {
    api_checknelems(L, 2);
    let t = index2addr(L, idx);
    settable(L, t, L.stack[L.top - 2], L.stack[L.top - 1]);
    delete L.stack[--L.top];
    delete L.stack[--L.top];
};

export const lua_setfield = function (L, idx, k) {
    auxsetstr(L, index2addr(L, idx), k);
};

const lua_seti = function (L, idx, n) {
    fengari_argcheckinteger(n);
    api_checknelems(L, 1);
    let t = index2addr(L, idx);
    L.stack[L.top] = new TValue(LUA_TNUMINT, n);
    api_incr_top(L);
    settable(L, t, L.stack[L.top - 1], L.stack[L.top - 2]);
    /* pop value and key */
    delete L.stack[--L.top];
    delete L.stack[--L.top];
};

const lua_rawset = function (L, idx) {
    api_checknelems(L, 2);
    let o = index2addr(L, idx);
    api_check(L, o.ttistable(), 'table expected');
    let k = L.stack[L.top - 2];
    let v = L.stack[L.top - 1];
    luaH_setfrom(L, o.value, k, v);
    invalidateTMcache(o.value);
    delete L.stack[--L.top];
    delete L.stack[--L.top];
};

const lua_rawseti = function (L, idx, n) {
    fengari_argcheckinteger(n);
    api_checknelems(L, 1);
    let o = index2addr(L, idx);
    api_check(L, o.ttistable(), 'table expected');
    luaH_setint(o.value, n, L.stack[L.top - 1]);
    delete L.stack[--L.top];
};

const lua_rawsetp = function (L, idx, p) {
    api_checknelems(L, 1);
    let o = index2addr(L, idx);
    api_check(L, o.ttistable(), 'table expected');
    let k = new TValue(LUA_TLIGHTUSERDATA, p);
    let v = L.stack[L.top - 1];
    luaH_setfrom(L, o.value, k, v);
    delete L.stack[--L.top];
};

/*
** get functions (Lua -> stack)
*/

const auxgetstr = function (L, t, k) {
    let str = luaS_new(L, from_userstring(k));
    pushsvalue2s(L, str);
    api_check(L, L.top <= L.ci.top, 'stack overflow');
    luaV_gettable(L, t, L.stack[L.top - 1], L.top - 1);
    return L.stack[L.top - 1].ttnov();
};

const lua_rawgeti = function (L, idx, n) {
    let t = index2addr(L, idx);
    fengari_argcheckinteger(n);
    api_check(L, t.ttistable(), 'table expected');
    pushobj2s(L, luaH_getint(t.value, n));
    api_check(L, L.top <= L.ci.top, 'stack overflow');
    return L.stack[L.top - 1].ttnov();
};

const lua_rawgetp = function (L, idx, p) {
    let t = index2addr(L, idx);
    api_check(L, t.ttistable(), 'table expected');
    let k = new TValue(LUA_TLIGHTUSERDATA, p);
    pushobj2s(L, luaH_get(L, t.value, k));
    api_check(L, L.top <= L.ci.top, 'stack overflow');
    return L.stack[L.top - 1].ttnov();
};

const lua_rawget = function (L, idx) {
    let t = index2addr(L, idx);
    api_check(L, t.ttistable(t), 'table expected');
    setobj2s(L, L.top - 1, luaH_get(L, t.value, L.stack[L.top - 1]));
    return L.stack[L.top - 1].ttnov();
};

// narray and nrec are mostly useless for this implementation
const lua_createtable = function (L, narray, nrec) {
    let t = new _TValue(LUA_TTABLE, luaH_new(L));
    L.stack[L.top] = t;
    api_incr_top(L);
};

const luaS_newudata = function (L, size) {
    return new Udata(L, size);
};

const lua_newuserdata = function (L, size) {
    let u = luaS_newudata(L, size);
    L.stack[L.top] = new _TValue(LUA_TUSERDATA, u);
    api_incr_top(L);
    return u.data;
};

const aux_upvalue = function (L, fi, n) {
    fengari_argcheckinteger(n);
    switch (fi.ttype()) {
        case LUA_TCCL: {  /* C closure */
            let f = fi.value;
            if (!(1 <= n && n <= f.nupvalues)) return null;
            return {
                name: to_luastring('', true),
                val: f.upvalue[n - 1]
            };
        }
        case LUA_TLCL: {  /* Lua closure */
            let f = fi.value;
            let p = f.p;
            if (!(1 <= n && n <= p.upvalues.length)) return null;
            let name = p.upvalues[n - 1].name;
            return {
                name: name ? name.getstr() : to_luastring('(*no name)', true),
                val: f.upvals[n - 1]
            };
        }
        default:
            return null;  /* not a closure */
    }
};

const lua_getupvalue = function (L, funcindex, n) {
    let up = aux_upvalue(L, index2addr(L, funcindex), n);
    if (up) {
        let name = up.name;
        let val = up.val;
        pushobj2s(L, val);
        api_check(L, L.top <= L.ci.top, 'stack overflow');
        return name;
    }
    return null;
};

const lua_setupvalue = function (L, funcindex, n) {
    let fi = index2addr(L, funcindex);
    api_checknelems(L, 1);
    let aux = aux_upvalue(L, fi, n);
    if (aux) {
        let name = aux.name;
        let val = aux.val;
        val.setfrom(L.stack[L.top - 1]);
        delete L.stack[--L.top];
        return name;
    }
    return null;
};

const lua_newtable = function (L) {
    lua_createtable(L, 0, 0);
};

const lua_register = function (L, n, f) {
    lua_pushcfunction(L, f);
    lua_setglobal(L, n);
};

const lua_getmetatable = function (L, objindex) {
    let obj = index2addr(L, objindex);
    let mt;
    let res = false;
    switch (obj.ttnov()) {
        case LUA_TTABLE:
        case LUA_TUSERDATA:
            mt = obj.value.metatable;
            break;
        default:
            mt = L.l_G.mt[obj.ttnov()];
            break;
    }

    if (mt !== null && mt !== undefined) {
        L.stack[L.top] = new TValue(LUA_TTABLE, mt);
        api_incr_top(L);
        res = true;
    }

    return res;
};

const lua_getuservalue = function (L, idx) {
    let o = index2addr(L, idx);
    api_check(L, o.ttisfulluserdata(), 'full userdata expected');
    let uv = o.value.uservalue;
    L.stack[L.top] = new TValue(uv.type, uv.value);
    api_incr_top(L);
    return L.stack[L.top - 1].ttnov();
};

const lua_gettable = function (L, idx) {
    let t = index2addr(L, idx);
    luaV_gettable(L, t, L.stack[L.top - 1], L.top - 1);
    return L.stack[L.top - 1].ttnov();
};

const lua_getfield = function (L, idx, k) {
    return auxgetstr(L, index2addr(L, idx), k);
};

const lua_geti = function (L, idx, n) {
    let t = index2addr(L, idx);
    fengari_argcheckinteger(n);
    L.stack[L.top] = new TValue(LUA_TNUMINT, n);
    api_incr_top(L);
    luaV_gettable(L, t, L.stack[L.top - 1], L.top - 1);
    return L.stack[L.top - 1].ttnov();
};

const lua_getglobal = function (L, name) {
    return auxgetstr(L, luaH_getint(L.l_G.l_registry.value, LUA_RIDX_GLOBALS), name);
};

/*
** access functions (stack -> JS)
*/

const lua_toboolean = function (L, idx) {
    let o = index2addr(L, idx);
    return !o.l_isfalse();
};

const lua_tolstring = function (L, idx) {
    let o = index2addr(L, idx);

    if (!o.ttisstring()) {
        if (!cvt2str(o)) {  /* not convertible? */
            return null;
        }
        luaO_tostring(L, o);
    }
    return o.svalue();
};

const lua_tostring = lua_tolstring;

const lua_tojsstring = function (L, idx) {
    let o = index2addr(L, idx);

    if (!o.ttisstring()) {
        if (!cvt2str(o)) {  /* not convertible? */
            return null;
        }
        luaO_tostring(L, o);
    }
    return o.jsstring();
};

const lua_todataview = function (L, idx) {
    let u8 = lua_tolstring(L, idx);
    return new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
};

const lua_rawlen = function (L, idx) {
    let o = index2addr(L, idx);
    switch (o.ttype()) {
        case LUA_TSHRSTR:
        case LUA_TLNGSTR:
            return o.vslen();
        case LUA_TUSERDATA:
            return o.value.len;
        case LUA_TTABLE:
            return luaH_getn(o.value);
        default:
            return 0;
    }
};

const lua_tocfunction = function (L, idx) {
    let o = index2addr(L, idx);
    if (o.ttislcf() || o.ttisCclosure()) return o.value;
    else return null;  /* not a C function */
};

const lua_tointeger = function (L, idx) {
    let n = lua_tointegerx(L, idx);
    return n === false ? 0 : n;
};

const lua_tointegerx = function (L, idx) {
    return tointeger(index2addr(L, idx));
};

const lua_tonumber = function (L, idx) {
    let n = lua_tonumberx(L, idx);
    return n === false ? 0 : n;
};

const lua_tonumberx = function (L, idx) {
    return tonumber(index2addr(L, idx));
};

const lua_touserdata = function (L, idx) {
    let o = index2addr(L, idx);
    switch (o.ttnov()) {
        case LUA_TUSERDATA:
            return o.value.data;
        case LUA_TLIGHTUSERDATA:
            return o.value;
        default:
            return null;
    }
};

const lua_tothread = function (L, idx) {
    let o = index2addr(L, idx);
    return o.ttisthread() ? o.value : null;
};

const lua_topointer = function (L, idx) {
    let o = index2addr(L, idx);
    switch (o.ttype()) {
        case LUA_TTABLE:
        case LUA_TLCL:
        case LUA_TCCL:
        case LUA_TLCF:
        case LUA_TTHREAD:
        case LUA_TUSERDATA: /* note: this differs in behaviour to reference lua implementation */
        case LUA_TLIGHTUSERDATA:
            return o.value;
        default:
            return null;
    }
};


/* A proxy is a function that the same lua value to the given lua state. */

/* Having a weakmap of created proxies was only way I could think of to provide an 'isproxy' function */
const seen = new WeakMap();

/* is the passed object a proxy? is it from the given state? (if passed) */
const lua_isproxy = function (p, L) {
    let G = seen.get(p);
    if (!G)
        return false;
    return (L === null) || (L.l_G === G);
};

/* Use 'create_proxy' helper function so that 'L' is not in scope */
const create_proxy = function (G, type, value) {
    let proxy = function (L) {
        api_check(L, L instanceof lua_State && G === L.l_G, 'must be from same global state');
        L.stack[L.top] = new TValue(type, value);
        api_incr_top(L);
    };
    seen.set(proxy, G);
    return proxy;
};

const lua_toproxy = function (L, idx) {
    let tv = index2addr(L, idx);
    /* pass broken down tv incase it is an upvalue index */
    return create_proxy(L.l_G, tv.type, tv.value);
};


const lua_compare = function (L, index1, index2, op) {
    let o1 = index2addr(L, index1);
    let o2 = index2addr(L, index2);

    let i = 0;

    if (isvalid(o1) && isvalid(o2)) {
        switch (op) {
            case LUA_OPEQ:
                i = luaV_equalobj(L, o1, o2);
                break;
            case LUA_OPLT:
                i = luaV_lessthan(L, o1, o2);
                break;
            case LUA_OPLE:
                i = luaV_lessequal(L, o1, o2);
                break;
            default:
                api_check(L, false, 'invalid option');
        }
    }

    return i;
};

const lua_stringtonumber = function (L, s) {
    let tv = new TValue();
    let sz = luaO_str2num(s, tv);
    if (sz !== 0) {
        L.stack[L.top] = tv;
        api_incr_top(L);
    }
    return sz;
};

const f_call = function (L, ud) {
    luaD_callnoyield(L, ud.funcOff, ud.nresults);
};

const lua_type = function (L, idx) {
    let o = index2addr(L, idx);
    return isvalid(o) ? o.ttnov() : LUA_TNONE;
};

const lua_typename = function (L, t) {
    api_check(L, LUA_TNONE <= t && t < LUA_NUMTAGS, 'invalid tag');
    return ttypename(t);
};

const lua_iscfunction = function (L, idx) {
    let o = index2addr(L, idx);
    return o.ttislcf(o) || o.ttisCclosure();
};

const lua_isnil = function (L, n) {
    return lua_type(L, n) === LUA_TNIL;
};

const lua_isboolean = function (L, n) {
    return lua_type(L, n) === LUA_TBOOLEAN;
};

const lua_isnone = function (L, n) {
    return lua_type(L, n) === LUA_TNONE;
};

const lua_isnoneornil = function (L, n) {
    return lua_type(L, n) <= 0;
};

const lua_istable = function (L, idx) {
    return index2addr(L, idx).ttistable();
};

const lua_isinteger = function (L, idx) {
    return index2addr(L, idx).ttisinteger();
};

const lua_isnumber = function (L, idx) {
    return tonumber(index2addr(L, idx)) !== false;
};

const lua_isstring = function (L, idx) {
    let o = index2addr(L, idx);
    return o.ttisstring() || cvt2str(o);
};

const lua_isuserdata = function (L, idx) {
    let o = index2addr(L, idx);
    return o.ttisfulluserdata(o) || o.ttislightuserdata();
};

const lua_isthread = function (L, idx) {
    return lua_type(L, idx) === LUA_TTHREAD;
};

const lua_isfunction = function (L, idx) {
    return lua_type(L, idx) === LUA_TFUNCTION;
};

const lua_islightuserdata = function (L, idx) {
    return lua_type(L, idx) === LUA_TLIGHTUSERDATA;
};

const lua_rawequal = function (L, index1, index2) {
    let o1 = index2addr(L, index1);
    let o2 = index2addr(L, index2);
    return isvalid(o1) && isvalid(o2) ? luaV_equalobj(null, o1, o2) : 0;
};

const lua_arith = function (L, op) {
    if (op !== LUA_OPUNM && op !== LUA_OPBNOT)
        api_checknelems(L, 2);  /* all other operations expect two operands */
    else {  /* for unary operations, add fake 2nd operand */
        api_checknelems(L, 1);
        pushobj2s(L, L.stack[L.top - 1]);
        api_check(L, L.top <= L.ci.top, 'stack overflow');
    }
    /* first operand at top - 2, second at top - 1; result go to top - 2 */
    luaO_arith(L, op, L.stack[L.top - 2], L.stack[L.top - 1], L.stack[L.top - 2]);
    delete L.stack[--L.top];  /* remove second operand */
};

/*
** 'load' and 'call' functions (run Lua code)
*/

const default_chunkname = to_luastring('?');
const lua_load = function (L, reader, data, chunkname, mode) {
    if (!chunkname) chunkname = default_chunkname;
    else chunkname = from_userstring(chunkname);
    if (mode !== null) mode = from_userstring(mode);
    let z = new ZIO(L, reader, data);
    let status = luaD_protectedparser(L, z, chunkname, mode);
    if (status === LUA_OK) {  /* no errors? */
        let f = L.stack[L.top - 1].value; /* get newly created function */
        if (f.nupvalues >= 1) {  /* does it have an upvalue? */
            /* get global table from registry */
            let gt = luaH_getint(L.l_G.l_registry.value, LUA_RIDX_GLOBALS);
            /* set global table as 1st upvalue of 'f' (may be LUA_ENV) */
            f.upvals[0].setfrom(gt);
        }
    }
    return status;
};

const lua_dump = function (L, writer, data, strip) {
    api_checknelems(L, 1);
    let o = L.stack[L.top - 1];
    if (o.ttisLclosure())
        return luaU_dump(L, o.value.p, writer, data, strip);
    return 1;
};

const lua_status = function (L) {
    return L.status;
};

const lua_setuservalue = function (L, idx) {
    api_checknelems(L, 1);
    let o = index2addr(L, idx);
    api_check(L, o.ttisfulluserdata(), 'full userdata expected');
    o.value.uservalue.setfrom(L.stack[L.top - 1]);
    delete L.stack[--L.top];
};

const checkresults = function (L, na, nr) {
    api_check(L, nr === LUA_MULTRET || (L.ci.top - L.top >= (nr) - (na)),
        'results from function overflow current stack size');
};

const lua_callk = function (L, nargs, nresults, ctx, k) {
    api_check(L, k === null || !(L.ci.callstatus & CIST_LUA), 'cannot use continuations inside hooks');
    api_checknelems(L, nargs + 1);
    api_check(L, L.status === LUA_OK, 'cannot do calls on non-normal thread');
    checkresults(L, nargs, nresults);
    let func = L.top - (nargs + 1);
    if (k !== null && L.nny === 0) { /* need to prepare continuation? */
        L.ci.c_k = k;
        L.ci.c_ctx = ctx;
        luaD_call(L, func, nresults);
    } else { /* no continuation or no yieldable */
        luaD_callnoyield(L, func, nresults);
    }

    if (nresults === LUA_MULTRET && L.ci.top < L.top)
        L.ci.top = L.top;
};

const lua_call = function (L, n, r) {
    lua_callk(L, n, r, 0, null);
};

const lua_pcallk = function (L, nargs, nresults, errfunc, ctx, k) {
    api_check(L, k === null || !(L.ci.callstatus & CIST_LUA), 'cannot use continuations inside hooks');
    api_checknelems(L, nargs + 1);
    api_check(L, L.status === LUA_OK, 'cannot do calls on non-normal thread');
    checkresults(L, nargs, nresults);
    let status;
    let func;
    if (errfunc === 0)
        func = 0;
    else {
        func = index2addr_(L, errfunc);
    }
    let funcOff = L.top - (nargs + 1); /* function to be called */
    if (k === null || L.nny > 0) { /* no continuation or no yieldable? */
        let c = {
            funcOff: funcOff,
            nresults: nresults /* do a 'conventional' protected call */
        };
        status = luaD_pcall(L, f_call, c, funcOff, func);
    } else { /* prepare continuation (call is already protected by 'resume') */
        let ci = L.ci;
        ci.c_k = k;  /* prepare continuation (call is already protected by 'resume') */
        ci.c_ctx = ctx;  /* prepare continuation (call is already protected by 'resume') */
        /* save information for error recovery */
        ci.extra = funcOff;
        ci.c_old_errfunc = L.errfunc;
        L.errfunc = func;
        ci.callstatus &= ~CIST_OAH | L.allowhook;
        ci.callstatus |= CIST_YPCALL;  /* function can do error recovery */
        luaD_call(L, funcOff, nresults);  /* do the call */
        ci.callstatus &= ~CIST_YPCALL;
        L.errfunc = ci.c_old_errfunc;
        status = LUA_OK;
    }

    if (nresults === LUA_MULTRET && L.ci.top < L.top)
        L.ci.top = L.top;

    return status;
};

const lua_pcall = function (L, n, r, f) {
    return lua_pcallk(L, n, r, f, 0, null);
};

/*
** miscellaneous functions
*/

const lua_error = function (L) {
    api_checknelems(L, 1);
    luaG_errormsg(L);
};

const lua_next = function (L, idx) {
    let t = index2addr(L, idx);
    api_check(L, t.ttistable(), 'table expected');
    L.stack[L.top] = new TValue();
    let more = luaH_next(L, t.value, L.top - 1);
    if (more) {
        api_incr_top(L);
        return 1;
    } else {
        delete L.stack[L.top];
        delete L.stack[--L.top];
        return 0;
    }
};

const lua_concat = function (L, n) {
    api_checknelems(L, n);
    if (n >= 2)
        luaV_concat(L, n);
    else if (n === 0) {
        pushsvalue2s(L, luaS_bless(L, to_luastring('', true)));
        api_check(L, L.top <= L.ci.top, 'stack overflow');
    }
};

const lua_len = function (L, idx) {
    let t = index2addr(L, idx);
    let tv = new TValue();
    luaV_objlen(L, tv, t);
    L.stack[L.top] = tv;
    api_incr_top(L);
};

const getupvalref = function (L, fidx, n) {
    let fi = index2addr(L, fidx);
    api_check(L, fi.ttisLclosure(), 'Lua function expected');
    let f = fi.value;
    fengari_argcheckinteger(n);
    api_check(L, 1 <= n && n <= f.p.upvalues.length, 'invalid upvalue index');
    return {
        f: f,
        i: n - 1
    };
};

const lua_upvalueid = function (L, fidx, n) {
    let fi = index2addr(L, fidx);
    switch (fi.ttype()) {
        case LUA_TLCL: {  /* lua closure */
            let ref = getupvalref(L, fidx, n);
            return ref.f.upvals[ref.i];
        }
        case LUA_TCCL: {  /* C closure */
            let f = fi.value;
            api_check(L, (n | 0) === n && n > 0 && n <= f.nupvalues, 'invalid upvalue index');
            return f.upvalue[n - 1];
        }
        default: {
            api_check(L, false, 'closure expected');
            return null;
        }
    }
};

const lua_upvaluejoin = function (L, fidx1, n1, fidx2, n2) {
    let ref1 = getupvalref(L, fidx1, n1);
    let ref2 = getupvalref(L, fidx2, n2);
    let up2 = ref2.f.upvals[ref2.i];
    ref1.f.upvals[ref1.i] = up2;
};

// This functions are only there for compatibility purposes
const lua_gc = function () {
};

const lua_getallocf = function () {
    console.warn('lua_getallocf is not available');
    return 0;
};

const lua_setallocf = function () {
    console.warn('lua_setallocf is not available');
    return 0;
};

const lua_getextraspace = function () {
    console.warn('lua_getextraspace is not available');
    return 0;
};
