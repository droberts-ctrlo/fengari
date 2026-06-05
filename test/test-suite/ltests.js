import assert from 'assert';

import {
    lua_absindex,
    lua_arith,
    lua_atpanic,
    lua_call,
    lua_callk,
    lua_checkstack,
    lua_close,
    lua_compare,
    lua_concat,
    lua_copy,
    lua_createtable,
    lua_error,
    lua_getfield,
    lua_getglobal,
    lua_getmetatable,
    lua_gettable,
    lua_gettop,
    lua_getupvalue,
    lua_insert,
    lua_iscfunction,
    lua_isfunction,
    lua_islightuserdata,
    lua_isnil,
    lua_isnone,
    lua_isnoneornil,
    lua_isnumber,
    lua_isstring,
    lua_istable,
    lua_isthread,
    lua_isuserdata,
    lua_len,
    LUA_MASKCALL,
    LUA_MASKCOUNT,
    LUA_MASKLINE,
    LUA_MASKRET,
    LUA_MULTRET,
    lua_newstate,
    lua_newtable,
    lua_newthread,
    lua_newuserdata,
    lua_next,
    LUA_OK,
    LUA_OPEQ,
    LUA_OPLE,
    LUA_OPLT,
    lua_pcall,
    lua_pcallk,
    lua_pop,
    lua_pushboolean,
    lua_pushcclosure,
    lua_pushcfunction,
    lua_pushinteger,
    lua_pushlightuserdata,
    lua_pushliteral,
    lua_pushlstring,
    lua_pushnil,
    lua_pushnumber,
    lua_pushstring,
    lua_pushvalue,
    lua_rawgeti,
    lua_rawgetp,
    lua_rawlen,
    lua_rawseti,
    lua_rawsetp,
    LUA_REGISTRYINDEX,
    lua_remove,
    lua_replace,
    lua_resume,
    lua_rotate,
    lua_setfield,
    lua_setglobal,
    lua_sethook,
    lua_setmetatable,
    lua_settable,
    lua_settop,
    lua_setupvalue,
    LUA_TFUNCTION,
    lua_toboolean,
    lua_tocfunction,
    lua_tointeger,
    lua_tojsstring,
    lua_tonumber,
    lua_topointer,
    lua_tostring,
    lua_tothread,
    lua_touserdata,
    LUA_TTABLE,
    lua_type,
    lua_upvalueindex,
    lua_xmove,
    lua_yield,
    LUA_YIELD,
    lua_yieldk
} from '../../src/lua.js';
import {
    LUA_PRELOAD_TABLE,
    luaL_argcheck,
    luaL_checkinteger,
    luaL_checklstring,
    luaL_checknumber,
    luaL_checkstack,
    luaL_checkstring,
    luaL_checktype,
    luaL_error,
    luaL_getsubtable,
    luaL_gsub,
    luaL_len,
    luaL_loadbuffer,
    luaL_loadfile,
    luaL_loadstring,
    luaL_newlib,
    luaL_newmetatable,
    luaL_optinteger,
    luaL_optstring,
    luaL_requiref,
    luaL_testudata,
    luaL_tojsstring,
    luaL_typename
} from '../../src/lauxlib.js';
import {luastring_eq, luastring_indexOf, to_jsstring, to_luastring} from '../../src/fengaricore.js';
import {lisdigit} from '../../src/ljstype.js';
import {
    GET_OPCODE,
    GETARG_A,
    GETARG_Ax,
    GETARG_B,
    GETARG_Bx,
    GETARG_C,
    GETARG_sBx,
    getOpMode,
    iABC,
    iABx,
    iAsBx,
    iAx,
    OpCodes
} from '../../src/lopcodes.js';
import {pushobj2s} from '../../src/lobject.js';
import {sprintf} from 'sprintf-js';
import {luaopen_base} from '../../src/lbaselib.js';
import {luaopen_coroutine} from '../../src/lcorolib.js';
import {luaopen_debug} from '../../src/ldblib.js';
import {luaopen_io} from '../../src/liolib.js';
import {luaopen_os} from '../../src/loslib.js';
import {luaopen_math} from '../../src/lmathlib.js';
import {luaopen_string} from '../../src/lstrlib.js';
import {luaopen_table} from '../../src/ltablib.js';
import {luaopen_package} from '../../src/loadlib.js';

