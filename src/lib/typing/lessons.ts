// Kid-friendly lesson plan.
//
// Pedagogy notes baked in (from typing-pedagogy research + Mavis Beacon style):
//   • Start at the HOME ROW with F and J — the keys with the bumps you can feel.
//   • Add one or two new keys at a time, then mix them with the keys already known.
//   • Build short single-key drills first; promote to real words once a few
//     home-row letters are known.
//   • Move home row → top row → bottom row → space → simple word mixes.
//   • Every drill stays SHORT (kid attention span) and only uses keys the
//     learner has already met. No surprise keys.
//
// The actual game is forgiving: wrong keys never penalize, the cursor just
// waits for the right one. Stars are awarded by accuracy, but finishing
// always earns at least one star.

import type { Lesson } from './types';

export const LESSONS: Lesson[] = [
	{
		id: 'home-fj',
		title: 'Bumpy Keys',
		description: 'Meet F and J — the keys with the little bumps!',
		emoji: '🟢',
		tier: 'home',
		newKeys: ['f', 'j'],
		reviewKeys: [],
		drills: [
			{ kind: 'keys', content: 'f f f f f', hint: 'Left pointer finger — feel the bump on F!' },
			{ kind: 'keys', content: 'j j j j j', hint: 'Right pointer finger — feel the bump on J!' },
			{ kind: 'keys', content: 'f j f j f j', hint: 'Bounce back and forth.' },
			{ kind: 'keys', content: 'fj jf fj jf' }
		]
	},
	{
		id: 'home-dk',
		title: 'Middle Magic',
		description: 'Add D and K with your middle fingers.',
		emoji: '🪄',
		tier: 'home',
		newKeys: ['d', 'k'],
		reviewKeys: ['f', 'j'],
		drills: [
			{ kind: 'keys', content: 'd d d d d', hint: 'Left middle finger.' },
			{ kind: 'keys', content: 'k k k k k', hint: 'Right middle finger.' },
			{ kind: 'keys', content: 'd k d k d k' },
			{ kind: 'keys', content: 'fd jk fd jk' }
		]
	},
	{
		id: 'home-sl',
		title: 'Ring Rings',
		description: 'Ring fingers stretch to S and L.',
		emoji: '💍',
		tier: 'home',
		newKeys: ['s', 'l'],
		reviewKeys: ['f', 'j', 'd', 'k'],
		drills: [
			{ kind: 'keys', content: 's s s s s', hint: 'Left ring finger.' },
			{ kind: 'keys', content: 'l l l l l', hint: 'Right ring finger.' },
			{ kind: 'keys', content: 'sl sl sl sl' },
			{
				kind: 'keys',
				content: 'asdf jkl;'.replace(/[a;]/g, '').trim().split('').join(' '),
				hint: 'All the ring + middle + index keys.'
			}
		]
	},
	{
		id: 'home-a-semi',
		title: 'Pinky Power',
		description: 'Tiny pinkies reach for A and ;.',
		emoji: '🤏',
		tier: 'home',
		newKeys: ['a', ';'],
		reviewKeys: ['s', 'd', 'f', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: 'a a a a a', hint: 'Left pinky — tiny but mighty.' },
			{ kind: 'keys', content: '; ; ; ; ;', hint: 'Right pinky.' },
			{ kind: 'keys', content: 'a s d f j k l ;', hint: 'The whole home row!' }
		]
	},
	{
		id: 'home-gh',
		title: 'Reach for G & H',
		description: 'Pointer fingers stretch one key in.',
		emoji: '🫳',
		tier: 'home',
		newKeys: ['g', 'h'],
		reviewKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
		drills: [
			{ kind: 'keys', content: 'g g g g g', hint: 'Left pointer slides over to G.' },
			{ kind: 'keys', content: 'h h h h h', hint: 'Right pointer slides over to H.' },
			{ kind: 'keys', content: 'fg jh fg jh' },
			{ kind: 'keys', content: 'a s d f g h j k l ;', hint: 'You can type the whole home row now!' }
		]
	},
	{
		id: 'home-words',
		title: 'Home Row Words',
		description: 'Tiny words made from your home-row friends.',
		emoji: '⭐',
		tier: 'words',
		newKeys: [],
		reviewKeys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
		drills: [
			{ kind: 'words', content: 'ask sad lad has', hint: 'Press space between words!' },
			{ kind: 'words', content: 'fall hall glad flask' },
			{ kind: 'words', content: 'dad lass half jaff' }
		]
	},
	{
		id: 'top-ei',
		title: 'Top Row: E & I',
		description: 'Middle fingers reach UP for E and I.',
		emoji: '⬆️',
		tier: 'top',
		newKeys: ['e', 'i'],
		reviewKeys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: 'e e e e e', hint: 'Left middle finger UP.' },
			{ kind: 'keys', content: 'i i i i i', hint: 'Right middle finger UP.' },
			{ kind: 'keys', content: 'ed ki ed ki' },
			{ kind: 'words', content: 'red kid she like' }
		]
	},
	{
		id: 'top-ru',
		title: 'Top Row: R & U',
		description: 'Pointer fingers stretch up.',
		emoji: '🚀',
		tier: 'top',
		newKeys: ['r', 'u'],
		reviewKeys: ['e', 'i', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: 'r r r r r', hint: 'Left pointer reaches up to R.' },
			{ kind: 'keys', content: 'u u u u u', hint: 'Right pointer reaches up to U.' },
			{ kind: 'words', content: 'sure fish hair ride' }
		]
	},
	{
		id: 'top-wo',
		title: 'Top Row: W & O',
		description: 'Ring fingers wave hello to W and O.',
		emoji: '🌊',
		tier: 'top',
		newKeys: ['w', 'o'],
		reviewKeys: ['r', 'u', 'e', 'i', 'a', 's', 'd', 'f', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: 'w w w w w', hint: 'Left ring finger UP.' },
			{ kind: 'keys', content: 'o o o o o', hint: 'Right ring finger UP.' },
			{ kind: 'words', content: 'wow look were word' }
		]
	},
	{
		id: 'top-qp',
		title: 'Top Row: Q & P',
		description: 'Pinkies climb to Q and P.',
		emoji: '👑',
		tier: 'top',
		newKeys: ['q', 'p'],
		reviewKeys: ['w', 'o', 'r', 'u', 'e', 'i', 'a', 's', 'd', 'f', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: 'q q q q q', hint: 'Left pinky UP.' },
			{ kind: 'keys', content: 'p p p p p', hint: 'Right pinky UP.' },
			{ kind: 'words', content: 'quiet paper pop pup' }
		]
	},
	{
		id: 'top-ty',
		title: 'Top Row: T & Y',
		description: 'The last two top-row keys!',
		emoji: '🎉',
		tier: 'top',
		newKeys: ['t', 'y'],
		reviewKeys: ['q', 'p', 'w', 'o', 'r', 'u', 'e', 'i', 'a', 's', 'd', 'f', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: 't t t t t', hint: 'Left pointer leans over to T.' },
			{ kind: 'keys', content: 'y y y y y', hint: 'Right pointer leans over to Y.' },
			{ kind: 'words', content: 'try yes typed yarn' }
		]
	},
	{
		id: 'bottom-vm',
		title: 'Bottom Row: V & M',
		description: 'Pointers reach DOWN.',
		emoji: '⬇️',
		tier: 'bottom',
		newKeys: ['v', 'm'],
		reviewKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', 'e', 'i', 'o', 'r', 'u'],
		drills: [
			{ kind: 'keys', content: 'v v v v v', hint: 'Left pointer reaches DOWN to V.' },
			{ kind: 'keys', content: 'm m m m m', hint: 'Right pointer reaches DOWN to M.' },
			{ kind: 'words', content: 'move five mom van' }
		]
	},
	{
		id: 'bottom-cn',
		title: 'Bottom Row: C & N',
		description: 'Middle and pointer dip down.',
		emoji: '🌙',
		tier: 'bottom',
		newKeys: ['c', 'n'],
		reviewKeys: ['v', 'm', 'a', 's', 'd', 'f', 'j', 'k', 'l', 'e', 'i', 'o'],
		drills: [
			{ kind: 'keys', content: 'c c c c c', hint: 'Left middle DOWN to C.' },
			{ kind: 'keys', content: 'n n n n n', hint: 'Right pointer DOWN to N.' },
			{ kind: 'words', content: 'cat nice can fun' }
		]
	},
	{
		id: 'bottom-xb',
		title: 'Bottom Row: X & B',
		description: 'Ring + pointer go low.',
		emoji: '🦕',
		tier: 'bottom',
		newKeys: ['x', 'b'],
		reviewKeys: ['c', 'n', 'v', 'm', 'a', 's', 'd', 'f', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: 'x x x x x', hint: 'Left ring DOWN to X.' },
			{ kind: 'keys', content: 'b b b b b', hint: 'Left pointer DOWN to B.' },
			{ kind: 'words', content: 'box bake fix bus' }
		]
	},
	{
		id: 'bottom-z',
		title: 'Bottom Row: Z & /',
		description: 'Sleepy pinkies head DOWN.',
		emoji: '😴',
		tier: 'bottom',
		newKeys: ['z', '/'],
		reviewKeys: ['x', 'b', 'c', 'n', 'v', 'm', 'a', 's', 'd', 'f', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: 'z z z z z', hint: 'Left pinky DOWN to Z.' },
			{ kind: 'keys', content: '/ / / / /', hint: 'Right pinky DOWN to the slash.' },
			{ kind: 'words', content: 'zip zone size buzz' }
		]
	},
	{
		id: 'space-words',
		title: 'Thumbs & Space',
		description: 'Thumbs press the long SPACE bar.',
		emoji: '👍',
		tier: 'space',
		newKeys: [' '],
		reviewKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', 'e', 'i', 'o', 't', 'h', 'n', 'r'],
		drills: [
			{
				kind: 'words',
				content: 'the and cat dog',
				hint: 'Tap SPACE with a thumb after each word.'
			},
			{ kind: 'words', content: 'i like cats and dogs' },
			{ kind: 'words', content: 'this is so fun to do' }
		]
	},
	{
		id: 'sentences',
		title: 'Tiny Sentences',
		description: 'Put it all together!',
		emoji: '🏆',
		tier: 'words',
		newKeys: [],
		reviewKeys: [
			'a',
			's',
			'd',
			'f',
			'g',
			'h',
			'j',
			'k',
			'l',
			'q',
			'w',
			'e',
			'r',
			't',
			'y',
			'u',
			'i',
			'o',
			'p',
			'z',
			'x',
			'c',
			'v',
			'b',
			'n',
			'm',
			' '
		],
		drills: [
			{ kind: 'words', content: 'a cat and a dog' },
			{ kind: 'words', content: 'i can type a lot' },
			{ kind: 'words', content: 'the quick fox jumps' }
		]
	}
];

export function findLesson(id: string): Lesson | undefined {
	return LESSONS.find((l) => l.id === id);
}

export function lessonIndex(id: string): number {
	return LESSONS.findIndex((l) => l.id === id);
}

export function nextLessonId(id: string): string | undefined {
	const i = lessonIndex(id);
	if (i < 0) return undefined;
	return LESSONS[i + 1]?.id;
}
