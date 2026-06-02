import { LUAL_BUFFERSIZE } from './luaconf.js';
import { LUA_ERRERR, LUA_MULTRET, LUA_REGISTRYINDEX, LUA_SIGNATURE, LUA_TBOOLEAN, LUA_TLIGHTUSERDATA, LUA_TNIL, LUA_TNONE, LUA_TNUMBER, LUA_TSTRING, LUA_TTABLE, LUA_VERSION_NUM, lua_Debug, lua_absindex, lua_atpanic, lua_call, lua_checkstack, lua_concat, lua_copy, lua_createtable, lua_error, lua_getfield, lua_getinfo, lua_getmetatable, lua_getstack, lua_gettop, lua_insert, lua_isinteger, lua_isnil, lua_isnumber, lua_isstring, lua_istable, lua_len, lua_load, lua_newstate, lua_newtable, lua_next, lua_pcall, lua_pop, lua_pushboolean, lua_pushcclosure, lua_pushcfunction, lua_pushfstring, lua_pushinteger, lua_pushliteral, lua_pushlstring, lua_pushnil, lua_pushstring, lua_pushvalue, lua_pushvfstring, lua_rawequal, lua_rawget, lua_rawgeti, lua_rawlen, lua_rawseti, lua_remove, lua_setfield, lua_setglobal, lua_setmetatable, lua_settop, lua_toboolean, lua_tointeger, lua_tointegerx, lua_tojsstring, lua_tolstring, lua_tonumber, lua_tonumberx, lua_topointer, lua_tostring, lua_touserdata, lua_type, lua_typename, lua_version } from './lua.js';
import { from_userstring, luastring_eq, to_luastring, to_uristring } from './fengaricore.js';
import fs from 'fs';

/* extra error code for 'luaL_loadfilex' */
const LUA_ERRFILE = LUA_ERRERR + 1;

/* key, in the registry, for table of loaded modules */
const LUA_LOADED_TABLE = to_luastring('_LOADED');

/* key, in the registry, for table of preloaded loaders */
const LUA_PRELOAD_TABLE = to_luastring('_PRELOAD');

const LUA_FILEHANDLE = to_luastring('FILE*');

const LUAL_NUMSIZES = 4 * 16 + 8;

const __name = to_luastring('__name');
const __tostring = to_luastring('__tostring');

const empty = new Uint8Array(0);

class luaL_Buffer {
    constructor() {
        this.L = null;
        this.b = empty;
        this.n = 0;
    }
}

const LEVELS1 = 10;  /* size of the first part of the stack */
const LEVELS2 = 11;  /* size of the second part of the stack */

/*
** search for 'objidx' in table at index -1.
** return 1 + string at top if find a good name.
*/
const findfield = function (L, objidx, level) {
    if (level === 0 || !lua_istable(L, -1))
        return 0;  /* not found */

    lua_pushnil(L);  /* start 'next' loop */

    while (lua_next(L, -2)) {  /* for each pair in table */
        if (lua_type(L, -2) === LUA_TSTRING) {  /* ignore non-string keys */
            if (lua_rawequal(L, objidx, -1)) {  /* found object? */
                lua_pop(L, 1);  /* remove value (but keep name) */
                return 1;
            } else if (findfield(L, objidx, level - 1)) {  /* try recursively */
                lua_remove(L, -2);  /* remove table (but keep name) */
                lua_pushliteral(L, '.');
                lua_insert(L, -2);  /* place '.' between the two names */
                lua_concat(L, 3);
                return 1;
            }
        }
        lua_pop(L, 1);  /* remove value */
    }

    return 0;  /* not found */
};

/*
** Search for a name for a function in all loaded modules
*/
const pushglobalfuncname = function (L, ar) {
    let top = lua_gettop(L);
    lua_getinfo(L, to_luastring('f'), ar);  /* push function */
    lua_getfield(L, LUA_REGISTRYINDEX, LUA_LOADED_TABLE);
    if (findfield(L, top + 1, 2)) {
        let name = lua_tostring(L, -1);
        if (name[0] === 95 /* '_'.charCodeAt(0) */ &&
            name[1] === 71 /* 'G'.charCodeAt(0) */ &&
            name[2] === 46 /* '.'.charCodeAt(0) */
        ) {  /* name start with '_G.'? */
            lua_pushstring(L, name.subarray(3));  /* push name without prefix */
            lua_remove(L, -2);  /* remove original name */
        }
        lua_copy(L, -1, top + 1);  /* move name to proper place */
        lua_pop(L, 2);  /* remove pushed values */
        return 1;
    } else {
        lua_settop(L, top);  /* remove function and global table */
        return 0;
    }
};

const pushfuncname = function (L, ar) {
    if (pushglobalfuncname(L, ar)) {  /* try first a global name */
        lua_pushfstring(L, to_luastring('function \'%s\''), lua_tostring(L, -1));
        lua_remove(L, -2);  /* remove name */
    }
    else if (ar.namewhat.length !== 0)  /* is there a name from code? */
        lua_pushfstring(L, to_luastring('%s \'%s\''), ar.namewhat, ar.name);  /* use it */
    else if (ar.what && ar.what[0] === 109 /* 'm'.charCodeAt(0) */)  /* main? */
        lua_pushliteral(L, 'main chunk');
    else if (ar.what && ar.what[0] === 76 /* 'L'.charCodeAt(0) */)  /* for Lua functions, use <file:line> */
        lua_pushfstring(L, to_luastring('function <%s:%d>'), ar.short_src, ar.linedefined);
    else  /* nothing left... */
        lua_pushliteral(L, '?');
};

