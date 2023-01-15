import { FiberNode } from 'react-reconciler/src/fiber';
import { HostText } from 'react-reconciler/src/workTag';
import { updateFiberProps } from './SyntheticEvent';
import { Props } from 'shared/ReactTypes';

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

// export const createInstance = (type: string, props: any): Instance => {
export const createInstance = (type: string, props: Props): Instance => {
	// TODO 处理props
	const element = document.createElement(type);
	updateFiberProps(element, props);
	return element;
};

export const appendInitialChild = (
	parent: Instance | Container,
	child: Instance
) => {
	parent.appendChild(child);
};

export const createTextInstance = (content: string) => {
	return document.createTextNode(content);
};

export function commitUpdate(finishedWork: FiberNode) {
	switch (finishedWork.tag) {
		case HostText:
			const newContent = finishedWork.pendingProps.content;
			return commitTextUpdate(finishedWork.stateNode, newContent);
	}
	console.error('commitUpdate未支持的类型', finishedWork);
}

export const commitTextUpdate = (
	textIntance: TextInstance,
	content: string
) => {
	textIntance.nodeValue = content;
};

export const insertChildToContainer = (
	child: Instance,
	container: Container,
	before: Instance
) => {
	container.insertBefore(child, before);
};

export const removeChild = (child: Instance, container: Container) => {
	container.removeChild(child);
};

export const appendChildToContainer = appendInitialChild;

export const scheduleMicrotask =
	typeof queueMicrotask === 'function'
		? queueMicrotask
		: typeof Promise === 'function'
		? (callback: () => void) => Promise.resolve(null).then(callback)
		: setTimeout;
