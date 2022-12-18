// @ts-ignore
import { createRoot } from 'react-dom';
// import React from 'react';
import { ReactElementType } from 'shared/ReactTypes';

export const renderIntoDocument = (element: ReactElementType) => {
	const div = document.createElement('div');
	return createRoot(div).render(element);
};
