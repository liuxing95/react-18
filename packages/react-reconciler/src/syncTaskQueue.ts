let syncQueue: ((...args: any) => void)[] | null = null;
let isFlushingSyncQueue = false;
/**
 * 调度任务
 * @param callback
 */
export function scheduleSyncCallback(callback: (...args: any) => void) {
	if (!syncQueue) {
		syncQueue = [callback];
	} else {
		syncQueue.push(callback);
	}
}

/**
 * 执行任务
 */
export function flushSyncCallbacks() {
	if (!isFlushingSyncQueue && syncQueue) {
		isFlushingSyncQueue = true;
		try {
			syncQueue.forEach((callback) => callback());
			syncQueue = null;
		} catch (e) {
			console.error('TODO flushSyncCallbacks报错', e);
		} finally {
			isFlushingSyncQueue = false;
			syncQueue = null;
		}
	}
}
