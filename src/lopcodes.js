const OpCodes = [
    "MOVE",
    "LOADK",
    "LOADKX",
    "LOADBOOL",
    "LOADNIL",
    "GETUPVAL",
    "GETTABUP",
    "GETTABLE",
    "SETTABUP",
    "SETUPVAL",
    "SETTABLE",
    "NEWTABLE",
    "SELF",
    "ADD",
    "SUB",
    "MUL",
    "MOD",
    "POW",
    "DIV",
    "IDIV",
    "BAND",
    "BOR",
    "BXOR",
    "SHL",
    "SHR",
    "UNM",
    "BNOT",
    "NOT",
    "LEN",
    "CONCAT",
    "JMP",
    "EQ",
    "LT",
    "LE",
    "TEST",
    "TESTSET",
    "CALL",
    "TAILCALL",
    "RETURN",
    "FORLOOP",
    "FORPREP",
    "TFORCALL",
    "TFORLOOP",
    "SETLIST",
    "CLOSURE",
    "VARARG",
    "EXTRAARG"
];

const OpCodesI = {
    OP_MOVE: 0,
    OP_LOADK: 1,
    OP_LOADKX: 2,
    OP_LOADBOOL: 3,
    OP_LOADNIL: 4,
    OP_GETUPVAL: 5,
    OP_GETTABUP: 6,
    OP_GETTABLE: 7,
    OP_SETTABUP: 8,
    OP_SETUPVAL: 9,
    OP_SETTABLE: 10,
    OP_NEWTABLE: 11,
    OP_SELF: 12,
    OP_ADD: 13,
    OP_SUB: 14,
    OP_MUL: 15,
    OP_MOD: 16,
    OP_POW: 17,
    OP_DIV: 18,
    OP_IDIV: 19,
    OP_BAND: 20,
    OP_BOR: 21,
    OP_BXOR: 22,
    OP_SHL: 23,
    OP_SHR: 24,
    OP_UNM: 25,
    OP_BNOT: 26,
    OP_NOT: 27,
    OP_LEN: 28,
    OP_CONCAT: 29,
    OP_JMP: 30,
    OP_EQ: 31,
    OP_LT: 32,
    OP_LE: 33,
    OP_TEST: 34,
    OP_TESTSET: 35,
    OP_CALL: 36,
    OP_TAILCALL: 37,
    OP_RETURN: 38,
    OP_FORLOOP: 39,
    OP_FORPREP: 40,
    OP_TFORCALL: 41,
    OP_TFORLOOP: 42,
    OP_SETLIST: 43,
    OP_CLOSURE: 44,
    OP_VARARG: 45,
    OP_EXTRAARG: 46
};

/*
** masks for instruction properties. The format is:
** bits 0-1: op mode
** bits 2-3: C arg mode
** bits 4-5: B arg mode
** bit 6: instruction set register A
** bit 7: operator is a test (next instruction must be a jump)
*/
const OpArgN = 0;  /* argument is not used */
const OpArgU = 1;  /* argument is used */
const OpArgR = 2;  /* argument is a register or a jump offset */
const OpArgK = 3;  /* argument is a constant or register/constant */

/* basic instruction format */
const iABC = 0;
const iABx = 1;
const iAsBx = 2;
const iAx = 3;

