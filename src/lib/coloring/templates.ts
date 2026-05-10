export interface ColoringTemplate {
	id: string;
	name: string;
	emoji: string;
	svg: string;
}

const wrap = (inner: string) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet"><g fill="none" stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">${inner}</g></svg>`;

export const templates: ColoringTemplate[] = [
	{
		id: 'butterfly',
		name: 'Butterfly',
		emoji: '🦋',
		svg: wrap(`
			<ellipse cx="400" cy="320" rx="22" ry="130"/>
			<path d="M 392 200 Q 365 160 350 130 Q 348 122 345 128"/>
			<path d="M 408 200 Q 435 160 450 130 Q 452 122 455 128"/>
			<circle cx="345" cy="128" r="6"/>
			<circle cx="455" cy="128" r="6"/>
			<path d="M 380 230 Q 200 150 130 250 Q 100 320 200 350 Q 340 360 380 290"/>
			<path d="M 420 230 Q 600 150 670 250 Q 700 320 600 350 Q 460 360 420 290"/>
			<path d="M 380 330 Q 240 360 180 440 Q 240 500 350 460 Q 395 425 388 360"/>
			<path d="M 420 330 Q 560 360 620 440 Q 560 500 450 460 Q 405 425 412 360"/>
			<circle cx="265" cy="265" r="22"/>
			<circle cx="535" cy="265" r="22"/>
			<circle cx="280" cy="410" r="16"/>
			<circle cx="520" cy="410" r="16"/>
			<path d="M 235 240 Q 250 280 235 310"/>
			<path d="M 565 240 Q 550 280 565 310"/>
			<path d="M 240 405 Q 230 430 245 450"/>
			<path d="M 560 405 Q 570 430 555 450"/>
		`)
	},
	{
		id: 'flower',
		name: 'Flower',
		emoji: '🌸',
		svg: wrap(`
			<circle cx="400" cy="240" r="55"/>
			<ellipse cx="400" cy="140" rx="44" ry="78"/>
			<ellipse cx="400" cy="340" rx="44" ry="78"/>
			<ellipse cx="300" cy="240" rx="78" ry="44"/>
			<ellipse cx="500" cy="240" rx="78" ry="44"/>
			<ellipse cx="328" cy="170" rx="58" ry="42" transform="rotate(-45 328 170)"/>
			<ellipse cx="472" cy="170" rx="58" ry="42" transform="rotate(45 472 170)"/>
			<ellipse cx="328" cy="310" rx="58" ry="42" transform="rotate(45 328 310)"/>
			<ellipse cx="472" cy="310" rx="58" ry="42" transform="rotate(-45 472 310)"/>
			<path d="M 400 295 Q 408 410 400 565"/>
			<path d="M 400 410 Q 340 388 305 430 Q 340 455 400 442"/>
			<path d="M 400 470 Q 460 448 495 490 Q 460 515 400 502"/>
			<circle cx="385" cy="225" r="4"/>
			<circle cx="415" cy="225" r="4"/>
			<circle cx="400" cy="245" r="4"/>
			<circle cx="385" cy="260" r="4"/>
			<circle cx="415" cy="260" r="4"/>
		`)
	},
	{
		id: 'fish',
		name: 'Fish',
		emoji: '🐟',
		svg: wrap(`
			<path d="M 200 300 Q 260 150 500 200 Q 600 240 610 300 Q 600 360 500 400 Q 260 450 200 300 Z"/>
			<path d="M 200 300 L 90 200 L 130 300 L 90 400 Z"/>
			<path d="M 280 230 Q 270 300 280 370"/>
			<path d="M 380 200 Q 405 150 435 195"/>
			<path d="M 380 400 Q 405 450 435 405"/>
			<circle cx="510" cy="270" r="22"/>
			<circle cx="510" cy="270" r="9" fill="#1a1a1a"/>
			<path d="M 350 250 Q 380 270 350 290"/>
			<path d="M 400 230 Q 430 250 400 270"/>
			<path d="M 400 290 Q 430 310 400 330"/>
			<path d="M 450 250 Q 480 270 450 290"/>
			<path d="M 605 295 Q 625 300 605 305"/>
			<circle cx="650" cy="190" r="16"/>
			<circle cx="700" cy="150" r="11"/>
			<circle cx="680" cy="110" r="9"/>
		`)
	},
	{
		id: 'house',
		name: 'House',
		emoji: '🏠',
		svg: wrap(`
			<rect x="200" y="290" width="400" height="260"/>
			<path d="M 170 295 L 400 130 L 630 295 Z"/>
			<rect x="345" y="395" width="110" height="155" rx="6"/>
			<circle cx="435" cy="475" r="6"/>
			<rect x="240" y="345" width="85" height="85"/>
			<line x1="282" y1="345" x2="282" y2="430"/>
			<line x1="240" y1="387" x2="325" y2="387"/>
			<rect x="475" y="345" width="85" height="85"/>
			<line x1="517" y1="345" x2="517" y2="430"/>
			<line x1="475" y1="387" x2="560" y2="387"/>
			<rect x="500" y="175" width="40" height="80"/>
			<circle cx="700" cy="115" r="42"/>
			<line x1="700" y1="40" x2="700" y2="60"/>
			<line x1="700" y1="170" x2="700" y2="190"/>
			<line x1="620" y1="115" x2="640" y2="115"/>
			<line x1="760" y1="115" x2="780" y2="115"/>
			<line x1="645" y1="60" x2="660" y2="75"/>
			<line x1="740" y1="155" x2="755" y2="170"/>
			<line x1="645" y1="170" x2="660" y2="155"/>
			<line x1="740" y1="75" x2="755" y2="60"/>
			<line x1="40" y1="555" x2="760" y2="555"/>
			<rect x="78" y="395" width="34" height="160"/>
			<circle cx="95" cy="370" r="65"/>
			<path d="M 70 360 Q 95 330 120 360"/>
			<path d="M 60 390 Q 95 360 130 390"/>
		`)
	},
	{
		id: 'cat',
		name: 'Kitty',
		emoji: '🐱',
		svg: wrap(`
			<circle cx="400" cy="320" r="180"/>
			<path d="M 270 200 L 250 80 L 365 175 Z"/>
			<path d="M 530 200 L 550 80 L 435 175 Z"/>
			<path d="M 285 180 L 275 130 L 320 170 Z"/>
			<path d="M 515 180 L 525 130 L 480 170 Z"/>
			<ellipse cx="340" cy="290" rx="26" ry="36"/>
			<ellipse cx="460" cy="290" rx="26" ry="36"/>
			<ellipse cx="340" cy="295" rx="9" ry="22" fill="#1a1a1a"/>
			<ellipse cx="460" cy="295" rx="9" ry="22" fill="#1a1a1a"/>
			<circle cx="332" cy="280" r="4" fill="#fff"/>
			<circle cx="452" cy="280" r="4" fill="#fff"/>
			<path d="M 380 360 L 400 382 L 420 360 Z"/>
			<line x1="400" y1="382" x2="400" y2="402"/>
			<path d="M 400 402 Q 380 422 360 412"/>
			<path d="M 400 402 Q 420 422 440 412"/>
			<line x1="280" y1="370" x2="195" y2="345"/>
			<line x1="280" y1="388" x2="195" y2="388"/>
			<line x1="280" y1="406" x2="195" y2="430"/>
			<line x1="520" y1="370" x2="605" y2="345"/>
			<line x1="520" y1="388" x2="605" y2="388"/>
			<line x1="520" y1="406" x2="605" y2="430"/>
		`)
	},
	{
		id: 'rainbow',
		name: 'Rainbow',
		emoji: '🌈',
		svg: wrap(`
			<path d="M 90 500 Q 400 90 710 500"/>
			<path d="M 125 500 Q 400 130 675 500"/>
			<path d="M 160 500 Q 400 170 640 500"/>
			<path d="M 195 500 Q 400 210 605 500"/>
			<path d="M 230 500 Q 400 250 570 500"/>
			<path d="M 265 500 Q 400 290 535 500"/>
			<path d="M 80 480 Q 60 440 100 425 Q 110 395 150 405 Q 180 385 215 408 Q 250 398 250 442 Q 260 472 220 492 Q 180 512 130 502 Q 90 512 80 480 Z"/>
			<path d="M 585 480 Q 580 512 620 502 Q 670 512 700 502 Q 750 512 740 480 Q 760 450 740 425 Q 730 395 690 405 Q 670 385 640 408 Q 610 398 600 425 Q 570 440 585 480 Z"/>
			<circle cx="660" cy="105" r="42"/>
			<line x1="660" y1="30" x2="660" y2="50"/>
			<line x1="660" y1="160" x2="660" y2="180"/>
			<line x1="580" y1="105" x2="600" y2="105"/>
			<line x1="720" y1="105" x2="740" y2="105"/>
			<line x1="605" y1="50" x2="620" y2="65"/>
			<line x1="700" y1="145" x2="715" y2="160"/>
			<line x1="605" y1="160" x2="620" y2="145"/>
			<line x1="700" y1="65" x2="715" y2="50"/>
			<path d="M 50 555 L 760 555"/>
			<circle cx="120" cy="540" r="6"/>
			<circle cx="200" cy="545" r="5"/>
			<circle cx="350" cy="540" r="6"/>
			<circle cx="450" cy="545" r="5"/>
			<circle cx="560" cy="540" r="6"/>
			<circle cx="680" cy="545" r="5"/>
		`)
	},
	{
		id: 'unicorn',
		name: 'Unicorn',
		emoji: '🦄',
		svg: wrap(`
			<path d="M 220 360 Q 200 240 290 200 Q 340 180 400 200 Q 470 180 520 220 Q 560 250 565 320 L 580 360 Q 590 410 560 440 L 540 460 Q 540 510 520 540 L 480 540 Q 470 500 470 470 L 380 470 Q 380 510 360 540 L 320 540 Q 310 500 320 460 Q 260 450 230 410 Z"/>
			<path d="M 420 200 L 450 80 L 470 200"/>
			<path d="M 425 130 L 460 130"/>
			<path d="M 430 160 L 465 160"/>
			<path d="M 320 220 Q 290 175 320 140 Q 360 160 350 200"/>
			<path d="M 380 195 Q 410 165 450 175"/>
			<circle cx="495" cy="280" r="10"/>
			<circle cx="495" cy="280" r="4" fill="#1a1a1a"/>
			<path d="M 555 320 Q 580 320 575 340"/>
			<path d="M 555 335 Q 575 335 568 348"/>
			<path d="M 220 360 Q 170 320 130 350 Q 110 380 130 410 Q 100 420 110 460 Q 130 480 170 470 Q 175 490 200 490 Q 220 470 220 440"/>
			<path d="M 150 360 Q 130 370 135 400"/>
			<path d="M 150 410 Q 130 430 145 455"/>
		`)
	},
	{
		id: 'mandala',
		name: 'Mandala',
		emoji: '✨',
		svg: wrap(`
			<circle cx="400" cy="300" r="40"/>
			<circle cx="400" cy="300" r="80"/>
			<circle cx="400" cy="300" r="140"/>
			<circle cx="400" cy="300" r="200"/>
			<circle cx="400" cy="300" r="250"/>
			<g>
				<line x1="400" y1="50" x2="400" y2="550"/>
				<line x1="150" y1="300" x2="650" y2="300"/>
				<line x1="223" y1="123" x2="577" y2="477"/>
				<line x1="577" y1="123" x2="223" y2="477"/>
			</g>
			<g>
				<circle cx="400" cy="100" r="20"/>
				<circle cx="400" cy="500" r="20"/>
				<circle cx="200" cy="300" r="20"/>
				<circle cx="600" cy="300" r="20"/>
				<circle cx="259" cy="159" r="15"/>
				<circle cx="541" cy="441" r="15"/>
				<circle cx="541" cy="159" r="15"/>
				<circle cx="259" cy="441" r="15"/>
			</g>
			<g>
				<path d="M 400 220 Q 430 260 400 300 Q 370 260 400 220 Z"/>
				<path d="M 400 380 Q 430 340 400 300 Q 370 340 400 380 Z"/>
				<path d="M 320 300 Q 360 270 400 300 Q 360 330 320 300 Z"/>
				<path d="M 480 300 Q 440 270 400 300 Q 440 330 480 300 Z"/>
			</g>
			<g>
				<path d="M 400 140 Q 440 200 400 240"/>
				<path d="M 400 460 Q 360 400 400 360"/>
				<path d="M 240 300 Q 300 260 340 300"/>
				<path d="M 560 300 Q 500 340 460 300"/>
			</g>
		`)
	}
];
