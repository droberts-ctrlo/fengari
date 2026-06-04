import * as luaconf from './luaconf.js';
import * as lua from './lua.js';
import * as fengaricore from './fengaricore.js';

const fs = typeof process === 'undefined' ? null : require('fs');  /* Only used in node env */

/* extra error code for 'luaL_loadfilex' */
export const LUA_ERRFILE = lua.LUA_ERRERR + 1;

/* key, in the registry, for table of loaded modules */
export const LUA_LOADED_TABLE = fengaricore.to_luastring('_LOADED');

/* key, in the registry, for table of preloaded loaders */
export const LUA_PRELOAD_TABLE = fengaricore.to_luastring('_PRELOAD');

export const LUA_FILEHANDLE = fengaricore.to_luastring('FILE*');

export const LUAL_NUMSIZES = 4 * 16 + 8;

export const __name = fengaricore.to_luastring('__name');
export const __tostring = fengaricore.to_luastring('__tostring');

export const empty = new Uint8Array(0);

export class luaL_Buffer {
    constructor() {
        this.L = null;
        this.b = empty;
        this.n = 0;
    }
}

export const LEVELS1 = 10;  /* size of the first part of the stack */
export const LEVELS2 = 11;  /* size of the second part of the stack */

/*
** search for 'objidx' in table at index -1.
** return 1 + string at top if find a good name.
*/
export const findfield = function (L, objidx, level) {
    if (level === 0 || !lua.lua_istable(L, -1))
        return 0;  /* not found */

    lua.lua_pushnil(L);  /* start 'next' loop */

    while (lua.lua_next(L, -2)) {  /* for each pair in table */
        if (lua.lua_type(L, -2) === lua.LUA_TSTRING) {  /* ignore non-string keys */
            if (lua.lua_rawequal(L, objidx, -1)) {  /* found object? */
                lua.lua_pop(L, 1);  /* remove value (but keep name) */
                return 1;
            } else if (findfield(L, objidx, level - 1)) {  /* try recursively */
                lua.lua_remove(L, -2);  /* remove table (but keep name) */
                lua.lua_pushliteral(L, '.');
                lua.lua_insert(L, -2);  /* place '.' between the two names */
                lua.lua_concat(L, 3);
                return 1;
            }
        }
        lua.lua_pop(L, 1);  /* remove value */
    }

    return 0;  /* not found */
};

/*
** Search for a name for a function in all loaded modules
*/
export const pushglobalfuncname = function (L, ar) {
    let top = lua.lua_gettop(L);
    lua.lua_getinfo(L, fengaricore.to_luastring('f'), ar);  /* push function */
    lua.lua_getfield(L, lua.LUA_REGISTRYINDEX, LUA_LOADED_TABLE);
    if (findfield(L, top + 1, 2)) {
        let name = lua.lua_tostring(L, -1);
        if (name[0] === 95 /* '_'.charCodeAt(0) */ &&
            name[1] === 71 /* 'G'.charCodeAt(0) */ &&
            name[2] === 46 /* '.'.charCodeAt(0) */
        ) {  /* name start with '_G.'? */
            lua.lua_pushstring(L, name.subarray(3));  /* push name without prefix */
            lua.lua_remove(L, -2);  /* remove original name */
        }
        lua.lua_copy(L, -1, top + 1);  /* move name to proper place */
        lua.lua_pop(L, 2);  /* remove pushed values */
        return 1;
    } else {
        lua.lua_settop(L, top);  /* remove function and global table */
        return 0;
    }
};

export const pushfuncname = function (L, ar) {
    if (pushglobalfuncname(L, ar)) {  /* try first a global name */
        lua.lua_pushfstring(L, fengaricore.to_luastring('function \'%s\''), lua.lua_tostring(L, -1));
        lua.lua_remove(L, -2);  /* remove name */
    }
    else if (ar.namewhat.length !== 0)  /* is there a name from code? */
        lua.lua_pushfstring(L, fengaricore.to_luastring('%s \'%s\''), ar.namewhat, ar.name);  /* use it */
    else if (ar.what && ar.what[0] === 109 /* 'm'.charCodeAt(0) */)  /* main? */
        lua.lua_pushliteral(L, 'main chunk');
    else if (ar.what && ar.what[0] === 76 /* 'L'.charCodeAt(0) */)  /* for Lua functions, use <file:line> */
        lua.lua_pushfstring(L, fengaricore.to_luastring('function <%s:%d>'), ar.short_src, ar.linedefined);
    else  /* nothing left... */
        lua.lua_pushliteral(L, '?');
};

