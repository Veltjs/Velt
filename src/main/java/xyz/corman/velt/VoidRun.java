package xyz.corman.velt;

public class VoidRun {
    private VoidCallable callback;
    public VoidRun(VoidCallable callback) {
        this.callback = callback;
    }

    public void execute(Object... args) {
        callback.execute(args);
    }
}