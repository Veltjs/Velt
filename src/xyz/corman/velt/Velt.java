package xyz.corman.velt;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang.StringEscapeUtils;
import org.bukkit.event.Listener;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitRunnable;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Source;

import xyz.corman.velt.modules.FileSystem;

//import org.bstats.bukkit.Metrics;
//import org.bstats.charts.CustomChart;
//import org.bstats.charts.SimplePie;

public class Velt extends JavaPlugin implements Listener {
	private static Velt instance;
	
	File dataFolder;
	File scriptsFolder;
	File modulesFolder;
	String[] extensions = new String[] {
		".js",
		".ts",
		".mjs",
		".mts",
		".jsx",
		".tsx"
	};
	
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
        metrics.addCustomChart(new Metrics.SimplePie("Script Count", () -> String.format("%s", scriptsFolder.listFiles().length)));
        metrics.addCustomChart(new Metrics.SimplePie("Version", () -> this.getDescription().getVersion()));
	}
	public void onEnable() {
		instance = this;
		dataFolder = getDataFolder();
		scriptsFolder = new File(
			Paths.get(dataFolder.getAbsolutePath(), "scripts").toString()
		);
		modulesFolder = new File(
			Paths.get(dataFolder.getAbsolutePath(), "node_modules").toString()
		);
		if (!dataFolder.exists()) dataFolder.mkdir();
		if (!scriptsFolder.exists()) scriptsFolder.mkdir();
		if (!modulesFolder.exists()) modulesFolder.mkdir();
		
		String[] files = {
			/*=========================
			 * MODULE LOADERS
			 ==========================*/	
			
			"jvm-npm/src/main/javascript/jvm-npm.js",
			"velt-loader/index.js",
				
			/*=========================
			 * Velt modules
			 ==========================*/
				
			"globals.js",
			"velt.js",
			"velt-helpers.js",
			"velt-storage.js",
			"npm.js",
			
			/*==============================
			 * Node module dependencies
			 =============================*/
			
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
			"core/paths.js",
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
			public void run() {
				Utils.runInPluginContext(() -> {
					for (File file : scriptsFolder.listFiles()) {
						String fileName = file.getPath();
						boolean hasExtension = false;
						for (String extension : extensions) {
							if (fileName.endsWith(extension)) {
								hasExtension = true;
								break;
							}
						}
						if (!hasExtension) {
							continue;
						}
						Context context = ContextCreation.createContext();
						String path = file.getAbsolutePath();
						String loaderPath = String.join(File.separator, dataFolder.getAbsolutePath(), "node_modules", "velt-loader", "index.js")
							.trim();
						loaderPath = Utils.escape(loaderPath);
						System.out.println("Preparing run.");
						context.eval(fromString("load('" + loaderPath + "')", "velt-loader.js"));
						context.eval(fromString("require('globals')", "globals.js"));
						String absPath = Utils.escape(file.getAbsolutePath().trim());
						context.eval(fromString("require('" + absPath + "')", path));
					}
				});
			}
		}.runTaskLater(this, 0);
		
		loadBStats();
	}
	public static Source fromString(String string, String path) {
		return Source.newBuilder("js", string, path).buildLiteral();
	}
}
