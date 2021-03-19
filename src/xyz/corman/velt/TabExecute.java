package xyz.corman.velt;

import java.util.List;

import org.bukkit.command.CommandSender;

public interface TabExecute {
	public List<String> execute(CommandSender sender, String alias, String[] args);
}
