import { error } from '@sveltejs/kit';
import { LESSONS, findLesson } from '$lib/typing/lessons';

export const prerender = true;

export const entries = () => LESSONS.map((l) => ({ lessonId: l.id }));

export const load = ({ params }: { params: { lessonId: string } }) => {
	const lesson = findLesson(params.lessonId);
	if (!lesson) {
		throw error(404, 'Typing lesson not found');
	}
	return { lesson };
};
