const { Events } = Java.pkg('xyz.corman.velt');
const internals = require('./internals');

let eventsInst = Events.getInstance();

const events = {
    listeners: [],
    waiting: [],
    anyEvent: Symbol('anyEvent'),
    checkTypes(types, event) {
        for (const type of types) {
            if (type == null) continue;
            if (type === this.anyEvent) {
                return true
            } else if (typeof type === 'function' && event instanceof type) {
                return true;
            } else if (type === event.getClass().getSimpleName()) {
                return true;
            }
        }
    },
    handleType(type) {
        /*
             Match the type names
             Works in such a way that:
             player chat_event -> PlayerChatEvent
             playerChatEvent -> PlayerChatEvent
             playerChat -> PlayerChatEvent
          */
        if (type === this.anyEvent) {
            return [ type ];
        } else if (Array.isArray(type)) {
            return type.flatMap(i => this.handleType(i));
        }
        const newType = type
            .split(/ |_/)
            .map(i => internals.capitalize(i))
            .join('');
        const types = [ newType, `${newType}Event` ];
        for (const typeOpt of types) {
            const eventType = eventsInst.eventMap.get(typeOpt);
            if (eventType != null) {
                return [ eventType ];
            }
        }
        return types;
    },
    on(type, run) {
        this.listeners.push({
            types: this.handleType(type),
            run
        });
    },
    once(...args) {
        switch (args.length) {
            case 3:
                if (typeof args[2] === 'function') {
                    return this.once({
                        type: args[0],
                        condition: args[1],
                        run: args[2]
                    });
                }
                return this.once({
                    type: args[0],
                    condition: args[1],
                    ...args[2]
                })
            case 2:
                return this.once({
                    type: args[0],
                    condition: () => true
                })
            case 1: {
                let { type, condition, run, limit } = args[0];
                if (limit) {
                    return Promise.resolve({
                        get matches() {
                            const getMatches = function* () {
                                for (let i = 0; i < limit; i++) {
                                    yield this.once({ type,  });
                                }
                            }
                            return getMatches();
                        }
                    });
                }
                const types = this.handleType(type);
                if (run && condition) {
                    this.waiting.push({ types, condition, run });
                } else if (run) {
                    this.waiting.push({ types, condition: () => true, run });
                } else {
                    return new Promise(res => {
                        if (condition) {
                            this.waiting.push({ types, condition, run: res });
                        } else {
                            this.waiting.push({ types, condition: () => true, run: res });
                        }
                    });
                }
            }
        }
    },
    removeListener(...args) {
        switch (args.length) {
            case 1: {
                const [ callback ] = args;
                this.listeners = this.listeners.filter(i => i.run !== callback);
            }
            case 2: {
                const [ name, callback ] = args;
                const names = this.handleType(name);
                this.listeners = this.listeners.filter(i => {
                    if (i.run !== callback) {
                        return true;
                    }
                    for (const name of i.types) {
                        if (names.includes(name)) {
                            return false;
                        }
                    }
                    return true;
                });
            }
        }
    },
    handleEvent(event) {
        /*
            This is bugged - needs further
         */
        try {
            this.listeners.forEach(({ types, run }) => {
                if (this.checkTypes(types, event)) {
                    run(event);
                }
            });
            this.waiting.forEach(({ types, condition, run }) => {
                if (this.checkTypes(types, event) && condition(event)) {
                    run(event);
                    this.waiting = this.waiting.filter(i => i.run !== run);
                }
            });
        } catch (e) {
            console.error(e);
        }
    },
}

events.waitFor = events.once;

eventsInst.listen(event => events.handleEvent(event));

module.exports = events;