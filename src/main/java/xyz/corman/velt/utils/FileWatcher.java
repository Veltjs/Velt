package xyz.corman.velt.utils;

import static java.nio.file.StandardWatchEventKinds.*;
import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class FileWatcher implements Runnable {
    protected List<FileListener> listeners = new ArrayList<>();
    protected final File folder;
    protected static final List<WatchService> watchServices = new ArrayList<>();

    public FileWatcher(File folder) {
        this.folder = folder;
    }
    public Thread watch() {
        if (folder.exists()) {
            Thread thread = new Thread(this);
            thread.setDaemon(true);
            thread.start();
            return thread;
        }
        return null;
    }
    @Override
    public void run() {
        try (WatchService watchService = FileSystems.getDefault().newWatchService()) {
            Path path = Paths.get(folder.getAbsolutePath());
            Files.walkFileTree(path, new SimpleFileVisitor<Path>() {
                @Override
                public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
                    dir.register(watchService, ENTRY_CREATE, ENTRY_MODIFY, ENTRY_MODIFY);
                    return FileVisitResult.CONTINUE;
                }
            });
            watchServices.add(watchService);
            boolean poll = true;
            while (poll) {
                poll = pollEvents(watchService);
            }
        } catch (IOException | InterruptedException | ClosedWatchServiceException e) {
            Thread.currentThread().interrupt();
        }
    }

    protected boolean pollEvents(WatchService watchService) throws InterruptedException {
        WatchKey key = watchService.take();
        Path path = (Path) key.watchable();
        for (WatchEvent<?> event : key.pollEvents()) {
            notifyListeners(event.kind(), path.resolve((Path) event.context()).toFile());
        }
        return key.reset();
    }

    protected void notifyListeners(WatchEvent.Kind<?> kind, File file) {
        FileEvent event = new FileEvent(file);
        if (kind == ENTRY_CREATE) {
            for (FileListener listener : listeners) {
                listener.onCreated(event);
                if (file.isDirectory()) {
                    new FileWatcher(file).setListeners(listeners).watch();
                }
            }
        } else if (kind == ENTRY_MODIFY) {
            for (FileListener listener : listeners) {
                listener.onModified(event);
            }
        } else if (kind == ENTRY_DELETE) {
            for (FileListener listener : listeners) {
                listener.onDeleted(event);
            }
        }
    }

    public FileWatcher addListener(FileListener listener) {
        listeners.add(listener);
        return this;
    }

    public FileWatcher removeListener(FileListener listener) {
        listeners.remove(listener);
        return this;
    }

    public List<FileListener> getListeners() {
        return listeners;
    }

    public FileWatcher setListeners(List<FileListener> listeners) {
        this.listeners = listeners;
        return this;
    }

    public static List<WatchService> getWatchServices() {
        return Collections.unmodifiableList(watchServices);
    }
}