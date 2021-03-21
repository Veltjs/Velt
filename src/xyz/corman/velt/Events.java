package xyz.corman.velt;

import org.bukkit.event.Listener;
import org.bukkit.event.EventException;
import org.bukkit.Bukkit;
import org.bukkit.event.Event;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.plugin.EventExecutor;
import org.bukkit.plugin.RegisteredListener;
import org.bukkit.scheduler.BukkitRunnable;
import org.graalvm.polyglot.Context;

import io.github.classgraph.ClassGraph;
import io.github.classgraph.ClassInfo;
import io.github.classgraph.ClassInfoList;

import org.bukkit.plugin.Plugin;

import java.util.Arrays;
import java.util.List;
import java.util.function.Consumer;
import java.util.ArrayList;
import java.lang.IllegalStateException;

public class Events {
	private static Events instance;
	Plugin plugin;
	Listener listener;
	EventExecutor executor;
	RegisteredListener registeredListener;
	ArrayList<Consumer<Event>> consumers = new ArrayList<Consumer<Event>>();
	
	public static Events getInstance() {
		return instance;
	}
	static void setInstance(Events eventInstance) {
		instance = eventInstance;
	}
	
	@SuppressWarnings({ "unchecked" })
	public Events(Plugin plugin) {
		this.plugin = plugin;
		listener = new Listener() {};
		executor = new EventExecutor() {
			public void execute(Listener ignored, Event event) throws EventException {
				try {
					for (Consumer<Event> consumer : consumers) {
						consumer.accept(event);
					}
				} catch (IllegalStateException e) { 
					
				}
			}
		};
		
		registeredListener = new RegisteredListener(
			listener,
			executor,
			EventPriority.NORMAL,
			plugin,
			false
		);
		
    	ClassInfo eventsInfo = new ClassGraph()
    	        .enableClassInfo()
    	        .scan() //you should use try-catch-resources instead
    	        .getClassInfo(Event.class.getName());
    	
    	if (eventsInfo == null) {
        	for (HandlerList handlerlist : HandlerList.getHandlerLists()) {
        		handlerlist.register(registeredListener);
        	}
        	
        	new BukkitRunnable() {
        		public void run() {
        	    	for (HandlerList handlerlist : HandlerList.getHandlerLists()) {
        	    		if (!Arrays.asList(handlerlist.getRegisteredListeners()).contains(registeredListener)) {
        	    			handlerlist.register(registeredListener);
        	    		}
        	    	}    			
        		}
        	}.runTaskTimer(plugin, 0, 1);
    	} else {
	    	ClassInfoList events = eventsInfo
	    	        .getSubclasses()
	    	        .filter(info -> !info.isAbstract());
	    	
			try {
			    for (ClassInfo event : events) {
			        Class<? extends Event> eventClass = (Class<? extends Event>) Class.forName(event.getName());
			        
			        if (Arrays.stream(eventClass.getDeclaredMethods()).anyMatch(method ->
			                method.getParameterCount() == 0 && method.getName().equals("getHandlers"))) {
			            //We could do this further filtering on the ClassInfoList instance instead,
			            //but that would mean that we have to enable method info scanning.
			            //I believe the overhead of initializing ~20 more classes
			            //is better than that alternative.
			       
			            Bukkit.getPluginManager().registerEvent(eventClass, listener,
			                    EventPriority.NORMAL, executor, plugin);
			        }
			    }
			} catch (ClassNotFoundException e) {
			    throw new AssertionError("Scanned class wasn't found", e);
			}
    	}
	}
	
	public void listen(Consumer<Event> consumer) {
		consumers.add(consumer);
	}
	public void clearConsumers() {
		consumers.clear();
	}
}
