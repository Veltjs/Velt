package xyz.corman.velt;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.logging.Logger;

import com.sun.org.apache.bcel.internal.generic.JSR;
import org.bukkit.Bukkit;
import org.bukkit.Server;
import org.bukkit.event.Listener;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Source;

import org.bukkit.command.Command;

import org.graalvm.polyglot.Value;
import xyz.corman.velt.modules.FileSystem;

interface AnonymousCallback<T> {
	void handle(T error);
}

public class Velt extends JavaPlugin implements Listener {
	private static Velt instance;
	
	private File dataFolder;
	private File scriptsFolder;
	private File modulesFolder;
	private File libFolder;
	private File scriptDataFolder;
	private Value libs;
	private ScriptWatch scriptWatch;
	private ScriptListener watchListener;
	private String watchPath;
	private ContextCreation contextCreation;

	public String getWatchPath() {
		return watchPath;
	}

	public void setWatchPath(String path) {
		watchPath = path;
	}

	Logger log;
	String[] extensions = new String[] {
		".js",
		".ts",
		".mjs",
		".mts",
		".jsx",
		".tsx"
	};

	public Value getLibs() {
		return libs;
	}
	public void setLibs(Value value) {
		libs = value;
	}

	private VeltRuntime runtime;
	private TypescriptCompiler compiler;
	
	public String getScriptsFolder() {
		return scriptsFolder.getAbsolutePath();
	}
	public String getScriptDataFolder() {
		return scriptDataFolder.getAbsolutePath();
	}
	public String getPluginDataFolder() {
		return getDataFolder().getAbsolutePath();
	}
	public File getLibFolder() {
		return libFolder;
	}
	
	public static Velt getInstance() {
		return instance;
	}
	
	interface ContextCallback {
		void call();
	}

	private void addResourceModule(String module) throws IOException {
		InputStream resource = getClass().getClassLoader().getResourceAsStream(module);
		if (resource == null) return;
		String content = Utils.convertStreamToString(resource);
		String modulePath = Paths.get(modulesFolder.getAbsolutePath(), module).toString();
		FileWriter writer;
		File moduleFile = new File(modulePath);
		moduleFile.mkdirs();
		moduleFile.delete();
		moduleFile.createNewFile();
		if (!moduleFile.exists()) {
			moduleFile.createNewFile();
		}
		FileSystem.writeFileSync(modulePath, content);
	}
	
	public void setupBuiltinModules() {
		FileSystem.setInstance(new FileSystem(this));
	}
	
