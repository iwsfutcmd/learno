import { writable, readonly } from 'svelte/store';
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
export const offline = writable(true);
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
	baseLocaleString.set(url.searchParams.get('base') || 'sa-Deva');
	baseLocaleString.subscribe((val) => {
		url.searchParams.set('base', val);
		window.history.pushState({}, '', url);
	});
	fromLocaleString.set(url.searchParams.get('from') || 'sa-Deva');
	fromLocaleString.subscribe((val) => {
		url.searchParams.set('from', val);
		window.history.pushState({}, '', url);
	});
	toLocaleString.set(url.searchParams.get('to') || 'sa-Latn-iso15919');
	toLocaleString.subscribe((val) => {
		url.searchParams.set('to', val);
		window.history.pushState({}, '', url);
	});
	numAnswers.set(parseInt(url.searchParams.get('n') ?? '4'));
	numAnswers.subscribe((val) => {
		url.searchParams.set('n', val.toString());
		window.history.pushState({}, '', url);
	});
	sortedAnswers.set(url.searchParams.get('sort') === 'y');
	sortedAnswers.subscribe((val) => {
		url.searchParams.set('sort', val ? 'y' : 'n')
		window.history.pushState({}, '', url);
	})
	fromFontSize.set(parseInt(url.searchParams.get('fromFontSize') ?? '64'));
	fromFontSize.subscribe((val) => {
		url.searchParams.set('fromFontSize', val.toString())
		window.history.pushState({}, '', url);
	})
	toFontSize.set(parseInt(url.searchParams.get('toFontSize') ?? '32'));
	toFontSize.subscribe((val) => {
		url.searchParams.set('toFontSize', val.toString())
		window.history.pushState({}, '', url);
	})
	fromCharsMap.set(JSON.parse(localStorage.getItem('fromCharsMap') || '{}'));
	fromCharsMap.subscribe((val) => localStorage.setItem('fromCharsMap', JSON.stringify(val)));
	toCharsMap.set(JSON.parse(localStorage.getItem('toCharsMap') || '{}'));
	toCharsMap.subscribe((val) => localStorage.setItem('toCharsMap', JSON.stringify(val)));
}
