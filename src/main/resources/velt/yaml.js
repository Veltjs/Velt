const yaml = require('../js-yaml');
const { Object } = Java.pkg('java.lang');

const parse = text => {
    return yaml.load(text);
};

const dump = obj => {
    return yaml.dump(obj);
}

module.exports = { parse, dump };