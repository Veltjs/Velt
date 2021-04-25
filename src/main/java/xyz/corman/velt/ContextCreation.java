package xyz.corman.velt;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Engine;
import org.graalvm.polyglot.EnvironmentAccess;
import org.graalvm.polyglot.HostAccess;

public class ContextCreation {
	private Engine engine;
	private HostAccess hostAccess;

	public ContextCreation() {
		hostAccess = HostAccess.newBuilder(HostAccess.ALL)
				.targetTypeMapping(Double.class, Float.class, null, x -> x.floatValue())
				.build();
	}

	public Engine getEngine() {
		if (engine == null) {
			engine = Engine.create();
		}
		return engine;
	}

	public void graalJSRequire(String moduleFolder, Map<String, String> options) {
		// Enable CommonJS experimental support.
		//options.put("js.commonjs-require", "true");
		// (optional) folder where the Npm modules to be loaded are located.
		//options.put("js.commonjs-require-cwd", moduleFolder);
		// (optional) initialization script to pre-define globals.
		//options.put("js.commonjs-global-properties", "globals");
		// (optional) Java jars as a comma separated list.
		//options.put("jvm.classpath", classpath.stream().collect(Collectors.joining(",")));
		// (optional) Node.js built-in replacements as a comma separated list.
		/*options.put(
			"js.commonjs-core-modules-replacements",
			"timers:core/intervals,fs:core/filesystem,events:core/emitter,path:core/paths,domain:core/domains,os:core/osmod,punycode:core/punycodes,"
			+ "tty:core/ttymod,assert:core/assertions,buffer:core/buffers,util:core/utils,querystring:core/querystrings,"
			+ "string_decoder:core/string_decode,url:core/urls,console:core/consolemod,http:core/httpmod,https:core/httpsmod,"
			+ "stream:core/streams,zlib:browserify-zlib,process:core/process"
		);*/
		/*options.put(
			"js.commonjs-core-modules-replacements",
			"timers:lib/timers,fs:lib/fs,events:lib/events,path:lib/path,domain:lib/domain,os:lib/os,punycode:lib/punycode,tty:lib/tty,assert:lib/assert," +
			"buffer:lib/buffer,util:lib/util,querystring:lib/querystring,string_decoder:lib/string_decoder,url:lib/url,console:lib/console,http:lib/http," +
			"https:lib/https,stream:lib/stream,zlib:lib/zlib,process:lib/process"
		);*/
	}
	public Context createSecureContext(Map<String, String> options) {
		Context context = Context.newBuilder("js")
				.allowExperimentalOptions(false)
				.allowIO(false)
				.allowCreateProcess(false)
				.allowCreateThread(false)
				.allowHostClassLookup(c -> {
					return false;
				})
				.allowNativeAccess(false)
				.allowEnvironmentAccess(EnvironmentAccess.NONE)
				.engine(getEngine())
				.options(options)
				.build();
		return context;
	}
	public Context createContext(Map<String, String> options) {
		Context context = Context.newBuilder("js")
                .allowExperimentalOptions(true)
                .allowIO(true)
                .allowHostAccess(hostAccess)
                .allowHostClassLookup(c -> true)
                .allowNativeAccess(true)
                .allowCreateThread(true)
                .allowCreateProcess(true)
                .options(options)
				.engine(getEngine())
                .build();
		return context;
	}
	public Context createContext() {
		return createContext(new HashMap<String, String>());
	}
	public Context createContext(String moduleFolder, List<String> classpath) {
		Map<String, String> options = new HashMap<String, String>();
		graalJSRequire(moduleFolder, options);
		return createContext(options);
	}
}