const lastlevel = function (L) {
    let ar = new lua_Debug();
    let li = 1;
    let le = 1;
    /* find an upper bound */
    while (lua_getstack(L, le, ar)) { li = le; le *= 2; }
    /* do a binary search */
    while (li < le) {
        let m = Math.floor((li + le) / 2);
        if (lua_getstack(L, m, ar)) li = m + 1;
        else le = m;
    }
    return le - 1;
};

const luaL_traceback = function (L, L1, msg, level) {
    let ar = new lua_Debug();
    let top = lua_gettop(L);
    let last = lastlevel(L1);
    let n1 = last - level > LEVELS1 + LEVELS2 ? LEVELS1 : -1;
    if (msg)
        lua_pushfstring(L, to_luastring('%s\n'), msg);
    luaL_checkstack(L, 10, null);
    lua_pushliteral(L, 'stack traceback:');
    while (lua_getstack(L1, level++, ar)) {
        if (n1-- === 0) {  /* too many levels? */
            lua_pushliteral(L, '\n\t...');  /* add a '...' */
            level = last - LEVELS2 + 1;  /* and skip to last ones */
        } else {
            lua_getinfo(L1, to_luastring('Slnt', true), ar);
            lua_pushfstring(L, to_luastring('\n\t%s:'), ar.short_src);
            if (ar.currentline > 0)
                lua_pushliteral(L, `${ar.currentline}:`);
            lua_pushliteral(L, ' in ');
            pushfuncname(L, ar);
            if (ar.istailcall)
                lua_pushliteral(L, '\n\t(...tail calls..)');
            lua_concat(L, lua_gettop(L) - top);
        }
    }
    lua_concat(L, lua_gettop(L) - top);
};

const panic = function (L) {
    let msg = 'PANIC: unprotected error in call to Lua API (' + lua_tojsstring(L, -1) + ')';
    throw new Error(msg);
};

const luaL_argerror = function (L, arg, extramsg) {
    let ar = new lua_Debug();

    if (!lua_getstack(L, 0, ar))  /* no stack frame? */
        return luaL_error(L, to_luastring('bad argument #%d (%s)'), arg, extramsg);

    lua_getinfo(L, to_luastring('n'), ar);

    if (luastring_eq(ar.namewhat, to_luastring('method'))) {
        arg--;  /* do not count 'self' */
        if (arg === 0)  /* error is in the self argument itself? */
            return luaL_error(L, to_luastring('calling \'%s\' on bad self (%s)'), ar.name, extramsg);
    }

    if (ar.name === null)
        ar.name = pushglobalfuncname(L, ar) ? lua_tostring(L, -1) : to_luastring('?');

    return luaL_error(L, to_luastring('bad argument #%d to \'%s\' (%s)'), arg, ar.name, extramsg);
};

const typeerror = function (L, arg, tname) {
    let typearg;
    if (luaL_getmetafield(L, arg, __name) === LUA_TSTRING)
        typearg = lua_tostring(L, -1);
    else if (lua_type(L, arg) === LUA_TLIGHTUSERDATA)
        typearg = to_luastring('light userdata', true);
    else
        typearg = luaL_typename(L, arg);

    let msg = lua_pushfstring(L, to_luastring('%s expected, got %s'), tname, typearg);
    return luaL_argerror(L, arg, msg);
};

const luaL_where = function (L, level) {
    let ar = new lua_Debug();
    if (lua_getstack(L, level, ar)) {
        lua_getinfo(L, to_luastring('Sl', true), ar);
        if (ar.currentline > 0) {
            lua_pushfstring(L, to_luastring('%s:%d: '), ar.short_src, ar.currentline);
            return;
        }
    }
    lua_pushstring(L, to_luastring(''));
};

const luaL_error = function (L, fmt, ...argp) {
    luaL_where(L, 1);
    lua_pushvfstring(L, fmt, argp);
    lua_concat(L, 2);
    return lua_error(L);
};

/* Unlike normal lua, we pass in an error object */
const luaL_fileresult = function (L, stat, fname, e) {
    if (stat) {
        lua_pushboolean(L, 1);
        return 1;
    } else {
        lua_pushnil(L);
        let message, errno;
        if (e) {
            message = e.message;
            errno = -e.errno;
        } else {
            message = 'Success'; /* what strerror(0) returns */
            errno = 0;
        }
        if (fname)
            lua_pushfstring(L, to_luastring('%s: %s'), fname, to_luastring(message));
        else
            lua_pushstring(L, to_luastring(message));
        lua_pushinteger(L, errno);
        return 3;
    }
};