const delimits = [' ', '\t', '\n', ',', ';'].map(e => e.charCodeAt(0));

const skip = function(pc) {
    for (;;) {
        if (pc.script[pc.offset] !== 0 && pc.offset < pc.script.length && delimits.indexOf(pc.script[pc.offset]) >= 0)
            pc.offset++;
        else if (pc.script[pc.offset] === '#'.charCodeAt(0)) {
            while (pc.script[pc.offset] !== '\n'.charCodeAt(0) && pc.script[pc.offset] !== 0 && pc.offset < pc.script.length)
                pc.offset++;
        } else break;
    }
};

const getnum = function(L, L1, pc) {
    let res = 0;
    let sig = 1;
    skip(pc);
    if (pc.script[pc.offset] === '.'.charCodeAt(0)) {
        res = lua_tointeger(L1, -1);
        lua_pop(L1, 1);
        pc.offset++;
        return res;
    } else if (pc.script[pc.offset] === '*'.charCodeAt(0)) {
        res = lua_gettop(L1);
        pc.offset++;
        return res;
    }
    else if (pc.script[pc.offset] === '-'.charCodeAt(0)) {
        sig = -1;
        pc.offset++;
    }
    if (!lisdigit(pc.script[pc.offset]))
        luaL_error(L, to_luastring('number expected (%s)'), pc.script);
    while (lisdigit(pc.script[pc.offset])) res = res*10 + pc.script[pc.offset++] - '0'.charCodeAt(0);
    return sig*res;
};

const getstring = function(L, buff, pc) {
    let i = 0;
    skip(pc);
    if (pc.script[pc.offset] === '"'.charCodeAt(0) || pc.script[pc.offset] === '\''.charCodeAt(0)) {  /* quoted string? */
        let quote = pc.script[pc.offset++];
        while (pc.script[pc.offset] !== quote) {
            if (pc.script[pc.offset] === 0 || pc.offset >= pc.script.length)
                luaL_error(L, to_luastring('unfinished string in JS script', true));
            buff[i++] = pc.script[pc.offset++];
        }
        pc.offset++;
    } else {
        while (pc.script[pc.offset] !== 0 && pc.offset < pc.script.length && delimits.indexOf(pc.script[pc.offset]) < 0)
            buff[i++] = pc.script[pc.offset++];
    }
    return buff.subarray(0, i);
};

const getindex = function(L, L1, pc) {
    skip(pc);
    switch (pc.script[pc.offset++]) {
        case 'R'.charCodeAt(0): return LUA_REGISTRYINDEX;
        case 'G'.charCodeAt(0): return luaL_error(L, to_luastring('deprecated index \'G\'', true));
        case 'U'.charCodeAt(0): return lua_upvalueindex(getnum(L, L1, pc));
        default: pc.offset--; return getnum(L, L1, pc);
    }
};

const codes = ['OK', 'YIELD', 'ERRRUN', 'ERRSYNTAX', 'ERRMEM', 'ERRGCMM', 'ERRERR'].map(e => to_luastring(e));

const pushcode = function(L, code) {
    lua_pushstring(L, codes[code]);
};

const printstack = function(L) {
    let n = lua_gettop(L);
    for (let i = 1; i <= n; i++) {
        console.log('${i}: %{to_jsstring(lauxlib.luaL_tolstring(L, i, null))}\n');
        lua_pop(L, 1);
    }
    console.log('');
};

/*
** arithmetic operation encoding for 'arith' instruction
** LUA_OPIDIV  -> \
** LUA_OPSHL   -> <
** LUA_OPSHR   -> >
** LUA_OPUNM   -> _
** LUA_OPBNOT  -> !
*/
const ops = '+-*%^/\\&|~<>_!'.split('').map(e => e.charCodeAt(0));

