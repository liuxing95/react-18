import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	const [num, setNum] = useState(1);
	console.log('num', num);
	const arr =
		num % 2 === 0
			? [<li key={1}>1</li>, <li key={2}>2</li>, <li key={3}>3</li>]
			: [<li key={3}>3</li>, <li key={2}>2</li>, <li key={1}>1</li>];
	console.log('arr', arr);
	useEffect(() => {
		console.log('num发生了变化', num);
		return () => {
			console.log('num发生了销毁', num);
		};
	}, [num]);
	return (
		<ul
			onClick={() => {
				setNum((num) => num + 1);
				setNum((num) => num + 1);
				setNum((num) => num + 1);
			}}
		>
			<>{num}</>
		</ul>
	);
	return <ul onClick={() => setNum(num + 1)}>{arr}</ul>;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