const luaP_opmodes = [
    0 << 7 | 1 << 6 | OpArgR << 4 | OpArgN << 2 | iABC,   /* OP_MOVE */
    0 << 7 | 1 << 6 | OpArgK << 4 | OpArgN << 2 | iABx,   /* OP_LOADK */
    0 << 7 | 1 << 6 | OpArgN << 4 | OpArgN << 2 | iABx,   /* OP_LOADKX */
    0 << 7 | 1 << 6 | OpArgU << 4 | OpArgU << 2 | iABC,   /* OP_LOADBOOL */
    0 << 7 | 1 << 6 | OpArgU << 4 | OpArgN << 2 | iABC,   /* OP_LOADNIL */
    0 << 7 | 1 << 6 | OpArgU << 4 | OpArgN << 2 | iABC,   /* OP_GETUPVAL */
    0 << 7 | 1 << 6 | OpArgU << 4 | OpArgK << 2 | iABC,   /* OP_GETTABUP */
    0 << 7 | 1 << 6 | OpArgR << 4 | OpArgK << 2 | iABC,   /* OP_GETTABLE */
    0 << 7 | 0 << 6 | OpArgK << 4 | OpArgK << 2 | iABC,   /* OP_SETTABUP */
    0 << 7 | 0 << 6 | OpArgU << 4 | OpArgN << 2 | iABC,   /* OP_SETUPVAL */
    0 << 7 | 0 << 6 | OpArgK << 4 | OpArgK << 2 | iABC,   /* OP_SETTABLE */
    0 << 7 | 1 << 6 | OpArgU << 4 | OpArgU << 2 | iABC,   /* OP_NEWTABLE */
    0 << 7 | 1 << 6 | OpArgR << 4 | OpArgK << 2 | iABC,   /* OP_SELF */
    0 << 7 | 1 << 6 | OpArgK << 4 | OpArgK << 2 | iABC,   /* OP_ADD */
    0 << 7 | 1 << 6 | OpArgK << 4 | OpArgK << 2 | iABC,   /* OP_SUB */
    0 << 7 | 1 << 6 | OpArgK << 4 | OpArgK << 2 | iABC,   /* OP_MUL */
    0 << 7 | 1 << 6 | OpArgK << 4 | OpArgK << 2 | iABC,   /* OP_MOD */
    0 << 7 | 1 << 6 | OpArgK << 4 | OpArgK << 2 | iABC,   /* OP_POW */
    0 << 7 | 1 << 6 | OpArgK << 4 | OpArgK << 2 | iABC,   /* OP_DIV */
    0 << 7 | 1 << 6 | OpArgK << 4 | OpArgK << 2 | iABC,   /* OP_IDIV */
    0 << 7 | 1 << 6 | OpArgK << 4 | OpArgK << 2 | iABC,   /* OP_BAND */
    0 << 7 | 1 << 6 | OpArgK << 4 | OpArgK << 2 | iABC,   /* OP_BOR */
    0 << 7 | 1 << 6 | OpArgK << 4 | OpArgK << 2 | iABC,   /* OP_BXOR */
    0 << 7 | 1 << 6 | OpArgK << 4 | OpArgK << 2 | iABC,   /* OP_SHL */
    0 << 7 | 1 << 6 | OpArgK << 4 | OpArgK << 2 | iABC,   /* OP_SHR */
    0 << 7 | 1 << 6 | OpArgR << 4 | OpArgN << 2 | iABC,   /* OP_UNM */
    0 << 7 | 1 << 6 | OpArgR << 4 | OpArgN << 2 | iABC,   /* OP_BNOT */
    0 << 7 | 1 << 6 | OpArgR << 4 | OpArgN << 2 | iABC,   /* OP_NOT */
    0 << 7 | 1 << 6 | OpArgR << 4 | OpArgN << 2 | iABC,   /* OP_LEN */
    0 << 7 | 1 << 6 | OpArgR << 4 | OpArgR << 2 | iABC,   /* OP_CONCAT */
    0 << 7 | 0 << 6 | OpArgR << 4 | OpArgN << 2 | iAsBx,  /* OP_JMP */
    1 << 7 | 0 << 6 | OpArgK << 4 | OpArgK << 2 | iABC,   /* OP_EQ */
    1 << 7 | 0 << 6 | OpArgK << 4 | OpArgK << 2 | iABC,   /* OP_LT */
    1 << 7 | 0 << 6 | OpArgK << 4 | OpArgK << 2 | iABC,   /* OP_LE */
    1 << 7 | 0 << 6 | OpArgN << 4 | OpArgU << 2 | iABC,   /* OP_TEST */
    1 << 7 | 1 << 6 | OpArgR << 4 | OpArgU << 2 | iABC,   /* OP_TESTSET */
    0 << 7 | 1 << 6 | OpArgU << 4 | OpArgU << 2 | iABC,   /* OP_CALL */
    0 << 7 | 1 << 6 | OpArgU << 4 | OpArgU << 2 | iABC,   /* OP_TAILCALL */
    0 << 7 | 0 << 6 | OpArgU << 4 | OpArgN << 2 | iABC,   /* OP_RETURN */
    0 << 7 | 1 << 6 | OpArgR << 4 | OpArgN << 2 | iAsBx,  /* OP_FORLOOP */
    0 << 7 | 1 << 6 | OpArgR << 4 | OpArgN << 2 | iAsBx,  /* OP_FORPREP */
    0 << 7 | 0 << 6 | OpArgN << 4 | OpArgU << 2 | iABC,   /* OP_TFORCALL */
    0 << 7 | 1 << 6 | OpArgR << 4 | OpArgN << 2 | iAsBx,  /* OP_TFORLOOP */
    0 << 7 | 0 << 6 | OpArgU << 4 | OpArgU << 2 | iABC,   /* OP_SETLIST */
    0 << 7 | 1 << 6 | OpArgU << 4 | OpArgN << 2 | iABx,   /* OP_CLOSURE */
    0 << 7 | 1 << 6 | OpArgU << 4 | OpArgN << 2 | iABC,   /* OP_VARARG */
    0 << 7 | 0 << 6 | OpArgU << 4 | OpArgU << 2 | iAx     /* OP_EXTRAARG */
];