const runJS = function(L, L1, pc) {
    let buff = new Uint8Array(300);
    let status = 0;
    if (!pc || !pc.script) return luaL_error(L, to_luastring('attempt to runJS null script'));
    for (;;) {
        let inst = to_jsstring(getstring(L, buff, pc));
        if (inst.length === 0) return 0;
        switch (inst) {
            case 'absindex': {
                lua_pushnumber(L1, lua_absindex(L1, getindex(L, L1, pc)));
                break;
            }
            case 'append': {
                let t = getindex(L, L1, pc);
                let i = lua_rawlen(L1, t);
                lua_rawseti(L1, t, i + 1);
                break;
            }
            case 'arith': {
                let op;
                skip(pc);
                op = ops.indexOf(pc.script[pc.offset++]);
                lua_arith(L1, op);
                break;
            }
            case 'call': {
                let narg = getnum(L, L1, pc);
                let nres = getnum(L, L1, pc);
                lua_call(L1, narg, nres);
                break;
            }
            case 'callk': {
                let narg = getnum(L, L1, pc);
                let nres = getnum(L, L1, pc);
                let i = getindex(L, L1, pc);
                lua_callk(L1, narg, nres, i, Cfunck);
                break;
            }
            case 'checkstack': {
                let sz = getnum(L, L1, pc);
                let msg = getstring(L, buff, pc);
                if (msg.length === 0)
                    msg = null;  /* to test 'luaL_checkstack' with no message */
                luaL_checkstack(L1, sz, msg);
                break;
            }
            case 'compare': {
                let opt = getstring(L, buff, pc);  /* EQ, LT, or LE */
                let op = (opt[0] === 'E'.charCodeAt(0))
                    ? LUA_OPEQ
                    : (opt[1] === 'T'.charCodeAt(0)) ? LUA_OPLT : LUA_OPLE;
                let a = getindex(L, L1, pc);
                let b = getindex(L, L1, pc);
                lua_pushboolean(L1, lua_compare(L1, a, b, op));
                break;
            }
            case 'concat': {
                lua_concat(L1, getnum(L, L1, pc));
                break;
            }
            case 'copy': {
                let f = getindex(L, L1, pc);
                lua_copy(L1, f, getindex(L, L1, pc));
                break;
            }
            case 'func2num': {
                let func = lua_tocfunction(L1, getindex(L, L1, pc));
                if (func === null) func = 0;
                else if (func.id) func = func.id;
                lua_pushnumber(L1, func);
                break;
            }
            case 'getfield': {
                let t = getindex(L, L1, pc);
                lua_getfield(L1, t, getstring(L, buff, pc));
                break;
            }
            case 'getglobal': {
                lua_getglobal(L1, getstring(L, buff, pc));
                break;
            }
            case 'getmetatable': {
                if (lua_getmetatable(L1, getindex(L, L1, pc)) === 0)
                    lua_pushnil(L1);
                break;
            }
            case 'gettable': {
                lua_gettable(L1, getindex(L, L1, pc));
                break;
            }
            case 'gettop': {
                lua_pushinteger(L1, lua_gettop(L1));
                break;
            }
            case 'gsub': {
                let a = getnum(L, L1, pc);
                let b = getnum(L, L1, pc);
                let c = getnum(L, L1, pc);
                luaL_gsub(L1, lua_tostring(L1, a), lua_tostring(L1, b), lua_tostring(L1, c));
                break;
            }
            case 'insert': {
                lua_insert(L1, getnum(L, L1, pc));
                break;
            }
            case 'iscfunction': {
                lua_pushboolean(L1, lua_iscfunction(L1, getindex(L, L1, pc)));
                break;
            }
            case 'isfunction': {
                lua_pushboolean(L1, lua_isfunction(L1, getindex(L, L1, pc)));
                break;
            }
            case 'isnil': {
                lua_pushboolean(L1, lua_isnil(L1, getindex(L, L1, pc)));
                break;
            }
            case 'isnull': {
                lua_pushboolean(L1, lua_isnone(L1, getindex(L, L1, pc)));
                break;
            }
            case 'isnumber': {
                lua_pushboolean(L1, lua_isnumber(L1, getindex(L, L1, pc)));
                break;
            }
            case 'isstring': {
                lua_pushboolean(L1, lua_isstring(L1, getindex(L, L1, pc)));
                break;
            }
            case 'istable': {
                lua_pushboolean(L1, lua_istable(L1, getindex(L, L1, pc)));
                break;
            }
            case 'isudataval': {
                lua_pushboolean(L1, lua_islightuserdata(L1, getindex(L, L1, pc)));
                break;
            }
            case 'isuserdata': {
                lua_pushboolean(L1, lua_isuserdata(L1, getindex(L, L1, pc)));
                break;
            }
            case 'len': {
                lua_len(L1, getindex(L, L1, pc));
                break;
            }
            case 'Llen': {
                lua_pushinteger(L1, luaL_len(L1, getindex(L, L1, pc)));
                break;
            }
            case 'loadfile': {
                luaL_loadfile(L1, luaL_checkstring(L1, getnum(L, L1, pc)));
                break;
            }
            case 'loadstring': {
                let s = luaL_checkstring(L1, getnum(L, L1, pc));
                luaL_loadstring(L1, s);
                break;
            }
            case 'newmetatable': {
                lua_pushboolean(L1, luaL_newmetatable(L1, getstring(L, buff, pc)));
                break;
            }
            case 'newtable': {
                lua_newtable(L1);
                break;
            }
            case 'newthread': {
                lua_newthread(L1);
                break;
            }
            case 'newuserdata': {
                lua_newuserdata(L1, getnum(L, L1, pc));
                break;
            }
            case 'next': {
                lua_next(L1, -2);
                break;
            }
            case 'objsize': {
                lua_pushinteger(L1, lua_rawlen(L1, getindex(L, L1, pc)));
                break;
            }
            case 'pcall': {
                let narg = getnum(L, L1, pc);
                let nres = getnum(L, L1, pc);
                status = lua_pcall(L1, narg, nres, getnum(L, L1, pc));
                break;
            }
            case 'pcallk': {
                let narg = getnum(L, L1, pc);
                let nres = getnum(L, L1, pc);
                let i = getindex(L, L1, pc);
                status = lua_pcallk(L1, narg, nres, 0, i, Cfunck);
                break;
            }
            case 'pop': {
                lua_pop(L1, getnum(L, L1, pc));
                break;
            }
            case 'print': {
                let n = getnum(L, L1, pc);
                if (n !== 0) {
                    console.log(`${luaL_tojsstring(L1, n, null)}\n`);
                    lua_pop(L1, 1);
                }
                else printstack(L1);
                break;
            }
            case 'pushbool': {
                lua_pushboolean(L1, getnum(L, L1, pc));
                break;
            }
            case 'pushcclosure': {
                lua_pushcclosure(L1, testJS, getnum(L, L1, pc));
                break;
            }
            case 'pushint': {
                lua_pushinteger(L1, getnum(L, L1, pc));
                break;
            }
            case 'pushnil': {
                lua_pushnil(L1);
                break;
            }
            case 'pushnum': {
                lua_pushnumber(L1, getnum(L, L1, pc));
                break;
            }
            case 'pushstatus': {
                pushcode(L1, status);
                break;
            }
            case 'pushstring': {
                lua_pushstring(L1, getstring(L, buff, pc));
                break;
            }
            case 'pushupvalueindex': {
                lua_pushinteger(L1, lua_upvalueindex(getnum(L, L1, pc)));
                break;
            }
            case 'pushvalue': {
                lua_pushvalue(L1, getindex(L, L1, pc));
                break;
            }
            case 'rawgeti': {
                let t = getindex(L, L1, pc);
                lua_rawgeti(L1, t, getnum(L, L1, pc));
                break;
            }
            case 'rawgetp': {
                let t = getindex(L, L1, pc);
                lua_rawgetp(L1, t, getnum(L, L1, pc));
                break;
            }
            case 'rawsetp': {
                let t = getindex(L, L1, pc);
                lua_rawsetp(L1, t, getnum(L, L1, pc));
                break;
            }
            case 'remove': {
                lua_remove(L1, getnum(L, L1, pc));
                break;
            }
            case 'replace': {
                lua_replace(L1, getindex(L, L1, pc));
                break;
            }
            case 'resume': {
                let i = getindex(L, L1, pc);
                status = lua_resume(lua_tothread(L1, i), L, getnum(L, L1, pc));
                break;
            }
            case 'return': {
                let n = getnum(L, L1, pc);
                if (L1 != L) {
                    let i;
                    for (i = 0; i < n; i++)
                        lua_pushstring(L, lua_tostring(L1, -(n - i)));
                }
                return n;
            }
            case 'rotate': {
                let i = getindex(L, L1, pc);
                lua_rotate(L1, i, getnum(L, L1, pc));
                break;
            }
            case 'setfield': {
                let t = getindex(L, L1, pc);
                lua_setfield(L1, t, getstring(L, buff, pc));
                break;
            }
            case 'setglobal': {
                lua_setglobal(L1, getstring(L, buff, pc));
                break;
            }
            case 'sethook': {
                let mask = getnum(L, L1, pc);
                let count = getnum(L, L1, pc);
                sethookaux(L1, mask, count, getstring(L, buff, pc));
                break;
            }
            case 'setmetatable': {
                lua_setmetatable(L1, getindex(L, L1, pc));
                break;
            }
            case 'settable': {
                lua_settable(L1, getindex(L, L1, pc));
                break;
            }
            case 'settop': {
                lua_settop(L1, getnum(L, L1, pc));
                break;
            }
            case 'testudata': {
                let i = getindex(L, L1, pc);
                lua_pushboolean(L1, luaL_testudata(L1, i, getstring(L, buff, pc)) !== null);
                break;
            }
            case 'error': {
                lua_error(L1);
                break;
            }
            case 'throw': {
                throw new Error();
            }
            case 'tobool': {
                lua_pushboolean(L1, lua_toboolean(L1, getindex(L, L1, pc)));
                break;
            }
            case 'tocfunction': {
                lua_pushcfunction(L1, lua_tocfunction(L1, getindex(L, L1, pc)));
                break;
            }
            case 'tointeger': {
                lua_pushinteger(L1, lua_tointeger(L1, getindex(L, L1, pc)));
                break;
            }
            case 'tonumber': {
                lua_pushnumber(L1, lua_tonumber(L1, getindex(L, L1, pc)));
                break;
            }
            case 'topointer': {
                let p = lua_topointer(L1, getindex(L, L1, pc));
                if (p === null) p = 0;
                else if (p.id) p = p.id;
                lua_pushnumber(L1, p);  /* in ltests.c, p is casted to a size_t so NULL gives 0 */
                break;
            }
            case 'tostring': {
                let s = lua_tostring(L1, getindex(L, L1, pc));
                let s1 = lua_pushstring(L1, s);
                assert(luastring_eq(s, s1));
                break;
            }
            case 'type': {
                lua_pushstring(L1, luaL_typename(L1, getnum(L, L1, pc)));
                break;
            }
            case 'xmove': {
                let f = getindex(L, L1, pc);
                let t = getindex(L, L1, pc);
                let fs = (f === 0) ? L1 : lua_tothread(L1, f);
                let ts = (t === 0) ? L1 : lua_tothread(L1, t);
                let n = getnum(L, L1, pc);
                if (n === 0) n = lua_gettop(fs);
                lua_xmove(fs, ts, n);
                break;
            }
            case 'yield': {
                return lua_yield(L1, getnum(L, L1, pc));
            }
            case 'yieldk': {
                let nres = getnum(L, L1, pc);
                let i = getindex(L, L1, pc);
                return lua_yieldk(L1, nres, i, Cfunck);
            }
            default:
                luaL_error(L, to_luastring('unknown instruction %s'), buff);
        }
    }
};


