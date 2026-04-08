import { writable, readonly, get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { parse } from 'bcp-47';
import { browser } from '$app/environment';

const _baseLocale = writable(parse(''));
export const baseLocale = readonly(_baseLocale);
const _fromLocale = writable(parse(''));
export const fromLocale = readonly(_fromLocale);
const _toLocale = writable(parse(''));
export const toLocale = readonly(_toLocale);

export const baseLocaleString = writable('sa-Deva');
export const fromLocaleString = writable('sa-Deva');
export const toLocaleString = writable('sa-Latn-iso15919');
export const fromFonts = writable(['']);
export const toFonts = writable(['']);
export const fromFont = writable('');
export const toFont = writable('');
export const randomizeFromFont = writable(false);
export const randomizeToFont = writable(false);
export const localePairs: Writable<{ [key: string]: string[] }> = writable({});
export const hardMode = writable(false);
export const revealDiff = writable(true);
export const slideyMode = writable(false);
export const withConjuncts = writable(1);
export const withIndepVowels = writable(1);
export const withDigits = writable(1);
export const withCase = writable(0);
export const usedHint = writable(false);
export const usedHintLastRound = writable(false);
export const currentText = writable('');
export const score = writable(0);
export const hardModeScore = writable(0);
export const charsPerSecond = writable(0);
export const recordCharsPerSecond = writable(0);
export const timer = writable(0);
export const firstLoad = writable(true);
export const loading = writable(false);
export const name = writable('');
export const fromCharsMap: Writable<{ [key: string]: string }> = writable({});
export const toCharsMap: Writable<{ [key: string]: string }> = writable({});
export const lineHeight = writable(0);
export const keySize = writable(0);
export const numAnswers = writable(16);
export const initialFetch = writable(true);
export const showWeight = writable(false);
export const addInversions = writable(false);
export const offline = writable(false);
export const sortedAnswers = writable(false);
export const fromFontSize = writable(64);
export const toFontSize = writable(32);

hardMode.subscribe(() => {
	score.set(0);
	hardModeScore.set(0);
});
baseLocaleString.subscribe((val) => _baseLocale.set(parse(val)));
fromLocaleString.subscribe((val) => _fromLocale.set(parse(val)));
toLocaleString.subscribe((val) => _toLocale.set(parse(val)));

if (browser) {
	const url = new URL(window.location.href);

	// Read all values from URL first
	baseLocaleString.set(url.searchParams.get('base') || 'sa-Deva');
	fromLocaleString.set(url.searchParams.get('from') || 'sa-Deva');
	toLocaleString.set(url.searchParams.get('to') || 'sa-Latn-iso15919');
	numAnswers.set(parseInt(url.searchParams.get('n') ?? '4'));
	fromFont.set(url.searchParams.get('ff') || '');
	toFont.set(url.searchParams.get('tf') || '');
	hardMode.set(url.searchParams.get('hard') === 'true');
	withConjuncts.set(parseInt(url.searchParams.get('conj') ?? '1'));
	withIndepVowels.set(parseInt(url.searchParams.get('vowels') ?? '1'));
	withDigits.set(parseInt(url.searchParams.get('digits') ?? '1'));
	withCase.set(parseInt(url.searchParams.get('case') ?? '0'));
	randomizeFromFont.set(url.searchParams.get('randf') === 'true');
	randomizeToFont.set(url.searchParams.get('randt') === 'true');
	lineHeight.set(parseInt(url.searchParams.get('lh') ?? '0'));
	keySize.set(parseInt(url.searchParams.get('ks') ?? '0'));
	showWeight.set(url.searchParams.get('weight') === 'true');
	addInversions.set(url.searchParams.get('inv') === 'true');
	sortedAnswers.set(url.searchParams.get('sorted') === 'true');
	offline.set(url.searchParams.get('offline') === 'true');
	fromFontSize.set(parseInt(url.searchParams.get('fromFontSize') ?? '64'));
	toFontSize.set(parseInt(url.searchParams.get('toFontSize') ?? '32'));

	// Global flag to prevent URL updates during initialization
	let initializing = true;

	// Helper to update URL parameter
	const updateUrlParam = (key: string, value: string) => {
		if (initializing) return;
		const url = new URL(window.location.href);
		url.searchParams.set(key, value);
		window.history.replaceState({}, '', url.href);
	};

	// Set up subscribers for future changes
	baseLocaleString.subscribe((val) => {
		updateUrlParam('base', val);
	});
	fromLocaleString.subscribe((val) => {
		updateUrlParam('from', val);
	});
	toLocaleString.subscribe((val) => {
		updateUrlParam('to', val);
	});
	numAnswers.subscribe((val) => {
		updateUrlParam('n', val.toString());
	});
	fromFont.subscribe((val) => {
		updateUrlParam('ff', val);
	});
	toFont.subscribe((val) => {
		updateUrlParam('tf', val);
	});
	hardMode.subscribe((val) => {
		updateUrlParam('hard', val.toString());
	});
	withConjuncts.subscribe((val) => {
		updateUrlParam('conj', val.toString());
	});
	withIndepVowels.subscribe((val) => {
		updateUrlParam('vowels', val.toString());
	});
	withDigits.subscribe((val) => {
		updateUrlParam('digits', val.toString());
	});
	withCase.subscribe((val) => {
		updateUrlParam('case', val.toString());
	});
	randomizeFromFont.subscribe((val) => {
		updateUrlParam('randf', val.toString());
	});
	randomizeToFont.subscribe((val) => {
		updateUrlParam('randt', val.toString());
	});
	lineHeight.subscribe((val) => {
		updateUrlParam('lh', val.toString());
	});
	keySize.subscribe((val) => {
		updateUrlParam('ks', val.toString());
	});
	showWeight.subscribe((val) => {
		updateUrlParam('weight', val.toString());
	});
	addInversions.subscribe((val) => {
		updateUrlParam('inv', val.toString());
	});
	sortedAnswers.subscribe((val) => {
		updateUrlParam('sorted', val.toString());
	});
	offline.subscribe((val) => {
		updateUrlParam('offline', val.toString());
	});
	fromFontSize.subscribe((val) => {
		updateUrlParam('fromFontSize', val.toString());
	});
	toFontSize.subscribe((val) => {
		updateUrlParam('toFontSize', val.toString());
	});

	// Mark initialization complete and write all current values to URL
	initializing = false;

	const currentUrl = new URL(window.location.href);
	currentUrl.searchParams.set('base', get(baseLocaleString));
	currentUrl.searchParams.set('from', get(fromLocaleString));
	currentUrl.searchParams.set('to', get(toLocaleString));
	currentUrl.searchParams.set('n', get(numAnswers).toString());
	currentUrl.searchParams.set('ff', get(fromFont));
	currentUrl.searchParams.set('tf', get(toFont));
	currentUrl.searchParams.set('hard', get(hardMode).toString());
	currentUrl.searchParams.set('conj', get(withConjuncts).toString());
	currentUrl.searchParams.set('vowels', get(withIndepVowels).toString());
	currentUrl.searchParams.set('digits', get(withDigits).toString());
	currentUrl.searchParams.set('case', get(withCase).toString());
	currentUrl.searchParams.set('randf', get(randomizeFromFont).toString());
	currentUrl.searchParams.set('randt', get(randomizeToFont).toString());
	currentUrl.searchParams.set('lh', get(lineHeight).toString());
	currentUrl.searchParams.set('ks', get(keySize).toString());
	currentUrl.searchParams.set('weight', get(showWeight).toString());
	currentUrl.searchParams.set('inv', get(addInversions).toString());
	currentUrl.searchParams.set('sorted', get(sortedAnswers).toString());
	currentUrl.searchParams.set('offline', get(offline).toString());
	currentUrl.searchParams.set('fromFontSize', get(fromFontSize).toString());
	currentUrl.searchParams.set('toFontSize', get(toFontSize).toString());
	window.history.replaceState({}, '', currentUrl.href);

	fromCharsMap.set(JSON.parse(localStorage.getItem('fromCharsMap') || '{}'));
	fromCharsMap.subscribe((val) => localStorage.setItem('fromCharsMap', JSON.stringify(val)));
	toCharsMap.set(JSON.parse(localStorage.getItem('toCharsMap') || '{}'));
	toCharsMap.subscribe((val) => localStorage.setItem('toCharsMap', JSON.stringify(val)));
}