const getOpMode = function (m) {
    return luaP_opmodes[m] & 3;
};

const getBMode = function (m) {
    return (luaP_opmodes[m] >> 4) & 3;
};

const getCMode = function (m) {
    return (luaP_opmodes[m] >> 2) & 3;
};

const testAMode = function (m) {
    return luaP_opmodes[m] & (1 << 6);
};

const testTMode = function (m) {
    return luaP_opmodes[m] & (1 << 7);
};

const SIZE_C = 9;
const SIZE_B = 9;
const SIZE_Bx = (SIZE_C + SIZE_B);
const SIZE_A = 8;
const SIZE_Ax = (SIZE_C + SIZE_B + SIZE_A);
const SIZE_OP = 6;
const POS_OP = 0;
const POS_A = (POS_OP + SIZE_OP);
const POS_C = (POS_A + SIZE_A);
const POS_B = (POS_C + SIZE_C);
const POS_Bx = POS_C;
const POS_Ax = POS_A;
const MAXARG_Bx = ((1 << SIZE_Bx) - 1);
const MAXARG_sBx = (MAXARG_Bx >> 1); /* 'sBx' is signed */
const MAXARG_Ax = ((1 << SIZE_Ax) - 1);
const MAXARG_A = ((1 << SIZE_A) - 1);
const MAXARG_B = ((1 << SIZE_B) - 1);
const MAXARG_C = ((1 << SIZE_C) - 1);

/* this bit 1 means constant (0 means register) */
const BITRK = (1 << (SIZE_B - 1));

const MAXINDEXRK = (BITRK - 1);

/*
** invalid register that fits in 8 bits
*/
const NO_REG = MAXARG_A;

/* test whether value is a constant */
const ISK = function (x) {
    return x & BITRK;
};

/* gets the index of the constant */
const INDEXK = function (r) {
    return r & ~BITRK;
};

/* code a constant index as a RK value */
const RKASK = function (x) {
    return x | BITRK;
};


/* creates a mask with 'n' 1 bits at position 'p' */
const MASK1 = function (n, p) {
    return ((~((~0) << (n))) << (p));
};

/* creates a mask with 'n' 0 bits at position 'p' */
const MASK0 = function (n, p) {
    return (~MASK1(n, p));
};

const GET_OPCODE = function (i) {
    return i.opcode;
};

const SET_OPCODE = function (i, o) {
    i.code = (i.code & MASK0(SIZE_OP, POS_OP)) | ((o << POS_OP) & MASK1(SIZE_OP, POS_OP));
    return fullins(i);
};

const setarg = function (i, v, pos, size) {
    i.code = (i.code & MASK0(size, pos)) | ((v << pos) & MASK1(size, pos));
    return fullins(i);
};

const GETARG_A = function (i) {
    return i.A;
};

