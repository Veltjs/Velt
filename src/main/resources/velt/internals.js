const { ArrayList, Arrays } = Java.pkg('java.util');

let internals = {
    reconstructTemplate(text, args) {
        out = [];
        for ([count, i] of args.entries()) {
            out.push(text[count]);
            out.push(i);
        }
        out.push(text[args.length]);
        return out.join('');
    },
    handleStringFunc(func) {
        return function(text, ...args) {
            if (typeof text === 'string') return func(text);
            return func(internals.reconstructTemplate(text, args));
        }
    },
    enumToCamelCase(text) {
        let words = text.split('_');
        words = [words[0], ...words.slice(1)
            .map(i => internals.capitalize(i))];
        return words.join('');
    },
    camelCaseToEnum(text) {
        return text
            .replace(/([a-z])([A-Z])/g, `$1_$2`)
            .toUpperCase()
    },
    javaArrToJSArr(arr) {
        return internals.javaListToJSArr(Arrays.asList(arr));
    },
    javaListToJSArr(arr) {
        let out = [];
        arr.forEach(item => out.push(item));
        return out;
    },
    JSArrToJavaList(arr) {
        let out = new ArrayList();
        arr.forEach(item => out.add(item));
        return out;
    },
    JSArrToJavaArr(arr) {
        return internals.JSArrToJavaList(arr).toArray();
    },
    timeout(promise, ticks) {
        let timeout = new Promise(resolve => {
            server.after(ticks, () => {
                resolve(undefined);
            });
        });

        return Promise.race([
            promise,
            timeout
        ]);
    },
    capitalize(str) {
        if (typeof str === 'string') {
            return str.replace(/^\w/, c => c.toUpperCase());
        } else {
            return '';
        }
    }
};

module.exports = internals;