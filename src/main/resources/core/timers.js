const Scheduling = Java.type('xyz.corman.velt.Scheduling');
const { setTimeoutFuture } = Scheduling.getInstance();

function setTimeout(callback, delay) {
	let future = setTimeoutFuture(callback, delay);
	return {
		close() { future.cancel() }
	};
}

function setInterval(callback, period, delay = 0) {
	let cancelled = false;
	let func = () => {
		setTimeout(() => {
			if (!cancelled) callback();
			if (!cancelled) func();
		}, period);
	}
	if (delay === 0) {
		func();
	} else {
		setTimeout(func, delay);
	}
	return {
		close() { cancelled = true }
	};
}

let clearInterval = clearTimeout = i => {
	i.close();
};

function waitAsync(delay = 0) {
	return new Promise(resolve => {
		setTimeout(resolve, delay);
	});
}

module.exports = {
	setInterval,
	setTimeout,
	clearInterval,
	clearTimeout,
	waitAsync
};