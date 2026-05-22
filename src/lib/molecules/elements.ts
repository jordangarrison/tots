import type { Element } from './types';

// CPK-inspired palette tuned for the Rosé Pine dark theme so symbols stay readable.
export const ELEMENTS: Element[] = [
	{ symbol: 'H', name: 'Hydrogen', atomicNumber: 1, fill: '#f2efe7', text: '#191724' },
	{ symbol: 'C', name: 'Carbon', atomicNumber: 6, fill: '#3a3651', text: '#e0def4' },
	{ symbol: 'N', name: 'Nitrogen', atomicNumber: 7, fill: '#6aa0ff', text: '#0a1330' },
	{ symbol: 'O', name: 'Oxygen', atomicNumber: 8, fill: '#eb6f92', text: '#2a0a17' },
	{ symbol: 'F', name: 'Fluorine', atomicNumber: 9, fill: '#c5e478', text: '#1b2a08' },
	{ symbol: 'Na', name: 'Sodium', atomicNumber: 11, fill: '#c4a7e7', text: '#1f0f33' },
	{ symbol: 'Mg', name: 'Magnesium', atomicNumber: 12, fill: '#9ccfd8', text: '#0a2429' },
	{ symbol: 'Cl', name: 'Chlorine', atomicNumber: 17, fill: '#7ad58c', text: '#0d2918' },
	{ symbol: 'Ca', name: 'Calcium', atomicNumber: 20, fill: '#f6c177', text: '#332006' },
	{ symbol: 'Fe', name: 'Iron', atomicNumber: 26, fill: '#e88c4a', text: '#2a1305' }
];

export const ELEMENT_BY_SYMBOL: Record<string, Element> = Object.fromEntries(
	ELEMENTS.map((e) => [e.symbol, e])
);
