const { Bukkit } = Java.pkg('org.bukkit');
const { Utils } = Java.pkg('xyz.corman.velt');
const { Player } = Java.pkg('org.bukkit.entity');

const { plugin } = require('./');
const internals = require('./internals');
const nearley = require('nearley');

const grammar = require('./grammar');

const createParser = () => {
    return new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
}

const parse = text => {
    const parser = createParser();
    parser.feed(text);
    return parser.results[0];
}

const ending = num => {
    switch (num) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
}

const commands = {
    types: [],
    handleType(obj) {
        if (typeof obj === 'string') {
            return { type: 'simple', value: obj };
        }
        return obj;
    },
    createType(...args) {
        switch (args.length) {
            case 1:
                const [ opts ] = args;

                commands.types.push(opts);
                break;
            case 2:
                return this.createType({
                    type: args[0],
                    ...args[1]
                })
        }
        return this;
    },
    createListType(name, arr) {
        return this.createType({
            type: name,
            tabComplete: () => arr,
            match: (sender, arg) => arr.toLowerCase().includes(arg.toLowerCase())
        });
    },
    getType(type) {
        switch (type.type) {
            case 'simple':
                return this.types.find(i => {
                    return i.type === type.value;
                });
            case 'optional': {
                const { value } = type;
                const val = this.findType(value);
                return {
                    type: `${val.type}?`,
                    tabComplete: val.tabComplete,
                    match: (sender, arg) => arg == null ? null : val.match == null ? null : val.match(sender, arg)
                };
            }
            case 'spread': {
                const { value } = type;
                const val = this.findType(value);
                return {
                    type: `...${val.type}`,
                    tabComplete: val.tabComplete,
                    match(sender, args) {
                        const matched = args.map(arg => val.match(sender, arg));
                        if (matched.some(i => i === undefined)) {
                            return;
                        }
                        return matched;
                    }
                }
            }
        }
    },
    findType(type) {
        const handledType = this.handleType(type);
        const out = this.getType(handledType);
        return out;
    },
    runCommand(sender, command) {
        Bukkit.dispatchCommand(sender, command);
    },
    runConsoleCommand(command) {
        this.runCommand(Bukkit.getServer().getConsoleSender(), command);
    },
    delegateTab(subs, tab, sender, args, current = null) {
        args = args ?? [];
        subs = subs ?? [];
        if (args == null) {
            return [];
        }
        const [ arg ] = args;
        if (arg != null) {
            for (const sub of subs) {
                if (sub.name === arg) {
                    return commands.delegateTab(sub.subs, sub.tabComplete, sender, args.slice(1), sub);
                }
            }
        }

        const extras = args.length <= 1 ? subs.map(i => i.name) : [];

        if (current?.args != null) {
            const index = args.length === 0 ? 0 : args.length - 1;
            const argType = current.args[index];
            if (argType) {
                const arg = this.findType(argType);
                if (arg.tabComplete) {
                    try {
                        extras.push(...arg.tabComplete(sender, args[index]));
                    } catch (e) {
                        console.error(e);
                    }
                }
            } else {
                const finalType = current.args[current.args.length - 1];
                if (finalType.type === 'spread') {
                    const arg = this.findType(finalType);
                    if (arg.tabComplete) {
                        try {
                            extras.push(...arg.tabComplete(sender, args[index]));
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            }
        }

        if (tab) {
            return [ ...extras, ...tab(sender, ...args) ];
        } else {
            return [ ...extras ];
        }
    },
    delegateRun(subs, run, sender, args, current = null) {
        args = args ?? [];
        const arg = args?.[0];
        if (arg != null) {
            for (const sub of subs) {
                if (sub.name === arg) {
                    return commands.delegateRun(sub.subs ?? [], sub.run, sender, args.slice(1), sub);
                }
            }
        }

        if (current != null) {
            if (current.playerOnly && commands.isConsole(sender)) {
                if (typeof current.playerOnly === 'string') {
                    sender.sendMessage(current.playerOnly);
                }
                return true;
            }
            if (current.permission && !sender.hasPermission(current.permission)) {
                if (current.permissionMessage) {
                    sender.sendMessage(current.permissionMessage);
                }
                return true;
            }
        }

        const newArgs = [ ...args ];

        if (current?.args != null) {
            let index = 0;
            for (const arg of args.filter(i =. i !== '')) {
                const argType = current.args[index];
                if (argType) {
                    let val;
                    if (argType.type === 'spread') {
                        val = args.slice(index).filter(i => i !== '');
                    } else {
                        val = args[index];
                    }
                    const argument = this.findType(argType);
                    if ((val == null || val.length === 0) && !([ 'spread', 'optional' ].includes(argType?.type))) {
                        const end = ending(index + 1)
                        sender.sendMessage(c`&fThe &b${index + 1}${end} &fargument is required, but wasn't specified.`);
                        return;
                    }
                    const matched = argument.match(sender, val);
                    if (matched !== false && matched !== undefined) {
                        newArgs[index] = matched;
                    } else {
                        const end = ending(index + 1);
                        switch (argType.type) {
                            case 'spread':
                                sender.sendMessage(c`&fOne of the arguments from the &b${index + 1}${end} &fspot to the final spot isn't a &b${argument.type}&f, which is the type it has to be.`);
                                return;
                            default:
                                sender.sendMessage(c`&fYour &b${index + 1}${end} &fargument must be a &b${argument.type}&f, not &b${val}`);
                                return;
                        }
                    }
                }
                index++;
            }
            if (args.length > current.args.length) {
                const final = current.args[current.args.length - 1];
                if (final.type !== 'spread') {
                    sender.sendMessage(c`&6Unfortunately, you have put &c${args.length} &6args when the maximum is &c${current.args.length}`);
                    return;
                }
            }
        }

        if (run) {
            return run(sender, ...newArgs);
        } else {
            throw new Error('No run or subcommand found');
        }
    },
    subCommand(cmd) {
        if (typeof cmd === 'function') {
            return {
                name: cmd.name,
                run: cmd
            };
        } else {
            if (cmd.args == null) {
                const { cmd: cmdName, args: parsedArgs } = parse(cmd.name);
                if (parsedArgs != null) {
                    cmd.args = parsedArgs;
                }
                cmd.name = cmdName;
            }
            if (cmd.subs) {
                const subCommands = [];
                for (const [ sub, actual ] of Object.entries(cmd.subs)) {
                    let extra = {};
                    if (typeof actual === 'function') {
                        extra.run = actual;
                    } else {
                        extra = { ...actual };
                    }
                    subCommands.push(commands.subCommand({ name: sub, ...extra }));
                }
                cmd.subs = subCommands;
            }
            return cmd;
        }
    },
    create(...args) {
        if (args.length === 1) {
            if (typeof args[0] == 'function') {
                return commands.create({ run: args[0] });
            }

            const [ opts ] = args;

            let {
                description = 'A velt command',
                usage = 'No given usage',
                aliases = [],
                subs = [],
                label = 'velt',
                run = undefined,
                tabComplete = undefined,
                name = undefined,
                permission = undefined,
                permissionMessage = undefined,
                playerOnly = undefined,
                args: cmdArgs = undefined,
                tabCondition = (sender, completions, args) => completions.filter(i => i.toLowerCase().startsWith(args[args.length - 1].toLowerCase())),
                argParser =  str => str.match(/\\?.|^$/g)
                    .reduce((p, c) => {
                        if (c === '"'){
                            p.quote ^= 1;
                        } else if (!p.quote && c === ' '){
                            p.a.push('');
                        } else {
                            p.a[p.a.length-1] += c.replace(/\\(.)/,"$1");
                        }
                        return p;
                    }, {a: ['']}).a
            } = opts;

            if (cmdArgs === undefined) {
                const { cmd: cmdName, args: parsedArgs } = parse(name);
                if (parsedArgs != null) {
                    cmdArgs = parsedArgs;
                    opts.args = cmdArgs;
                }
                name = cmdName;

            }

            if (tabCondition == null) {
                tabCondition = (sender, completions) => completions;
            }

            if (argParser == null) {
                argParser = str => str.split(' ');
            }

            if (name === undefined) {
                name = run.name;
            }

            const subCommands = [];

            const handleCommand = (sender, label, args) => {
                let parsed = argParser(internals.javaArrToJSArr(args).join(' '));
                if (run || subCommands.length > 0) {
                    try {
                        if (playerOnly && commands.isConsole(sender)) {
                            sender.sendMessage(playerOnly);
                            return true;
                        } else {
                            const res = commands.delegateRun(subCommands, run, sender, parsed, opts);
                            if (res === false) {
                                return false;
                            }
                            if (typeof res === 'string') {
                                sender.sendMessage(res);
                            }
                        }
                    } catch (e) {
                        console.error(e);
                        return false;
                    }
                    return true;
                }
                return false;
            };
            const handleTabComplete = (sender, alias, args) => {
                let parsed = argParser(internals.javaArrToJSArr(args).join(' '));
                if (tabComplete || subCommands.length > 0 || cmdArgs != null) {
                    out = commands.delegateTab(subCommands, tabComplete, sender, parsed, opts);
                } else {
                    out = [];
                }
                return internals.JSArrToJavaList(tabCondition(sender, out, args));
            }

            let cmd = Utils.makeVeltCommand(label, name, internals.JSArrToJavaList(aliases), description, usage, handleCommand, handleTabComplete, plugin);
            if (permission) {
                cmd.setPermission(permission);
            }
            if (permissionMessage) {
                cmd.setPermissionMessage(permissionMessage);
            }

            Utils.getCommandMap().register(cmd.getName(), "velt", cmd);
            Bukkit.getServer().syncCommands();

            for (const [ sub, actual ] of Object.entries(subs)) {
                let extra = {};
                if (typeof actual === 'function') {
                    extra.run = actual;
                } else {
                    extra = { ...actual };
                }
                subCommands.push(commands.subCommand({ name: sub, ...extra }));
            }

            return {
                tabComplete(call) {
                    tabComplete = call;
                },
                run(call) {
                    run = call;
                }
            };
        } else if (args.length == 2) {
            if (typeof args[0] == 'string') {
                let opts;
                if (typeof args[1] == 'function') {
                    opts = {run: args[1]};
                } else {
                    opts = args[1];
                }
                return commands.create({
                    name: args[0],
                    ...opts
                });
            }
            return commands.create({ run: args[0], ...args[1] });
        } else if (args.length == 3) {
            return commands.create({
                name: args[0],
                run: args[2],
                ...args[1]
            });
        }
    },
    isConsole(sender) {
        return !sender instanceof Player;
    },
};

commands
    .createType('text', {
        match(sender, arg) {
            if (arg == null) return;
            return arg;
        }
    })
    .createType('integer', {
        match(sender, arg) {
            if (arg == null) return;
            const parsed = parseInt(arg);
            if (isNaN(parsed)) return;
            return parsed;
        }
    })
    .createType('number', {
        match(sender, arg) {
            if (arg == null) return;
            const parsed = parseFloat(arg);
            if (isNaN(parsed)) return;
            return parsed;
        }
    })
    .createType('boolean', {
        tabComplete: () => [ 'true', 'false' ],
        match(sender, arg) {
            if (arg == null) return;
            const bools = { true: true, false: false };
            const val = bools[arg.toLowerCase()];
            if (val == null) return;
            return val;
        }
    })
    .createType('player', {
        tabComplete: () => server.onlinePlayers.map(i => i.getName()),
        match(sender, arg) {
            if (arg == null) return;
            const casted = cast.asPlayer(arg);
            if (!casted) return;
            return casted;
        }
    });

module.exports = commands;