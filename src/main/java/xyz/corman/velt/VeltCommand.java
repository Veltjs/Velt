package xyz.corman.velt;

import java.util.List;
import java.util.ArrayList;

import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;

import org.bukkit.command.PluginIdentifiableCommand;
import org.bukkit.plugin.Plugin;

import org.bukkit.command.defaults.BukkitCommand;

public class VeltCommand extends BukkitCommand {
	CommandExecute executor;
	TabExecute tabExecutor;
	
	public VeltCommand(String label, String name, List<String> aliases, String description, String usage, CommandExecute executor, TabExecute tabExecutor, Plugin plugin) {
        super(name, description, usage, aliases);
        boolean labelSuccess = this.setLabel(label);
        if (!labelSuccess) {
			Bukkit.getLogger().warning(String.format("Velt was unsuccessful in setting %s's label to %s", name, label));
		}
        this.executor = executor;
        this.tabExecutor = tabExecutor;
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
	
	public List<String> tabComplete(CommandSender sender, String alias, String[] args) {
		ArrayList<String> empty = new ArrayList<>();
		if (this.getPermission() != null && !sender.hasPermission(this.getPermission())) {
			return empty;
		}
		try {
			return this.tabExecutor.execute(sender, alias, args);
		} catch (Exception err) {
			return new ArrayList<>();
		}
	}
}