const testJS = function(L) {
    let L1;
    let pc;
    if (lua_isuserdata(L, 1)) {
        L1 = getstate(L);
        pc = luaL_checkstring(L, 2);
    } else if (lua_isthread(L, 1)) {
        L1 = lua_tothread(L, 1);
        pc = luaL_checkstring(L, 2);
    } else {
        L1 = L;
        pc = luaL_checkstring(L, 1);
    }
    return runJS(L, L1, { script: pc, offset: 0 });
};

const upvalue = function(L) {
    let n = luaL_checkinteger(L, 2);
    luaL_checktype(L, 1, LUA_TFUNCTION);
    if (lua_isnone(L, 3)) {
        let name = lua_getupvalue(L, 1, n);
        if (name === null) return 0;
        lua_pushstring(L, name);
        return 2;
    }
    else {
        let name = lua_setupvalue(L, 1, n);
        lua_pushstring(L, name);
        return 1;
    }
};

const pushuserdata = function(L) {
    let u = luaL_checkinteger(L, 1);
    lua_pushlightuserdata(L, u);
    return 1;
};

const udataval = function(L) {
    lua_pushinteger(L, lua_touserdata(L, 1));
    return 1;
};

const d2s = function(L) {
    let d = luaL_checknumber(L, 1);
    let b = new ArrayBuffer(8);
    new DataView(b).setFloat64(0, d, true);
    lua_pushlstring(L, new Uint8Array(b), 8);
    return 1;
};