	public void loadBStats() {
        int pluginId = 10685; // <-- Replace with the id of your plugin!
        Metrics metrics = new Metrics(this, pluginId);
        metrics.addCustomChart(new Metrics.SimplePie("script_count", () -> String.format("%s", Objects.requireNonNull(scriptsFolder.listFiles()).length)));
	}
	public void onDisable() {
		try {
			stop();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	public void onEnable() {
		Velt velt = this;

		setLibs(null);
		log = this.getLogger();
		instance = this;
		dataFolder = getDataFolder();
		scriptDataFolder = new File(Paths.get(dataFolder.getAbsolutePath(), "data").toString()
		);
		scriptsFolder = new File(
			Paths.get(dataFolder.getAbsolutePath(), "scripts").toString()
		);
		modulesFolder = new File(
			Paths.get(dataFolder.getAbsolutePath(), "node_modules").toString()
		);
		libFolder = new File(
			Paths.get(dataFolder.getAbsolutePath(), "lib").toString()
		);
		if (!dataFolder.exists()) dataFolder.mkdir();
		if (!scriptsFolder.exists()) scriptsFolder.mkdir();
		if (!modulesFolder.exists()) modulesFolder.mkdir();
		if (!libFolder.exists()) libFolder.mkdir();
		if (!scriptDataFolder.exists()) scriptDataFolder.mkdir();

		watchListener = file -> {
			if (watchPath == null) {
				return;
			}
			Path path = Paths.get(file.toString());
			if (path.startsWith(watchPath)) {
				Bukkit.getScheduler().scheduleSyncDelayedTask(this, () -> velt.reload(err -> {
					if (err == null) {
						getLogger().info("Successfully reloaded Velt with /velt watch");
					}
				}), 1);
			}
		};

		scriptWatch = new ScriptWatch(this, watchListener);
		scriptWatch.watch();

		String[] files = Core.getFiles();
		
		for (String filename : files) {
			try {
				addResourceModule(filename);
			} catch (IOException e) {
				e.printStackTrace();
			}
		}

		setupBuiltinModules();
		
		Scheduling.setInstance(new Scheduling());
		Events.setInstance(new Events(this));
		
		List<String> classpath = new ArrayList<>();
		
		loadBStats();

		Utils.runInPluginContext(() -> {
			ContextCreation contextCreation = new ContextCreation();
			runtime = new VeltRuntime(contextCreation, this);
			runtime.setModulesFolder(modulesFolder.getAbsolutePath());
			runtime.setProvideGlobals(true);

			compiler = new TypescriptCompiler(contextCreation);
			compiler.setModulesFolder(modulesFolder.getAbsolutePath());
			compiler.setProvideGlobals(true);
		});

		Bukkit.getScheduler().scheduleSyncDelayedTask(this, this::load, 1);
	}
	public void reload(AnonymousCallback<Throwable> callback) {
		Velt velt = this;

		Bukkit.getScheduler().scheduleSyncDelayedTask(this, () -> {
			try {
				velt.stop();
			} catch (NoSuchMethodException | SecurityException | IllegalAccessException | IllegalArgumentException
					| InvocationTargetException | NoSuchFieldException e) {
				// TODO Auto-generated catch block
				callback.handle(e);
				return;
			}
			Bukkit.getScheduler().scheduleSyncDelayedTask(this, () -> {
				try {
					velt.load();
				} catch (Throwable e) {
					callback.handle(e);
					return;
				}
				callback.handle(null);
			}, 1);
		}, 1);
	}
	public void stop() throws NoSuchMethodException, SecurityException, IllegalAccessException, IllegalArgumentException, InvocationTargetException, NoSuchFieldException {
		Events.getInstance().clearConsumers();
		for (VeltCommand command : Utils.commands) {
			command.unregister(Utils.getCommandMap());
		}
		Map<String, Command> knownCommands = Utils.getKnownCommands();
		knownCommands.values().removeIf(cmd -> cmd instanceof VeltCommand);
		Utils.commands.clear();
		Server server = Bukkit.getServer();
		Class<? extends Server> serverClass = server.getClass();
		Method syncCommands = serverClass.getDeclaredMethod("syncCommands");
		syncCommands.setAccessible(true);
		syncCommands.invoke(server);
		for (BukkitTask task : Bukkit.getScheduler().getPendingTasks()) {
			if (task.getOwner() == this) {
				task.cancel();
			}
		}
		Context current = runtime.context;
		Bukkit.getScheduler().scheduleSyncDelayedTask(this, () -> {
			JSRuntime.stop(current);
		}, 5);
	}
	public void load() {
		Utils.runInPluginContext(() -> {
			compiler.init();
			runtime.clearScripts();
			for (File file : Objects.requireNonNull(scriptsFolder.listFiles())) {
				String path = file.getAbsolutePath();
				String fileName = file.getPath();
				boolean hasExtension = false;
				for (String extension : extensions) {
					if (fileName.endsWith(extension)) {
						hasExtension = true;
						break;
					}
				}
				if (!hasExtension && !file.isDirectory()) {
					continue;
				}
				log.info(String.format("Adding script: %s", file.getName()));
				String absPath = Utils.escape(file.getAbsolutePath().trim());
				runtime.addScript(absPath);
			}
			runtime.init();
			runtime.put("__tscompiler", compiler);
			runtime.start();
			runtime.require("velt/setup");
		});
	}
}
