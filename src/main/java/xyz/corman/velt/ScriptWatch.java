package xyz.corman.velt;

import xyz.corman.velt.utils.FileAdapter;
import xyz.corman.velt.utils.FileEvent;
import xyz.corman.velt.utils.FileWatcher;

import java.io.File;

interface ScriptListener {
    void update(File file);
}

public class ScriptWatch {
    private ScriptWatch instance;
    private File folder;
    private FileWatcher watcher;

    public ScriptWatch getInstance() {
        return instance;
    }

    public void setInstance(ScriptWatch instance) {
        this.instance = instance;
    }

    public ScriptWatch(Velt velt, ScriptListener listener) {
        this(new File(velt.getScriptsFolder()), listener);
    }
    public ScriptWatch(File folder, ScriptListener listener) {
        this.setFolder(folder);
        watcher = new FileWatcher(folder).addListener(new FileAdapter() {
            @Override
            public void onCreated(FileEvent event) {
                listener.update(event.getFile());
            }

            @Override
            public void onDeleted(FileEvent event) {
                listener.update(event.getFile());
            }

            @Override
            public void onModified(FileEvent event) {
                listener.update(event.getFile());
            }
        });

    }

    public Thread watch() {
        return watcher.watch();
    }

    public File getFolder() {
        return folder;
    }
    public void setFolder(File folder) {
        this.folder = folder;
    }


}
