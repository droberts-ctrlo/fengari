import * as defs from './defs.js';

const platform = () => {
    if (typeof process === 'undefined') return 'web';
    if (process.platform === 'win32') return 'win32';
    return 'posix';
};

export const conf = (typeof process !== 'undefined' && process.env.FENGARICONF ? JSON.parse(process.env.FENGARICONF) : {});

/*
** LUA_PATH_SEP is the character that separates templates in a path.
** LUA_PATH_MARK is the string that marks the substitution points in a
** template.
** LUA_EXEC_DIR in a Windows path is replaced by the executable's
** directory.
*/
export const LUA_PATH_SEP = ';';

export const LUA_PATH_MARK = '?';

export const LUA_EXEC_DIR = '!';

/*
@@ LUA_PATH_DEFAULT is the default path that Lua uses to look for
** Lua libraries.
@@ LUA_JSPATH_DEFAULT is the default path that Lua uses to look for
** JS libraries.
** CHANGE them if your machine has a non-conventional directory
** hierarchy or if you want to install your libraries in
** non-conventional directories.
*/
export const LUA_VDIR = defs.LUA_VERSION_MAJOR + '.' + defs.LUA_VERSION_MINOR;

export let LUA_DIRSEP, LUA_LDIR, LUA_JSDIR, LUA_SHRDIR, LUA_PATH_DEFAULT, LUA_JSPATH_DEFAULT, LUA_ROOT;

if (typeof process === 'undefined') {
    LUA_DIRSEP = '/';

    LUA_LDIR = './lua/' + LUA_VDIR + '/';

    LUA_JSDIR = LUA_LDIR;

    LUA_PATH_DEFAULT = defs.to_luastring(
        LUA_LDIR + '?.lua;' + LUA_LDIR + '?/init.lua;' +
        /* LUA_JSDIR excluded as it is equal to LUA_LDIR */
        './?.lua;./?/init.lua'
    );

    LUA_JSPATH_DEFAULT = defs.to_luastring(
        LUA_JSDIR + '?.js;' + LUA_JSDIR + 'loadall.js;./?.js'
    );
} else if (platform() === 'win32') {
    LUA_DIRSEP = '\\';

    /*
    ** In Windows, any exclamation mark ('!') in the path is replaced by the
    ** path of the directory of the executable file of the current process.
    */
    LUA_LDIR = '!\\lua\\';

    LUA_JSDIR = '!\\';

    LUA_SHRDIR = '!\\..\\share\\lua\\' + LUA_VDIR + '\\';

    LUA_PATH_DEFAULT = defs.to_luastring(
        LUA_LDIR + '?.lua;' + LUA_LDIR + '?\\init.lua;' +
        LUA_JSDIR + '?.lua;' + LUA_JSDIR + '?\\init.lua;' +
        LUA_SHRDIR + '?.lua;' + LUA_SHRDIR + '?\\init.lua;' +
        '.\\?.lua;.\\?\\init.lua'
    );

    LUA_JSPATH_DEFAULT = defs.to_luastring(
        LUA_JSDIR + '?.js;' +
        LUA_JSDIR + '..\\share\\lua\\' + LUA_VDIR + '\\?.js;' +
        LUA_JSDIR + 'loadall.js;.\\?.js'
    );
} else {
    LUA_DIRSEP = '/';

    LUA_ROOT = '/usr/local/';
    const LUA_ROOT2 = '/usr/';

    LUA_LDIR = LUA_ROOT + 'share/lua/' + LUA_VDIR + '/';
    const LUA_LDIR2 = LUA_ROOT2 + 'share/lua/' + LUA_VDIR + '/';

    LUA_JSDIR = LUA_LDIR;
    const LUA_JSDIR2 = LUA_LDIR2;

    LUA_PATH_DEFAULT = defs.to_luastring(
        LUA_LDIR + '?.lua;' + LUA_LDIR + '?/init.lua;' +
        LUA_LDIR2 + '?.lua;' + LUA_LDIR2 + '?/init.lua;' +
        /* LUA_JSDIR(2) excluded as it is equal to LUA_LDIR(2) */
        './?.lua;./?/init.lua'
    );

    LUA_JSPATH_DEFAULT = defs.to_luastring(
        LUA_JSDIR + '?.js;' + LUA_JSDIR + 'loadall.js;' +
        LUA_JSDIR2 + '?.js;' + LUA_JSDIR2 + 'loadall.js;' +
        './?.js'
    );
}

/*
@@ LUA_COMPAT_FLOATSTRING makes Lua format integral floats without a
@@ a float mark ('.0').
** This macro is not on by default even in compatibility mode,
** because this is not really an incompatibility.
*/
export const LUA_COMPAT_FLOATSTRING = conf.LUA_COMPAT_FLOATSTRING || false;

export const LUA_MAXINTEGER = 2147483647;
export const LUA_MININTEGER = -2147483648;

/*
@@ LUA_IDSIZE gives the maximum size for the description of the source
@@ of a function in debug information.
** CHANGE it if you want a different size.
*/
export const LUA_IDSIZE = conf.LUA_IDSIZE || (60 - 1); /* fengari uses 1 less than lua as we don't embed the null byte */

export const lua_integer2str = function (n) {
    return String(n); /* should match behaviour of LUA_INTEGER_FMT */
};

export const lua_number2str = function (n) {
    return String(Number(n.toPrecision(14))); /* should match behaviour of LUA_NUMBER_FMT */
};

export const lua_numbertointeger = function (n) {
    return n >= LUA_MININTEGER && n < -LUA_MININTEGER ? n : false;
};

export const LUA_INTEGER_FRMLEN = '';
export const LUA_NUMBER_FRMLEN = '';

export const LUA_INTEGER_FMT = `%${LUA_INTEGER_FRMLEN}d`;
export const LUA_NUMBER_FMT = '%.14g';

export const lua_getlocaledecpoint = function () {
    /* we hard-code the decimal point to '.' as a user cannot change the
       locale in most JS environments, and in that you can, a multi-byte
       locale is common.
    */
    return 46 /* '.'.charCodeAt(0) */;
};

/*
@@ LUAL_BUFFERSIZE is the buffer size used by the lauxlib buffer system.
*/
export const LUAL_BUFFERSIZE = conf.LUAL_BUFFERSIZE || 8192;

// See: http://croquetweak.blogspot.fr/2014/08/deconstructing-floats-frexp-and-ldexp.html
export const frexp = function (value) {
    if (value === 0) return [value, 0];
    var data = new DataView(new ArrayBuffer(8));
    data.setFloat64(0, value);
    var bits = (data.getUint32(0) >>> 20) & 0x7FF;
    if (bits === 0) { // denormal
        data.setFloat64(0, value * Math.pow(2, 64));  // exp + 64
        bits = ((data.getUint32(0) >>> 20) & 0x7FF) - 64;
    }
    var exponent = bits - 1022;
    var mantissa = ldexp(value, -exponent);
    return [mantissa, exponent];
};

export const ldexp = function (mantissa, exponent) {
    var steps = Math.min(3, Math.ceil(Math.abs(exponent) / 1023));
    var result = mantissa;
    for (var i = 0; i < steps; i++)
        result *= Math.pow(2, Math.floor((exponent + i) / steps));
    return result;
};
