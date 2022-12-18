import { FiberNode } from './fiber';
import internals from 'shared/internals';
import { Dispatcher, Dispatch } from 'react/src/currentDispatcher';
import {
	createUpdateQueue,
	UpdateQueue,
	createUpdate,
	enqueueUpdate
} from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

let currentlyRenderingFiber: FiberNode | null = null;
const currentHook: Hook | null = null;
let workInProgressHook: Hook | null = null;

interface Hook {
	memoizedState: any;
	// 对于state，保存update相关数据
	updateQueue: unknown;
	// 指向下一个hook
	next: Hook | null;
}

const { currentDispatcher } = internals;
export const renderWithHooks = (wip: FiberNode) => {
	currentlyRenderingFiber = wip;
	wip.memorizedState = null;

	const current = wip.alternate;
	if (current !== null) {
		// update
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

const dispatchSetState = <State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) => {
	const update = createUpdate(action);
	enqueueUpdate(updateQueue, update);
	scheduleUpdateOnFiber(fiber);
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

const HookDispatcherOnMount: Dispatcher = {
	useState: mountState
};
