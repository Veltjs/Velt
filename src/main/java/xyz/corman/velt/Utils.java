package xyz.corman.velt;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.Set;
import java.util.ArrayList;

import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.command.Command;
import org.bukkit.command.CommandMap;
import org.bukkit.command.SimpleCommandMap;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.plugin.Plugin;
import org.bukkit.plugin.SimplePluginManager;
import org.bukkit.util.Vector;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Engine;
import org.graalvm.polyglot.Source;
import org.graalvm.polyglot.Value;

import xyz.corman.velt.Velt.ContextCallback;

interface Callable<T> {
	T execute(Object ...args);
}

interface VoidCallable {
	void execute(Object ...args);
}

public class Utils {
	static List<VeltCommand> commands  = new ArrayList<>();;

	public static String convertStreamToString(InputStream is) {
	    try (Scanner scanner = new Scanner(is)) {
			try (Scanner s = scanner.useDelimiter("\\A")) {
				return s.hasNext() ? s.next() : "";
			}
		}
	}
	public static boolean isJavaObject(Object obj) {
		return !(obj instanceof Value);
	}
	public static void runInPluginContext(ContextCallback callback) {
		ClassLoader oldCl = Thread.currentThread().getContextClassLoader();
		Thread.currentThread().setContextClassLoader(Velt.class.getClassLoader());
		callback.call();
		Thread.currentThread().setContextClassLoader(oldCl);
	}
	@SuppressWarnings("rawtypes")
	public static boolean isInstanceOf(Class cls, Object obj) {
		return cls.isInstance(obj);
	}
	public static boolean isLookingAt(Player player, LivingEntity livingEntity, double targetDist){
	    Location eye = player.getEyeLocation();
	    Vector toEntity = livingEntity.getEyeLocation().toVector().subtract(eye.toVector());
	    double dot = toEntity.normalize().dot(eye.getDirection());

	    return dot > targetDist;
	}
	public static LivingEntity getLookingAt(Player player, int range, double targetDist) {
	    for (Entity e : player.getNearbyEntities(range, range, range)){
	        if (e instanceof LivingEntity){
	        	if (isLookingAt(player, (LivingEntity) e, targetDist)) {
	        		return (LivingEntity) e;
	        	}
	        }
	    }
	    return null;
	}
	public static void printErrorTrace(Exception e) {
		e.printStackTrace();
	}
	public static VeltCommand makeVeltCommand(String label, String name, List<String> aliases, String description, String usage, CommandExecute executor, TabExecute tabExecutor, Plugin plugin) {
		VeltCommand command = new VeltCommand(label, name, aliases, description, usage, executor, tabExecutor, plugin);
		commands.add(command);
		return command;
	}
	public static CommandMap getCommandMap() throws NoSuchMethodException, SecurityException, IllegalAccessException, IllegalArgumentException, InvocationTargetException, NoSuchFieldException {
		Field commandMapField = SimplePluginManager.class.getDeclaredField("commandMap");
		commandMapField.setAccessible(true);
		CommandMap map = (CommandMap) commandMapField.get(Bukkit.getPluginManager());
        return (CommandMap) map.getClass().getSuperclass().cast(map);
	}
	
	@SuppressWarnings("unchecked")
	public static Map<String, Command> getKnownCommands() throws IllegalArgumentException, IllegalAccessException, NoSuchMethodException, SecurityException, InvocationTargetException, NoSuchFieldException {
		Field knownCommandsField = SimpleCommandMap.class.getDeclaredField("knownCommands");
		knownCommandsField.setAccessible(true);
		return (Map<String, Command>) knownCommandsField.get(getCommandMap());
	}

	@SuppressWarnings("unchecked")
	public static Set<String> getAliases() throws NoSuchFieldException, SecurityException, IllegalArgumentException, IllegalAccessException, NoSuchMethodException, InvocationTargetException {
		Field aliasesField = SimpleCommandMap.class.getDeclaredField("aliases");
		aliasesField.setAccessible(true);
		return (Set<String>) aliasesField.get(getCommandMap());
	}
	
	public static void addAliases(String[] names, VeltCommand command) throws IllegalArgumentException, IllegalAccessException, NoSuchMethodException, SecurityException, InvocationTargetException, NoSuchFieldException {
		Map<String, Command> knownCommands = getKnownCommands();
		Set<String> aliases;
		try {
			aliases = getAliases();
		} catch (Exception e) {
			aliases = new LinkedHashSet<String>();
		}
		for (String name : names) {
			knownCommands.put(name, command);
			aliases.add(name);
		}
	}
	public static byte[] toBytes(String string) {
		return string.getBytes();
	}
	public static String escape(String s){
		  return s.replace("\\", "\\\\")
		          .replace("\t", "\\t")
		          .replace("\b", "\\b")
		          .replace("\n", "\\n")
		          .replace("\r", "\\r")
		          .replace("\f", "\\f")
		          .replace("\'", "\\'")
		          .replace("\"", "\\\"");
		}
	public static String toAbsolutePath(String maybeRelative) {
		return toAbsolutePath(maybeRelative, Paths.get(""));
	}
	public static String toAbsolutePath(String maybeRelative, String base) {
		return toAbsolutePath(maybeRelative, Paths.get(base));
	}
	public static String toAbsolutePath(String maybeRelative, Path base) {
	    Path path = Paths.get(maybeRelative);
	    Path effectivePath = path;
	    if (!path.isAbsolute()) {
	        effectivePath = base.resolve(path).toAbsolutePath();
	    }
	    return effectivePath.normalize().toString();
	}
	public static Value getBindings(Context context) {
		return context.getBindings("js");
	}
	public static <T> T cast(Class<T> cls, Object obj) {
		return (T) cls.cast(obj);
	}

	public static <T> VoidRun wrap(Callable<T> val) {
		VoidRun res = new VoidRun((Object ...args) -> {
			Bukkit.getScheduler().scheduleSyncDelayedTask(Velt.getInstance(), val::execute, 0); //why does this need to be delayed by 1 tick?
		});
		return res;
	}

	public static Source fromString(String string, String path) {
		return Source.newBuilder("js", string, path).cached(true).buildLiteral();
	}
}
