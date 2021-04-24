package xyz.corman.velt;

import java.util.ArrayList;

public class VeltRuntime extends JSRuntime {
    private ArrayList<String> scripts;
    public VeltRuntime() {
        super();
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
            super.require(script);
        }
        return this;
    }

    public VeltRuntime stop() {
        super.stop();
        return this;
    }
}
