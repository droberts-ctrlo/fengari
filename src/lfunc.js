import { constant_types } from './defs.js';
import { LClosure, TValue } from './lobject.js';

const { LUA_TNIL } = constant_types;

class Proto {
    constructor(L) {
        this.id = L.l_G.id_counter++;
        this.k = [];              // constants used by the function
        this.p = [];              // functions defined inside the function
        this.code = [];           // opcodes
        this.cache = null;        // last-created closure with this prototype
        this.lineinfo = [];       // map from opcodes to source lines (debug information)
        this.upvalues = [];       // upvalue information
        this.numparams = 0;       // number of fixed parameters
        this.is_vararg = false;
        this.maxstacksize = 0;    // number of registers needed by this function
        this.locvars = [];        // information about local variables (debug information)
        this.linedefined = 0;     // debug information
        this.lastlinedefined = 0; // debug information
        this.source = null;       // used for debug information
    }
}

const luaF_newLclosure = function(L, n) {
    return new LClosure(L, n);
};


const luaF_findupval = function(L, level) {
    return L.stack[level];
};

const luaF_close = function(L, level) {
    /* Create new TValues on stack;
     * any closures will keep referencing old TValues */
    for (let i=level; i<L.top; i++) {
        let old = L.stack[i];
        L.stack[i] = new TValue(old.type, old.value);
    }
};

/*
** fill a closure with new upvalues
*/
const luaF_initupvals = function(L, cl) {
    for (let i = 0; i < cl.nupvalues; i++)
        cl.upvals[i] = new TValue(LUA_TNIL, null);
};

/*
** Look for n-th local variable at line 'line' in function 'func'.
** Returns null if not found.
*/
const luaF_getlocalname = function(f, local_number, pc) {
    for (let i = 0; i < f.locvars.length && f.locvars[i].startpc <= pc; i++) {
        if (pc < f.locvars[i].endpc) {  /* is variable active? */
            local_number--;
            if (local_number === 0)
                return f.locvars[i].varname.getstr();
        }
    }
    return null;  /* not found */
};

export const MAXUPVAL          = 255;
const _Proto = Proto;
export { _Proto as Proto };
const _luaF_findupval = luaF_findupval;
export { _luaF_findupval as luaF_findupval };
const _luaF_close = luaF_close;
export { _luaF_close as luaF_close };
const _luaF_getlocalname = luaF_getlocalname;
export { _luaF_getlocalname as luaF_getlocalname };
const _luaF_initupvals = luaF_initupvals;
export { _luaF_initupvals as luaF_initupvals };
const _luaF_newLclosure = luaF_newLclosure;
export { _luaF_newLclosure as luaF_newLclosure };
