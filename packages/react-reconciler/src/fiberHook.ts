import { FiberNode } from './fiber';
export const renderWithHooks = (wip: FiberNode) => {
	const Component = wip.type;
	const props = wip.memorizedProps;
	const children = Component(props);
	return children;
};
