// React
import { jsx } from './src/jsx';
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

export default {
	version: '0.0.0',
	createElement: jsx
};