export const lastlevel = function (L) {
    let ar = new lua.lua_Debug();
    let li = 1;
    let le = 1;
    /* find an upper bound */
    while (lua.lua_getstack(L, le, ar)) { li = le; le *= 2; }
    /* do a binary search */
    while (li < le) {
        let m = Math.floor((li + le) / 2);
        if (lua.lua_getstack(L, m, ar)) li = m + 1;
        else le = m;
    }
    return le - 1;
};

export const luaL_traceback = function (L, L1, msg, level) {
    let ar = new lua.lua_Debug();
    let top = lua.lua_gettop(L);
    let last = lastlevel(L1);
    let n1 = last - level > LEVELS1 + LEVELS2 ? LEVELS1 : -1;
    if (msg)
        lua.lua_pushfstring(L, fengaricore.to_luastring('%s\n'), msg);
    luaL_checkstack(L, 10, null);
    lua.lua_pushliteral(L, 'stack traceback:');
    while (lua.lua_getstack(L1, level++, ar)) {
        if (n1-- === 0) {  /* too many levels? */
            lua.lua_pushliteral(L, '\n\t...');  /* add a '...' */
            level = last - LEVELS2 + 1;  /* and skip to last ones */
        } else {
            lua.lua_getinfo(L1, fengaricore.to_luastring('Slnt', true), ar);
            lua.lua_pushfstring(L, fengaricore.to_luastring('\n\t%s:'), ar.short_src);
            if (ar.currentline > 0)
                lua.lua_pushliteral(L, `${ar.currentline}:`);
            lua.lua_pushliteral(L, ' in ');
            pushfuncname(L, ar);
            if (ar.istailcall)
                lua.lua_pushliteral(L, '\n\t(...tail calls..)');
            lua.lua_concat(L, lua.lua_gettop(L) - top);
        }
    }
    lua.lua_concat(L, lua.lua_gettop(L) - top);
};

export const panic = function (L) {
    let msg = 'PANIC: unprotected error in call to Lua API (' + lua.lua_tojsstring(L, -1) + ')';
    throw new Error(msg);
};

export const luaL_argerror = function (L, arg, extramsg) {
    let ar = new lua.lua_Debug();

    if (!lua.lua_getstack(L, 0, ar))  /* no stack frame? */
        return luaL_error(L, fengaricore.to_luastring('bad argument #%d (%s)'), arg, extramsg);

    lua.lua_getinfo(L, fengaricore.to_luastring('n'), ar);

    if (fengaricore.luastring_eq(ar.namewhat, fengaricore.to_luastring('method'))) {
        arg--;  /* do not count 'self' */
        if (arg === 0)  /* error is in the self argument itself? */
            return luaL_error(L, fengaricore.to_luastring('calling \'%s\' on bad self (%s)'), ar.name, extramsg);
    }

    if (ar.name === null)
        ar.name = pushglobalfuncname(L, ar) ? lua.lua_tostring(L, -1) : fengaricore.to_luastring('?');

    return luaL_error(L, fengaricore.to_luastring('bad argument #%d to \'%s\' (%s)'), arg, ar.name, extramsg);
};

export const typeerror = function (L, arg, tname) {
    let typearg;
    if (luaL_getmetafield(L, arg, __name) === lua.LUA_TSTRING)
        typearg = lua.lua_tostring(L, -1);
    else if (lua.lua_type(L, arg) === lua.LUA_TLIGHTUSERDATA)
        typearg = fengaricore.to_luastring('light userdata', true);
    else
        typearg = luaL_typename(L, arg);

    let msg = lua.lua_pushfstring(L, fengaricore.to_luastring('%s expected, got %s'), tname, typearg);
    return luaL_argerror(L, arg, msg);
};

