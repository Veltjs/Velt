const { Events } = Java.pkg('xyz.corman.velt');

let eventsInst = Events.getInstance();

const events = {
    waiting: {},
    callbacks: {},
    anyEvent: Symbol('anyEvent'),
    on(event, callback) {
        if (Array.isArray(event)) {
            const events = event.forEach(ev => this.on(ev, callback));
            return {
                close() {
                    events.forEach(ev => event.close());
                }
            }
        } else {
            if (!this.callbacks[event]) this.callbacks[event] = [];
            this.callbacks[event].push(callback);
        }
        return this;
    },
    removeListener(event, callback) {
        let callbacks = events.callbacks[event];
        callbacks.splice(callbacks.indexOf(callback), 1);
        return this;
    },
    once(event, cond = undefined, options = undefined) {
        if (options === undefined) {
            var callback = undefined;
            var timeout = undefined;
        } else if (typeof options === 'function') {
            var callback = options;
            var timeout = undefined;
        } else {
            var { callback, timeout = undefined } = options;
        }
        if (timeout) {
            return internals.timeout(
                events.waitFor(event, cond, callback), timeout
            );
        }
        if (Array.isArray(event)) {
            event.forEach(ev => this.waitFor(ev, cond, callback));
        } else {
            let condition;
            if (cond) {
                condition = cond;
            } else {
                condition = event => true;
            }
            if (!this.waiting[event]) this.waiting[event] = [];
            if (callback) {
                this.waiting[event].push({ event, condition, callback });
            } else {
                return new Promise(resolve => {
                    this.waiting[event].push(
                        { event, condition, callback: resolve }
                    );
                });
            }
        }
    },
    handleEvent(event) {
        let waiting = this.waiting[event.getClass().getSimpleName()];
        if (waiting) {
            waiting.forEach(({ event: eventListenedFor, condition, callback }) => {
                if (
                    (event.getClass().getSimpleName() !== eventListenedFor) || eventListenedFor === this.anyEvent
                ) return;
                if (!condition(event)) return;
                callback(event);
                waiting.splice(waiting.indexOf(callback), 1);
            });
        }
        let handler = this.callbacks[event.getClass().getSimpleName()];
        if (!handler) return;
        for (callback of handler) callback(event);
        if (this.callbacks[this.anyEvent]) {
            this.callbacks[this.anyEvent]
                .forEach(callback => callback(event));
        }
    },
}

events.waitFor = events.once;

eventsInst.listen(event => events.handleEvent(event));

module.exports = events;