const SETARG_A = function (i, v) {
    return setarg(i, v, POS_A, SIZE_A);
};

const GETARG_B = function (i) {
    return i.B;
};

const SETARG_B = function (i, v) {
    return setarg(i, v, POS_B, SIZE_B);
};

const GETARG_C = function (i) {
    return i.C;
};

const SETARG_C = function (i, v) {
    return setarg(i, v, POS_C, SIZE_C);
};

const GETARG_Bx = function (i) {
    return i.Bx;
};

const SETARG_Bx = function (i, v) {
    return setarg(i, v, POS_Bx, SIZE_Bx);
};

const GETARG_Ax = function (i) {
    return i.Ax;
};

const SETARG_Ax = function (i, v) {
    return setarg(i, v, POS_Ax, SIZE_Ax);
};

const GETARG_sBx = function (i) {
    return i.sBx;
};

const SETARG_sBx = function (i, b) {
    return SETARG_Bx(i, b + MAXARG_sBx);
};

/*
** Pre-calculate all possible part of the instruction
*/
const fullins = function (ins) {
    if (typeof ins === "number") {
        return {
            code: ins,
            opcode: (ins >> POS_OP) & MASK1(SIZE_OP, 0),
            A: (ins >> POS_A) & MASK1(SIZE_A, 0),
            B: (ins >> POS_B) & MASK1(SIZE_B, 0),
            C: (ins >> POS_C) & MASK1(SIZE_C, 0),
            Bx: (ins >> POS_Bx) & MASK1(SIZE_Bx, 0),
            Ax: (ins >> POS_Ax) & MASK1(SIZE_Ax, 0),
            sBx: ((ins >> POS_Bx) & MASK1(SIZE_Bx, 0)) - MAXARG_sBx
        };
    } else {
        let i = ins.code;
        ins.opcode = (i >> POS_OP) & MASK1(SIZE_OP, 0);
        ins.A = (i >> POS_A) & MASK1(SIZE_A, 0);
        ins.B = (i >> POS_B) & MASK1(SIZE_B, 0);
        ins.C = (i >> POS_C) & MASK1(SIZE_C, 0);
        ins.Bx = (i >> POS_Bx) & MASK1(SIZE_Bx, 0);
        ins.Ax = (i >> POS_Ax) & MASK1(SIZE_Ax, 0);
        ins.sBx = ((i >> POS_Bx) & MASK1(SIZE_Bx, 0)) - MAXARG_sBx;
        return ins;
    }
};

const CREATE_ABC = function (o, a, b, c) {
    return fullins(o << POS_OP | a << POS_A | b << POS_B | c << POS_C);
};

const CREATE_ABx = function (o, a, bc) {
    return fullins(o << POS_OP | a << POS_A | bc << POS_Bx);
};

const CREATE_Ax = function (o, a) {
    return fullins(o << POS_OP | a << POS_Ax);
};

/* number of list items to accumulate before a SETLIST instruction */
const LFIELDS_PER_FLUSH = 50;

