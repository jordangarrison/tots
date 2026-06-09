// All conversation content for the Kingdom: greetings, personality chatter,
// contextual flavor lines, and fetch-errand (quest) templates. Pure data +
// selection logic — no DOM, no canvas — so it is safe to import anywhere.
//
// Pages are short bubbles of text (1-2 small sentences, ~5-year-old reading
// level). Selection uses Math.random: pseudo-random but stable within a call.

import type { CharacterId } from '$lib/characters';
import type { ActiveQuest, AreaId, Inventory, ItemId } from './types';

export interface DialogueContext {
	npc: CharacterId;
	playerId: CharacterId;
	playerName: string;
	areaId: AreaId;
	hearts: number; // 0..MAX_HEARTS (5)
	inventory: Inventory;
	activeQuest: ActiveQuest | null; // this NPC’s errand, if any
	questsDone: number; // total errands the player has completed
	firstMeeting: boolean; // very first time ever talking to this NPC
}

export interface QuestTemplate {
	id: string; // unique across all templates, stable (saved in localStorage)
	npc: CharacterId;
	itemId: ItemId;
	count: number; // 1..3
	offer: string[]; // pages spoken when offering the errand
	reminder: string[]; // pages while in progress
	complete: string[]; // pages when handing the items in
	rewardItemId: ItemId;
	rewardCount: number;
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function pick<T>(list: T[]): T {
	return list[Math.floor(Math.random() * list.length)];
}

function chance(p: number): boolean {
	return Math.random() < p;
}

const NUM_WORDS = ['zero', 'one', 'two', 'three'];

function numWord(n: number): string {
	return NUM_WORDS[n] ?? String(n);
}

const ITEM_WORDS: Record<ItemId, { one: string; many: string }> = {
	rose: { one: 'rose', many: 'roses' },
	lavender: { one: 'lavender sprig', many: 'lavender sprigs' },
	fish: { one: 'fish', many: 'fish' },
	tulip: { one: 'tulip', many: 'tulips' },
	seed: { one: 'bluebonnet seed', many: 'bluebonnet seeds' },
	berry: { one: 'berry', many: 'berries' },
	shell: { one: 'seashell', many: 'seashells' },
	butterfly: { one: 'butterfly', many: 'butterflies' },
	muffin: { one: 'muffin', many: 'muffins' }
};

/** "one rose" / "two seashells" — for handing rewards over. */
function itemPhrase(itemId: ItemId, n: number): string {
	const w = ITEM_WORDS[itemId];
	return n === 1 ? `one ${w.one}` : `${numWord(n)} ${w.many}`;
}

/** "one more berry" / "two more berries" — for reminders. */
function needPhrase(itemId: ItemId, remaining: number): string {
	const w = ITEM_WORDS[itemId];
	return remaining === 1 ? `one more ${w.one}` : `${numWord(remaining)} more ${w.many}`;
}

/** Expand {name}, and (when a template is given) {need} and {reward}. */
function fill(page: string, ctx: DialogueContext, t?: QuestTemplate, remaining = 0): string {
	let out = page.replace(/\{name\}/g, ctx.playerName);
	if (t) {
		out = out
			.replace(/\{need\}/g, needPhrase(t.itemId, remaining))
			.replace(/\{reward\}/g, itemPhrase(t.rewardItemId, t.rewardCount));
	}
	return out;
}

/* ------------------------------------------------------------------ */
/* Voices                                                              */
/* ------------------------------------------------------------------ */

interface Line {
	text: string;
	/** This line mentions a family member — skipped when the player IS them. */
	about?: CharacterId;
}

interface FlavorRule {
	when: (ctx: DialogueContext) => boolean;
	lines: Line[];
}

interface Voice {
	/** First-ever meeting, 2-3 pages. {name} allowed. */
	intro: string[];
	/** Greetings: hearts 0-1, 2-3, 4-5. */
	hello: Line[];
	friend: Line[];
	best: Line[];
	/** Personality chatter, family gossip, gentle gameplay tips. */
	chatter: Line[];
	/** Extra chatter once the player has done a few errands. */
	praise: string;
	/** Reminder shown when the player already holds everything needed. */
	allFound: string;
	/** Context-aware lines (at most one per chat). */
	flavor: FlavorRule[];
}

const VOICES: Record<CharacterId, Voice> = {
	jane: {
		intro: [
			'Oh, hello! You must be {name}! I’m Jane — I grow all the roses here. 🌹',
			'If you ever want to plant one, come find me. I’ll show you how!',
			'I just know we’re going to be great friends.'
		],
		hello: [
			{ text: 'Hello there! Lovely day for the garden, isn’t it?' },
			{ text: 'Oh, hi! I was just smelling the roses. Want to smell too? 🌹' },
			{ text: 'Welcome, welcome! The kingdom is extra pretty today.' },
			{ text: 'Hello! If you see a droopy rose, give it a kind word. It helps!' }
		],
		friend: [
			{ text: '{name}! I was hoping you’d come by today.' },
			{ text: 'Hi {name}! Want a secret? Roses grow faster when you hum to them.' },
			{ text: 'There you are! The garden feels happier when you’re in it.' },
			{ text: 'Hi friend! I saved the prettiest rose to show you today. 🌹' }
		],
		best: [
			{ text: '{name}! My very best friend! Hooray, hooray!' },
			{ text: 'I told the roses you were coming. I think they bloomed extra. 🌹' },
			{ text: 'Best-friend hug! Gentle, gentle. Now — what shall we do today?' },
			{ text: 'You and me, {name}. Best gardeners in the whole kingdom.' }
		],
		chatter: [
			{ text: 'Have you visited Isla’s meadow? It smells like sleep-time.', about: 'isla' },
			{ text: 'Ollie buried a stick by my roses again. I left it. He loves it so.', about: 'ollie' },
			{ text: 'Berry Woods is just past my garden. Butterflies live there! 🦋' },
			{ text: 'Plant a rose seed and wait a little. Good things take time.' },
			{ text: 'Mommy’s bluebonnets are for looking, not picking. That’s the rule!', about: 'mommy' }
		],
		praise: 'Everyone keeps talking about your kind helping, {name}. I’m so proud.',
		allFound: 'Oh! You have everything already! Come here — let me see! 🌹',
		flavor: [
			{
				when: (c) => c.inventory.rose > 0,
				lines: [
					{ text: 'Your roses are beautiful! You picked them at just the right time. 🌹' },
					{ text: 'I can smell your roses from here. Lovely!' }
				]
			},
			{
				when: (c) => c.areaId === 'rose-garden',
				lines: [
					{ text: 'Welcome to my rose garden! Plant a seed, wait a little, then pick! 🌹' },
					{ text: 'Careful of the thorns, okay? Roses are sweet but pointy.' }
				]
			},
			{
				when: (c) => c.inventory.shell > 0,
				lines: [{ text: 'A seashell! Hold it to your ear — you can hear the waves. 🐚' }]
			},
			{
				when: (c) => c.inventory.butterfly > 0,
				lines: [{ text: 'A butterfly! It must like you. They only follow gentle friends. 🦋' }]
			},
			{
				when: (c) => c.inventory.berry > 0,
				lines: [{ text: 'Ooh, berries! You found the woods behind my garden, didn’t you? 🫐' }]
			}
		]
	},

	isla: {
		intro: [
			'Hi hi! Are you {name}? I’m Isla! I live by the lavender. 💜',
			'Smell the air! It’s purple. That’s my favorite smell.',
			'Come play with me any time, okay? Hee hee!'
		],
		hello: [
			{ text: 'Hi! Hee hee. You walked right up to me!' },
			{ text: 'Hello! Do you like purple? I LOVE purple. 💜' },
			{ text: 'Hi there! I’m sniffing flowers. Want to sniff with me?' },
			{ text: 'Ooh, hello! Your shoes look fast today.' }
		],
		friend: [
			{ text: '{name}! Yay! I was JUST thinking about you!' },
			{ text: 'Hi {name}! Secret: bees take naps inside flowers. Tiny naps!' },
			{ text: 'You came back! Hee hee! Let’s smell ALL the flowers.' },
			{ text: 'Hi hi {name}! I found a rock today. It was so round. 💜' }
		],
		best: [
			{ text: '{name}!! My best best friend! Hee hee hee!' },
			{ text: 'I saved you the comfiest spot in the meadow. It’s extra soft.' },
			{ text: 'You smell like adventures, {name}! Tell me everything!' },
			{ text: 'Best friends forever, okay? Pinky promise. 💜' }
		],
		chatter: [
			{ text: 'Lavender always grows back after you pick it. Isn’t that magic?' },
			{ text: 'Ollie let me throw his stick. He brought it back nine times!', about: 'ollie' },
			{ text: 'Jane hums to her roses. I tried humming to a rock. It liked it!', about: 'jane' },
			{ text: 'The bakery smells like warm hugs. Two berries make one muffin! 🧁' },
			{ text: 'Daddy’s tulips go POOF if you’re slow. Be speedy-quick!', about: 'daddy' }
		],
		praise: 'You help EVERYBODY, {name}. You’re like sunshine with shoes.',
		allFound: '*gasp* You have ALL of them! Hee hee! Gimme gimme! 💜',
		flavor: [
			{
				when: (c) => c.inventory.lavender > 0,
				lines: [
					{ text: 'You have lavender! Smell it! Doesn’t it smell purple? 💜' },
					{ text: 'Lavender! Hold it close and take a biiiig sniff.' }
				]
			},
			{
				when: (c) => c.areaId === 'lavender-meadow',
				lines: [
					{ text: 'Welcome to my meadow! Pick lavender — it always grows back. 💜' },
					{ text: 'Shh — hear the bees? They’re singing the buzzy song.' }
				]
			},
			{
				when: (c) => c.inventory.shell > 0,
				lines: [{ text: 'A seashell! It’s swirly like a tiny purple slide! 🐚' }]
			},
			{
				when: (c) => c.inventory.butterfly > 0,
				lines: [{ text: 'A butterfly friend! What color are its wings? I bet ALL of them. 🦋' }]
			},
			{
				when: (c) => c.inventory.muffin > 0,
				lines: [{ text: 'A muffin! It smells like warm hugs. Lucky you! 🧁' }]
			}
		]
	},

	ollie: {
		intro: [
			'*sniff sniff* New friend! Are you {name}? I’m Ollie! Woof!',
			'I love fish. And sticks. And the pond. And YOU now too!',
			'*wags whole body* My tail is small but it is SO happy.'
		],
		hello: [
			{ text: 'Woof! Hi! Hi hi hi!' },
			{ text: '*sniff sniff* You smell nice. Like outside!' },
			{ text: 'Hello! I am being SO good right now. See? Sitting.' },
			{ text: '*wags* A visitor! Best day. Best day!' }
		],
		friend: [
			{ text: '{name}! WOOF! You came back! You always come back!' },
			{ text: 'Hi {name}! I saved you a stick. It’s the second-best one.' },
			{ text: '*happy spin* It’s you! It’s you! Okay. Okay. I’m calm. Hi.' },
			{ text: '{name}! Want to watch the fish? They go blub blub. 🐟' }
		],
		best: [
			{ text: '{name}!! BEST FRIEND ALERT! Woof woof!' },
			{ text: 'I saved you the BEST stick. Number one stick. It’s yours.' },
			{ text: '*flops over* Belly rubs are for best friends only. That’s you!' },
			{ text: 'You + me + the pond = best day ever. Every time. 🐟' }
		],
		chatter: [
			{ text: 'The beach is past my pond! Sand! Shells! Waves go whoosh! 🐚' },
			{ text: 'Face the water. Press SPACE. Wait wait wait... FISH! That’s fishing.' },
			{ text: 'Isla threw my stick nine times. Nine! She’s so good at it.', about: 'isla' },
			{ text: 'I dug a hole today. Then I filled it back in. Busy busy.' },
			{ text: 'Daddy says I’m a good boy. He is correct. *wags*', about: 'daddy' }
		],
		praise: 'You help everybody, {name}! You’re a good... person! Woof!',
		allFound: '*sniff sniff* WAIT. You have ALL of them?! WOOF! Gimme!',
		flavor: [
			{
				when: (c) => c.inventory.fish > 0,
				lines: [
					{ text: '*sniff sniff* FISH! You smell like fish! That’s the BEST smell! 🐟' },
					{ text: 'You have a fish! I am drooling. Just a little. Woof.' }
				]
			},
			{
				when: (c) => c.areaId === 'pond',
				lines: [
					{ text: 'This is MY pond! The fish know me. We’re friends.' },
					{ text: 'Want to fish? Face the water and press SPACE. Then wait! 🐟' }
				]
			},
			{
				when: (c) => c.inventory.shell > 0,
				lines: [{ text: '*sniff* A shell! Beach smell! The beach is past my pond! 🐚' }]
			},
			{
				when: (c) => c.inventory.butterfly > 0,
				lines: [{ text: 'A butterfly?! I chase those! I never catch them. You DID?! Woof!' }]
			},
			{
				when: (c) => c.inventory.muffin > 0,
				lines: [{ text: '*sniff sniff sniff* MUFFIN. I am sitting SO nicely right now. 🧁' }]
			}
		]
	},

	mommy: {
		intro: [
			'Well hello, sweetheart! You must be {name}. I’m Mommy.',
			'I tend the bluebonnets. We look at them — we never pick. That’s my rule!',
			'If you’re ever hungry, find me at the Sweet Bakery. 🧁'
		],
		hello: [
			{ text: 'Hello, sweetheart. Have you had some water today? Good.' },
			{ text: 'Hi, little one. The bluebonnets and I are glad to see you.' },
			{ text: 'Welcome, dear. Mind the flower beds as you play.' },
			{ text: 'Hello, love. Don’t forget to stop and smell the flowers.' }
		],
		friend: [
			{ text: '{name}, sweetheart! Come here — let me look at you. So big!' },
			{ text: 'Hi {name}! I baked this morning. The whole castle smells lovely. 🧁' },
			{ text: 'There’s my helper! The garden missed you.' },
			{ text: 'Hello, dear. Secret: I sing to the bluebonnets when no one’s looking.' }
		],
		best: [
			{ text: '{name}, my sunshine! Biggest hug. Arms out!' },
			{ text: 'I love you to the moon, {name}. Now — shall we find an adventure?' },
			{ text: 'My very favorite visitor! Don’t tell the bluebonnets. They get jealous.' },
			{ text: 'Sweetheart! I saved you the warmest spot by the oven. 🧁' }
		],
		chatter: [
			{ text: 'Take seeds from the bin and plant them. Bluebonnets love new friends.' },
			{ text: 'Remember: bluebonnets are for looking, never picking. Thank you, love.' },
			{ text: 'The Sweet Bakery is off the courtyard. Two berries bake one muffin! 🧁' },
			{ text: 'Daddy tried to count his tulips. They vanished before he hit three!', about: 'daddy' },
			{ text: 'Jane gives the gentlest hugs. Mind the roses when you hug back.', about: 'jane' }
		],
		praise: 'You’ve been helping everyone, {name}. That makes my heart so full.',
		allFound: 'Oh sweetheart — you found them all already! Come here!',
		flavor: [
			{
				when: (c) => c.inventory.berry > 0,
				lines: [
					{ text: 'Berries! Those would bake into a lovely muffin, you know. 🫐' },
					{ text: 'Ooh, berries! Bring them to the bakery oven sometime. 🧁' }
				]
			},
			{
				when: (c) => c.areaId === 'bluebonnet-garden',
				lines: [{ text: 'Welcome to my bluebonnets. We look with our eyes, not our hands.' }]
			},
			{
				when: (c) => c.areaId === 'bakery',
				lines: [{ text: 'Doesn’t the oven smell wonderful? Pop in two berries — one muffin! 🧁' }]
			},
			{
				when: (c) => c.inventory.muffin > 0,
				lines: [{ text: 'You baked a muffin! Clever you. Share a bite with someone you love. 🧁' }]
			},
			{
				when: (c) => c.inventory.shell > 0,
				lines: [{ text: 'What a pretty shell, dear. The beach tucks them in the sand for us. 🐚' }]
			},
			{
				when: (c) => c.inventory.fish > 0,
				lines: [
					{ text: 'A fish! Shall we cook it for supper? Ollie will beg, you know.', about: 'ollie' },
					{ text: 'A fish! What a fine catch, sweetheart. 🐟' }
				]
			}
		]
	},

	daddy: {
		intro: [
			'Ho ho! A new face! You must be {name}! I’m Daddy — King of Tulips! 🌷',
			'Tulips pop up and vanish quick as a sneeze. Blink and they’re gone!',
			'Welcome to the kingdom! I’m already proud of you. That’s how I work.'
		],
		hello: [
			{ text: 'Ho ho! Hello there, young adventurer!' },
			{ text: 'Welcome, welcome! Mind the tulips — they’re sneaky.' },
			{ text: 'Hello! You’re just in time. For what? Anything!' },
			{ text: 'Greetings! A fine day for being royal, eh?' }
		],
		friend: [
			{ text: '{name}! Just who I wanted to see! It’s always you, by the way.' },
			{ text: 'Hi {name}! I almost caught two tulips at once today. ALMOST.' },
			{ text: 'Ah, my favorite helper! Don’t tell the tulips. They gossip.' },
			{ text: 'Ho ho, {name}! Did you grow taller? You did. I’m sure of it.' }
		],
		best: [
			{ text: '{name}, my legend! Give me five! Up high!' },
			{ text: 'Best friend of the King! That’s you. It comes with zero chores.' },
			{ text: 'I’m SO proud of you, {name}. I tell everyone. Constantly.' },
			{ text: 'There’s my hero! The tulips bow when you walk by. I taught them. 🌷' }
		],
		chatter: [
			{ text: 'Tulips vanish fast — grab them quick as a wink! 🌷' },
			{ text: 'Mommy’s rule: bluebonnets are for looking, not picking. Wise queen!', about: 'mommy' },
			{ text: 'Ollie helped me garden today. There are three new holes.', about: 'ollie' },
			{ text: 'The beach has the best sand. I built a castle. A tiny one. 🐚' },
			{ text: 'Try a muffin from the Sweet Bakery. Royal taste buds approve! 🧁' }
		],
		praise: 'Helping everyone, eh {name}? That’s my hero. SO proud!',
		allFound: 'Ho ho! You found every single one already?! Hand them here!',
		flavor: [
			{
				when: (c) => c.inventory.tulip > 0,
				lines: [{ text: 'You caught a tulip before it vanished! Quick hands! Royal hands! 🌷' }]
			},
			{
				when: (c) => c.areaId === 'tulip-garden',
				lines: [{ text: 'Welcome to the tulip garden! They pop up, then POOF. Be speedy! 🌷' }]
			},
			{
				when: (c) => c.inventory.fish > 0,
				lines: [{ text: 'A fish! Fine catch! We’ll make a fisher-knight of you yet. 🐟' }]
			},
			{
				when: (c) => c.inventory.butterfly > 0,
				lines: [{ text: 'A butterfly! It likes you. Smart butterfly. 🦋' }]
			},
			{
				when: (c) => c.inventory.shell > 0,
				lines: [{ text: 'A seashell! Did the waves go whoosh? They always do. 🐚' }]
			},
			{
				when: (c) => c.inventory.berry > 0,
				lines: [{ text: 'Berries! Don’t eat them ALL before the bakery, ho ho. 🫐' }]
			}
		]
	}
};

/** Pick a line, skipping lines that mention the player’s own character. */
function pickLine(lines: Line[], ctx: DialogueContext): string {
	const usable = lines.filter((l) => !l.about || l.about !== ctx.playerId);
	return pick(usable.length > 0 ? usable : lines).text;
}

function flavorLine(ctx: DialogueContext): string | null {
	const candidates: Line[] = [];
	for (const rule of VOICES[ctx.npc].flavor) {
		if (!rule.when(ctx)) continue;
		for (const line of rule.lines) {
			if (!line.about || line.about !== ctx.playerId) candidates.push(line);
		}
	}
	return candidates.length > 0 ? pick(candidates).text : null;
}

function chatterLine(ctx: DialogueContext): string {
	const v = VOICES[ctx.npc];
	const pool = [...v.chatter];
	if (ctx.questsDone >= 3) pool.push({ text: v.praise });
	return pickLine(pool, ctx);
}

/* ------------------------------------------------------------------ */
/* Public selection API                                                */
/* ------------------------------------------------------------------ */

/** Pages for a normal chat: greeting + personality chatter, picked for this context. */
export function greetingPages(ctx: DialogueContext): string[] {
	const v = VOICES[ctx.npc];
	if (ctx.firstMeeting) return v.intro.map((p) => fill(p, ctx));

	const tier = ctx.hearts >= 4 ? v.best : ctx.hearts >= 2 ? v.friend : v.hello;
	const pages: string[] = [fill(pickLine(tier, ctx), ctx)];

	// At most one contextual flavor line per chat, then maybe a bit of chatter.
	const flavor = flavorLine(ctx);
	if (flavor && chance(0.7)) pages.push(fill(flavor, ctx));
	if (pages.length < 3 && chance(pages.length === 1 ? 0.6 : 0.25)) {
		const extra = fill(chatterLine(ctx), ctx);
		if (!pages.includes(extra)) pages.push(extra);
	}
	return pages.slice(0, 3);
}

/* ------------------------------------------------------------------ */
/* Quests                                                              */
/* ------------------------------------------------------------------ */

const QUESTS: QuestTemplate[] = [
	// --- Jane: rewards roses -----------------------------------------
	{
		id: 'jane-lavender-1',
		npc: 'jane',
		itemId: 'lavender',
		count: 2,
		offer: [
			'I want to make a sweet-smelling posy for the castle table.',
			'Could you bring me two lavender sprigs from the meadow? 💜',
			'Thank you! You’re a dear.'
		],
		reminder: [
			'Lavender grows in the meadow — and it regrows after you pick it!',
			'Just {need} to go. You’re doing great!'
		],
		complete: [
			'Lavender! It smells like a lullaby. Thank you, {name}!',
			'Here — {reward} from my garden, just for you. 🌹'
		],
		rewardItemId: 'rose',
		rewardCount: 1
	},
	{
		id: 'jane-shell-1',
		npc: 'jane',
		itemId: 'shell',
		count: 2,
		offer: [
			'I’ve never seen the ocean up close. Isn’t that funny?',
			'Would you bring me two seashells from Beach Cove? 🐚',
			'I’ll listen for the waves inside them. Thank you!'
		],
		reminder: ['Shells hide in the sand at Beach Cove, past the pond.', 'Only {need} to find!'],
		complete: [
			'Seashells! I can hear the whole ocean. Oh, thank you, {name}!',
			'Take {reward} from my best bush. You earned them! 🌹'
		],
		rewardItemId: 'rose',
		rewardCount: 2
	},
	{
		id: 'jane-butterfly-1',
		npc: 'jane',
		itemId: 'butterfly',
		count: 1,
		offer: [
			'A butterfly landed on my watering can once. I still think about it.',
			'Could you catch one butterfly in Berry Woods for me? Gently! 🦋',
			'We’ll say hello, then let it go. Thank you!'
		],
		reminder: [
			'Butterflies flutter in Berry Woods, past my garden. SPACE to catch!',
			'Still {need} to catch. Soft and slow!'
		],
		complete: [
			'Oh! Hello, little butterfly. Hello! Okay — off you flutter. 🦋',
			'That was magic. Take {reward}, {name}. You’re wonderful.'
		],
		rewardItemId: 'rose',
		rewardCount: 2
	},
	{
		id: 'jane-berry-1',
		npc: 'jane',
		itemId: 'berry',
		count: 3,
		offer: [
			'I’d love to bake something sweet for the family.',
			'Could you pick three berries in Berry Woods for me? 🫐',
			'It’s just past my garden. Thank you, sweet friend!'
		],
		reminder: ['Berry bushes grow in the woods behind my roses.', '{need} to go — happy picking!'],
		complete: [
			'Berries! Round and perfect. The muffins will be dreamy. 🫐',
			'Here’s {reward} for my favorite berry-picker. 🌹'
		],
		rewardItemId: 'rose',
		rewardCount: 1
	},

	// --- Isla: rewards lavender --------------------------------------
	{
		id: 'isla-rose-1',
		npc: 'isla',
		itemId: 'rose',
		count: 2,
		offer: [
			'I want to see if roses smell pink. I think they do!',
			'Will you bring me two roses? Hee hee! 🌹',
			'Sniff test! It’s very scientific. Thank you!'
		],
		reminder: ['Roses grow in the rose garden. Plant, wait, pick!', '{need} to go! My nose is ready.'],
		complete: [
			'*sniiiff* Yes! Roses DO smell pink! I knew it! 🌹',
			'Here’s {reward} so you can smell purple too. 💜'
		],
		rewardItemId: 'lavender',
		rewardCount: 2
	},
	{
		id: 'isla-shell-1',
		npc: 'isla',
		itemId: 'shell',
		count: 3,
		offer: [
			'Shells are like little ears for the ocean!',
			'Can you find me three seashells at Beach Cove? 🐚',
			'I’m going to listen to ALL of them. Thank you!'
		],
		reminder: [
			'Beach Cove is past the pond. Shells hide in the sand!',
			'Only {need} to find. Hee hee!'
		],
		complete: [
			'*listens* Whoooosh! This one has the best whoosh! 🐚',
			'Take {reward} from my meadow. Sniff it when you’re sleepy. 💜'
		],
		rewardItemId: 'lavender',
		rewardCount: 1
	},
	{
		id: 'isla-butterfly-1',
		npc: 'isla',
		itemId: 'butterfly',
		count: 1,
		offer: [
			'Butterflies are flowers that learned to fly. That’s what I think!',
			'Could you catch one butterfly in Berry Woods? Be gentle! 🦋',
			'I just want to see its colors up close. Thank you!'
		],
		reminder: [
			'Butterflies live in Berry Woods, past the roses. Sneak up sloooow!',
			'{need} to catch. Tiptoe, tiptoe!'
		],
		complete: [
			'Ooooh. Its wings have ALL the colors. Hello, tiny friend! 🦋',
			'Okay, fly free! And {reward} for you, hee hee. 💜'
		],
		rewardItemId: 'lavender',
		rewardCount: 2
	},
	{
		id: 'isla-muffin-1',
		npc: 'isla',
		itemId: 'muffin',
		count: 1,
		offer: [
			'I smelled something amazing from the bakery today.',
			'Could you bake me one muffin? Two berries go in the oven! 🧁',
			'I will eat it so politely. Hee hee. Thank you!'
		],
		reminder: [
			'Pick berries in Berry Woods, then bake them in the bakery oven.',
			'{need} to bake. It’ll smell SO good.'
		],
		complete: [
			'*biiiig sniff* Warm hugs! It smells like warm hugs! 🧁',
			'Nom. NOM. Okay — {reward} for the best baker ever! 💜'
		],
		rewardItemId: 'lavender',
		rewardCount: 2
	},

	// --- Ollie: rewards fish -----------------------------------------
	{
		id: 'ollie-tulip-1',
		npc: 'ollie',
		itemId: 'tulip',
		count: 1,
		offer: [
			'*sniff sniff* I smelled a flower today. It went POOF before I licked it!',
			'Can you grab me one tulip? They’re fast! You’re faster! 🌷',
			'Woof! Thank you thank you!'
		],
		reminder: [
			'Tulips pop up in the tulip garden. Grab them QUICK before they poof!',
			'{need} to grab. Zoom zoom!'
		],
		complete: [
			'A TULIP! *sniff* It smells like sunshine. I won’t eat it. Promise. 🌷',
			'Here — {reward} from my pond! I caught it myself! 🐟'
		],
		rewardItemId: 'fish',
		rewardCount: 1
	},
	{
		id: 'ollie-berry-1',
		npc: 'ollie',
		itemId: 'berry',
		count: 2,
		offer: [
			'Berries! I love berries! They bounce when you drop them!',
			'Will you pick me two berries from Berry Woods? Woof? 🫐',
			'I’ll do my best trick when you’re back! Thank you!'
		],
		reminder: [
			'Berry Woods is behind the rose garden! Bushes full of bouncy berries!',
			'{need} to go! *wags*'
		],
		complete: [
			'BERRIES! *bounce* *chomp* So bouncy! So yummy! 🫐',
			'You get {reward}! Fresh from the pond! Woof! 🐟'
		],
		rewardItemId: 'fish',
		rewardCount: 1
	},
	{
		id: 'ollie-shell-1',
		npc: 'ollie',
		itemId: 'shell',
		count: 2,
		offer: [
			'*sniff* The beach has shells! I tried to dig them ALL up. Too many!',
			'Bring me two seashells? They’re past my pond, in the sand! 🐚',
			'Woof woof! You’re the best!'
		],
		reminder: [
			'Shells hide in the sand at Beach Cove! Dig— I mean, look around!',
			'{need} left! Sniff them out!'
		],
		complete: [
			'SHELLS! *sniff sniff* They smell like waves and adventure! 🐚',
			'Take {reward}! I caught extra just for you! 🐟'
		],
		rewardItemId: 'fish',
		rewardCount: 2
	},
	{
		id: 'ollie-muffin-1',
		npc: 'ollie',
		itemId: 'muffin',
		count: 1,
		offer: [
			'*sniiiiff* The bakery smells AMAZING. I’m not allowed on the counter.',
			'Could you bake me one muffin? Pleeeease? I’ll sit so nicely! 🧁',
			'Look how nicely I’m sitting. Woof. Thank you!'
		],
		reminder: [
			'Two berries + the bakery oven = one muffin! I did the math. Woof.',
			'{need} to bake. I believe in you!'
		],
		complete: [
			'MUFFIN! *chomp* *happy spin* Best day! BEST DAY! 🧁',
			'Here — {reward}! Pond-fresh! Best friend trade! 🐟'
		],
		rewardItemId: 'fish',
		rewardCount: 2
	},

	// --- Mommy: rewards muffins and bluebonnet seeds ------------------
	{
		id: 'mommy-berry-1',
		npc: 'mommy',
		itemId: 'berry',
		count: 2,
		offer: [
			'Sweetheart, I’m baking today, but my berry basket is empty!',
			'Would you pick two berries from Berry Woods for me? 🫐',
			'We’ll share whatever we bake. Thank you, love!'
		],
		reminder: [
			'Berry Woods is behind the rose garden. The bushes are full!',
			'{need} to go, sweetheart.'
		],
		complete: [
			'Perfect berries! Into the oven they go... and... done! 🧁',
			'Here — {reward}, baked with love. Mind the warm bottom!'
		],
		rewardItemId: 'muffin',
		rewardCount: 1
	},
	{
		id: 'mommy-lavender-1',
		npc: 'mommy',
		itemId: 'lavender',
		count: 2,
		offer: [
			'I’d love a bit of lavender to dry by the hearth. It smells so calm.',
			'Could you pick two lavender sprigs from the meadow? 💜',
			'Thank you, sweetheart. Take your time.'
		],
		reminder: [
			'Lavender regrows after picking — the meadow always has more. 💜',
			'Just {need}, my love.'
		],
		complete: [
			'Mmm. The cottage will smell like calm evenings now. Thank you. 💜',
			'Here — {reward} for your own little garden.'
		],
		rewardItemId: 'seed',
		rewardCount: 2
	},
	{
		id: 'mommy-fish-1',
		npc: 'mommy',
		itemId: 'fish',
		count: 1,
		offer: [
			'I’m making supper tonight — something tasty for the whole family.',
			'Could you catch one fish at the pond for me? 🐟',
			'Careful by the water, love. Thank you!'
		],
		reminder: [
			'Face the pond water and press SPACE to cast. Then be patient!',
			'{need} to catch, sweetheart.'
		],
		complete: [
			'What a catch! Supper will be delicious tonight. 🐟',
			'Take {reward} — plant them and watch the blue arrive.'
		],
		rewardItemId: 'seed',
		rewardCount: 2
	},
	{
		id: 'mommy-tulip-1',
		npc: 'mommy',
		itemId: 'tulip',
		count: 2,
		offer: [
			'A vase of tulips would make the kitchen so cheerful!',
			'Could you grab two tulips before they vanish? Quick fingers! 🌷',
			'Thank you, sweetheart. Be speedy!'
		],
		reminder: [
			'Tulips pop up in the tulip garden and vanish fast. You can do it!',
			'{need} to grab, love.'
		],
		complete: [
			'Oh, how cheerful! The kitchen is smiling already. 🌷',
			'Here — {reward}, still warm from the oven. 🧁'
		],
		rewardItemId: 'muffin',
		rewardCount: 1
	},

	// --- Daddy: rewards tulips ----------------------------------------
	{
		id: 'daddy-fish-1',
		npc: 'daddy',
		itemId: 'fish',
		count: 2,
		offer: [
			'Ho ho! A king cannot fish. The crown falls in the pond. Every time.',
			'Could you catch two fish for me at the pond? 🐟',
			'A royal feast awaits! Thank you, brave fisher!'
		],
		reminder: [
			'Face the water, press SPACE, and wait for the bite!',
			'{need} to catch! The royal pan is ready.'
		],
		complete: [
			'FISH! Magnificent! Tonight we feast like... well, like kings! 🐟',
			'Here — {reward} from the royal garden. Grabbed it mid-poof! 🌷'
		],
		rewardItemId: 'tulip',
		rewardCount: 1
	},
	{
		id: 'daddy-rose-1',
		npc: 'daddy',
		itemId: 'rose',
		count: 1,
		offer: [
			'I want to surprise someone I love with a rose. Shh — top secret!',
			'Could you bring me one rose from the rose garden? 🌹',
			'You’re officially a Royal Secret Keeper. Thank you!'
		],
		reminder: [
			'Roses grow in the rose garden. Plant a seed, wait, then pick!',
			'{need} to go, Secret Keeper!'
		],
		complete: [
			'The secret rose! Operation Surprise is GO. Ho ho ho! 🌹',
			'Your reward: {reward}! Caught them mid-poof myself. 🌷'
		],
		rewardItemId: 'tulip',
		rewardCount: 2
	},
	{
		id: 'daddy-muffin-1',
		npc: 'daddy',
		itemId: 'muffin',
		count: 1,
		offer: [
			'I smelled the bakery and now I think about muffins. All day. Help.',
			'Could you bake one muffin for your hungry king? 🧁',
			'Two berries, one oven, one happy Daddy. Thank you!'
		],
		reminder: [
			'Berries grow in Berry Woods. The bakery oven bakes two into a muffin!',
			'{need} to bake! I can almost smell it...'
		],
		complete: [
			'A MUFFIN! *royal chomp* Mmmf. Delicious. You’re a hero. 🧁',
			'Take {reward}! Speedy hands, royal flowers! 🌷'
		],
		rewardItemId: 'tulip',
		rewardCount: 2
	},
	{
		id: 'daddy-shell-1',
		npc: 'daddy',
		itemId: 'shell',
		count: 3,
		offer: [
			'I’m building a tiny sandcastle. A castle this grand needs decorations!',
			'Would you find three seashells at Beach Cove? 🐚',
			'It will be the fanciest tiny castle ever. Thank you!'
		],
		reminder: [
			'Beach Cove is past the pond. Shells love hiding in the sand!',
			'Still {need}, royal shell-finder!'
		],
		complete: [
			'Look at these beauties! The tiny castle is now SO fancy. 🐚',
			'For you: {reward}! A royal thank-you! 🌷'
		],
		rewardItemId: 'tulip',
		rewardCount: 1
	}
];

/** All quest templates this NPC can hand out. */
export function questPool(npc: CharacterId): QuestTemplate[] {
	return QUESTS.filter((q) => q.npc === npc);
}

/** Find a template by id (reminder/complete lines must survive a page reload). */
export function questById(id: string): QuestTemplate | null {
	return QUESTS.find((q) => q.id === id) ?? null;
}

/** Pages while an errand is in progress (mention how many are still needed). */
export function reminderPages(t: QuestTemplate, ctx: DialogueContext): string[] {
	const remaining = Math.max(0, t.count - (ctx.inventory[t.itemId] ?? 0));
	if (remaining === 0) return [fill(VOICES[t.npc].allFound, ctx, t, 0)];
	return t.reminder.map((p) => fill(p, ctx, t, remaining));
}

/** Pages when handing in the errand (celebrate + hand over the reward). */
export function completePages(t: QuestTemplate, ctx: DialogueContext): string[] {
	return t.complete.map((p) => fill(p, ctx, t, 0));
}
