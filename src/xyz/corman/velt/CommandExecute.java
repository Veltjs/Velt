package xyz.corman.velt;

import org.bukkit.command.CommandSender;

interface CommandExecute {
	public boolean execute(CommandSender sender, String commandLabel, String[] args);
}