/* Unlike normal lua, we pass in an error object */
const luaL_execresult = function (L, e) {
    let what, stat;
    if (e === null) {
        lua_pushboolean(L, 1);
        lua_pushliteral(L, 'exit');
        lua_pushinteger(L, 0);
        return 3;
    } else if (e.status) {
        what = 'exit';
        stat = e.status;
    } else if (e.signal) {
        what = 'signal';
        stat = e.signal;
    } else {
        /* XXX: node seems to have e.errno as a string instead of a number */
        return luaL_fileresult(L, 0, null, e);
    }
    lua_pushnil(L);
    lua_pushliteral(L, what);
    lua_pushinteger(L, stat);
    return 3;
};

const luaL_getmetatable = function (L, n) {
    return lua_getfield(L, LUA_REGISTRYINDEX, n);
};

const luaL_newmetatable = function (L, tname) {
    if (luaL_getmetatable(L, tname) !== LUA_TNIL)  /* name already in use? */
        return 0;  /* leave previous value on top, but return 0 */
    lua_pop(L, 1);
    lua_createtable(L, 0, 2);  /* create metatable */
    lua_pushstring(L, tname);
    lua_setfield(L, -2, __name);  /* metatable.__name = tname */
    lua_pushvalue(L, -1);
    lua_setfield(L, LUA_REGISTRYINDEX, tname);  /* registry.name = metatable */
    return 1;

};

const luaL_setmetatable = function (L, tname) {
    luaL_getmetatable(L, tname);
    lua_setmetatable(L, -2);
};

const luaL_testudata = function (L, ud, tname) {
    let p = lua_touserdata(L, ud);
    if (p !== null) {  /* value is a userdata? */
        if (lua_getmetatable(L, ud)) {  /* does it have a metatable? */
            luaL_getmetatable(L, tname);  /* get correct metatable */
            if (!lua_rawequal(L, -1, -2))  /* not the same? */
                p = null;  /* value is a userdata with wrong metatable */
            lua_pop(L, 2);  /* remove both metatables */
            return p;
        }
    }
    return null;  /* value is not a userdata with a metatable */
};

const luaL_checkudata = function (L, ud, tname) {
    let p = luaL_testudata(L, ud, tname);
    if (p === null) typeerror(L, ud, tname);
    return p;
};

const luaL_checkoption = function (L, arg, def, lst) {
    let name = def !== null ? luaL_optstring(L, arg, def) : luaL_checkstring(L, arg);
    for (let i = 0; lst[i]; i++)
        if (luastring_eq(lst[i], name))
            return i;
    return luaL_argerror(L, arg, lua_pushfstring(L, to_luastring('invalid option \'%s\''), name));
};

const tag_error = function (L, arg, tag) {
    typeerror(L, arg, lua_typename(L, tag));
};

const luaL_newstate = function () {
    let L = lua_newstate();
    if (L) lua_atpanic(L, panic);
    return L;
};


const luaL_typename = function (L, i) {
    return lua_typename(L, lua_type(L, i));
};

const luaL_argcheck = function (L, cond, arg, extramsg) {
    if (!cond) luaL_argerror(L, arg, extramsg);
};

const luaL_checkany = function (L, arg) {
    if (lua_type(L, arg) === LUA_TNONE)
        luaL_argerror(L, arg, to_luastring('value expected', true));
};

const luaL_checktype = function (L, arg, t) {
    if (lua_type(L, arg) !== t)
        tag_error(L, arg, t);
};

const luaL_checklstring = function (L, arg) {
    let s = lua_tolstring(L, arg);
    if (s === null || s === undefined) tag_error(L, arg, LUA_TSTRING);
    return s;
};

const luaL_checkstring = luaL_checklstring;

const luaL_optlstring = function (L, arg, def) {
    if (lua_type(L, arg) <= 0) {
        return def === null ? null : from_userstring(def);
    } else return luaL_checklstring(L, arg);
};

const luaL_optstring = luaL_optlstring;

const interror = function (L, arg) {
    if (lua_isnumber(L, arg))
        luaL_argerror(L, arg, to_luastring('number has no integer representation', true));
    else
        tag_error(L, arg, LUA_TNUMBER);
};

const luaL_checknumber = function (L, arg) {
    let d = lua_tonumberx(L, arg);
    if (d === false)
        tag_error(L, arg, LUA_TNUMBER);
    return d;
};

const luaL_optnumber = function (L, arg, def) {
    return luaL_opt(L, luaL_checknumber, arg, def);
};

const luaL_checkinteger = function (L, arg) {
    let d = lua_tointegerx(L, arg);
    if (d === false)
        interror(L, arg);
    return d;
};

const luaL_optinteger = function (L, arg, def) {
    return luaL_opt(L, luaL_checkinteger, arg, def);
};

const luaL_prepbuffsize = function (B, sz) {
    let newend = B.n + sz;
    if (B.b.length < newend) {
        let newsize = Math.max(B.b.length * 2, newend);  /* double buffer size */
        let newbuff = new Uint8Array(newsize);  /* create larger buffer */
        newbuff.set(B.b);  /* copy original content */
        B.b = newbuff;
    }
    return B.b.subarray(B.n, newend);
};

const luaL_buffinit = function (L, B) {
    B.L = L;
    B.b = empty;
};

const luaL_buffinitsize = function (L, B, sz) {
    luaL_buffinit(L, B);
    return luaL_prepbuffsize(B, sz);
};

