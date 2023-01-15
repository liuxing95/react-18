import { FiberNode } from './fiber';
import internals from 'shared/internals';
import { Dispatcher, Dispatch } from 'react/src/currentDispatcher';
import {
	createUpdateQueue,
	UpdateQueue,
	createUpdate,
	enqueueUpdate,
	processUpdateQueue
} from './updateQueue';
import { requestUpdateLane, Lane, NoLane } from './fiberLanes';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';
import { Flags, PassiveEffect } from './fiberFlags';
import { Passive, HookHasEffect } from './hookEffectTags';

let currentlyRenderingFiber: FiberNode | null = null;
let currentHook: Hook | null = null;
let workInProgressHook: Hook | null = null;
let renderLanes: Lane = NoLane;

interface Hook {
	memoizedState: any;
	// 对于state，保存update相关数据
	updateQueue: unknown;
	// 指向下一个hook
	next: Hook | null;
}

export interface Effect {
	tags: Flags;
	create: EffectCallback | void;
	destroy: EffectCallback | void;
	deps: EffectDeps;
	// 环状链表
	next: Effect | null;
}

export interface FCUpdateQueue<State> extends UpdateQueue<State> {
	lastEffect: Effect | null;
}

type EffectCallback = () => void;
type EffectDeps = any[] | null;

const { currentDispatcher } = internals;
export const renderWithHooks = (wip: FiberNode, lane: Lane) => {
	currentlyRenderingFiber = wip;
	wip.memorizedState = null;
	renderLanes = lane;

	const current = wip.alternate;
	if (current !== null) {
		// update
		currentDispatcher.current = HookDispatcherOnUpdate;
	} else {
		// mount
		currentDispatcher.current = HookDispatcherOnMount;
	}
	// 赋值操作
	const Component = wip.type;
	const props = wip.memorizedProps;
	const children = Component(props);

	// 重置操作
	currentlyRenderingFiber = null;
	workInProgressHook = null;
	currentHook = null;
	renderLanes = NoLane;
	return children;
};

const mountWorkInProgressHook = (): Hook => {
	const hook: Hook = {
		memoizedState: null,
		updateQueue: null,
		next: null
	};
	if (workInProgressHook === null) {
		// mount时 第一个hook
		if (currentlyRenderingFiber === null) {
			if (__DEV__) {
				console.error('mountWorkInprogressHook时currentlyRenderingFiber未定义');
			}
		} else {
			currentlyRenderingFiber.memorizedState = workInProgressHook = hook;
		}
	} else {
		workInProgressHook = workInProgressHook.next = hook;
	}
	return workInProgressHook as Hook;
};

const updateWorkInProgressHook = (): Hook => {
	// 情况1:交互触发的更新，此时wipHook还不存在，复用 currentHook链表中对应的 hook 克隆 wipHook
	// 情况2:render阶段触发的更新，wipHook已经存在，使用wipHook
	let nextCurrentHook: Hook | null;

	if (currentHook === null) {
		// 情况1 当前组件的第一个hook
		const current = (currentlyRenderingFiber as FiberNode).alternate;
		if (current !== null) {
			nextCurrentHook = current.memorizedState;
		} else {
			// mount 阶段
			nextCurrentHook = null;
		}
	} else {
		// 这个 fc update 时后续的hook
		nextCurrentHook = currentHook.next;
	}
	// 针对情况1 nextCurrentHook保存了可供克隆的hook数据
	if (nextCurrentHook === null) {
		// 本次render当前组件执行的hook比之前多，举个例子：
		// 之前：hook1 -> hook2 -> hook3
		// 本次：hook1 -> hook2 -> hook3 -> hook4
		// 那到了hook4，nextCurrentHook就为null
		console.error(`组件${currentlyRenderingFiber?.type}本次执行的hook比上次多`);
	}

	currentHook = nextCurrentHook;
	const newHook: Hook = {
		memoizedState: currentHook?.memoizedState,
		updateQueue: currentHook?.updateQueue,
		next: null
	};

	if (workInProgressHook === null) {
		// mount时 第一个hook
		if (currentlyRenderingFiber === null) {
			if (__DEV__) {
				console.error('mountWorkInprogressHook时currentlyRenderingFiber未定义');
			}
		} else {
			currentlyRenderingFiber.memorizedState = workInProgressHook = newHook;
		}
	} else {
		workInProgressHook = workInProgressHook.next = newHook;
	}

	return workInProgressHook as Hook;
};

