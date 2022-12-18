// React
import { jsx, isValidElement as isValidElementFn } from './src/jsx';
import currentDispatcher, {
	Dispatcher,
	resolveDispatcher
} from './src/currentDispatcher';

export const useState: Dispatcher['useState'] = (initialState: any) => {
	const dispatch = resolveDispatcher();
	return dispatch.useState(initialState);
};

// 内部数据共享层
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher
};

export const version = '0.0.0';
// 这里应该根据环境区分jsx/jsxDEV，在测试用例中也要区分，当前ReactElement-test.js中使用的是jsx
export const createElement = jsx;
export const isValidElement = isValidElementFn;