const luaL_prepbuffer = function (B) {
    return luaL_prepbuffsize(B, LUAL_BUFFERSIZE);
};

const luaL_addlstring = function (B, s, l) {
    if (l > 0) {
        s = from_userstring(s);
        let b = luaL_prepbuffsize(B, l);
        b.set(s.subarray(0, l));
        luaL_addsize(B, l);
    }
};

const luaL_addstring = function (B, s) {
    s = from_userstring(s);
    luaL_addlstring(B, s, s.length);
};

const luaL_pushresult = function (B) {
    lua_pushlstring(B.L, B.b, B.n);
    /* delete old buffer */
    B.n = 0;
    B.b = empty;
};

const luaL_addchar = function (B, c) {
    luaL_prepbuffsize(B, 1);
    B.b[B.n++] = c;
};

const luaL_addsize = function (B, s) {
    B.n += s;
};

const luaL_pushresultsize = function (B, sz) {
    luaL_addsize(B, sz);
    luaL_pushresult(B);
};

const luaL_addvalue = function (B) {
    let L = B.L;
    let s = lua_tostring(L, -1);
    luaL_addlstring(B, s, s.length);
    lua_pop(L, 1);  /* remove value */
};

const luaL_opt = function (L, f, n, d) {
    return lua_type(L, n) <= 0 ? d : f(L, n);
};

const getS = function (L, ud) {
    let s = ud.string;
    ud.string = null;
    return s;
};

const luaL_loadbufferx = function (L, buff, size, name, mode) {
    return lua_load(L, getS, { string: buff }, name, mode);
};

const luaL_loadbuffer = function (L, s, sz, n) {
    return luaL_loadbufferx(L, s, sz, n, null);
};

const luaL_loadstring = function (L, s) {
    return luaL_loadbuffer(L, s, s.length, s);
};

const luaL_dostring = function (L, s) {
    return (luaL_loadstring(L, s) || lua_pcall(L, 0, LUA_MULTRET, 0));
};

const luaL_getmetafield = function (L, obj, event) {
    if (!lua_getmetatable(L, obj))  /* no metatable? */
        return LUA_TNIL;
    else {
        lua_pushstring(L, event);
        let tt = lua_rawget(L, -2);
        if (tt === LUA_TNIL)  /* is metafield nil? */
            lua_pop(L, 2);  /* remove metatable and metafield */
        else
            lua_remove(L, -2);  /* remove only metatable */
        return tt;  /* return metafield type */
    }
};

const luaL_callmeta = function (L, obj, event) {
    obj = lua_absindex(L, obj);
    if (luaL_getmetafield(L, obj, event) === LUA_TNIL)
        return false;

    lua_pushvalue(L, obj);
    lua_call(L, 1, 1);

    return true;
};

const luaL_len = function (L, idx) {
    lua_len(L, idx);
    let l = lua_tointegerx(L, -1);
    if (l === false)
        luaL_error(L, to_luastring('object length is not an integer', true));
    lua_pop(L, 1);  /* remove object */
    return l;
};

const p_I = to_luastring('%I');
const p_f = to_luastring('%f');
const luaL_tolstring = function (L, idx) {
    if (luaL_callmeta(L, idx, __tostring)) {
        if (!lua_isstring(L, -1))
            luaL_error(L, to_luastring('\'__tostring\' must return a string'));
    } else {
        let t = lua_type(L, idx);
        switch (t) {
            case LUA_TNUMBER: {
                if (lua_isinteger(L, idx))
                    lua_pushfstring(L, p_I, lua_tointeger(L, idx));
                else
                    lua_pushfstring(L, p_f, lua_tonumber(L, idx));
                break;
            }
            case LUA_TSTRING:
                lua_pushvalue(L, idx);
                break;
            case LUA_TBOOLEAN:
                lua_pushliteral(L, (lua_toboolean(L, idx) ? 'true' : 'false'));
                break;
            case LUA_TNIL:
                lua_pushliteral(L, 'nil');
                break;
            default: {
                let tt = luaL_getmetafield(L, idx, __name);
                let kind = tt === LUA_TSTRING ? lua_tostring(L, -1) : luaL_typename(L, idx);
                lua_pushfstring(L, to_luastring('%s: %p'), kind, lua_topointer(L, idx));
                if (tt !== LUA_TNIL)
                    lua_remove(L, -2);
                break;
            }
        }
    }

    return lua_tolstring(L, -1);
};

/*
** Stripped-down 'require': After checking "loaded" table, calls 'openf'
** to open a module, registers the result in 'package.loaded' table and,
** if 'glb' is true, also registers the result in the global table.
** Leaves resulting module on the top.
*/
const luaL_requiref = function (L, modname, openf, glb) {
    luaL_getsubtable(L, LUA_REGISTRYINDEX, LUA_LOADED_TABLE);
    lua_getfield(L, -1, modname); /* LOADED[modname] */
    if (!lua_toboolean(L, -1)) {  /* package not already loaded? */
        lua_pop(L, 1);  /* remove field */
        lua_pushcfunction(L, openf);
        lua_pushstring(L, modname);  /* argument to open function */
        lua_call(L, 1, 1);  /* call 'openf' to open module */
        lua_pushvalue(L, -1);  /* make copy of module (call result) */
        lua_setfield(L, -3, modname);  /* LOADED[modname] = module */
    }
    lua_remove(L, -2);  /* remove LOADED table */
    if (glb) {
        lua_pushvalue(L, -1);  /* copy of module */
        lua_setglobal(L, modname);  /* _G[modname] = module */
    }
};