export const luaL_where = function (L, level) {
    let ar = new lua.lua_Debug();
    if (lua.lua_getstack(L, level, ar)) {
        lua.lua_getinfo(L, fengaricore.to_luastring('Sl', true), ar);
        if (ar.currentline > 0) {
            lua.lua_pushfstring(L, fengaricore.to_luastring('%s:%d: '), ar.short_src, ar.currentline);
            return;
        }
    }
    lua.lua_pushstring(L, fengaricore.to_luastring(''));
};

export const luaL_error = function (L, fmt, ...argp) {
    luaL_where(L, 1);
    lua.lua_pushvfstring(L, fmt, argp);
    lua.lua_concat(L, 2);
    return lua.lua_error(L);
};

/* Unlike normal lua, we pass in an error object */
export const luaL_fileresult = function (L, stat, fname, e) {
    if (stat) {
        lua.lua_pushboolean(L, 1);
        return 1;
    } else {
        lua.lua_pushnil(L);
        let message, errno;
        if (e) {
            message = e.message;
            errno = -e.errno;
        } else {
            message = 'Success'; /* what strerror(0) returns */
            errno = 0;
        }
        if (fname)
            lua.lua_pushfstring(L, fengaricore.to_luastring('%s: %s'), fname, fengaricore.to_luastring(message));
        else
            lua.lua_pushstring(L, fengaricore.to_luastring(message));
        lua.lua_pushinteger(L, errno);
        return 3;
    }
};

