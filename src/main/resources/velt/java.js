const { Utils } = Java.pkg('xyz.corman.velt');

const wrap = (...args) => {
    const wrapped = Utils.wrap(...args);
    return wrapped.execute;
}

module.exports = {
    wrap
};

