import type { Quest } from './types';

export const QUESTS: Quest[] = [
	{
		id: 'water',
		prompt: 'Make water.',
		hint: 'Two hydrogens, one oxygen.',
		target: 'H2O'
	},
	{
		id: 'exhale',
		prompt: 'Make the gas we breathe out.',
		hint: 'A carbon between two oxygens.',
		target: 'CO2'
	},
	{
		id: 'salt',
		prompt: 'Make table salt.',
		hint: 'Sodium plus chlorine.',
		target: 'ClNa'
	},
	{
		id: 'methane',
		prompt: 'Make the gas that cows burp.',
		hint: 'One carbon with four hydrogens.',
		target: 'CH4'
	},
	{
		id: 'ammonia',
		prompt: 'Make ammonia (smells like cleaning spray).',
		hint: 'One nitrogen with three hydrogens.',
		target: 'H3N'
	},
	{
		id: 'rust',
		prompt: 'Make rust.',
		hint: 'Two irons, three oxygens.',
		target: 'Fe2O3'
	},
	{
		id: 'oxygen',
		prompt: 'Make the gas we breathe in.',
		hint: 'A pair of oxygens.',
		target: 'O2'
	},
	{
		id: 'ozone',
		prompt: 'Make the gas that shields us from sunburns.',
		hint: 'Three oxygens together.',
		target: 'O3'
	},
	{
		id: 'vinegar',
		prompt: 'Make vinegar.',
		hint: 'Two carbons, four hydrogens, two oxygens.',
		target: 'C2H4O2'
	},
	{
		id: 'ethanol',
		prompt: 'Make the alcohol in beer.',
		hint: 'Two carbons, six hydrogens, one oxygen.',
		target: 'C2H6O'
	},
	{
		id: 'baking-soda',
		prompt: 'Make baking soda for cookies.',
		hint: 'Sodium, hydrogen, carbon, three oxygens.',
		target: 'CHNaO3'
	},
	{
		id: 'grill',
		prompt: 'Make the gas in a backyard grill tank.',
		hint: 'Three carbons, eight hydrogens.',
		target: 'C3H8'
	},
	{
		id: 'rotten-egg',
		prompt: 'Make the rotten-egg smell.',
		hint: 'Two hydrogens and a sulfur.',
		target: 'H2S'
	},
	{
		id: 'pee',
		prompt: 'Make urea (the main stuff in pee).',
		hint: 'One carbon, one oxygen, two nitrogens, four hydrogens.',
		target: 'CH4N2O'
	},
	{
		id: 'aspirin',
		prompt: 'Make aspirin (for headaches).',
		hint: 'Nine carbons, eight hydrogens, four oxygens.',
		target: 'C9H8O4'
	},
	{
		id: 'caffeine',
		prompt: 'Make the molecule in coffee.',
		hint: 'Eight carbons, ten hydrogens, four nitrogens, two oxygens.',
		target: 'C8H10N4O2'
	},
	{
		id: 'sugar',
		prompt: 'Make the sugar in fruit.',
		hint: 'Six carbons, twelve hydrogens, six oxygens.',
		target: 'C6H12O6'
	},
	{
		id: 'vitamin-c',
		prompt: 'Make the vitamin in oranges.',
		hint: 'Six carbons, eight hydrogens, six oxygens.',
		target: 'C6H8O6'
	}
];