const s2d = function(L) {
    let b = luaL_checkstring(L, 1);
    let dv = new DataView(b.buffer);
    lua_pushnumber(L, dv.getFloat64(0, true));
    return 1;
};

const newstate = function(L) {
    let L1 = lua_newstate();
    if (L1) {
        lua_atpanic(L1, tpanic);
        lua_pushlightuserdata(L, L1);
    }
    else
        lua_pushnil(L);
    return 1;
};

const getstate = function(L) {
    let L1 = lua_touserdata(L, 1);
    luaL_argcheck(L, L1 !== null, 1, 'state expected');
    return L1;
};

const loadlib = function(L) {
    let libs = {
        '_G': luaopen_base,
        'coroutine': luaopen_coroutine,
        'debug': luaopen_debug,
        'io': luaopen_io,
        'os': luaopen_os,
        'math': luaopen_math,
        'string': luaopen_string,
        'table': luaopen_table
    };
    let L1 = getstate(L);
    luaL_requiref(L1, to_luastring('package', true), luaopen_package, 0);
    assert(lua_type(L1, -1) == LUA_TTABLE);
    /* 'requiref' should not reload module already loaded... */
    luaL_requiref(L1, to_luastring('package', true), null, 1);    /* seg. fault if it reloads */
    /* ...but should return the same module */
    assert(lua_compare(L1, -1, -2, LUA_OPEQ));
    luaL_getsubtable(L1, LUA_REGISTRYINDEX, LUA_PRELOAD_TABLE);
    for (let name in libs) {
        lua_pushcfunction(L1, libs[name]);
        lua_setfield(L1, -2, to_luastring(name, true));
    }
    return 0;
};

