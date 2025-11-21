import { createClient } from '@vercel/kv';
import type { RequestHandler } from '@sveltejs/kit';

const kv = createClient({
	url: import.meta.env.KV_REST_API_URL,
	token: import.meta.env.KV_REST_API_TOKEN
});

export const POST: RequestHandler = async ({ request }) => {
	const params = await request.json();
	const { fromLocale, toLocale, question } = params;
	const returnedWeights = await kv.hgetall(`${fromLocale}:${toLocale}:${question}`);
	const weights = returnedWeights
		? Object.entries(returnedWeights).reduce((acc, [k, v]) => ({ ...acc, [k]: Number(v) }), {})
		: {};
	return new Response(JSON.stringify(weights));
};
