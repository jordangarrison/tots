import { error } from '@sveltejs/kit';
import { cardTemplates } from '$lib/cards/templates';

export const prerender = true;

export const entries = () => cardTemplates.map((t) => ({ id: t.id }));

export const load = ({ params }: { params: { id: string } }) => {
	const template = cardTemplates.find((t) => t.id === params.id);
	if (!template) {
		throw error(404, 'Card template not found');
	}
	return { template };
};
