const { commands, scripts, c, plugin } = require('./');
const { Storage } = require('./storage');

const infoMsg = c`
&5&lVelt Help
&8-----------
&b/velt &8| &b/velt info &8| &b/velt help &8| &fGet info on how to use Velt
&b/velt reload &8| &fReload all of your Velt scripts
&b/velt eval &8| &fEvaluate JavaScript code in-game
&8-----------`;

const reload = {
    permission: 'velt.reload',
    permissionMessage: c`&5&lVelt &8| &cYou do not have the permissions to reload all scripts.`,
    run(sender) {
        sender.sendMessage(c`&5&lVelt &8| &bReloading all scripts.`);
        try {
            plugin.reload();
            sender.sendMessage(c`&5&lVelt &8| &aReloaded all scripts.`);
        } catch (err) {
            sender.sendMessage(c(`&c${err}`));
        }
    }
};

commands.create('velt', {
    argParser: null,
    subs: {
        info: () => infoMsg,
        help: () => infoMsg,
        reload: reload,
        rl: reload,
        eval(sender, ...args) {
            if (!sender.hasPermission('velt.eval')) return;
            const evaluate = args.join(' ');
            sender.sendMessage(c`&5&lVelt &8| &b${evaluate}`);
            try {
                sender.sendMessage(`${eval(evaluate)}`);
            } catch (err) {
                sender.sendMessage(c(`&c${err}`));
            }
        }
    },
    run: () => infoMsg
});

const config = Storage.createConfig(scripts.pluginPath('config.yml'), {
    version: '0.1.1',
    'arg types': {
        prefix: '',
        messages: {
            'required argument': '&fThe &b{index}{ending} &fargument is required, but wasn\'t specified.',
            'spread type failure': '&fOne of the arguments from the &b{index}{ending} &fspot to the final spot isn\'t a &b{type}&f, which is the type it has to be.',
            'type failure': '&fYour &b{index}{ending} &fargument must be a &b{type}&f, not &b{value}',
            'maximum failure': '&fUnfortunately, you have put &b{given} &6args when the maximum is &b{max}'
        }
    },
    'simple commands': []
});

const result = config.get();

const convertCommand = data => {
    const subs = {};
    for (const [ name, command ] of Object.entries(data.subs ?? {})) {
        subs[name] = convertCommand(command);
    }
    return {
        subs,
        run: () => c(data.message)
    }
}

for (const [ name, command ] of Object.entries(result['simple commands'])) {
    commands.create(name, convertCommand(command))
}

module.exports = { config };
