// 递归中的递阶段
import { FiberNode } from './fiber';
import {
	HostComponent,
	HostText,
	HostRoot,
	FunctionComponent
} from './workTag';
import { UpdateQueue, processUpdateQueue } from './updateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import { reconcileChildFibers, mountChildFibers } from './childFiber';
import { renderWithHooks } from './fiberHook';
import { Fragment } from './workTag';
import { Lane } from './fiberLanes';
export const beginWork = (wip: FiberNode, renderLane: Lane) => {
	// 比较 返回 子 fiberNode
	switch (wip.tag) {
		case HostRoot:
			return updateHostRoot(wip, renderLane);
		case HostComponent:
			return updateHostComponent(wip);
		case HostText:
			return null;
		case FunctionComponent:
			return updateFunctionComponent(wip, renderLane);
		case Fragment:
			return updateFragmentComponent(wip);
		default:
			if (__DEV__) {
				console.warn('beginWork 未能实现的类型');
			}
			return null;
	}
};

const updateHostRoot = (wip: FiberNode, renderLane: Lane) => {
	const baseState = wip.memorizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	const { memorizedState } = processUpdateQueue(baseState, pending, renderLane);
	wip.memorizedState = memorizedState;

	const nextChildren = wip.memorizedState;
	reconcileChildren(wip, nextChildren);
	return wip.child;
};

const updateHostComponent = (wip: FiberNode) => {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
};

const updateFragmentComponent = (wip: FiberNode) => {
	const nextChildren = wip.pendingProps;
	reconcileChildren(wip, nextChildren);
	return wip.child;
};

const updateFunctionComponent = (wip: FiberNode, renderLane: Lane) => {
	const nextProps = wip.pendingProps;
	const nextChildren = renderWithHooks(wip, renderLane);

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
