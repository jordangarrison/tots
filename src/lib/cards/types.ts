export type Occasion =
	| 'birthday'
	| 'mothers-day'
	| 'fathers-day'
	| 'valentine'
	| 'thank-you'
	| 'christmas'
	| 'blank';

export interface TextSlot {
	kind: 'text';
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	placeholder?: string;
	defaultText?: string;
	fontFamily?: string;
	fontSize?: number;
	color?: string;
	align?: 'left' | 'center' | 'right';
}

export interface ImageSlot {
	kind: 'image';
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	hint?: string;
}

export type Slot = TextSlot | ImageSlot;

export interface CardPage {
	width: number;
	height: number;
	svg: string;
	slots: Slot[];
}

export interface CardTemplate {
	id: string;
	name: string;
	emoji: string;
	occasion: Occasion;
	occasionLabel: string;
	front: CardPage;
	inside: CardPage;
}

export const occasionOrder: Occasion[] = [
	'birthday',
	'mothers-day',
	'fathers-day',
	'valentine',
	'thank-you',
	'christmas',
	'blank'
];

export const occasionLabels: Record<Occasion, string> = {
	birthday: 'BIRTHDAY',
	'mothers-day': "MOTHER'S DAY",
	'fathers-day': "FATHER'S DAY",
	valentine: 'VALENTINE',
	'thank-you': 'THANK YOU',
	christmas: 'CHRISTMAS',
	blank: 'BLANK'
};