const find_subarray = function (arr, subarr, from_index) {
    var i = from_index >>> 0,
        sl = subarr.length,
        l = arr.length + 1 - sl;

    loop: for (; i < l; i++) {
        for (let j = 0; j < sl; j++)
            if (arr[i + j] !== subarr[j])
                continue loop;
        return i;
    }
    return -1;
};

const luaL_gsub = function (L, s, p, r) {
    let wild;
    let b = new luaL_Buffer();
    luaL_buffinit(L, b);
    while ((wild = find_subarray(s, p)) >= 0) {
        luaL_addlstring(b, s, wild);  /* push prefix */
        luaL_addstring(b, r);  /* push replacement in place of pattern */
        s = s.subarray(wild + p.length);  /* continue after 'p' */
    }
    luaL_addstring(b, s);  /* push last suffix */
    luaL_pushresult(b);
    return lua_tostring(L, -1);
};

/*
** ensure that stack[idx][fname] has a table and push that table
** into the stack
*/
const luaL_getsubtable = function (L, idx, fname) {
    if (lua_getfield(L, idx, fname) === LUA_TTABLE)
        return true;  /* table already there */
    else {
        lua_pop(L, 1);  /* remove previous result */
        idx = lua_absindex(L, idx);
        lua_newtable(L);
        lua_pushvalue(L, -1);  /* copy to be left at top */
        lua_setfield(L, idx, fname);  /* assign new table to field */
        return false;  /* false, because did not find table there */
    }
};

/*
** set functions from list 'l' into table at top - 'nup'; each
** function gets the 'nup' elements at the top as upvalues.
** Returns with only the table at the stack.
*/
const luaL_setfuncs = function (L, l, nup) {
    luaL_checkstack(L, nup, to_luastring('too many upvalues', true));
    for (let lib in l) {  /* fill the table with given functions */
        for (let i = 0; i < nup; i++)  /* copy upvalues to the top */
            lua_pushvalue(L, -nup);
        lua_pushcclosure(L, l[lib], nup);  /* closure with those upvalues */
        lua_setfield(L, -(nup + 2), to_luastring(lib));
    }
    lua_pop(L, nup);  /* remove upvalues */
};

/*
** Ensures the stack has at least 'space' extra slots, raising an error
** if it cannot fulfill the request. (The error handling needs a few
** extra slots to format the error message. In case of an error without
** this extra space, Lua will generate the same 'stack overflow' error,
** but without 'msg'.)
*/
const luaL_checkstack = function (L, space, msg) {
    if (!lua_checkstack(L, space)) {
        if (msg)
            luaL_error(L, to_luastring('stack overflow (%s)'), msg);
        else
            luaL_error(L, to_luastring('stack overflow', true));
    }
};

const luaL_newlibtable = function (L) {
    lua_createtable(L);
};

const luaL_newlib = function (L, l) {
    lua_createtable(L);
    luaL_setfuncs(L, l, 0);
};

/* predefined references */
const LUA_NOREF = -2;
const LUA_REFNIL = -1;

const luaL_ref = function (L, t) {
    let ref;
    if (lua_isnil(L, -1)) {
        lua_pop(L, 1);  /* remove from stack */
        return LUA_REFNIL;  /* 'nil' has a unique fixed reference */
    }
    t = lua_absindex(L, t);
    lua_rawgeti(L, t, 0);  /* get first free element */
    ref = lua_tointeger(L, -1);  /* ref = t[freelist] */
    lua_pop(L, 1);  /* remove it from stack */
    if (ref !== 0) {  /* any free element? */
        lua_rawgeti(L, t, ref);  /* remove it from list */
        lua_rawseti(L, t, 0);  /* (t[freelist] = t[ref]) */
    }
    else  /* no free elements */
        ref = lua_rawlen(L, t) + 1;  /* get a new reference */
    lua_rawseti(L, t, ref);
    return ref;
};


const luaL_unref = function (L, t, ref) {
    if (ref >= 0) {
        t = lua_absindex(L, t);
        lua_rawgeti(L, t, 0);
        lua_rawseti(L, t, ref);  /* t[ref] = t[freelist] */
        lua_pushinteger(L, ref);
        lua_rawseti(L, t, 0);  /* t[freelist] = ref */
    }
};


const errfile = function (L, what, fnameindex, error) {
    let serr = error.message;
    let filename = lua_tostring(L, fnameindex).subarray(1);
    lua_pushfstring(L, to_luastring('cannot %s %s: %s'), to_luastring(what), filename, to_luastring(serr));
    lua_remove(L, fnameindex);
    return LUA_ERRFILE;
};

let getc;

