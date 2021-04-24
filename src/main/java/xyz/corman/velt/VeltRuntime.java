package xyz.corman.velt;

import java.util.ArrayList;

public class VeltRuntime extends JSRuntime {
    private ArrayList<String> scripts;
    private Velt velt;
    public VeltRuntime(Velt plugin) {
        super();
        velt = plugin;
        scripts = new ArrayList<>();
    }

    public VeltRuntime addScript(String script) {
        scripts.add(script);
        return this;
    }

    public VeltRuntime clearScripts() {
        scripts.clear();
        return this;
    }

    public VeltRuntime start() {
        for (String script : scripts) {
            velt.getLogger().info(String.format("Loading script: %s", script));
            super.require(script);
        }
        return this;
    }

    public VeltRuntime stop() {
        super.stop();
        return this;
    }
}
