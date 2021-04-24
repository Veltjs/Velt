package xyz.corman.velt;
import com.sun.org.apache.bcel.internal.generic.JSR;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Value;

import java.io.File;

public class JSRuntime {
    Context context;
    private boolean provideGlobals;
    private String modulesFolder;

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

    public JSRuntime() {}

    public Value require(String module) {
        return this.eval(String.format("require('%s')", Utils.escape(module)), "Velt Runtime");
    }

    public JSRuntime init() {
        context = ContextCreation.createContext();
        context.getBindings("js").putMember("__context", context);
        context.getBindings("js").putMember("__runtime", this);
        String loaderPath = String.join(File.separator, modulesFolder, "velt-loader", "index.js").trim();
        loaderPath = Utils.escape(loaderPath);
        context.eval(Utils.fromString("load('" + loaderPath + "')", "velt-loader.js"));
        require("globals");
        return this;
    }

    public JSRuntime stop() {
        try {
            context.eval(Utils.fromString("throw new Error()", "<error>"));
        } catch (Exception e) {}
        context.close(false);
        context.leave();
        return this;
    }
}
