const { FileSystem } = Java.pkg('xyz.corman.velt.modules');
const { BigInteger } = Java.pkg('java.math');

const stream = require('stream');

const inst = FileSystem.getInstance();

const fs = module.exports = {};

class WriteStream extends stream.Writable {
	constructor(path, opts = {}) {
		super();
		this._stream = FileSystem.createWriteStream(path);
	}
	_write(chunk, encoding, done) {
		const buf = Buffer.from(chunk, encoding);
		const length = buf.length;
		let arr = [];
		buf.forEach(i => arr.push(i));
		arr = arr.map(i => BigInteger.valueOf(i).toByteArray());
		for (let inner of arr) {
			this._stream.write(inner);
		}
		done();
	}
}

class ReadStream extends stream.Readable {
	constructor(path, opts = {}) {
		super();
		this._stream = FileSystem.createReadStream(path);		
	}
	_read(n) {
		const bytes = this._stream.readNBytes(n);
		if (bytes.length == 0) return null;
		return Buffer.from(bytes);
	}
}

fs.createWriteStream = (...args) => new WriteStream(...args);
fs.createReadStream = (...args) => new ReadStream(...args);

fs.readFileSync = FileSystem.readFileSync;
fs.createFileSync = FileSystem.createFileSync;
fs.appendFileSync = FileSystem.appendFileSync;
fs.writeFileSync = FileSystem.writeFileSync;
fs.unlinkSync = FileSystem.unlinkSync;
fs.renameSync = FileSystem.renameSync;
fs.readFile = inst.readFile;
fs.appendFile = inst.appendFile;
fs.writeFile = inst.writeFile;
fs.unlink = inst.unlink;
fs.rename = inst.rename;