/* Unlike normal lua, we pass in an error object */
export const luaL_execresult = function (L, e) {
    let what, stat;
    if (e === null) {
        lua.lua_pushboolean(L, 1);
        lua.lua_pushliteral(L, 'exit');
        lua.lua_pushinteger(L, 0);
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
    lua.lua_pushnil(L);
    lua.lua_pushliteral(L, what);
    lua.lua_pushinteger(L, stat);
    return 3;
};

export const luaL_getmetatable = function (L, n) {
    return lua.lua_getfield(L, lua.LUA_REGISTRYINDEX, n);
};

export const luaL_newmetatable = function (L, tname) {
    if (luaL_getmetatable(L, tname) !== lua.LUA_TNIL)  /* name already in use? */
        return 0;  /* leave previous value on top, but return 0 */
    lua.lua_pop(L, 1);
    lua.lua_createtable(L, 0, 2);  /* create metatable */
    lua.lua_pushstring(L, tname);
    lua.lua_setfield(L, -2, __name);  /* metatable.__name = tname */
    lua.lua_pushvalue(L, -1);
    lua.lua_setfield(L, lua.LUA_REGISTRYINDEX, tname);  /* registry.name = metatable */
    return 1;

};

export const luaL_setmetatable = function (L, tname) {
    luaL_getmetatable(L, tname);
    lua.lua_setmetatable(L, -2);
};

export const luaL_testudata = function (L, ud, tname) {
    let p = lua.lua_touserdata(L, ud);
    if (p !== null) {  /* value is a userdata? */
        if (lua.lua_getmetatable(L, ud)) {  /* does it have a metatable? */
            luaL_getmetatable(L, tname);  /* get correct metatable */
            if (!lua.lua_rawequal(L, -1, -2))  /* not the same? */
                p = null;  /* value is a userdata with wrong metatable */
            lua.lua_pop(L, 2);  /* remove both metatables */
            return p;
        }
    }
    return null;  /* value is not a userdata with a metatable */
};

export const luaL_checkudata = function (L, ud, tname) {
    let p = luaL_testudata(L, ud, tname);
    if (p === null) typeerror(L, ud, tname);
    return p;
};

export const luaL_checkoption = function (L, arg, def, lst) {
    let name = def !== null ? luaL_optstring(L, arg, def) : luaL_checkstring(L, arg);
    for (let i = 0; lst[i]; i++)
        if (fengaricore.luastring_eq(lst[i], name))
            return i;
    return luaL_argerror(L, arg, lua.lua_pushfstring(L, fengaricore.to_luastring('invalid option \'%s\''), name));
};

export const tag_error = function (L, arg, tag) {
    typeerror(L, arg, lua.lua_typename(L, tag));
};

export const luaL_newstate = function () {
    let L = lua.lua_newstate();
    if (L) lua.lua_atpanic(L, panic);
    return L;
};


export const luaL_typename = function (L, i) {
    return lua.lua_typename(L, lua.lua_type(L, i));
};

export const luaL_argcheck = function (L, cond, arg, extramsg) {
    if (!cond) luaL_argerror(L, arg, extramsg);
};

export const luaL_checkany = function (L, arg) {
    if (lua.lua_type(L, arg) === lua.LUA_TNONE)
        luaL_argerror(L, arg, fengaricore.to_luastring('value expected', true));
};

export const luaL_checktype = function (L, arg, t) {
    if (lua.lua_type(L, arg) !== t)
        tag_error(L, arg, t);
};

export const luaL_checklstring = function (L, arg) {
    let s = lua.lua_tolstring(L, arg);
    if (s === null || s === undefined) tag_error(L, arg, lua.LUA_TSTRING);
    return s;
};

export const luaL_checkstring = luaL_checklstring;

export const luaL_optlstring = function (L, arg, def) {
    if (lua.lua_type(L, arg) <= 0) {
        return def === null ? null : fengaricore.from_userstring(def);
    } else return luaL_checklstring(L, arg);
};

export const luaL_optstring = luaL_optlstring;

export const interror = function (L, arg) {
    if (lua.lua_isnumber(L, arg))
        luaL_argerror(L, arg, fengaricore.to_luastring('number has no integer representation', true));
    else
        tag_error(L, arg, lua.LUA_TNUMBER);
};

export const luaL_checknumber = function (L, arg) {
    let d = lua.lua_tonumberx(L, arg);
    if (d === false)
        tag_error(L, arg, lua.LUA_TNUMBER);
    return d;
};

export const luaL_optnumber = function (L, arg, def) {
    return luaL_opt(L, luaL_checknumber, arg, def);
};

export const luaL_checkinteger = function (L, arg) {
    let d = lua.lua_tointegerx(L, arg);
    if (d === false)
        interror(L, arg);
    return d;
};

export const luaL_optinteger = function (L, arg, def) {
    return luaL_opt(L, luaL_checkinteger, arg, def);
};

export const luaL_prepbuffsize = function (B, sz) {
    let newend = B.n + sz;
    if (B.b.length < newend) {
        let newsize = Math.max(B.b.length * 2, newend);  /* double buffer size */
        let newbuff = new Uint8Array(newsize);  /* create larger buffer */
        newbuff.set(B.b);  /* copy original content */
        B.b = newbuff;
    }
    return B.b.subarray(B.n, newend);
};

export const luaL_buffinit = function (L, B) {
    B.L = L;
    B.b = empty;
};

export const luaL_buffinitsize = function (L, B, sz) {
    luaL_buffinit(L, B);
    return luaL_prepbuffsize(B, sz);
};

export const luaL_prepbuffer = function (B) {
    return luaL_prepbuffsize(B, luaconf.LUAL_BUFFERSIZE);
};

export const luaL_addlstring = function (B, s, l) {
    if (l > 0) {
        s = fengaricore.from_userstring(s);
        let b = luaL_prepbuffsize(B, l);
        b.set(s.subarray(0, l));
        luaL_addsize(B, l);
    }
};

export const luaL_addstring = function (B, s) {
    s = fengaricore.from_userstring(s);
    luaL_addlstring(B, s, s.length);
};

export const luaL_pushresult = function (B) {
    lua.lua_pushlstring(B.L, B.b, B.n);
    /* delete old buffer */
    B.n = 0;
    B.b = empty;
};

export const luaL_addchar = function (B, c) {
    luaL_prepbuffsize(B, 1);
    B.b[B.n++] = c;
};

export const luaL_addsize = function (B, s) {
    B.n += s;
};

export const luaL_pushresultsize = function (B, sz) {
    luaL_addsize(B, sz);
    luaL_pushresult(B);
};

export const luaL_addvalue = function (B) {
    let L = B.L;
    let s = lua.lua_tostring(L, -1);
    luaL_addlstring(B, s, s.length);
    lua.lua_pop(L, 1);  /* remove value */
};

export const luaL_opt = function (L, f, n, d) {
    return lua.lua_type(L, n) <= 0 ? d : f(L, n);
};

export const getS = function (L, ud) {
    let s = ud.string;
    ud.string = null;
    return s;
};

export const luaL_loadbufferx = function (L, buff, size, name, mode) {
    return lua.lua_load(L, getS, { string: buff }, name, mode);
};

export const luaL_loadbuffer = function (L, s, sz, n) {
    return luaL_loadbufferx(L, s, sz, n, null);
};

export const luaL_loadstring = function (L, s) {
    return luaL_loadbuffer(L, s, s.length, s);
};

export const luaL_dostring = function (L, s) {
    return (luaL_loadstring(L, s) || lua.lua_pcall(L, 0, lua.LUA_MULTRET, 0));
};

export const luaL_getmetafield = function (L, obj, event) {
    if (!lua.lua_getmetatable(L, obj))  /* no metatable? */
        return lua.LUA_TNIL;
    else {
        lua.lua_pushstring(L, event);
        let tt = lua.lua_rawget(L, -2);
        if (tt === lua.LUA_TNIL)  /* is metafield nil? */
            lua.lua_pop(L, 2);  /* remove metatable and metafield */
        else
            lua.lua_remove(L, -2);  /* remove only metatable */
        return tt;  /* return metafield type */
    }
};

export const luaL_callmeta = function (L, obj, event) {
    obj = lua.lua_absindex(L, obj);
    if (luaL_getmetafield(L, obj, event) === lua.LUA_TNIL)
        return false;

    lua.lua_pushvalue(L, obj);
    lua.lua_call(L, 1, 1);

    return true;
};

export const luaL_len = function (L, idx) {
    lua.lua_len(L, idx);
    let l = lua.lua_tointegerx(L, -1);
    if (l === false)
        luaL_error(L, fengaricore.to_luastring('object length is not an integer', true));
    lua.lua_pop(L, 1);  /* remove object */
    return l;
};

export const p_I = fengaricore.to_luastring('%I');
export const p_f = fengaricore.to_luastring('%f');
export const luaL_tolstring = function (L, idx) {
    if (luaL_callmeta(L, idx, __tostring)) {
        if (!lua.lua_isstring(L, -1))
            luaL_error(L, fengaricore.to_luastring('\'__tostring\' must return a string'));
    } else {
        let t = lua.lua_type(L, idx);
        switch (t) {
            case lua.LUA_TNUMBER: {
                if (lua.lua_isinteger(L, idx))
                    lua.lua_pushfstring(L, p_I, lua.lua_tointeger(L, idx));
                else
                    lua.lua_pushfstring(L, p_f, lua.lua_tonumber(L, idx));
                break;
            }
            case lua.LUA_TSTRING:
                lua.lua_pushvalue(L, idx);
                break;
            case lua.LUA_TBOOLEAN:
                lua.lua_pushliteral(L, (lua.lua_toboolean(L, idx) ? 'true' : 'false'));
                break;
            case lua.LUA_TNIL:
                lua.lua_pushliteral(L, 'nil');
                break;
            default: {
                let tt = luaL_getmetafield(L, idx, __name);
                let kind = tt === lua.LUA_TSTRING ? lua.lua_tostring(L, -1) : luaL_typename(L, idx);
                lua.lua_pushfstring(L, fengaricore.to_luastring('%s: %p'), kind, lua.lua_topointer(L, idx));
                if (tt !== lua.LUA_TNIL)
                    lua.lua_remove(L, -2);
                break;
            }
        }
    }

    return lua.lua_tolstring(L, -1);
};

/*
** Stripped-down 'require': After checking "loaded" table, calls 'openf'
** to open a module, registers the result in 'package.loaded' table and,
** if 'glb' is true, also registers the result in the global table.
** Leaves resulting module on the top.
*/
export const luaL_requiref = function (L, modname, openf, glb) {
    luaL_getsubtable(L, lua.LUA_REGISTRYINDEX, LUA_LOADED_TABLE);
    lua.lua_getfield(L, -1, modname); /* LOADED[modname] */
    if (!lua.lua_toboolean(L, -1)) {  /* package not already loaded? */
        lua.lua_pop(L, 1);  /* remove field */
        lua.lua_pushcfunction(L, openf);
        lua.lua_pushstring(L, modname);  /* argument to open function */
        lua.lua_call(L, 1, 1);  /* call 'openf' to open module */
        lua.lua_pushvalue(L, -1);  /* make copy of module (call result) */
        lua.lua_setfield(L, -3, modname);  /* LOADED[modname] = module */
    }
    lua.lua_remove(L, -2);  /* remove LOADED table */
    if (glb) {
        lua.lua_pushvalue(L, -1);  /* copy of module */
        lua.lua_setglobal(L, modname);  /* _G[modname] = module */
    }
};

export const find_subarray = function (arr, subarr, from_index) {
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

export const luaL_gsub = function (L, s, p, r) {
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
    return lua.lua_tostring(L, -1);
};

/*
** ensure that stack[idx][fname] has a table and push that table
** into the stack
*/
export const luaL_getsubtable = function (L, idx, fname) {
    if (lua.lua_getfield(L, idx, fname) === lua.LUA_TTABLE)
        return true;  /* table already there */
    else {
        lua.lua_pop(L, 1);  /* remove previous result */
        idx = lua.lua_absindex(L, idx);
        lua.lua_newtable(L);
        lua.lua_pushvalue(L, -1);  /* copy to be left at top */
        lua.lua_setfield(L, idx, fname);  /* assign new table to field */
        return false;  /* false, because did not find table there */
    }
};

/*
** set functions from list 'l' into table at top - 'nup'; each
** function gets the 'nup' elements at the top as upvalues.
** Returns with only the table at the stack.
*/
export const luaL_setfuncs = function (L, l, nup) {
    luaL_checkstack(L, nup, fengaricore.to_luastring('too many upvalues', true));
    for (let lib in l) {  /* fill the table with given functions */
        for (let i = 0; i < nup; i++)  /* copy upvalues to the top */
            lua.lua_pushvalue(L, -nup);
        lua.lua_pushcclosure(L, l[lib], nup);  /* closure with those upvalues */
        lua.lua_setfield(L, -(nup + 2), fengaricore.to_luastring(lib));
    }
    lua.lua_pop(L, nup);  /* remove upvalues */
};

/*
** Ensures the stack has at least 'space' extra slots, raising an error
** if it cannot fulfill the request. (The error handling needs a few
** extra slots to format the error message. In case of an error without
** this extra space, Lua will generate the same 'stack overflow' error,
** but without 'msg'.)
*/
export const luaL_checkstack = function (L, space, msg) {
    if (!lua.lua_checkstack(L, space)) {
        if (msg)
            luaL_error(L, fengaricore.to_luastring('stack overflow (%s)'), msg);
        else
            luaL_error(L, fengaricore.to_luastring('stack overflow', true));
    }
};

export const luaL_newlibtable = function (L) {
    lua.lua_createtable(L);
};

export const luaL_newlib = function (L, l) {
    lua.lua_createtable(L);
    luaL_setfuncs(L, l, 0);
};

/* predefined references */
export const LUA_NOREF = -2;
export const LUA_REFNIL = -1;

export const luaL_ref = function (L, t) {
    let ref;
    if (lua.lua_isnil(L, -1)) {
        lua.lua_pop(L, 1);  /* remove from stack */
        return LUA_REFNIL;  /* 'nil' has a unique fixed reference */
    }
    t = lua.lua_absindex(L, t);
    lua.lua_rawgeti(L, t, 0);  /* get first free element */
    ref = lua.lua_tointeger(L, -1);  /* ref = t[freelist] */
    lua.lua_pop(L, 1);  /* remove it from stack */
    if (ref !== 0) {  /* any free element? */
        lua.lua_rawgeti(L, t, ref);  /* remove it from list */
        lua.lua_rawseti(L, t, 0);  /* (t[freelist] = t[ref]) */
    }
    else  /* no free elements */
        ref = lua.lua_rawlen(L, t) + 1;  /* get a new reference */
    lua.lua_rawseti(L, t, ref);
    return ref;
};


export const luaL_unref = function (L, t, ref) {
    if (ref >= 0) {
        t = lua.lua_absindex(L, t);
        lua.lua_rawgeti(L, t, 0);
        lua.lua_rawseti(L, t, ref);  /* t[ref] = t[freelist] */
        lua.lua_pushinteger(L, ref);
        lua.lua_rawseti(L, t, 0);  /* t[freelist] = ref */
    }
};


export const errfile = function (L, what, fnameindex, error) {
    let serr = error.message;
    let filename = lua.lua_tostring(L, fnameindex).subarray(1);
    lua.lua_pushfstring(L, fengaricore.to_luastring('cannot %s %s: %s'), fengaricore.to_luastring(what), filename, fengaricore.to_luastring(serr));
    lua.lua_remove(L, fnameindex);
    return LUA_ERRFILE;
};

let getc;

export const utf8_bom = [0XEF, 0XBB, 0XBF];  /* UTF-8 BOM mark */
export const skipBOM = function (lf) {
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
export const skipcomment = function (lf) {
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

export let luaL_loadfilex;

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
        let fnameindex = lua.lua_gettop(L) + 1;  /* index of filename on the stack */
        if (filename === null) {
            throw new Error('Can\'t read stdin in the browser');
        } else {
            lua.lua_pushfstring(L, fengaricore.to_luastring('@%s'), filename);
            let path = fengaricore.to_uristring(filename);
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
                    lf.f = fengaricore.to_luastring(xhr.response);
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
        if (com.c === lua.LUA_SIGNATURE[0] && filename) {  /* binary file? */
            /* no need to re-open */
        } else if (com.skipped) { /* read initial portion */
            lf.buff[lf.n++] = 10 /* '\n'.charCodeAt(0) */;  /* add line to correct line numbers */
        }
        if (com.c !== null)
            lf.buff[lf.n++] = com.c; /* 'c' is the first character of the stream */
        let status = lua.lua_load(L, getF, lf, lua.lua_tostring(L, -1), mode);
        let readstatus = lf.err;
        if (readstatus) {
            lua.lua_settop(L, fnameindex);  /* ignore results from 'lua_load' */
            return errfile(L, 'read', fnameindex, readstatus);
        }
        lua.lua_remove(L, fnameindex);
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
        let bytes;
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
        let fnameindex = lua.lua_gettop(L) + 1;  /* index of filename on the stack */
        if (filename === null) {
            lua.lua_pushliteral(L, '=stdin');
            lf.f = process.stdin.fd;
        } else {
            lua.lua_pushfstring(L, fengaricore.to_luastring('@%s'), filename);
            try {
                lf.f = fs.openSync(filename, 'r');
            } catch (e) {
                return errfile(L, 'open', fnameindex, e);
            }
        }
        let com = skipcomment(lf);
        /* check for signature first, as we don't want to add line number corrections in binary case */
        if (com.c === lua.LUA_SIGNATURE[0] && filename) {  /* binary file? */
            /* no need to re-open */
        } else if (com.skipped) { /* read initial portion */
            lf.buff[lf.n++] = 10 /* '\n'.charCodeAt(0) */;  /* add line to correct line numbers */
        }
        if (com.c !== null)
            lf.buff[lf.n++] = com.c; /* 'c' is the first character of the stream */
        let status = lua.lua_load(L, getF, lf, lua.lua_tostring(L, -1), mode);
        let readstatus = lf.err;
        if (filename) try { fs.closeSync(lf.f); } catch (e) { }  /* close file (even in case of errors) */
        if (readstatus) {
            lua.lua_settop(L, fnameindex);  /* ignore results from 'lua_load' */
            return errfile(L, 'read', fnameindex, readstatus);
        }
        lua.lua_remove(L, fnameindex);
        return status;
    };
}

export const luaL_loadfile = function (L, filename) {
    return luaL_loadfilex(L, filename, null);
};

export const luaL_dofile = function (L, filename) {
    return (luaL_loadfile(L, filename) || lua.lua_pcall(L, 0, lua.LUA_MULTRET, 0));
};

export const lua_writestringerror = function () {
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

export const luaL_checkversion_ = function (L, ver, sz) {
    let v = lua.lua_version(L);
    if (sz != LUAL_NUMSIZES)  /* check numeric types */
        luaL_error(L, fengaricore.to_luastring('core and library have incompatible numeric types'));
    if (v != lua.lua_version(null))
        luaL_error(L, fengaricore.to_luastring('multiple Lua VMs detected'));
    else if (v !== ver)
        luaL_error(L, fengaricore.to_luastring('version mismatch: app. needs %f, Lua core provides %f'), ver, v);
};

/* There is no point in providing this function... */
export const luaL_checkversion = function (L) {
    luaL_checkversion_(L, lua.LUA_VERSION_NUM, LUAL_NUMSIZES);
};
