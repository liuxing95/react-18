declare module 'scheduler' {
	export type FrameCallbackType = (
		didTimeout: boolean
	) => FrameCallbackType | void;
	export interface CallbackNode {
		callback: FrameCallbackType;
		priorityLevel: number;
		expirationTime: number;
		next: CallbackNode | null;
		prev: CallbackNode | null;
	}
	export function unstable_scheduleCallback(
		priorityLevel: number,
		callback: FrameCallbackType,
		options?: { delay?: number | undefined; timeout?: number | undefined }
	): CallbackNode;

	export const unstable_NormalPriority = 3;
}
