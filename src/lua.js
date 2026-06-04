import { thread_status, constant_types } from './defs.js';

export { LUA_AUTHORS, LUA_COPYRIGHT, thread_status, LUA_HOOKCALL, LUA_HOOKCOUNT, LUA_HOOKLINE, LUA_HOOKRET, LUA_HOOKTAILCALL, LUA_MASKCALL, LUA_MASKCOUNT, LUA_MASKLINE, LUA_MASKRET, LUA_MINSTACK, LUA_MULTRET, constant_types, LUA_OPADD, LUA_OPBAND, LUA_OPBNOT, LUA_OPBOR, LUA_OPBXOR, LUA_OPDIV, LUA_OPEQ, LUA_OPIDIV, LUA_OPLE, LUA_OPLT, LUA_OPMOD, LUA_OPMUL, LUA_OPPOW, LUA_OPSHL, LUA_OPSHR, LUA_OPSUB, LUA_OPUNM, LUA_REGISTRYINDEX, LUA_RELEASE, LUA_RIDX_GLOBALS, LUA_RIDX_LAST, LUA_RIDX_MAINTHREAD, LUA_SIGNATURE, LUA_VERSION, LUA_VERSION_MAJOR, LUA_VERSION_MINOR, LUA_VERSION_NUM, LUA_VERSION_RELEASE, lua_Debug, lua_upvalueindex } from './defs.js';
export { lua_absindex, lua_arith, lua_atpanic, lua_atnativeerror, lua_call, lua_callk, lua_checkstack, lua_compare, lua_concat, lua_copy, lua_createtable, lua_dump, lua_error, lua_gc, lua_getallocf, lua_getextraspace, lua_getfield, lua_getglobal, lua_geti, lua_getmetatable, lua_gettable, lua_gettop, lua_getupvalue, lua_getuservalue, lua_insert, lua_isboolean, lua_iscfunction, lua_isfunction, lua_isinteger, lua_islightuserdata, lua_isnil, lua_isnone, lua_isnoneornil, lua_isnumber, lua_isproxy, lua_isstring, lua_istable, lua_isthread, lua_isuserdata, lua_len, lua_load, lua_newtable, lua_newuserdata, lua_next, lua_pcall, lua_pcallk, lua_pop, lua_pushboolean, lua_pushcclosure, lua_pushcfunction, lua_pushfstring, lua_pushglobaltable, lua_pushinteger, lua_pushjsclosure, lua_pushjsfunction, lua_pushlightuserdata, lua_pushliteral, lua_pushlstring, lua_pushnil, lua_pushnumber, lua_pushstring, lua_pushthread, lua_pushvalue, lua_pushvfstring, lua_rawequal, lua_rawget, lua_rawgeti, lua_rawgetp, lua_rawlen, lua_rawset, lua_rawseti, lua_rawsetp, lua_register, lua_remove, lua_replace, lua_rotate, lua_setallocf, lua_setfield, lua_setglobal, lua_seti, lua_setmetatable, lua_settable, lua_settop, lua_setupvalue, lua_setuservalue, lua_status, lua_stringtonumber, lua_toboolean, lua_todataview, lua_tointeger, lua_tointegerx, lua_tojsstring, lua_tolstring, lua_tonumber, lua_tonumberx, lua_topointer, lua_toproxy, lua_tostring, lua_tothread, lua_touserdata, lua_type, lua_typename, lua_upvalueid, lua_upvaluejoin, lua_version, lua_xmove, lua_tocfunction } from './lapi.js';
export { lua_gethook, lua_gethookcount, lua_gethookmask, lua_getinfo, lua_getlocal, lua_getstack, lua_sethook, lua_setlocal } from './ldebug.js';
export { lua_isyieldable, lua_resume, lua_yield, lua_yieldk } from './ldo.js';
export { lua_close, lua_newstate, lua_newthread } from './lstate.js';

export const {
    LUA_ERRERR,
    LUA_ERRGCMM,
    LUA_ERRMEM,
    LUA_ERRRUN,
    LUA_ERRSYNTAX,
    LUA_OK,
    LUA_YIELD
} = thread_status;

export const {
    LUA_TNONE,
    LUA_TNIL,
    LUA_TBOOLEAN,
    LUA_TLIGHTUSERDATA,
    LUA_TNUMBER,
    LUA_TSTRING,
    LUA_TTABLE,
    LUA_TFUNCTION,
    LUA_TUSERDATA,
    LUA_TTHREAD
} = constant_types;