const utf8_bom = [0XEF, 0XBB, 0XBF];  /* UTF-8 BOM mark */
const skipBOM = function (lf) {
    lf.n = 0;
    let c;
    let p = 0;
    do {
        c = getc(lf);
        if (c === null || c !== utf8_bom[p]) return c;
        p++;
        lf.buff[lf.n++] = c;  /* to be read by the parser */
    } while (p < utf8_bom.length);
    lf.n = 0;  /* prefix matched; discard it */
    return getc(lf);  /* return next character */
};

/*
** reads the first character of file 'f' and skips an optional BOM mark
** in its beginning plus its first line if it starts with '#'. Returns
** true if it skipped the first line.  In any case, '*cp' has the
** first "valid" character of the file (after the optional BOM and
** a first-line comment).
*/
const skipcomment = function (lf) {
    let c = skipBOM(lf);
    if (c === 35 /* '#'.charCodeAt(0) */) {  /* first line is a comment (Unix exec. file)? */
        do {  /* skip first line */
            c = getc(lf);
        } while (c && c !== 10 /* '\n'.charCodeAt(0) */);

        return {
            skipped: true,
            c: getc(lf)  /* skip end-of-line, if present */
        };
    } else {
        return {
            skipped: false,
            c: c
        };
    }
};

let luaL_loadfilex;

if (typeof process === 'undefined') {
    class LoadF {
        constructor() {
            this.n = NaN;  /* number of pre-read characters */
            this.f = null;  /* file being read */
            this.buff = new Uint8Array(1024);  /* area for reading file */
            this.pos = 0;  /* current position in file */
            this.err = void 0;
        }
    }

    const getF = function (L, ud) {
        let lf = ud;

        if (lf.f !== null && lf.n > 0) {  /* are there pre-read characters to be read? */
            let bytes = lf.n; /* return them (chars already in buffer) */
            lf.n = 0;  /* no more pre-read characters */
            lf.f = lf.f.subarray(lf.pos);  /* we won't use lf.buff anymore */
            return lf.buff.subarray(0, bytes);
        }

        let f = lf.f;
        lf.f = null;
        return f;
    };

    getc = function (lf) {
        return lf.pos < lf.f.length ? lf.f[lf.pos++] : null;
    };

    luaL_loadfilex = function (L, filename, mode) {
        let lf = new LoadF();
        let fnameindex = lua_gettop(L) + 1;  /* index of filename on the stack */
        if (filename === null) {
            throw new Error('Can\'t read stdin in the browser');
        } else {
            lua_pushfstring(L, to_luastring('@%s'), filename);
            let path = to_uristring(filename);
            let xhr = new XMLHttpRequest();
            xhr.open('GET', path, false);
            /*
            Synchronous xhr in main thread always returns a js string.
            Some browsers make console noise if you even attempt to set responseType
            */
            if (typeof window === 'undefined') {
                xhr.responseType = 'arraybuffer';
            }
            xhr.send();
            if (xhr.status >= 200 && xhr.status <= 299) {
                if (typeof xhr.response === 'string') {
                    lf.f = to_luastring(xhr.response);
                } else {
                    lf.f = new Uint8Array(xhr.response);
                }
            } else {
                lf.err = xhr.status;
                return errfile(L, 'open', fnameindex, { message: `${xhr.status}: ${xhr.statusText}` });
            }
        }
        let com = skipcomment(lf);
        /* check for signature first, as we don't want to add line number corrections in binary case */
        if (com.c === LUA_SIGNATURE[0] && filename) {  /* binary file? */
            /* no need to re-open */
        } else if (com.skipped) { /* read initial portion */
            lf.buff[lf.n++] = 10 /* '\n'.charCodeAt(0) */;  /* add line to correct line numbers */
        }
        if (com.c !== null)
            lf.buff[lf.n++] = com.c; /* 'c' is the first character of the stream */
        let status = lua_load(L, getF, lf, lua_tostring(L, -1), mode);
        let readstatus = lf.err;
        if (readstatus) {
            lua_settop(L, fnameindex);  /* ignore results from 'lua_load' */
            return errfile(L, 'read', fnameindex, readstatus);
        }
        lua_remove(L, fnameindex);
        return status;
    };
} else {
    class LoadF {
        constructor() {
            this.n = NaN;  /* number of pre-read characters */
            this.f = null;  /* file being read */
            this.buff = Buffer.alloc(1024);  /* area for reading file */
            this.pos = 0;  /* current position in file */
            this.err = void 0;
        }
    }

    const getF = function (L, ud) {
        let lf = ud;
        let bytes = 0;
        if (lf.n > 0) {  /* are there pre-read characters to be read? */
            bytes = lf.n; /* return them (chars already in buffer) */
            lf.n = 0;  /* no more pre-read characters */
        } else {  /* read a block from file */
            try {
                bytes = fs.readSync(lf.f, lf.buff, 0, lf.buff.length, lf.pos); /* read block */
            } catch (e) {
                lf.err = e;
                bytes = 0;
            }
            lf.pos += bytes;
        }
        if (bytes > 0)
            return lf.buff.subarray(0, bytes);
        else return null;
    };

    getc = function (lf) {
        let b = Buffer.alloc(1);
        let bytes;
        try {
            bytes = fs.readSync(lf.f, b, 0, 1, lf.pos);
        } catch (e) {
            lf.err = e;
            return null;
        }
        lf.pos += bytes;
        return bytes > 0 ? b.readUInt8() : null;
    };

    luaL_loadfilex = function (L, filename, mode) {
        let lf = new LoadF();
        let fnameindex = lua_gettop(L) + 1;  /* index of filename on the stack */
        if (filename === null) {
            lua_pushliteral(L, '=stdin');
            lf.f = process.stdin.fd;
        } else {
            lua_pushfstring(L, to_luastring('@%s'), filename);
            try {
                lf.f = fs.openSync(filename, 'r');
            } catch (e) {
                return errfile(L, 'open', fnameindex, e);
            }
        }
        let com = skipcomment(lf);
        /* check for signature first, as we don't want to add line number corrections in binary case */
        if (com.c === LUA_SIGNATURE[0] && filename) {  /* binary file? */
            /* no need to re-open */
        } else if (com.skipped) { /* read initial portion */
            lf.buff[lf.n++] = 10 /* '\n'.charCodeAt(0) */;  /* add line to correct line numbers */
        }
        if (com.c !== null)
            lf.buff[lf.n++] = com.c; /* 'c' is the first character of the stream */
        let status = lua_load(L, getF, lf, lua_tostring(L, -1), mode);
        let readstatus = lf.err;
        if (filename) try { fs.closeSync(lf.f); } catch (e) { }  /* close file (even in case of errors) */
        if (readstatus) {
            lua_settop(L, fnameindex);  /* ignore results from 'lua_load' */
            return errfile(L, 'read', fnameindex, readstatus);
        }
        lua_remove(L, fnameindex);
        return status;
    };
}