const closestate = function(L) {
    let L1 = getstate(L);
    lua_close(L1);
    return 0;
};

const doremote = function(L) {
    let L1 = getstate(L);
    let lcode;
    let code = luaL_checklstring(L, 2, lcode);
    let status;
    lua_settop(L1, 0);
    status = luaL_loadbuffer(L1, code, lcode, code);
    if (status === LUA_OK)
        status = lua_pcall(L1, 0, LUA_MULTRET, 0);
    if (status !== LUA_OK) {
        lua_pushnil(L);
        lua_pushstring(L, lua_tostring(L1, -1));
        lua_pushinteger(L, status);
        return 3;
    }
    else {
        let i = 0;
        while (!lua_isnone(L1, ++i))
            lua_pushstring(L, lua_tostring(L1, i));
        lua_pop(L1, i-1);
        return i-1;
    }
};

const tpanic = function(L) {
    console.error(`PANIC: unprotected error in call to Lua API (${lua_tojsstring(L, -1)})\n`);
    return process.exit(1);  /* do not return to Lua */
};

const newuserdata = function(L) {
    lua_newuserdata(L, luaL_checkinteger(L, 1));
    return 1;
};

/*
** C hook that runs the C script stored in registry.C_HOOK[L]
*/
const Chook = function(L, ar) {
    let scpt;
    let events = ['call', 'ret', 'line', 'count', 'tailcall'].map(e => to_luastring(e));
    lua_getfield(L, LUA_REGISTRYINDEX, to_luastring('JS_HOOK', true));
    lua_pushlightuserdata(L, L);
    lua_gettable(L, -2);  /* get C_HOOK[L] (script saved by sethookaux) */
    scpt = lua_tostring(L, -1);  /* not very religious (string will be popped) */
    lua_pop(L, 2);  /* remove C_HOOK and script */
    lua_pushstring(L, events[ar.event]);  /* may be used by script */
    lua_pushinteger(L, ar.currentline);  /* may be used by script */
    runJS(L, L, { script: scpt, offset: 0 });  /* run script from C_HOOK[L] */
};

