package xyz.corman.velt;

import java.util.List;

import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;

import org.bukkit.command.PluginIdentifiableCommand;
import org.bukkit.plugin.Plugin;

public class VeltCommand extends Command implements PluginIdentifiableCommand {
	CommandExecute executor;
	Plugin plugin;
	
	public VeltCommand(String label, String name, List<String> aliases, String description, String usage, CommandExecute executor, Plugin plugin) {
        super(name, description, usage, aliases);
        if (label != null) this.setLabel(label);
        this.executor = executor;
        this.plugin = plugin;
	}

	@Override
	public boolean execute(CommandSender sender, String commandLabel, String[] args) {
		if (this.getPermission() != null && !sender.hasPermission(this.getPermission())) {
			if (this.getPermissionMessage() != null) {
				sender.sendMessage(this.getPermissionMessage());
			}
			return false;
		}
		return this.executor.execute(sender, commandLabel, args);
	}

	@Override
	public Plugin getPlugin() {
		// TODO Auto-generated method stub
		return plugin;
	}

}
