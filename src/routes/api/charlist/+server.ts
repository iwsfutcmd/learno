import type { RequestHandler } from '@sveltejs/kit';
import filterWordlist from '$lib/filterWordlist';
import _ from 'lodash';

const CONJUNCT_PROPS = [
	'Virama',
	'Invisible_Stacker',
	'Consonant_Dead',
	'Consonant_With_Stacker',
	'Consonant_Prefixed',
	'Consonant_Preceding_Repha',
	'Consonant_Initial_Postfixed',
	'Consonant_Succeeding_Repha',
	'Consonant_Subjoined',
	'Consonant_Medial',
	'Consonant_Final',
	'Consonant_Head_Letter',
	'Gemination_Mark'
];

const INDEP_VOWEL_PROPS = ['Vowel_Independent'];

const DIGIT_PROPS = ['Number', 'Brahmi_Joining_Number'];

export const POST: RequestHandler = async ({ request }) => {
	const params = await request.json();
	const { lang, script } = params;
	const from = params.from === 'autodetect' ? script : params.from;
	const fromScript = from.includes('/') ? from.split('/')[0] : from;
	const positiveFilter = [
		...(params.withConjuncts === 2 ? CONJUNCT_PROPS : []),
		...(params.withIndepVowels === 2 ? INDEP_VOWEL_PROPS : []),
		...(params.withDigits === 2 ? DIGIT_PROPS : [])
	];
	const negativeFilter = [
		...(params.withConjuncts === 0 ? CONJUNCT_PROPS : []),
		...(params.withIndepVowels === 0 ? INDEP_VOWEL_PROPS : []),
		...(params.withDigits === 0 ? DIGIT_PROPS : [])
	];
	let wordlist = [];
	try {
		wordlist = (await import(`./charlists/${lang}-${script}.json`)).default;
	} catch (e) {}
	if (positiveFilter.length > 0) {
		wordlist = filterWordlist(wordlist, Array.from(positiveFilter));
	}
	if (negativeFilter.length > 0) {
		wordlist = filterWordlist(wordlist, Array.from(negativeFilter), true);
	}
	const randomizedWordlist = _.shuffle(wordlist);
	return new Response(JSON.stringify(randomizedWordlist));
};
