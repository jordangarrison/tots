import type { CardTemplate, Slot } from './types';

const FRONT_W = 512;
const FRONT_H = 768;
const INSIDE_W = 1024;
const INSIDE_H = 768;

const wrap = (inner: string, w: number, h: number) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet"><g fill="none" stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">${inner}</g></svg>`;

const frontSvg = (inner: string) => wrap(inner, FRONT_W, FRONT_H);
const insideSvg = (inner: string) => wrap(inner, INSIDE_W, INSIDE_H);

const standardFrontSlots = (defaultGreeting: string): Slot[] => [
	{
		kind: 'text',
		id: 'greeting',
		x: 32,
		y: 500,
		width: 448,
		height: 90,
		defaultText: defaultGreeting,
		fontSize: 56,
		align: 'center'
	},
	{
		kind: 'text',
		id: 'to',
		x: 32,
		y: 610,
		width: 448,
		height: 70,
		placeholder: 'To …',
		fontSize: 40,
		align: 'center'
	}
];

const standardInsideSlots = (): Slot[] => [
	{
		kind: 'image',
		id: 'photo',
		x: 60,
		y: 110,
		width: 380,
		height: 320,
		hint: 'Add a photo'
	},
	{
		kind: 'text',
		id: 'message',
		x: 510,
		y: 110,
		width: 450,
		height: 380,
		placeholder: 'Write something nice…',
		fontSize: 40,
		align: 'center'
	},
	{
		kind: 'text',
		id: 'from',
		x: 510,
		y: 560,
		width: 450,
		height: 80,
		placeholder: 'Love, …',
		fontSize: 40,
		align: 'center'
	}
];

const birthdayCake: CardTemplate = {
	id: 'birthday-cake',
	name: 'Birthday Cake',
	emoji: '🎂',
	occasion: 'birthday',
	occasionLabel: 'Birthday',
	front: {
		width: FRONT_W,
		height: FRONT_H,
		svg: frontSvg(`
			<!-- candles -->
			<line x1="206" y1="120" x2="206" y2="200"/>
			<line x1="256" y1="100" x2="256" y2="200"/>
			<line x1="306" y1="120" x2="306" y2="200"/>
			<path d="M 206 120 Q 196 100 206 80 Q 216 100 206 120 Z"/>
			<path d="M 256 100 Q 246 80 256 60 Q 266 80 256 100 Z"/>
			<path d="M 306 120 Q 296 100 306 80 Q 316 100 306 120 Z"/>
			<!-- top tier -->
			<rect x="160" y="200" width="192" height="80" rx="6"/>
			<path d="M 160 220 Q 195 240 230 220 Q 265 240 300 220 Q 335 240 352 220"/>
			<!-- middle tier -->
			<rect x="120" y="280" width="272" height="100" rx="6"/>
			<path d="M 120 300 Q 165 320 210 300 Q 255 320 300 300 Q 345 320 392 300"/>
			<!-- bottom tier -->
			<rect x="80" y="380" width="352" height="120" rx="6"/>
			<path d="M 80 400 Q 130 420 180 400 Q 230 420 280 400 Q 330 420 380 400 Q 410 420 432 400"/>
			<!-- plate -->
			<ellipse cx="256" cy="505" rx="200" ry="14"/>
			<!-- confetti -->
			<circle cx="80" cy="80" r="6"/>
			<circle cx="430" cy="60" r="6"/>
			<circle cx="55" cy="200" r="5"/>
			<circle cx="450" cy="160" r="5"/>
			<path d="M 50 140 L 60 140"/>
			<path d="M 450 240 L 460 240"/>
			<path d="M 100 50 L 110 60"/>
			<path d="M 410 100 L 420 110"/>
		`),
		slots: standardFrontSlots('Happy Birthday!')
	},
	inside: {
		width: INSIDE_W,
		height: INSIDE_H,
		svg: insideSvg(`
			<!-- balloons -->
			<circle cx="80" cy="80" r="40"/>
			<path d="M 80 120 L 80 200"/>
			<circle cx="160" cy="60" r="32"/>
			<path d="M 160 92 L 160 180"/>
			<circle cx="944" cy="80" r="40"/>
			<path d="M 944 120 L 944 200"/>
			<circle cx="864" cy="60" r="32"/>
			<path d="M 864 92 L 864 180"/>
			<!-- streamers -->
			<path d="M 0 700 Q 100 660 200 700 Q 300 740 400 700 Q 500 660 600 700 Q 700 740 800 700 Q 900 660 1024 700"/>
			<!-- stars -->
			<path d="M 60 680 L 65 670 L 70 680 L 80 682 L 72 690 L 74 700 L 65 695 L 56 700 L 58 690 L 50 682 Z"/>
			<path d="M 960 680 L 965 670 L 970 680 L 980 682 L 972 690 L 974 700 L 965 695 L 956 700 L 958 690 L 950 682 Z"/>
		`),
		slots: standardInsideSlots()
	}
};

const balloons: CardTemplate = {
	id: 'birthday-balloons',
	name: 'Balloons',
	emoji: '🎈',
	occasion: 'birthday',
	occasionLabel: 'Birthday',
	front: {
		width: FRONT_W,
		height: FRONT_H,
		svg: frontSvg(`
			<!-- balloon cluster -->
			<circle cx="180" cy="180" r="80"/>
			<path d="M 180 260 Q 175 280 195 290"/>
			<circle cx="320" cy="140" r="70"/>
			<path d="M 320 210 Q 325 230 305 240"/>
			<circle cx="250" cy="320" r="74"/>
			<path d="M 250 394 Q 260 410 240 420"/>
			<!-- strings tied -->
			<path d="M 195 290 Q 245 360 240 420"/>
			<path d="M 305 240 Q 270 320 260 420"/>
			<path d="M 240 420 L 256 460"/>
			<!-- bow -->
			<path d="M 230 460 Q 256 440 282 460 Q 256 480 230 460 Z"/>
			<!-- confetti -->
			<circle cx="60" cy="80" r="6"/>
			<circle cx="440" cy="80" r="6"/>
			<circle cx="80" cy="380" r="6"/>
			<circle cx="430" cy="350" r="5"/>
			<path d="M 50 200 L 60 210"/>
			<path d="M 450 250 L 460 260"/>
		`),
		slots: standardFrontSlots('Happy Birthday!')
	},
	inside: {
		width: INSIDE_W,
		height: INSIDE_H,
		svg: insideSvg(`
			<!-- corner balloon clusters -->
			<circle cx="70" cy="80" r="34"/>
			<circle cx="130" cy="60" r="28"/>
			<path d="M 70 114 L 100 160"/>
			<path d="M 130 88 L 110 160"/>
			<circle cx="950" cy="80" r="34"/>
			<circle cx="890" cy="60" r="28"/>
			<path d="M 950 114 L 920 160"/>
			<path d="M 890 88 L 910 160"/>
			<!-- bottom party streamer -->
			<path d="M 0 720 Q 128 680 256 720 Q 384 760 512 720 Q 640 680 768 720 Q 896 760 1024 720"/>
			<circle cx="120" cy="710" r="4"/>
			<circle cx="384" cy="710" r="4"/>
			<circle cx="640" cy="710" r="4"/>
			<circle cx="904" cy="710" r="4"/>
		`),
		slots: standardInsideSlots()
	}
};

const mothersDayFlowers: CardTemplate = {
	id: 'mothers-day-flowers',
	name: 'Bouquet',
	emoji: '💐',
	occasion: 'mothers-day',
	occasionLabel: "Mother's Day",
	front: {
		width: FRONT_W,
		height: FRONT_H,
		svg: frontSvg(`
			<!-- big flower -->
			<circle cx="256" cy="220" r="40"/>
			<ellipse cx="256" cy="140" rx="32" ry="56"/>
			<ellipse cx="256" cy="300" rx="32" ry="56"/>
			<ellipse cx="176" cy="220" rx="56" ry="32"/>
			<ellipse cx="336" cy="220" rx="56" ry="32"/>
			<ellipse cx="200" cy="164" rx="42" ry="30" transform="rotate(-45 200 164)"/>
			<ellipse cx="312" cy="164" rx="42" ry="30" transform="rotate(45 312 164)"/>
			<ellipse cx="200" cy="276" rx="42" ry="30" transform="rotate(45 200 276)"/>
			<ellipse cx="312" cy="276" rx="42" ry="30" transform="rotate(-45 312 276)"/>
			<!-- side flowers -->
			<circle cx="120" cy="120" r="22"/>
			<ellipse cx="120" cy="80" rx="16" ry="28"/>
			<ellipse cx="120" cy="160" rx="16" ry="28"/>
			<ellipse cx="84" cy="120" rx="28" ry="16"/>
			<ellipse cx="156" cy="120" rx="28" ry="16"/>
			<circle cx="392" cy="120" r="22"/>
			<ellipse cx="392" cy="80" rx="16" ry="28"/>
			<ellipse cx="392" cy="160" rx="16" ry="28"/>
			<ellipse cx="356" cy="120" rx="28" ry="16"/>
			<ellipse cx="428" cy="120" rx="28" ry="16"/>
			<!-- stems gathered -->
			<path d="M 256 360 L 256 460"/>
			<path d="M 120 160 Q 200 280 256 400"/>
			<path d="M 392 160 Q 312 280 256 400"/>
			<!-- ribbon -->
			<path d="M 200 440 Q 256 420 312 440 Q 256 470 200 440 Z"/>
			<path d="M 220 460 L 200 480"/>
			<path d="M 292 460 L 312 480"/>
		`),
		slots: standardFrontSlots("Happy Mother's Day")
	},
	inside: {
		width: INSIDE_W,
		height: INSIDE_H,
		svg: insideSvg(`
			<!-- corner flowers -->
			<circle cx="80" cy="90" r="22"/>
			<ellipse cx="80" cy="54" rx="14" ry="24"/>
			<ellipse cx="80" cy="126" rx="14" ry="24"/>
			<ellipse cx="44" cy="90" rx="24" ry="14"/>
			<ellipse cx="116" cy="90" rx="24" ry="14"/>
			<circle cx="944" cy="90" r="22"/>
			<ellipse cx="944" cy="54" rx="14" ry="24"/>
			<ellipse cx="944" cy="126" rx="14" ry="24"/>
			<ellipse cx="908" cy="90" rx="24" ry="14"/>
			<ellipse cx="980" cy="90" rx="24" ry="14"/>
			<!-- vine bottom -->
			<path d="M 60 700 Q 200 660 340 700 Q 480 740 620 700 Q 760 660 900 700"/>
			<circle cx="200" cy="680" r="10"/>
			<circle cx="480" cy="720" r="10"/>
			<circle cx="760" cy="680" r="10"/>
			<path d="M 200 680 L 196 670"/>
			<path d="M 480 720 L 476 710"/>
			<path d="M 760 680 L 756 670"/>
		`),
		slots: standardInsideSlots()
	}
};

const fathersDayTie: CardTemplate = {
	id: 'fathers-day-tie',
	name: 'Necktie',
	emoji: '👔',
	occasion: 'fathers-day',
	occasionLabel: "Father's Day",
	front: {
		width: FRONT_W,
		height: FRONT_H,
		svg: frontSvg(`
			<!-- collar -->
			<path d="M 160 80 L 200 60 L 256 120 L 312 60 L 352 80 L 352 160 L 160 160 Z"/>
			<line x1="200" y1="60" x2="256" y2="120"/>
			<line x1="312" y1="60" x2="256" y2="120"/>
			<!-- tie knot -->
			<path d="M 226 120 L 286 120 L 296 180 L 216 180 Z"/>
			<!-- tie body -->
			<path d="M 216 180 L 296 180 L 320 460 L 256 500 L 192 460 Z"/>
			<!-- tie pattern -->
			<line x1="240" y1="230" x2="272" y2="230"/>
			<line x1="244" y1="280" x2="276" y2="280"/>
			<line x1="248" y1="330" x2="280" y2="330"/>
			<line x1="252" y1="380" x2="284" y2="380"/>
			<line x1="256" y1="430" x2="288" y2="430"/>
			<!-- buttons on shirt -->
			<circle cx="180" cy="200" r="6"/>
			<circle cx="180" cy="240" r="6"/>
			<circle cx="180" cy="280" r="6"/>
			<!-- shirt edge -->
			<line x1="160" y1="160" x2="160" y2="540"/>
			<line x1="352" y1="160" x2="352" y2="540"/>
			<!-- stars -->
			<path d="M 100 80 L 105 70 L 110 80 L 120 82 L 112 90 L 114 100 L 105 95 L 96 100 L 98 90 L 90 82 Z"/>
			<path d="M 412 80 L 417 70 L 422 80 L 432 82 L 424 90 L 426 100 L 417 95 L 408 100 L 410 90 L 402 82 Z"/>
		`),
		slots: standardFrontSlots("Happy Father's Day")
	},
	inside: {
		width: INSIDE_W,
		height: INSIDE_H,
		svg: insideSvg(`
			<!-- corner tools/badges -->
			<rect x="50" y="60" width="80" height="60" rx="6"/>
			<circle cx="90" cy="90" r="20"/>
			<path d="M 90 70 L 90 110"/>
			<path d="M 70 90 L 110 90"/>
			<rect x="894" y="60" width="80" height="60" rx="6"/>
			<path d="M 914 80 L 954 100"/>
			<path d="M 914 100 L 954 80"/>
			<!-- bottom wood plank pattern -->
			<line x1="0" y1="700" x2="1024" y2="700"/>
			<line x1="0" y1="720" x2="1024" y2="720"/>
			<line x1="200" y1="700" x2="200" y2="720"/>
			<line x1="450" y1="700" x2="450" y2="720"/>
			<line x1="700" y1="700" x2="700" y2="720"/>
		`),
		slots: standardInsideSlots()
	}
};

const valentineHeart: CardTemplate = {
	id: 'valentine-heart',
	name: 'Heart',
	emoji: '💖',
	occasion: 'valentine',
	occasionLabel: 'Valentine',
	front: {
		width: FRONT_W,
		height: FRONT_H,
		svg: frontSvg(`
			<!-- big heart -->
			<path d="M 256 460
				C 256 360, 380 320, 380 220
				C 380 160, 320 130, 256 200
				C 192 130, 132 160, 132 220
				C 132 320, 256 360, 256 460 Z"/>
			<!-- inner heart -->
			<path d="M 256 400
				C 256 340, 320 320, 320 260
				C 320 230, 290 215, 256 250
				C 222 215, 192 230, 192 260
				C 192 320, 256 340, 256 400 Z"/>
			<!-- little hearts -->
			<path d="M 80 100 C 80 80, 110 70, 110 50 C 110 35, 90 30, 80 50 C 70 30, 50 35, 50 50 C 50 70, 80 80, 80 100 Z"/>
			<path d="M 432 100 C 432 80, 462 70, 462 50 C 462 35, 442 30, 432 50 C 422 30, 402 35, 402 50 C 402 70, 432 80, 432 100 Z"/>
			<path d="M 80 460 C 80 440, 110 430, 110 410 C 110 395, 90 390, 80 410 C 70 390, 50 395, 50 410 C 50 430, 80 440, 80 460 Z"/>
			<path d="M 432 460 C 432 440, 462 430, 462 410 C 462 395, 442 390, 432 410 C 422 390, 402 395, 402 410 C 402 430, 432 440, 432 460 Z"/>
			<!-- sparkles -->
			<path d="M 120 200 L 130 200"/>
			<path d="M 125 195 L 125 205"/>
			<path d="M 380 350 L 390 350"/>
			<path d="M 385 345 L 385 355"/>
		`),
		slots: standardFrontSlots('Be Mine!')
	},
	inside: {
		width: INSIDE_W,
		height: INSIDE_H,
		svg: insideSvg(`
			<!-- corner hearts -->
			<path d="M 80 100 C 80 80, 110 70, 110 50 C 110 35, 90 30, 80 50 C 70 30, 50 35, 50 50 C 50 70, 80 80, 80 100 Z"/>
			<path d="M 944 100 C 944 80, 974 70, 974 50 C 974 35, 954 30, 944 50 C 934 30, 914 35, 914 50 C 914 70, 944 80, 944 100 Z"/>
			<!-- bottom heart trail -->
			<path d="M 100 700 C 100 690, 115 685, 115 675 C 115 668, 105 665, 100 675 C 95 665, 85 668, 85 675 C 85 685, 100 690, 100 700 Z"/>
			<path d="M 300 720 C 300 710, 315 705, 315 695 C 315 688, 305 685, 300 695 C 295 685, 285 688, 285 695 C 285 705, 300 710, 300 720 Z"/>
			<path d="M 512 700 C 512 690, 527 685, 527 675 C 527 668, 517 665, 512 675 C 507 665, 497 668, 497 675 C 497 685, 512 690, 512 700 Z"/>
			<path d="M 724 720 C 724 710, 739 705, 739 695 C 739 688, 729 685, 724 695 C 719 685, 709 688, 709 695 C 709 705, 724 710, 724 720 Z"/>
			<path d="M 924 700 C 924 690, 939 685, 939 675 C 939 668, 929 665, 924 675 C 919 665, 909 668, 909 675 C 909 685, 924 690, 924 700 Z"/>
		`),
		slots: standardInsideSlots()
	}
};

const thankYouStars: CardTemplate = {
	id: 'thank-you-stars',
	name: 'Stars',
	emoji: '🌟',
	occasion: 'thank-you',
	occasionLabel: 'Thank You',
	front: {
		width: FRONT_W,
		height: FRONT_H,
		svg: frontSvg(`
			<!-- big star -->
			<path d="M 256 100
				L 290 200 L 396 200 L 312 264
				L 344 366 L 256 304 L 168 366
				L 200 264 L 116 200 L 222 200 Z"/>
			<!-- smaller stars -->
			<path d="M 100 100 L 110 130 L 142 130 L 116 150 L 126 180 L 100 162 L 74 180 L 84 150 L 58 130 L 90 130 Z"/>
			<path d="M 412 100 L 422 130 L 454 130 L 428 150 L 438 180 L 412 162 L 386 180 L 396 150 L 370 130 L 402 130 Z"/>
			<path d="M 100 400 L 110 430 L 142 430 L 116 450 L 126 480 L 100 462 L 74 480 L 84 450 L 58 430 L 90 430 Z"/>
			<path d="M 412 400 L 422 430 L 454 430 L 428 450 L 438 480 L 412 462 L 386 480 L 396 450 L 370 430 L 402 430 Z"/>
			<!-- small dots -->
			<circle cx="60" cy="240" r="5"/>
			<circle cx="452" cy="240" r="5"/>
			<circle cx="160" cy="60" r="5"/>
			<circle cx="352" cy="60" r="5"/>
			<circle cx="160" cy="460" r="5"/>
			<circle cx="352" cy="460" r="5"/>
		`),
		slots: standardFrontSlots('Thank You!')
	},
	inside: {
		width: INSIDE_W,
		height: INSIDE_H,
		svg: insideSvg(`
			<!-- star scatter -->
			<path d="M 80 80 L 88 102 L 112 102 L 92 116 L 100 138 L 80 124 L 60 138 L 68 116 L 48 102 L 72 102 Z"/>
			<path d="M 944 80 L 952 102 L 976 102 L 956 116 L 964 138 L 944 124 L 924 138 L 932 116 L 912 102 L 936 102 Z"/>
			<path d="M 460 60 L 466 76 L 484 76 L 470 86 L 476 102 L 460 92 L 444 102 L 450 86 L 436 76 L 454 76 Z"/>
			<path d="M 580 60 L 586 76 L 604 76 L 590 86 L 596 102 L 580 92 L 564 102 L 570 86 L 556 76 L 574 76 Z"/>
			<!-- bottom stars -->
			<path d="M 80 700 L 88 722 L 112 722 L 92 736 L 100 758 L 80 744 L 60 758 L 68 736 L 48 722 L 72 722 Z"/>
			<path d="M 512 700 L 520 722 L 544 722 L 524 736 L 532 758 L 512 744 L 492 758 L 500 736 L 480 722 L 504 722 Z"/>
			<path d="M 944 700 L 952 722 L 976 722 L 956 736 L 964 758 L 944 744 L 924 758 L 932 736 L 912 722 L 936 722 Z"/>
			<!-- dotted line -->
			<path d="M 160 720 L 170 720"/>
			<path d="M 220 720 L 230 720"/>
			<path d="M 280 720 L 290 720"/>
			<path d="M 340 720 L 350 720"/>
			<path d="M 400 720 L 410 720"/>
			<path d="M 600 720 L 610 720"/>
			<path d="M 660 720 L 670 720"/>
			<path d="M 720 720 L 730 720"/>
			<path d="M 780 720 L 790 720"/>
			<path d="M 840 720 L 850 720"/>
		`),
		slots: standardInsideSlots()
	}
};

const christmasTree: CardTemplate = {
	id: 'christmas-tree',
	name: 'Tree',
	emoji: '🎄',
	occasion: 'christmas',
	occasionLabel: 'Christmas',
	front: {
		width: FRONT_W,
		height: FRONT_H,
		svg: frontSvg(`
			<!-- star on top -->
			<path d="M 256 60 L 266 90 L 296 90 L 272 108 L 282 138 L 256 120 L 230 138 L 240 108 L 216 90 L 246 90 Z"/>
			<!-- tree layers -->
			<path d="M 256 140 L 180 240 L 220 240 L 160 320 L 200 320 L 140 400 L 372 400 L 312 320 L 352 320 L 292 240 L 332 240 Z"/>
			<!-- trunk -->
			<rect x="232" y="400" width="48" height="60"/>
			<!-- ornaments -->
			<circle cx="220" cy="280" r="8"/>
			<circle cx="290" cy="280" r="8"/>
			<circle cx="190" cy="350" r="8"/>
			<circle cx="256" cy="340" r="8"/>
			<circle cx="320" cy="350" r="8"/>
			<circle cx="170" cy="390" r="8"/>
			<circle cx="345" cy="390" r="8"/>
			<!-- presents at base -->
			<rect x="80" y="460" width="80" height="60"/>
			<line x1="120" y1="460" x2="120" y2="520"/>
			<line x1="80" y1="490" x2="160" y2="490"/>
			<rect x="180" y="470" width="60" height="50"/>
			<line x1="210" y1="470" x2="210" y2="520"/>
			<rect x="352" y="460" width="80" height="60"/>
			<line x1="392" y1="460" x2="392" y2="520"/>
			<line x1="352" y1="490" x2="432" y2="490"/>
			<!-- snowflakes -->
			<path d="M 70 120 L 90 120"/>
			<path d="M 80 110 L 80 130"/>
			<path d="M 74 114 L 86 126"/>
			<path d="M 86 114 L 74 126"/>
			<path d="M 422 120 L 442 120"/>
			<path d="M 432 110 L 432 130"/>
			<path d="M 426 114 L 438 126"/>
			<path d="M 438 114 L 426 126"/>
		`),
		slots: standardFrontSlots('Merry Christmas')
	},
	inside: {
		width: INSIDE_W,
		height: INSIDE_H,
		svg: insideSvg(`
			<!-- corner snowflakes -->
			<path d="M 60 100 L 100 100"/>
			<path d="M 80 80 L 80 120"/>
			<path d="M 68 88 L 92 112"/>
			<path d="M 92 88 L 68 112"/>
			<path d="M 924 100 L 964 100"/>
			<path d="M 944 80 L 944 120"/>
			<path d="M 932 88 L 956 112"/>
			<path d="M 956 88 L 932 112"/>
			<!-- holly bottom corners -->
			<ellipse cx="80" cy="720" rx="24" ry="14" transform="rotate(-25 80 720)"/>
			<ellipse cx="110" cy="700" rx="24" ry="14" transform="rotate(20 110 700)"/>
			<circle cx="100" cy="730" r="6"/>
			<circle cx="115" cy="725" r="6"/>
			<ellipse cx="944" cy="720" rx="24" ry="14" transform="rotate(25 944 720)"/>
			<ellipse cx="914" cy="700" rx="24" ry="14" transform="rotate(-20 914 700)"/>
			<circle cx="924" cy="730" r="6"/>
			<circle cx="909" cy="725" r="6"/>
			<!-- snow drift -->
			<path d="M 0 740 Q 256 720 512 740 Q 768 760 1024 740 L 1024 768 L 0 768 Z"/>
		`),
		slots: standardInsideSlots()
	}
};

const blankCard: CardTemplate = {
	id: 'blank',
	name: 'Blank Card',
	emoji: '⬜',
	occasion: 'blank',
	occasionLabel: 'Blank',
	front: {
		width: FRONT_W,
		height: FRONT_H,
		svg: frontSvg(`
			<rect x="32" y="32" width="448" height="704" rx="20" stroke-dasharray="10 10"/>
		`),
		slots: [
			{
				kind: 'text',
				id: 'greeting',
				x: 40,
				y: 90,
				width: 432,
				height: 90,
				placeholder: 'Big greeting…',
				fontSize: 60,
				align: 'center'
			},
			{
				kind: 'image',
				id: 'cover-photo',
				x: 70,
				y: 220,
				width: 372,
				height: 320,
				hint: 'Add a photo'
			},
			{
				kind: 'text',
				id: 'to',
				x: 40,
				y: 600,
				width: 432,
				height: 90,
				placeholder: 'To …',
				fontSize: 48,
				align: 'center'
			}
		]
	},
	inside: {
		width: INSIDE_W,
		height: INSIDE_H,
		svg: insideSvg(''),
		slots: standardInsideSlots()
	}
};

export const cardTemplates: CardTemplate[] = [
	birthdayCake,
	balloons,
	mothersDayFlowers,
	fathersDayTie,
	valentineHeart,
	thankYouStars,
	christmasTree,
	blankCard
];