class Aux {
    constructor() {
        this.paniccode = null;
        this.L = null;
    }
}

/*
** does a long-jump back to "main program".
*/
const panicback = function(L) {
    let b = new Aux();
    lua_checkstack(L, 1);    /* open space for 'Aux' struct */
    lua_getfield(L, LUA_REGISTRYINDEX, to_luastring('_jmpbuf', true));    /* get 'Aux' struct */
    b = lua_touserdata(L, -1);
    lua_pop(L, 1);    /* remove 'Aux' struct */
    runJS(b.L, L, { script: b.paniccode, offset: 0 });    /* run optional panic code */
    throw 1;
};

const checkpanic = function(L) {
    let b = new Aux();
    let code = luaL_checkstring(L, 1);
    b.paniccode = luaL_optstring(L, 2, '');
    b.L = L;
    let L1 = lua_newstate();    /* create new state */
    if (L1 === null) {    /* error? */
        lua_pushnil(L);
        return 1;
    }
    lua_atpanic(L1, panicback);    /* set its panic function */
    lua_pushlightuserdata(L1, b);
    lua_setfield(L1, LUA_REGISTRYINDEX, to_luastring('_jmpbuf', true));    /* store 'Aux' struct */
    try {    /* set jump buffer */
        runJS(L, L1, { script: code, offset: 0 });    /* run code unprotected */
        lua_pushliteral(L, 'no errors');
    } catch (e) {    /* error handling */
        /* move error message to original state */
        lua_pushstring(L, lua_tostring(L1, -1));
    }
    lua_close(L1);
    return 1;
};

/*
** sets 'registry.C_HOOK[L] = scpt' and sets 'Chook' as a hook
*/
const sethookaux = function(L, mask, count, scpt) {
    if (scpt.length <= 0) {  /* no script? */
        lua_sethook(L, null, 0, 0);  /* turn off hooks */
        return;
    }
    lua_getfield(L, LUA_REGISTRYINDEX, to_luastring('JS_HOOK', true));  /* get C_HOOK table */
    if (!lua_istable(L, -1)) {  /* no hook table? */
        lua_pop(L, 1);  /* remove previous value */
        lua_newtable(L);  /* create new C_HOOK table */
        lua_pushvalue(L, -1);
        lua_setfield(L, LUA_REGISTRYINDEX, to_luastring('JS_HOOK', true));  /* register it */
    }
    lua_pushlightuserdata(L, L);
    lua_pushstring(L, scpt);
    lua_settable(L, -3);  /* C_HOOK[L] = script */
    lua_sethook(L, Chook, mask, count);
};

const sethook = function(L) {
    if (lua_isnoneornil(L, 1))
        lua_sethook(L, null, 0, 0);  /* turn off hooks */
    else {
        const scpt = luaL_checkstring(L, 1);
        const smask = luaL_checkstring(L, 2);
        let count = luaL_optinteger(L, 3, 0);
        let mask = 0;
        if (luastring_indexOf(smask, 'c'.charCodeAt(0)) >= 0) mask |= LUA_MASKCALL;
        if (luastring_indexOf(smask, 'r'.charCodeAt(0)) >= 0) mask |= LUA_MASKRET;
        if (luastring_indexOf(smask, 'l'.charCodeAt(0)) >= 0) mask |= LUA_MASKLINE;
        if (count > 0) mask |= LUA_MASKCOUNT;
        sethookaux(L, mask, count, scpt);
    }
    return 0;
};

const Cfunc = function(L) {
    return runJS(L, L, { script: lua_tostring(L, lua_upvalueindex(1)), offset: 0 });
};

const Cfunck = function(L, status, ctx) {
    pushcode(L, status);
    lua_setglobal(L, to_luastring('status', true));
    lua_pushinteger(L, ctx);
    lua_setglobal(L, to_luastring('ctx', true));
    return runJS(L, L, { script: lua_tostring(L, ctx), offset: 0 });
};

const makeCfunc = function(L) {
    luaL_checkstring(L, 1);
    lua_pushcclosure(L, Cfunc, lua_gettop(L));
    return 1;
};

