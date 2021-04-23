package xyz.corman.velt;
import com.sun.org.apache.bcel.internal.generic.JSR;
import org.graalvm.polyglot.Context;

import java.io.File;

public class JSRuntime {
    Context context;
    private boolean provideGlobals;
    private String modulesFolder;
    private String scriptsFolder;

    public String getScriptsFolder() {
        return scriptsFolder;
    }
    public void setScriptsFolder(String scriptsFolder) {
        this.scriptsFolder = scriptsFolder;
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

    public JSRuntime() {
        context = ContextCreation.createContext();
    }

    public void require(String module) {
        context.eval(Utils.fromString(String.format("require('%s')", module), "Velt Runtime"));
    }

    public JSRuntime init() {
        context.getBindings("js").putMember("__context", context);
        String loaderPath = String.join(File.separator, modulesFolder, "velt-loader", "index.js").trim();
        loaderPath = Utils.escape(loaderPath);
        context.eval(Utils.fromString("load('" + loaderPath + "')", "velt-loader.js"));
        require("globals");
        return this;
    }
}