const luaL_loadfile = function (L, filename) {
    return luaL_loadfilex(L, filename, null);
};

const luaL_dofile = function (L, filename) {
    return (luaL_loadfile(L, filename) || lua_pcall(L, 0, LUA_MULTRET, 0));
};

const lua_writestringerror = function () {
    for (let i = 0; i < arguments.length; i++) {
        let a = arguments[i];
        if (typeof process === 'undefined') {
            /* split along new lines for separate console.error invocations */
            do {
                /* regexp uses [\d\D] to work around matching new lines
                   the 's' flag is non-standard */
                let r = /([^\n]*)\n?([\d\D]*)/.exec(a);
                console.error(r[1]);
                a = r[2];
            } while (a !== '');
        } else {
            process.stderr.write(a);
        }
    }
};

const luaL_checkversion_ = function (L, ver, sz) {
    let v = lua_version(L);
    if (sz != LUAL_NUMSIZES)  /* check numeric types */
        luaL_error(L, to_luastring('core and library have incompatible numeric types'));
    if (v != lua_version(null))
        luaL_error(L, to_luastring('multiple Lua VMs detected'));
    else if (v !== ver)
        luaL_error(L, to_luastring('version mismatch: app. needs %f, Lua core provides %f'), ver, v);
};

/* There is no point in providing this function... */
const luaL_checkversion = function (L) {
    luaL_checkversion_(L, LUA_VERSION_NUM, LUAL_NUMSIZES);
};

