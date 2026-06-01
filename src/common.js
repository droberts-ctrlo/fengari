const conf = (process.env.FENGARICONF ? JSON.parse(process.env.FENGARICONF) : {});

/*
@@ LUAI_MAXSTACK limits the size of the Lua stack.
** CHANGE it if you need a different limit. This limit is arbitrary;
** its only purpose is to stop Lua from consuming unlimited stack
** space (and to reserve some numbers for pseudo-indices).
*/
export const LUAI_MAXSTACK = conf.LUAI_MAXSTACK || 1000000;
