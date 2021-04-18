package xyz.corman.velt;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import org.bukkit.Bukkit;
import org.bukkit.Server;
import org.bukkit.event.Listener;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Source;

import org.bukkit.command.Command;

import org.graalvm.polyglot.Value;
import xyz.corman.velt.modules.FileSystem;

//import org.bstats.bukkit.Metrics;
//import org.bstats.charts.CustomChart;
//import org.bstats.charts.SimplePie;

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

	private Context context;
	
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
        metrics.addCustomChart(new Metrics.SimplePie("script_count", () -> String.format("%s", scriptsFolder.listFiles().length)));
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
				new BukkitRunnable() {
					@Override
					public void run() {
						velt.reload(err -> {
							if (err == null) {
								getLogger().info("Successfully reloaded Velt with /velt watch");
							}
						});
					}
				}.runTaskLater(this, 1);
			}
		};

		scriptWatch = new ScriptWatch(this, watchListener);
		scriptWatch.watch();

		String[] files = {
			/*=========================
			 * MODULE LOADERS
			 ==========================*/

			"jvm-npm/src/main/javascript/jvm-npm.js",
			"velt-loader/index.js",

			/*=========================
             * Typecript Lib
            ==========================*/

			"typescript/lib/lib.d.ts",
			"typescript/lib/lib.dom.d.ts",
			"typescript/lib/lib.dom.iterable.d.ts",
			"typescript/lib/lib.es2015.collection.d.ts",
			"typescript/lib/lib.es2015.core.d.ts",
			"typescript/lib/lib.es2015.d.ts",
			"typescript/lib/lib.es2015.generator.d.ts",
			"typescript/lib/lib.es2015.iterable.d.ts",
			"typescript/lib/lib.es2015.promise.d.ts",
			"typescript/lib/lib.es2015.proxy.d.ts",
			"typescript/lib/lib.es2015.reflect.d.ts",
			"typescript/lib/lib.es2015.symbol.d.ts",
			"typescript/lib/lib.es2015.symbol.wellknown.d.ts",
			"typescript/lib/lib.es2016.array.include.d.ts",
			"typescript/lib/lib.es2016.d.ts",
			"typescript/lib/lib.es2016.full.d.ts",
			"typescript/lib/lib.es2017.d.ts",
			"typescript/lib/lib.es2017.full.d.ts",
			"typescript/lib/lib.es2017.intl.d.ts",
			"typescript/lib/lib.es2017.object.d.ts",
			"typescript/lib/lib.es2017.sharedmemory.d.ts",
			"typescript/lib/lib.es2017.string.d.ts",
			"typescript/lib/lib.es2017.typedarrays.d.ts",
			"typescript/lib/lib.es2018.asyncgenerator.d.ts",
			"typescript/lib/lib.es2018.asynciterable.d.ts",
			"typescript/lib/lib.es2018.d.ts",
			"typescript/lib/lib.es2018.full.d.ts",
			"typescript/lib/lib.es2018.intl.d.ts",
			"typescript/lib/lib.es2018.promise.d.ts",
			"typescript/lib/lib.es2018.regexp.d.ts",
			"typescript/lib/lib.es2019.array.d.ts",
			"typescript/lib/lib.es2019.d.ts",
			"typescript/lib/lib.es2019.full.d.ts",
			"typescript/lib/lib.es2019.object.d.ts",
			"typescript/lib/lib.es2019.string.d.ts",
			"typescript/lib/lib.es2019.symbol.d.ts",
			"typescript/lib/lib.es2020.bigint.d.ts",
			"typescript/lib/lib.es2020.d.ts",
			"typescript/lib/lib.es2020.full.d.ts",
			"typescript/lib/lib.es2020.intl.d.ts",
			"typescript/lib/lib.es2020.promise.d.ts",
			"typescript/lib/lib.es2020.sharedmemory.d.ts",
			"typescript/lib/lib.es2020.string.d.ts",
			"typescript/lib/lib.es2020.symbol.wellknown.d.ts",
			"typescript/lib/lib.es5.d.ts",
			"typescript/lib/lib.es6.d.ts",
			"typescript/lib/lib.esnext.d.ts",
			"typescript/lib/lib.esnext.full.d.ts",
			"typescript/lib/lib.esnext.intl.d.ts",
			"typescript/lib/lib.esnext.promise.d.ts",
			"typescript/lib/lib.esnext.string.d.ts",
			"typescript/lib/lib.esnext.weakref.d.ts",
			"typescript/lib/lib.scripthost.d.ts",
			"typescript/lib/lib.webworker.d.ts",
			"typescript/lib/lib.webworker.importscripts.d.ts",
			"typescript/lib/lib.webworker.iterable.d.ts",
				
			/*=========================
			 * Velt modules
			 ==========================*/
				
			"globals.js",
			"velt/index.js",
			"velt/helpers.js",
			"velt/storage.js",
			"velt/convert.js",
			"velt/java.js",

			"velt/yaml.js",
			"velt/events.js",
			"velt/commands.js",
			"velt/grammar.js",
			"velt/internals.js",

			"velt/setup.js",

			"npm.js",
			
			"@types/velt/index.d.ts",
			"@types/velt/helpers.d.ts",
			"@types/velt/storage.d.ts",
			"@types/velt/convert.d.ts",

			"@types/node/globals.d.ts",
			
			/*==============================
			 * Node module dependencies
			 =============================*/

			"nearley.js",
			"js-yaml.js",
			"typescript/index.js",
			"table-polyfill.js",

			"base64-js.js",
			"base-64.js",
			"ieee754.js",
			"inherits.js",
			"is-arguments.js",
			"is-generator-function.js",
			"safe-buffer.js",
			//Readable Stream
			"readable-stream/errors.js",
			"readable-stream/readable.js",
			"readable-stream/lib/_stream_duplex.js",
			"readable-stream/lib/_stream_passthrough.js",
			"readable-stream/lib/_stream_readable.js",
			"readable-stream/lib/_stream_transform.js",
			"readable-stream/lib/_stream_writable.js",
			"readable-stream/lib/internal/streams/async_iterator.js",
			"readable-stream/lib/internal/streams/buffer_list.js",
			"readable-stream/lib/internal/streams/destroy.js",
			"readable-stream/lib/internal/streams/end-of-stream.js",
			"readable-stream/lib/internal/streams/from-browser.js",
			"readable-stream/lib/internal/streams/from.js",
			"readable-stream/lib/internal/streams/pipeline.js",
			"readable-stream/lib/internal/streams/state.js",
			"readable-stream/lib/internal/streams/stream-browser.js",
			"readable-stream/lib/internal/streams/stream.js",
			//Pako
			"pako/index.js",
			"pako/lib/deflate.js",
			"pako/lib/inflate.js",
			"pako/lib/zlib/adler32.js",
			"pako/lib/zlib/constants.js",
			"pako/lib/zlib/crc32.js",
			"pako/lib/zlib/deflate.js",
			"pako/lib/zlib/gzheader.js",
			"pako/lib/zlib/inffast.js",
			"pako/lib/zlib/inflate.js",
			"pako/lib/zlib/inftrees.js",
			"pako/lib/zlib/messages.js",
			"pako/lib/zlib/trees.js",
			"pako/lib/zlib/zstream.js",
			"pako/lib/utils/common.js",
			"pako/lib/utils/strings.js",
			
			"browserify-zlib/index.js",
			"browserify-zlib/src/index.js",
			"browserify-zlib/src/binding.js",
			
			/*===========================
			   Node module replacements
			=============================*/
			
			"core/assert.js",
			"core/buffer.js",
			"core/console.js",
			"core/domain.js",
			"core/events.js",
			"core/fs.js",
			"core/http.js",
			"core/https.js",
			"core/os.js",
			"core/path.js",
			"core/process.js",
			"core/punycode.js",
			"core/querystring.js",
			"core/stream.js",
			"core/string_decoder.js",
			"core/timers.js",
			"core/tty.js",
			"core/url.js",
			"core/util.js",
			"core/zlib.js"

		};
		
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
		
		List<String> classpath = new ArrayList<String>();

		new BukkitRunnable() {
			@Override
			public void run() {
				load();
			}
		}.runTaskLater(this, 1);
		
		loadBStats();
	}
	public void reload(AnonymousCallback<Throwable> callback) {
		Velt velt = this;
		new BukkitRunnable() {
			@Override
			public void run() {
				try {
					velt.stop();
				} catch (NoSuchMethodException | SecurityException | IllegalAccessException | IllegalArgumentException
						| InvocationTargetException | NoSuchFieldException e) {
					// TODO Auto-generated catch block
					callback.handle(e);
					return;
				}
				new BukkitRunnable() {
					@Override
					public void run() {
						try {
							context = null;
							velt.load();
						} catch (Throwable e) {
							callback.handle(e);
							return;
						}
						callback.handle(null);
					}
				}.runTaskLater(velt, 2);
			}
		}.runTaskLater(this, 3);
	}
	public void stop() throws NoSuchMethodException, SecurityException, IllegalAccessException, IllegalArgumentException, InvocationTargetException, NoSuchFieldException {
		Events.getInstance().clearConsumers();
		for (VeltCommand command : Utils.commands) {
			command.unregister(Utils.getCommandMap());
		}
		Map<String, Command> knownCommands = Utils.getKnownCommands();
		for (Iterator<Command> i = knownCommands.values().iterator(); i.hasNext(); ) {
			Command cmd = i.next();
			if (cmd instanceof VeltCommand) {
				i.remove();
			}
		}
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
		try {
			context.eval(fromString("throw new Error()", "<error>"));
		} catch (Exception e) {}
		Context current = context;
		new BukkitRunnable() {
			@Override
			public void run() {
				current.close(false);
				current.leave();
			}
		}.runTaskLater(this, 3);
	}
	public void loadOnce() {
		context = ContextCreation.createContext();
	}
	public void load() {
		Utils.runInPluginContext(() -> {
			if (context == null) {
				loadOnce();
			}
			context.getBindings("js").putMember("__context", context);
			String loaderPath = String.join(File.separator, dataFolder.getAbsolutePath(), "node_modules", "velt-loader", "index.js")
					.trim();
			loaderPath = Utils.escape(loaderPath);
			context.eval(fromString("load('" + loaderPath + "')", "velt-loader.js"));
			log.info("Loading scripts");
			context.eval(fromString("require('globals')", "globals.js"));
			context.eval(fromString("require('velt/setup')", "globals.js"));
			for (File file : scriptsFolder.listFiles()) {
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
				log.info(String.format("Loading script: %s", file.getName()));
				String absPath = Utils.escape(file.getAbsolutePath().trim());
				context.eval(fromString("require('" + absPath + "')", "<Loading>"));
			}
		});
	}
	public static Source fromString(String string, String path) {
		return Source.newBuilder("js", string, path).buildLiteral();
	}
}
