// 支持的事件类型
import { Props } from 'shared/ReactTypes';
import { Container } from 'hostConfig';
const validEventTypeList = ['click'];
export const elementEventPropsKey = '__props';

interface SyntheticEvent extends Event {
	type: string;
	__stopPropagation: boolean;
}

type EventCallback = (e: SyntheticEvent) => void;

interface Paths {
	capture: EventCallback[];
	bubble: EventCallback[];
}

export interface DomElement extends Element {
	[elementEventPropsKey]?: {
		[eventType: string]: EventCallback;
	};
}

export const updateFiberProps = (node: DomElement, props: Props) => {
	node[elementEventPropsKey] = props;
};

const getEventCallbackNameFromtEventType = (
	eventType: string
): string[] | undefined => {
	return {
		click: ['onClickCapture', 'onClick']
	}[eventType];
};

const collectPaths = (
	targetElement: DomElement,
	container: Container,
	eventType: string
): Paths => {
	const paths: Paths = {
		capture: [],
		bubble: []
	};
	while (targetElement && targetElement !== container) {
		// 收集
		const elementProps = targetElement[elementEventPropsKey];
		if (elementProps) {
			// click => onClick onClickCature
			const callbackNameList = getEventCallbackNameFromtEventType(eventType);
			if (callbackNameList) {
				callbackNameList.forEach((callbackName, i) => {
					const eventCallback = elementProps[callbackName];
					if (eventCallback) {
						if (i === 0) {
							// 反向插入捕获阶段的事件回调
							paths.capture.unshift(eventCallback);
						} else {
							// 正向插入冒泡阶段的事件回调
							paths.bubble.push(eventCallback);
						}
					}
				});
			}
		}
		targetElement = targetElement.parentNode as DomElement;
	}
	return paths;
};

const createSyntheticEvent = (e: Event): SyntheticEvent => {
	const syntheticEvent = e as SyntheticEvent;
	syntheticEvent.__stopPropagation = false;
	const originStopPropagation = e.stopPropagation;

	syntheticEvent.stopPropagation = () => {
		syntheticEvent.__stopPropagation = true;
		if (originStopPropagation) {
			originStopPropagation();
		}
	};
	return syntheticEvent;
};

const triggerEventFlow = (paths: EventCallback[], se: SyntheticEvent) => {
	for (let i = 0; i < paths.length; i++) {
		const callback = paths[i];

		callback.call(null, se);

		if (se.__stopPropagation) {
			break;
		}
	}
};

const dispatchEvent = (container: Container, eventType: string, e: Event) => {
	const targetElement = e.target as DomElement;
	if (targetElement === null) {
		console.warn('事件不存在target', e);
		return;
	}
	// 1. 收集沿途的事件
	const { capture, bubble } = collectPaths(targetElement, container, eventType);
	// 2. 构造合成事件
	const se = createSyntheticEvent(e);
	// 3. 遍历 cature
	if (__DEV__) {
		console.log('模拟事件捕获阶段：', eventType);
	}
	triggerEventFlow(capture, se);
	// 4. 遍历 bubble
	if (!se.__stopPropagation) {
		if (__DEV__) {
			console.log('模拟事件冒泡阶段：', eventType);
		}
		triggerEventFlow(bubble, se);
	}
};

export const initEvent = (container: Container, eventType: string) => {
	if (!validEventTypeList.includes(eventType)) {
		console.warn('当前不支持的', eventType);
		return;
	}
	if (__DEV__) {
		console.log('初始化事件', eventType);
	}

	container.addEventListener(eventType, (e) => {
		dispatchEvent(container, eventType, e);
	});
};
