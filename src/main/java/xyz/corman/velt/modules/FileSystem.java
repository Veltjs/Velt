package xyz.corman.velt.modules;

import java.io.*;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.util.function.BiConsumer;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import java.nio.file.Paths;

import org.bukkit.Bukkit;
import org.bukkit.plugin.Plugin;
import org.bukkit.scheduler.BukkitRunnable;

public class FileSystem {
	Plugin plugin;
	
	private static FileSystem instance;
	
	public FileSystem(Plugin plugin) {
		this.plugin = plugin;
	}
	
	public static void setInstance(FileSystem inst) {
		instance = inst;
	}
	
	public static FileSystem getInstance() {
		return instance;
	}
	
	public static OutputStream createWriteStream(String name) throws FileNotFoundException {
		File file = new File(name);
		OutputStream stream = new FileOutputStream(file);
		return stream;
	}
	
	public static InputStream createReadStream(String name) throws FileNotFoundException {
	    File file = new File(name);
	    InputStream stream = new FileInputStream(file);
	    return stream;
	}
	public static void writeToFile(String name, String content, boolean append) throws IOException {
		createFileSync(name);
		BufferedWriter writer = new BufferedWriter(new FileWriter(name, append));
		writer.write(content);
		writer.close();
	}

	public static String readFileSync(String path) throws IOException {
		return new String(Files.readAllBytes(Paths.get(path)));
	}
	public static void createFileSync(String name) throws IOException {
		File file = new File(name);
		if (!file.isFile()) file.createNewFile();
	}
	public static void appendFileSync(String name, String content) throws IOException {
		writeToFile(name, content, true);
	}
	public static void writeFileSync(String name, String content) throws IOException {
		writeToFile(name, content, false);
	}
	public static void unlinkSync(String name) {
		new File(name).delete();
	}
	public static void renameSync(String name, String newname) {
		new File(name).renameTo(new File(newname));
	}
	
	public static void readFileThreaded(String name, BiConsumer<String, Exception> consumer) {
		new Thread() {
			public void run() {
				try {
					consumer.accept(readFileSync(name), null);
				} catch (Exception e) {
					consumer.accept(null, e);
				}
			}
		}.start();
	}
	public static void appendFileThreaded(String name, String content, Consumer<Exception> consumer) {
		new Thread() {
			public void run() {
				try {
					appendFileSync(name, content);
					consumer.accept(null);
				} catch (Exception e) {
					consumer.accept(e);
				}
			}
		}.start();
	}
	public static void writeFileThreaded(String name, String content, Consumer<Exception> consumer) {
		new Thread() {
			public void run() {
				try {
					writeFileSync(name, content);
					consumer.accept(null);
				} catch (Exception e) {
					consumer.accept(e);
				}
			}
		}.start();
	}
	public static void unlinkThreaded(String name, Consumer<Exception> consumer) {
		new Thread() {
			public void run() {
				try {
					unlinkSync(name);
					consumer.accept(null);
				} catch (Exception e) {
					consumer.accept(e);
				}
			}
		}.start();
	}
	public static void renameThreaded(String name, String newname, Consumer<Exception> consumer) {
		new Thread() {
			public void run() {
				try {
					renameSync(name, newname);
					consumer.accept(null);
				} catch (Exception e) {
					consumer.accept(e);
				}
			}
		}.start();
	}
	
	public void readFile(String name, BiConsumer<String, Exception> consumer) {
		readFileThreaded(name, (text, error) -> {
			Bukkit.getScheduler().scheduleSyncDelayedTask(plugin, () -> consumer.accept(text, error));
		});
	}
	
	public void appendFile(String name, String content, Consumer<Exception> consumer) {
		appendFileThreaded(name, content, error -> {
			Bukkit.getScheduler().scheduleSyncDelayedTask(plugin, () -> consumer.accept(error));
		});
	}
	
	public void writeFile(String name, String content, Consumer<Exception> consumer) {
		writeFileThreaded(name, content, error -> {
			Bukkit.getScheduler().scheduleSyncDelayedTask(plugin, () -> consumer.accept(error));
		});
	}
	
	public void unlink(String name, Consumer<Exception> consumer) {
		unlinkThreaded(name, error -> {
			Bukkit.getScheduler().scheduleSyncDelayedTask(plugin, () -> consumer.accept(error));
		});
	}
	
	public void rename(String name, String newname, Consumer<Exception> consumer) {
		renameThreaded(name, newname, error -> {
			Bukkit.getScheduler().scheduleSyncDelayedTask(plugin, () -> consumer.accept(error));
		});
	}
}

