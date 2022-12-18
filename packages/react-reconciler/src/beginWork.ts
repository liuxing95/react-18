// 递归中的递阶段
import { FiberNode } from './fiber';
import { HostComponent, HostText, HostRoot } from './workTag';
import { UpdateQueue, processUpdateQueue } from './updateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import { reconcileChildFibers, mountChildFibers } from './childFiber';
export const beginWork = (wip: FiberNode) => {
	// 比较 返回 子 fiberNode
	switch (wip.tag) {
		case HostRoot:
			return updateHostRoot(wip);
		case HostComponent:
			return updateHostComponent(wip);
		case HostText:
			return null;
		default:
			if (__DEV__) {
				console.warn('beginWork 未能实现的类型');
			}
			return null;
	}
};

const updateHostRoot = (wip: FiberNode) => {
	const baseState = wip.memorizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	const { memorizedState } = processUpdateQueue(baseState, pending);
	wip.memorizedState = memorizedState;

	const nextChildren = wip.memorizedState;
	reconcileChildren(wip, nextChildren);
	return wip.child;
};

const updateHostComponent = (wip: FiberNode) => {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.chilren;
	reconcileChildren(wip, nextChildren);
	return wip.child;
};

const reconcileChildren = (wip: FiberNode, children?: ReactElementType) => {
	const current = wip.alternate;

	if (current !== null) {
		// update
		wip.child = reconcileChildFibers(wip, current?.child, children);
	} else {
		// mount
		wip.child = mountChildFibers(wip, null, children);
	}
};