const _BITRK = BITRK;
export { _BITRK as BITRK };
const _CREATE_ABC = CREATE_ABC;
export { _CREATE_ABC as CREATE_ABC };
const _CREATE_ABx = CREATE_ABx;
export { _CREATE_ABx as CREATE_ABx };
const _CREATE_Ax = CREATE_Ax;
export { _CREATE_Ax as CREATE_Ax };
const _GET_OPCODE = GET_OPCODE;
export { _GET_OPCODE as GET_OPCODE };
const _GETARG_A = GETARG_A;
export { _GETARG_A as GETARG_A };
const _GETARG_B = GETARG_B;
export { _GETARG_B as GETARG_B };
const _GETARG_C = GETARG_C;
export { _GETARG_C as GETARG_C };
const _GETARG_Bx = GETARG_Bx;
export { _GETARG_Bx as GETARG_Bx };
const _GETARG_Ax = GETARG_Ax;
export { _GETARG_Ax as GETARG_Ax };
const _GETARG_sBx = GETARG_sBx;
export { _GETARG_sBx as GETARG_sBx };
const _INDEXK = INDEXK;
export { _INDEXK as INDEXK };
const _ISK = ISK;
export { _ISK as ISK };
const _LFIELDS_PER_FLUSH = LFIELDS_PER_FLUSH;
export { _LFIELDS_PER_FLUSH as LFIELDS_PER_FLUSH };
const _MAXARG_A = MAXARG_A;
export { _MAXARG_A as MAXARG_A };
const _MAXARG_Ax = MAXARG_Ax;
export { _MAXARG_Ax as MAXARG_Ax };
const _MAXARG_B = MAXARG_B;
export { _MAXARG_B as MAXARG_B };
const _MAXARG_Bx = MAXARG_Bx;
export { _MAXARG_Bx as MAXARG_Bx };
const _MAXARG_C = MAXARG_C;
export { _MAXARG_C as MAXARG_C };
const _MAXARG_sBx = MAXARG_sBx;
export { _MAXARG_sBx as MAXARG_sBx };
const _MAXINDEXRK = MAXINDEXRK;
export { _MAXINDEXRK as MAXINDEXRK };
const _NO_REG = NO_REG;
export { _NO_REG as NO_REG };
const _OpArgK = OpArgK;
export { _OpArgK as OpArgK };
const _OpArgN = OpArgN;
export { _OpArgN as OpArgN };
const _OpArgR = OpArgR;
export { _OpArgR as OpArgR };
const _OpArgU = OpArgU;
export { _OpArgU as OpArgU };
const _OpCodes = OpCodes;
export { _OpCodes as OpCodes };
const _OpCodesI = OpCodesI;
export { _OpCodesI as OpCodesI };
const _POS_A = POS_A;
export { _POS_A as POS_A };
const _POS_Ax = POS_Ax;
export { _POS_Ax as POS_Ax };
const _POS_B = POS_B;
export { _POS_B as POS_B };
const _POS_Bx = POS_Bx;
export { _POS_Bx as POS_Bx };
const _POS_C = POS_C;
export { _POS_C as POS_C };
const _POS_OP = POS_OP;
export { _POS_OP as POS_OP };
const _RKASK = RKASK;
export { _RKASK as RKASK };
const _SETARG_A = SETARG_A;
export { _SETARG_A as SETARG_A };
const _SETARG_Ax = SETARG_Ax;
export { _SETARG_Ax as SETARG_Ax };
const _SETARG_B = SETARG_B;
export { _SETARG_B as SETARG_B };
const _SETARG_Bx = SETARG_Bx;
export { _SETARG_Bx as SETARG_Bx };
const _SETARG_C = SETARG_C;
export { _SETARG_C as SETARG_C };
const _SETARG_sBx = SETARG_sBx;
export { _SETARG_sBx as SETARG_sBx };
const _SET_OPCODE = SET_OPCODE;
export { _SET_OPCODE as SET_OPCODE };
const _SIZE_A = SIZE_A;
export { _SIZE_A as SIZE_A };
const _SIZE_Ax = SIZE_Ax;
export { _SIZE_Ax as SIZE_Ax };
const _SIZE_B = SIZE_B;
export { _SIZE_B as SIZE_B };
const _SIZE_Bx = SIZE_Bx;
export { _SIZE_Bx as SIZE_Bx };
const _SIZE_C = SIZE_C;
export { _SIZE_C as SIZE_C };
const _SIZE_OP = SIZE_OP;
export { _SIZE_OP as SIZE_OP };
const _fullins = fullins;
export { _fullins as fullins };
const _getBMode = getBMode;
export { _getBMode as getBMode };
const _getCMode = getCMode;
export { _getCMode as getCMode };
const _getOpMode = getOpMode;
export { _getOpMode as getOpMode };
const _iABC = iABC;
export { _iABC as iABC };
const _iABx = iABx;
export { _iABx as iABx };
const _iAsBx = iAsBx;
export { _iAsBx as iAsBx };
const _iAx = iAx;
export { _iAx as iAx };
const _testAMode = testAMode;
export { _testAMode as testAMode };
const _testTMode = testTMode;
export { _testTMode as testTMode };
