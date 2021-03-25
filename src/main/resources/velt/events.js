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
            if (typeof type === 'function' && event instanceof type) {
                return true;
            } else if (type === event.getClass().getSimpleName()) {
                return true;
            }
        }
    },
    handleType(type, event) {
        /*
             Match the type names
             Works in such a way that:
             player chat_event -> PlayerChatEvent
             playerChatEvent -> PlayerChatEvent
             playerChat -> PlayerChatEvent
          */
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
                return this.once({
                    type: args[0],
                    condition: args[1],
                    run: args[2]
                });
            case 2:
                return this.once({
                    type: args[0],
                    condition: () => true
                })
            case 1: {
                let { type, condition, run } = args[0];
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
    handleEvent(event) {
        /*
            This is bugged - needs further
         */
        try {
            for (const {types, run} of this.listeners) {
                if (this.checkTypes(types, event)) {
                    run(event);
                }
            }
            for (const {types, condition, run} of this.waiting) {
                if (this.checkTypes(types, event) && condition(event)) {
                    run(event);
                    this.waiting = this.waiting.filter(i => i.run !== run);
                }
            }
        } catch (e) {
            console.error(e);
        }
    },
}

events.waitFor = events.once;

eventsInst.listen(event => events.handleEvent(event));

module.exports = events;