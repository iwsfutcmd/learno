import { createClient } from '@vercel/kv';
import type { RequestHandler } from '@sveltejs/kit';

const kv = createClient({
	url: import.meta.env.KV_REST_API_URL,
	token: import.meta.env.KV_REST_API_TOKEN
});

export const POST: RequestHandler = async ({ request }) => {
	const params = await request.json();
	const { fromLocale, toLocale, question, answer, inc } = params;
	kv.hincrby(`${fromLocale}:${toLocale}:${question}`, answer, inc);
	return new Response('OK');
};
