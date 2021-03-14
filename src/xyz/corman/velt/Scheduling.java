package xyz.corman.velt;

import java.util.Timer;
import java.util.TimerTask;

import java.util.concurrent.TimeUnit.*;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

public class Scheduling {
	private static Scheduling instance;
	
	private ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
	
	public static Scheduling getInstance() {
		return instance;
	}
	
	public static void setInstance(Scheduling inst) {
		instance = inst;
	}
	
	public ScheduledFuture<?> setTimeoutFuture(Runnable func, int delay) {
		return scheduler.schedule(
			() -> {
				func.run();
			}, (long) delay, TimeUnit.MILLISECONDS
		);
	}
}