const dispatchSetState = <State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) => {
	const lane = requestUpdateLane();
	const update = createUpdate(action, lane);
	enqueueUpdate(updateQueue, update);
	scheduleUpdateOnFiber(fiber, lane);
};

const mountState = <State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] => {
	// 找到当前 useState 对应的hook数据
	const hook = mountWorkInProgressHook();
	let memoizedState: State;
	if (initialState instanceof Function) {
		memoizedState = initialState();
	} else {
		memoizedState = initialState;
	}
	hook.memoizedState = memoizedState;
	const queue = createUpdateQueue<State>();
	hook.updateQueue = queue;
	// @ts-ignore
	const dispatch = (queue.dispatch = dispatchSetState.bind(
		null,
		currentlyRenderingFiber,
		queue
	));
	return [memoizedState, dispatch];
};
function createFCUpdateQueue<State>() {
	const updateQueue = createUpdateQueue<State>() as FCUpdateQueue<State>;
	updateQueue.lastEffect = null;
	return updateQueue;
}

// 将所有effectHook连接形成链表，并且保证每次commit updateQueue.lastEffect链表的顺序都不会变
function pushEffect(
	hookFlags: Flags,
	create: EffectCallback | void,
	destroy: EffectCallback | void,
	deps: EffectDeps
) {
	const effect: Effect = {
		tags: hookFlags,
		create,
		destroy,
		deps,
		next: null
	};
	const fiber = currentlyRenderingFiber as FiberNode;
	const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;
	if (updateQueue === null) {
		const updateQueue = createFCUpdateQueue();
		fiber.updateQueue = updateQueue;
		// 与自己形成环
		updateQueue.lastEffect = effect.next = effect;
	} else {
		// append 操作
		const lastEffect = updateQueue.lastEffect;
		if (lastEffect === null) {
			updateQueue.lastEffect = effect.next = effect;
		} else {
			const firstEffect = lastEffect.next;
			lastEffect.next = effect;
			effect.next = firstEffect;
			updateQueue.lastEffect = effect;
		}
	}
	return effect;
}

const mountEffect = (
	create: EffectCallback | void,
	deps: EffectDeps | void
) => {
	// 找到当前 对应的hook数据
	const hook = mountWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	// 注意区分PassiveEffect与Passive，PassiveEffect是针对fiber.flags
	// Passive是effect类型，代表useEffect。类似的，Layout代表useLayoutEffect
	(currentlyRenderingFiber as FiberNode).flags |= PassiveEffect;

	hook.memoizedState = pushEffect(
		Passive | HookHasEffect,
		create,
		undefined,
		nextDeps
	);
};

const updateState = <State>(): [State, Dispatch<State>] => {
	// 找到当前 useState 对应的hook数据
	const hook = updateWorkInProgressHook();

	// 计算新的 state的逻辑
	const queue = hook.updateQueue as UpdateQueue<State>;
	const pending = queue.shared.pending;
	queue.shared.pending = null;

	if (pending !== null) {
		const { memorizedState } = processUpdateQueue(
			hook.memoizedState,
			pending,
			renderLanes
		);
		hook.memoizedState = memorizedState;
	}

	return [hook.memoizedState, queue.dispatch as Dispatch<State>];
};

const updateEffect = (
	create: EffectCallback | void,
	deps: EffectDeps | void
) => {
	// TODO:
};

const HookDispatcherOnMount: Dispatcher = {
	useState: mountState,
	useEffect: mountEffect
};

const HookDispatcherOnUpdate: Dispatcher = {
	useState: updateState,
	useEffect: updateEffect
};
