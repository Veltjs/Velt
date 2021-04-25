package xyz.corman.velt;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Value;

import java.io.File;

public class JSRuntime {
    ContextCreation contextCreation;
    Context context;
    private boolean provideGlobals;
    private Value bindings;
    private String modulesFolder;

    public Value getBindings() {
        if (bindings == null) {
            bindings = context.getBindings("js");
        }
        return bindings;
    }

    public boolean getProvideGlobals() {
        return provideGlobals;
    }
    public JSRuntime setProvideGlobals(boolean provideGlobals) {
        this.provideGlobals = provideGlobals;
        return this;
    }

    public String getModulesFolder() {
        return modulesFolder;
    }
    public JSRuntime setModulesFolder(String modulesFolder) {
        this.modulesFolder = modulesFolder;
        return this;
    }

    public Value eval(String text, String path) {
        return context.eval(Utils.fromString(text, path));
    }

    public JSRuntime(ContextCreation creator) {
        contextCreation = creator;
    }

    public Value require(String module) {
        return this.eval(String.format("require('%s')", Utils.escape(module)), "Velt Runtime");
    }

    public JSRuntime put(String identifier, Object value) {
        getBindings().putMember(identifier, value);
        return this;
    }

    public JSRuntime init() {
        context = contextCreation.createContext();
        if (this.getProvideGlobals()) {
            this
                .put("__context", context)
                .put("__runtime", this);
        }
        String loaderPath = String.join(File.separator, modulesFolder, "velt-loader", "index.js").trim();
        loaderPath = Utils.escape(loaderPath);
        context.eval(Utils.fromString("load('" + loaderPath + "')", "velt-loader.js"));
        require("globals");
        return this;
    }

    public JSRuntime stop() {
        JSRuntime.stop(context);
        return this;
    }

    public static void stop(Context context) {
        try {
            context.eval(Utils.fromString("throw new Error()", "<error>"));
        } catch (Exception e) {}
        context.close(false);
        context.leave();
    }
}