const coresume = function(L) {
    let status;
    let co = lua_tothread(L, 1);
    luaL_argcheck(L, co, 1, 'coroutine expected');
    status = lua_resume(co, L, 0);
    if (status != LUA_OK && status !== LUA_YIELD) {
        lua_pushboolean(L, 0);
        lua_insert(L, -2);
        return 2;  /* return false + error message */
    }
    else {
        lua_pushboolean(L, 1);
        return 1;
    }
};

const obj_at = function(L, k) {
    return L.stack[L.ci.funcOff + k].value.p;
};

const setnameval = function(L, name, val) {
    lua_pushstring(L, name);
    lua_pushinteger(L, val);
    lua_settable(L, -3);
};

const pushobject = function(L, o){
    pushobj2s(L, o);
    assert(L.top <= L.ci.top, 'stack overflow');
};

const buildop = function(p, pc) {
    let i = p.code[pc];
    let o = GET_OPCODE(i);
    let name = OpCodes[o];
    let line = p.lineinfo.length !== 0 ? p.lineinfo[pc] : -1;
    let result = sprintf('(%4d) %4d - ', line, pc); //`(${line}) ${pc} - `;
    switch (getOpMode(o)) {
        case iABC:
            result += sprintf('%-12s%4d %4d %4d', name, GETARG_A(i), GETARG_B(i), GETARG_C(i)); // `${name} ${lopcodes.GETARG_A(i)} ${lopcodes.GETARG_B(i)} ${lopcodes.GETARG_C(i)}`;
            break;
        case iABx:
            result += sprintf('%-12s%4d %4d', name, GETARG_A(i), GETARG_Bx(i)); // `${name} ${lopcodes.GETARG_A(i)} ${lopcodes.GETARG_Bx(i)}`;
            break;
        case iAsBx:
            result += sprintf('%-12s%4d %4d', name, GETARG_A(i), GETARG_sBx(i)); // `${name} ${lopcodes.GETARG_A(i)} ${lopcodes.GETARG_sBx(i)}`;
            break;
        case iAx:
            result += sprintf('%-12s%4d', name, GETARG_Ax(i)); // `${name} ${lopcodes.GETARG_Ax(i)}`;
            break;
    }

    return to_luastring(result);
};

const listcode = function(L) {
    luaL_argcheck(L, lua_isfunction(L, 1) && !lua_iscfunction(L, 1),
        1, 'Lua function expected');
    let p = obj_at(L, 1);
    lua_newtable(L);
    setnameval(L, to_luastring('maxstack', true), p.maxstacksize);
    setnameval(L, to_luastring('numparams', true), p.numparams);
    for (let pc = 0; pc < p.code.length; pc++) {
        lua_pushinteger(L, pc+1);
        lua_pushstring(L, buildop(p, pc));
        lua_settable(L, -3);
    }
    return 1;
};

const listk = function(L) {
    luaL_argcheck(L,
        lua_isfunction(L, 1) && !lua_iscfunction(L, 1),
        1, 'Lua function expected');
    let p = obj_at(L, 1);
    lua_createtable(L, p.k.length, 0);
    for (let i = 0; i < p.k.length; i++) {
        pushobject(L, p.k[i]);
        lua_rawseti(L, -2, i + 1);
    }
    return 1;
};

const tests_funcs = {
    'checkpanic':   checkpanic,
    'closestate':   closestate,
    'd2s':          d2s,
    'doremote':     doremote,
    'listcode':     listcode,
    'listk':        listk,
    'loadlib':      loadlib,
    'makeCfunc':    makeCfunc,
    'newstate':     newstate,
    'newuserdata':  newuserdata,
    'pushuserdata': pushuserdata,
    'resume':       coresume,
    's2d':          s2d,
    'sethook':      sethook,
    'testC':        testJS,
    'testJS':       testJS,
    'udataval':     udataval,
    'upvalue':      upvalue
};

const luaB_opentests = function(L) {
    lua_atpanic(L, tpanic);
    luaL_newlib(L, tests_funcs);
    return 1;
};

export const luaopen_tests = function(L) {
    luaL_requiref(L, to_luastring('T'), luaB_opentests, 1);
    lua_pop(L, 1); /* remove lib */
};
