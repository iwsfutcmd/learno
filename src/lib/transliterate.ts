import { parse, stringify } from 'bcp-47';
import type { Schema } from 'bcp-47';
import { localePairs } from '../stores';
import { get } from 'svelte/store';
import transliteratorIdsJson from '$lib/transliteratorIdOrder.json';
import Module from '$lib/transliterator.mjs';
import localeStringFallback from '$lib/localeStringFallback';
const transliteratorIds = transliteratorIdsJson as [string, string, string][];

const module = await Module();

const minifyRules = (rules: string) => {
	return rules.replace(/\uFEFF/g, '').replace(/(\\n)+/g, '\n');
};

const underscore = (localeString: string): string => localeString.replace(/-/g, '_');

const registerTransliterator = (
	fromLocale: string,
	toLocale: string,
	intermediateLocale: string | null = null
) =>
	module.registerTransliterator(
		`${underscore(fromLocale)}-${underscore(toLocale)}`,
		'',
		intermediateLocale
			? `::NFC;::${underscore(fromLocale)}-${underscore(intermediateLocale)};::${underscore(
					intermediateLocale
			  )}-${underscore(toLocale)};::NFD;`
			: `::NFC;::${underscore(fromLocale)}-${underscore(toLocale)};::NFD;`
	);

const transliteratorRules: { [key: string]: string } = Object.fromEntries(
	Object.entries(
		import.meta.glob('$lib/transliterators/*.rbt', {
			as: 'raw',
			eager: true
		})
	).map(([filepath, rules]) => [filepath.split(/[/\\]/).pop(), minifyRules(rules)])
);

const explicitLocalePairs: { [key: string]: string[] } = {};

transliteratorIds.forEach(([id, inverseId, filename]) => {
	module.registerTransliterator(id, inverseId, transliteratorRules[filename]);
	[id, inverseId].forEach((i) => {
		const [from, to] = i.split('-').map((locale) => locale.replace(/_/g, '-'));
		if (from && to) {
			if (explicitLocalePairs[from]) {
				explicitLocalePairs[from].push(to);
			} else {
				explicitLocalePairs[from] = [to];
			}
		}
	});
});

const tempLocalePairs = { ...explicitLocalePairs };

Object.entries(explicitLocalePairs).forEach(([fromLocale, toLocales]) => {
	toLocales.forEach((intermediateLocale) => {
		(explicitLocalePairs[intermediateLocale] ?? []).forEach((toLocale) => {
			if (fromLocale !== toLocale && !tempLocalePairs[fromLocale].includes(toLocale)) {
				registerTransliterator(fromLocale, toLocale, intermediateLocale);
				if (tempLocalePairs[fromLocale]) {
					tempLocalePairs[fromLocale].push(toLocale);
				} else {
					tempLocalePairs[fromLocale] = [toLocale];
				}
			}
		});
	});
});

localePairs.set(tempLocalePairs);

const createTransliteratorId = (from: string, to: string): string => {
	let fromLocale: Schema | null = null;
	let toLocale: Schema | null = null;
	const localePairsValue = get(localePairs);
	if (localePairsValue[from] && localePairsValue[from].includes(to)) {
		fromLocale = parse(from);
		toLocale = parse(to);
	} else if (localePairsValue[from] && localePairsValue[from].includes(localeStringFallback(to))) {
		fromLocale = parse(from);
		toLocale = parse(localeStringFallback(to));
	} else if (
		localePairsValue[localeStringFallback(from)] &&
		localePairsValue[localeStringFallback(from)].includes(to)
	) {
		fromLocale = parse(localeStringFallback(from));
		toLocale = parse(to);
	} else if (
		localePairsValue[localeStringFallback(from)] &&
		localePairsValue[localeStringFallback(from)].includes(localeStringFallback(to))
	) {
		fromLocale = parse(localeStringFallback(from));
		toLocale = parse(localeStringFallback(to));
	}
	const fromLocaleString = fromLocale ? stringify(fromLocale) : '';
	const toLocaleString = toLocale ? stringify(toLocale) : '';
	const fromLocaleTag = fromLocale ? underscore(fromLocaleString) : '';
	const toLocaleTag = toLocale ? underscore(toLocaleString) : '';
	return `${fromLocaleTag}-${toLocaleTag}`;
};

export const transliterate = (from: string, to: string, text: string): string => {
	if (from === to || !from || !to) return text;
	const transliteratorId = createTransliteratorId(from, to);
	if (!transliteratorId) {
		console.log(`Failed! ${from} ${to}`);
		return text;
	}
	const newText = module.transliterate(text, transliteratorId);
	return newText;
};

export const transliterateInput = (
	from: string,
	to: string,
	text: string,
	input: string
): string => {
	if (from === to || !from || !to) return text + input;
	const transliteratorId = createTransliteratorId(from, to);
	if (!transliteratorId) {
		console.log(`Failed! ${from} ${to}`);
		return text;
	}
	const newText = module.transliterateInput(text, input, transliteratorId);
	return newText;
};

export const getSourceSet = (from: string, to: string): string =>
	module.getSourceSet(createTransliteratorId(from, to));

export const getAvailableIDs = module.getAvailableIDs;

// export const splitByGraphemeClusters = (text: string): string[] => {
// 	const output = module.splitByGraphemeClusters(text);
// 	console.log(output);
// 	return output;
// };

// export const getIndicSyllabicCategory = (codepoint: number): string =>
// 	module.getIndicSyllabicCategory(codepoint);
