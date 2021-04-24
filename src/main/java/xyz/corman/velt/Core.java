package xyz.corman.velt;

public class Core {
    public static String[] getFiles() {
        return new String[] {
            /*=========================
             * MODULE LOADERS
             ==========================*/

            "jvm-npm/src/main/javascript/jvm-npm.js",
            "velt-loader/index.js",

            /*=========================
             * Typecript Lib
            ==========================*/

            "typescript/lib/lib.d.ts",
            "typescript/lib/lib.dom.d.ts",
            "typescript/lib/lib.dom.iterable.d.ts",
            "typescript/lib/lib.es2015.collection.d.ts",
            "typescript/lib/lib.es2015.core.d.ts",
            "typescript/lib/lib.es2015.d.ts",
            "typescript/lib/lib.es2015.generator.d.ts",
            "typescript/lib/lib.es2015.iterable.d.ts",
            "typescript/lib/lib.es2015.promise.d.ts",
            "typescript/lib/lib.es2015.proxy.d.ts",
            "typescript/lib/lib.es2015.reflect.d.ts",
            "typescript/lib/lib.es2015.symbol.d.ts",
            "typescript/lib/lib.es2015.symbol.wellknown.d.ts",
            "typescript/lib/lib.es2016.array.include.d.ts",
            "typescript/lib/lib.es2016.d.ts",
            "typescript/lib/lib.es2016.full.d.ts",
            "typescript/lib/lib.es2017.d.ts",
            "typescript/lib/lib.es2017.full.d.ts",
            "typescript/lib/lib.es2017.intl.d.ts",
            "typescript/lib/lib.es2017.object.d.ts",
            "typescript/lib/lib.es2017.sharedmemory.d.ts",
            "typescript/lib/lib.es2017.string.d.ts",
            "typescript/lib/lib.es2017.typedarrays.d.ts",
            "typescript/lib/lib.es2018.asyncgenerator.d.ts",
            "typescript/lib/lib.es2018.asynciterable.d.ts",
            "typescript/lib/lib.es2018.d.ts",
            "typescript/lib/lib.es2018.full.d.ts",
            "typescript/lib/lib.es2018.intl.d.ts",
            "typescript/lib/lib.es2018.promise.d.ts",
            "typescript/lib/lib.es2018.regexp.d.ts",
            "typescript/lib/lib.es2019.array.d.ts",
            "typescript/lib/lib.es2019.d.ts",
            "typescript/lib/lib.es2019.full.d.ts",
            "typescript/lib/lib.es2019.object.d.ts",
            "typescript/lib/lib.es2019.string.d.ts",
            "typescript/lib/lib.es2019.symbol.d.ts",
            "typescript/lib/lib.es2020.bigint.d.ts",
            "typescript/lib/lib.es2020.d.ts",
            "typescript/lib/lib.es2020.full.d.ts",
            "typescript/lib/lib.es2020.intl.d.ts",
            "typescript/lib/lib.es2020.promise.d.ts",
            "typescript/lib/lib.es2020.sharedmemory.d.ts",
            "typescript/lib/lib.es2020.string.d.ts",
            "typescript/lib/lib.es2020.symbol.wellknown.d.ts",
            "typescript/lib/lib.es5.d.ts",
            "typescript/lib/lib.es6.d.ts",
            "typescript/lib/lib.esnext.d.ts",
            "typescript/lib/lib.esnext.full.d.ts",
            "typescript/lib/lib.esnext.intl.d.ts",
            "typescript/lib/lib.esnext.promise.d.ts",
            "typescript/lib/lib.esnext.string.d.ts",
            "typescript/lib/lib.esnext.weakref.d.ts",
            "typescript/lib/lib.scripthost.d.ts",
            "typescript/lib/lib.webworker.d.ts",
            "typescript/lib/lib.webworker.importscripts.d.ts",
            "typescript/lib/lib.webworker.iterable.d.ts",

            /*=========================
             * Velt modules
             ==========================*/

            "globals.js",
            "velt/index.js",
            "velt/helpers.js",
            "velt/storage.js",
            "velt/convert.js",
            "velt/java.js",

            "velt/yaml.js",
            "velt/events.js",
            "velt/commands.js",
            "velt/grammar.js",
            "velt/internals.js",

            "velt/setup.js",

            "npm.js",

            "@types/velt/index.d.ts",
            "@types/velt/helpers.d.ts",
            "@types/velt/storage.d.ts",
            "@types/velt/convert.d.ts",

            "@types/node/globals.d.ts",

            /*==============================
             * Node module dependencies
             =============================*/

            "nearley.js",
            "js-yaml.js",
            "typescript/index.js",
            "table-polyfill.js",

            "base64-js.js",
            "base-64.js",
            "ieee754.js",
            "inherits.js",
            "is-arguments.js",
            "is-generator-function.js",
            "safe-buffer.js",
            //Readable Stream
            "readable-stream/errors.js",
            "readable-stream/readable.js",
            "readable-stream/lib/_stream_duplex.js",
            "readable-stream/lib/_stream_passthrough.js",
            "readable-stream/lib/_stream_readable.js",
            "readable-stream/lib/_stream_transform.js",
            "readable-stream/lib/_stream_writable.js",
            "readable-stream/lib/internal/streams/async_iterator.js",
            "readable-stream/lib/internal/streams/buffer_list.js",
            "readable-stream/lib/internal/streams/destroy.js",
            "readable-stream/lib/internal/streams/end-of-stream.js",
            "readable-stream/lib/internal/streams/from-browser.js",
            "readable-stream/lib/internal/streams/from.js",
            "readable-stream/lib/internal/streams/pipeline.js",
            "readable-stream/lib/internal/streams/state.js",
            "readable-stream/lib/internal/streams/stream-browser.js",
            "readable-stream/lib/internal/streams/stream.js",
            //Pako
            "pako/index.js",
            "pako/lib/deflate.js",
            "pako/lib/inflate.js",
            "pako/lib/zlib/adler32.js",
            "pako/lib/zlib/constants.js",
            "pako/lib/zlib/crc32.js",
            "pako/lib/zlib/deflate.js",
            "pako/lib/zlib/gzheader.js",
            "pako/lib/zlib/inffast.js",
            "pako/lib/zlib/inflate.js",
            "pako/lib/zlib/inftrees.js",
            "pako/lib/zlib/messages.js",
            "pako/lib/zlib/trees.js",
            "pako/lib/zlib/zstream.js",
            "pako/lib/utils/common.js",
            "pako/lib/utils/strings.js",

            "browserify-zlib/index.js",
            "browserify-zlib/src/index.js",
            "browserify-zlib/src/binding.js",

            /*===========================
               Node module replacements
            =============================*/

            "core/assert.js",
            "core/buffer.js",
            "core/console.js",
            "core/domain.js",
            "core/events.js",
            "core/fs.js",
            "core/http.js",
            "core/https.js",
            "core/os.js",
            "core/path.js",
            "core/process.js",
            "core/punycode.js",
            "core/querystring.js",
            "core/stream.js",
            "core/string_decoder.js",
            "core/timers.js",
            "core/tty.js",
            "core/url.js",
            "core/util.js",
            "core/zlib.js"
        };
    }
}