const _LUA_ERRFILE = LUA_ERRFILE;
export { _LUA_ERRFILE as LUA_ERRFILE };
const _LUA_FILEHANDLE = LUA_FILEHANDLE;
export { _LUA_FILEHANDLE as LUA_FILEHANDLE };
const _LUA_LOADED_TABLE = LUA_LOADED_TABLE;
export { _LUA_LOADED_TABLE as LUA_LOADED_TABLE };
const _LUA_NOREF = LUA_NOREF;
export { _LUA_NOREF as LUA_NOREF };
const _LUA_PRELOAD_TABLE = LUA_PRELOAD_TABLE;
export { _LUA_PRELOAD_TABLE as LUA_PRELOAD_TABLE };
const _LUA_REFNIL = LUA_REFNIL;
export { _LUA_REFNIL as LUA_REFNIL };
const _luaL_Buffer = luaL_Buffer;
export { _luaL_Buffer as luaL_Buffer };
const _luaL_addchar = luaL_addchar;
export { _luaL_addchar as luaL_addchar };
const _luaL_addlstring = luaL_addlstring;
export { _luaL_addlstring as luaL_addlstring };
const _luaL_addsize = luaL_addsize;
export { _luaL_addsize as luaL_addsize };
const _luaL_addstring = luaL_addstring;
export { _luaL_addstring as luaL_addstring };
const _luaL_addvalue = luaL_addvalue;
export { _luaL_addvalue as luaL_addvalue };
const _luaL_argcheck = luaL_argcheck;
export { _luaL_argcheck as luaL_argcheck };
const _luaL_argerror = luaL_argerror;
export { _luaL_argerror as luaL_argerror };
const _luaL_buffinit = luaL_buffinit;
export { _luaL_buffinit as luaL_buffinit };
const _luaL_buffinitsize = luaL_buffinitsize;
export { _luaL_buffinitsize as luaL_buffinitsize };
const _luaL_callmeta = luaL_callmeta;
export { _luaL_callmeta as luaL_callmeta };
const _luaL_checkany = luaL_checkany;
export { _luaL_checkany as luaL_checkany };
const _luaL_checkinteger = luaL_checkinteger;
export { _luaL_checkinteger as luaL_checkinteger };
const _luaL_checklstring = luaL_checklstring;
export { _luaL_checklstring as luaL_checklstring };
const _luaL_checknumber = luaL_checknumber;
export { _luaL_checknumber as luaL_checknumber };
const _luaL_checkoption = luaL_checkoption;
export { _luaL_checkoption as luaL_checkoption };
const _luaL_checkstack = luaL_checkstack;
export { _luaL_checkstack as luaL_checkstack };
const _luaL_checkstring = luaL_checkstring;
export { _luaL_checkstring as luaL_checkstring };
const _luaL_checktype = luaL_checktype;
export { _luaL_checktype as luaL_checktype };
const _luaL_checkudata = luaL_checkudata;
export { _luaL_checkudata as luaL_checkudata };
const _luaL_checkversion = luaL_checkversion;
export { _luaL_checkversion as luaL_checkversion };
const _luaL_checkversion_ = luaL_checkversion_;
export { _luaL_checkversion_ as luaL_checkversion_ };
const _luaL_dofile = luaL_dofile;
export { _luaL_dofile as luaL_dofile };
const _luaL_dostring = luaL_dostring;
export { _luaL_dostring as luaL_dostring };
const _luaL_error = luaL_error;
export { _luaL_error as luaL_error };
const _luaL_execresult = luaL_execresult;
export { _luaL_execresult as luaL_execresult };
const _luaL_fileresult = luaL_fileresult;
export { _luaL_fileresult as luaL_fileresult };
const _luaL_getmetafield = luaL_getmetafield;
export { _luaL_getmetafield as luaL_getmetafield };
const _luaL_getmetatable = luaL_getmetatable;
export { _luaL_getmetatable as luaL_getmetatable };
const _luaL_getsubtable = luaL_getsubtable;
export { _luaL_getsubtable as luaL_getsubtable };
const _luaL_gsub = luaL_gsub;
export { _luaL_gsub as luaL_gsub };
const _luaL_len = luaL_len;
export { _luaL_len as luaL_len };
const _luaL_loadbuffer = luaL_loadbuffer;
export { _luaL_loadbuffer as luaL_loadbuffer };
const _luaL_loadbufferx = luaL_loadbufferx;
export { _luaL_loadbufferx as luaL_loadbufferx };
const _luaL_loadfile = luaL_loadfile;
export { _luaL_loadfile as luaL_loadfile };
const _luaL_loadfilex = luaL_loadfilex;
export { _luaL_loadfilex as luaL_loadfilex };
const _luaL_loadstring = luaL_loadstring;
export { _luaL_loadstring as luaL_loadstring };
const _luaL_newlib = luaL_newlib;
export { _luaL_newlib as luaL_newlib };
const _luaL_newlibtable = luaL_newlibtable;
export { _luaL_newlibtable as luaL_newlibtable };
const _luaL_newmetatable = luaL_newmetatable;
export { _luaL_newmetatable as luaL_newmetatable };
const _luaL_newstate = luaL_newstate;
export { _luaL_newstate as luaL_newstate };
const _luaL_opt = luaL_opt;
export { _luaL_opt as luaL_opt };
const _luaL_optinteger = luaL_optinteger;
export { _luaL_optinteger as luaL_optinteger };
const _luaL_optlstring = luaL_optlstring;
export { _luaL_optlstring as luaL_optlstring };
const _luaL_optnumber = luaL_optnumber;
export { _luaL_optnumber as luaL_optnumber };
const _luaL_optstring = luaL_optstring;
export { _luaL_optstring as luaL_optstring };
const _luaL_prepbuffer = luaL_prepbuffer;
export { _luaL_prepbuffer as luaL_prepbuffer };
const _luaL_prepbuffsize = luaL_prepbuffsize;
export { _luaL_prepbuffsize as luaL_prepbuffsize };
const _luaL_pushresult = luaL_pushresult;
export { _luaL_pushresult as luaL_pushresult };
const _luaL_pushresultsize = luaL_pushresultsize;
export { _luaL_pushresultsize as luaL_pushresultsize };
const _luaL_ref = luaL_ref;
export { _luaL_ref as luaL_ref };
const _luaL_requiref = luaL_requiref;
export { _luaL_requiref as luaL_requiref };
const _luaL_setfuncs = luaL_setfuncs;
export { _luaL_setfuncs as luaL_setfuncs };
const _luaL_setmetatable = luaL_setmetatable;
export { _luaL_setmetatable as luaL_setmetatable };
const _luaL_testudata = luaL_testudata;
export { _luaL_testudata as luaL_testudata };
const _luaL_tolstring = luaL_tolstring;
export { _luaL_tolstring as luaL_tolstring };
const _luaL_traceback = luaL_traceback;
export { _luaL_traceback as luaL_traceback };
const _luaL_typename = luaL_typename;
export { _luaL_typename as luaL_typename };
const _luaL_unref = luaL_unref;
export { _luaL_unref as luaL_unref };
const _luaL_where = luaL_where;
export { _luaL_where as luaL_where };
const _lua_writestringerror = lua_writestringerror;
export { _lua_writestringerror as lua_writestringerror };
