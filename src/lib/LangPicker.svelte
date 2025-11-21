<script lang="ts">
	import { slide } from 'svelte/transition';
	import { parse, stringify } from 'bcp-47';
	import type { Schema } from 'bcp-47';
	import cldrLanguagesJson from 'cldr-localenames-modern/main/en/languages.json';
	const cldrLanguageNames = cldrLanguagesJson.main.en.localeDisplayNames.languages as {
		[key: string]: string;
	};
	import languageNamesJson from '$lib/languageNames.json';
	const languageNames = languageNamesJson as { [key: string]: string };
	import casedScripts from '$lib/casedScripts.json';
	import scriptExemplarsJson from '$lib/scriptExemplars.json';
	const scriptExemplars = scriptExemplarsJson as { [key: string]: string };
	import localeStringFallback from '$lib/localeStringFallback';
	import {
		baseLocale,
		baseLocaleString,
		fromLocale,
		fromLocaleString,
		toLocaleString,
		fromFonts,
		fromFont,
		randomizeFromFont,
		toFonts,
		toFont,
		randomizeToFont,
		localePairs,
		hardMode,
		revealDiff,
		withConjuncts,
		withIndepVowels,
		withDigits,
		withCase,
		lineHeight,
		keySize,
		showWeight,
		addInversions,
		sortedAnswers
	} from '../stores';
	import indicScripts from '$lib/indicScripts.json';
	import scriptAliasesJson from '$lib/scriptAliases.json';
	const scriptAliases = scriptAliasesJson as { [key: string]: string };
	import langScriptMapJson from '$lib/langScriptMap.json';
	const langScriptMap = langScriptMapJson as unknown as { [key: string]: [string, number][] };

	const SCRIPT_THRESHOLD = 0.005;

	baseLocaleString.subscribe((val) => val !== $baseLocaleString && fromLocaleString.set(val));
	fromLocale.subscribe((val) => {
		if (!indicScripts.includes(val.script ?? '')) {
			$withConjuncts = 1;
			$withIndepVowels = 1;
			$withDigits = 1;
		}
	});
	export let onClose: () => void;
	export let soundo = false;
	export let translo = false;
	export let transliterate = (from: string, to: string, text: string) => '';
	export let displayHardMode = true;
	export let displayRandomizeFromFont = true;
	export let displayLineHeight = true;
	export let displayKeySize = true;
	export let displayShowWeight = false;
	export let displayAddInversions = false;
	export let displaySortedAnswers = false;
	let conjunctsIndeterminate: boolean;
	let conjunctsChecked: boolean;
	let indepVowelsIndeterminate: boolean;
	let indepVowelsChecked: boolean;
	let digitsIndeterminate: boolean;
	let digitsChecked: boolean;
	let localeString: string;
	let locale: Schema;

	const soundoFromLocaleStrings = ['ltc-Latn', 'la-Latn'];

	// if (soundo) {
	// 	$baseLocaleString = soundoFromLocaleStrings.includes($baseLocaleString)
	// 		? $baseLocaleString
	// 		: soundoFromLocaleStrings[0];
	// 	$fromLocaleString = soundoFromLocaleStrings.includes($fromLocaleString)
	// 		? $fromLocaleString
	// 		: soundoFromLocaleStrings[0];
	// }
	let baseLanguage = $baseLocale.language ?? '';
	const baseLanguages = Object.keys(langScriptMap)
		.sort()
		.map((language) => [
			language,
			langScriptMap[language]
				.filter(([_, freq]) => freq >= SCRIPT_THRESHOLD)
				.filter(
					([script, _]) =>
						$localePairs[(localeString = stringify({ language, script }))] ||
						$localePairs[localeStringFallback(localeString)]
				)
		])
		.filter(([_, scripts]) => scripts.length)
		.map(([language, _]) => language) as string[];
	let baseLocaleStrings = [$baseLocaleString];
	let fromLocaleStrings = [$fromLocaleString];
	let toLocaleStrings = [$toLocaleString];

	$: {
		$baseLocaleString = stringify({ ...$baseLocale, language: baseLanguage });
	}
	$: {
		baseLocaleStrings = langScriptMap[baseLanguage ?? '']
			.filter(([_, freq]) => freq >= SCRIPT_THRESHOLD)
			.filter(
				([script, _]) =>
					$localePairs[(localeString = stringify({ ...$baseLocale, script }))] ||
					$localePairs[localeStringFallback(localeString)]
			)
			.sort((a, b) => b[1] - a[1])
			.map(([script, _]) => stringify({ ...$baseLocale, script }));
		if (!baseLocaleStrings.includes($baseLocaleString))
			$baseLocaleString = baseLocaleStrings[0] ?? $baseLocaleString;
	}
	$: {
		fromLocaleStrings = [
			...($localePairs[$baseLocaleString] || []),
			...($localePairs[localeStringFallback($baseLocaleString)] || []),
			$baseLocaleString
		]
			.filter((localeString) => !parse(localeString).privateuse.length)
			.map((localeString) =>
				stringify({
					...(locale = parse(localeString)),
					language: locale.language === 'und' ? $baseLocale.language : locale.language
				})
			)
			.filter((value, index, array) => array.indexOf(value) === index)
			.sort();
		if (!fromLocaleStrings.includes($fromLocaleString)) $fromLocaleString = $baseLocaleString;
	}
	$: {
		toLocaleStrings = [
			...($localePairs[$fromLocaleString] || []),
			...($localePairs[localeStringFallback($fromLocaleString)] || [])
		]
			.filter((localeString) => !parse(localeString).privateuse.length)
			.map((localeString) =>
				stringify({
					...(locale = parse(localeString)),
					language: locale.language === 'und' ? $baseLocale.language : locale.language
				})
			)
			.filter((value, index, array) => array.indexOf(value) === index)
			.sort();
		if (!toLocaleStrings.includes($toLocaleString)) $toLocaleString = toLocaleStrings[0];
	}
	$: {
		conjunctsIndeterminate = $withConjuncts === 1;
		conjunctsChecked = $withConjuncts === 2;
		indepVowelsIndeterminate = $withIndepVowels === 1;
		indepVowelsChecked = $withIndepVowels === 2;
		digitsIndeterminate = $withDigits === 1;
		digitsChecked = $withDigits === 2;
	}
</script>

<div class="lang-picker-container">
	<button class="lang-picker-background" on:click={onClose} />
	<div class="lang-picker" transition:slide|global>
		<!-- {#if !soundo} -->
		<div class="wordlist-lang-picker picker">
			<div class="option-button">
				<label for="base-lang">
					<span class="material-symbols-outlined">mode_comment</span>
					<select id="base-lang" class="option-button" bind:value={baseLanguage}>
						{#each baseLanguages
							.map((code) => [cldrLanguageNames[code] ?? languageNames[code] ?? code, code])
							.sort((a, b) => a[0].localeCompare(b[0])) as [lang, code]}
							<option value={code}>
								{`${lang} (${code})`}
							</option>
						{/each}
					</select>
				</label>
			</div>
			<div class="option-button">
				<label for="base-script">
					<span class="material-symbols-outlined">history_edu</span>
					<select id="base-script" class="option-button" bind:value={$baseLocaleString}>
						{#each baseLocaleStrings as localeString}
							<option value={localeString}>{localeString}</option>
						{/each}
					</select>
				</label>
			</div>
		</div>
		<!-- {/if} -->
		<div class="picker">
			<select class="option-button from-locale" bind:value={$fromLocaleString}>
				{#each soundo ? soundoFromLocaleStrings : fromLocaleStrings as localeString}
					<option value={localeString}>{localeString}</option>
				{/each}
			</select>
			{#if translo}
				<button
					class="material-symbols-outlined"
					on:click={() => {
						const temp = $fromLocaleString;
						$fromLocaleString = $toLocaleString;
						$toLocaleString = temp;
					}}>keyboard_double_arrow_right</button
				>
			{:else}
				<span class="material-symbols-outlined">keyboard_double_arrow_right</span>
			{/if}
			<select class="option-button to-locale" bind:value={$toLocaleString}>
				{#each toLocaleStrings as localeString}
					<option value={localeString}>{localeString}</option>
				{/each}
			</select>
		</div>
		<div class="option-button">
			<label for="from-font">
				<span class="material-symbols-outlined">glyphs</span>
			</label>
			<select id="from-font" class="option-button" bind:value={$fromFont}>
				{#each $fromFonts.sort() as font}
					<option value={font}>
						{font}
					</option>
				{/each}
			</select>
		</div>
		<div class="option-button">
			<label for="to-font">
				<span class="material-symbols-outlined">glyphs</span>
			</label>
			<select id="to-font" class="option-button" bind:value={$toFont}>
				{#each $toFonts.sort() as font}
					<option value={font}>
						{font}
					</option>
				{/each}
			</select>
		</div>
		<div class="options picker">
			{#if indicScripts.includes($fromLocale.script ?? '')}
				<form>
					<input
						type="checkbox"
						class="trinary"
						id="conjuncts"
						bind:checked={conjunctsChecked}
						bind:indeterminate={conjunctsIndeterminate}
						on:change={() => {
							$withConjuncts = ($withConjuncts + 1) % 3;
						}}
					/>
					<label class="option-button icon" for="conjuncts"
						>{transliterate('sa-Deva', $fromLocaleString, 'क्ष')}</label
					>
				</form>
				<form>
					<input
						type="checkbox"
						class="trinary"
						id="indep-vowels"
						bind:checked={indepVowelsChecked}
						bind:indeterminate={indepVowelsIndeterminate}
						on:change={() => {
							$withIndepVowels = ($withIndepVowels + 1) % 3;
						}}
					/>
					<label class="option-button icon" for="indep-vowels"
						>{transliterate('sa-Deva', $fromLocaleString, 'अ')}</label
					>
				</form>
				<form>
					<input
						type="checkbox"
						class="trinary"
						id="digits"
						bind:checked={digitsChecked}
						bind:indeterminate={digitsIndeterminate}
						on:change={() => {
							$withDigits = ($withDigits + 1) % 3;
						}}
					/>
					<label class="option-button icon" for="digits">
						<!-- {transliterate('sa-Deva', $fromLocaleString, '१')} -->
						१
					</label>
				</form>
			{/if}
			{#if casedScripts.includes($fromLocale.script ?? '')}
				<form>
					<button
						class="option-button icon"
						id="case"
						on:click={() => {
							$withCase = ($withCase + 1) % 3;
						}}
					>
						{$withCase === 1
							? scriptExemplars[$fromLocale.script ?? ''].toLowerCase()
							: $withCase === 2
							? scriptExemplars[$fromLocale.script ?? ''].toUpperCase()
							: scriptExemplars[$fromLocale.script ?? ''].toUpperCase() +
							  scriptExemplars[$fromLocale.script ?? ''].toLowerCase()}
					</button>
				</form>
			{/if}
		</div>

		<div class="options picker">
			{#if displayHardMode}
				<form>
					<input
						class="binary"
						type="checkbox"
						id="hard-mode"
						bind:checked={$hardMode}
						on:change={() => ($revealDiff = !$revealDiff)}
					/>
					<label class="option-button icon" for="hard-mode">
						<span class="material-symbols-outlined"
							>{$hardMode ? 'visibility_off' : 'visibility'}</span
						>
					</label>
				</form>
			{/if}
			{#if displayRandomizeFromFont}
				<form>
					<input
						class="binary"
						type="checkbox"
						id="randomize-from-font"
						bind:checked={$randomizeFromFont}
					/>
					<label class="option-button overlap icon" for="randomize-from-font">
						<div class="material-symbols-outlined" style:font-size="0.75rem">glyphs</div>
						<div class="material-symbols-outlined">cycle</div>
					</label>
				</form>
			{/if}
			{#if displayLineHeight}
				<form>
					<button class="option-button icon" on:click={() => ($lineHeight = ($lineHeight + 1) % 3)}>
						<span class="material-symbols-outlined">format_line_spacing</span>
					</button>
				</form>
			{/if}
			{#if displayKeySize}
				<form>
					<button
						class="option-button overlap icon"
						on:click={() => ($keySize = ($keySize + 1) % 3)}
					>
						<div class="material-symbols-outlined" style:font-size="1rem">expand_content</div>
						<div class="material-symbols-outlined">crop_square</div>
					</button>
				</form>
			{/if}
			{#if displayShowWeight}
				<form>
					<input class="binary" type="checkbox" id="show-weight" bind:checked={$showWeight} />
					<label class="option-button icon" for="show-weight">
						<div class="material-symbols-outlined">scale</div>
					</label>
				</form>
			{/if}
			{#if displayAddInversions}
				<form>
					<input class="binary" type="checkbox" id="add-inversions" bind:checked={$addInversions} />
					<label class="option-button icon" for="add-inversions">
						<div class="material-symbols-outlined">compare_arrows</div>
					</label>
				</form>
			{/if}
			{#if displaySortedAnswers}
				<form>
					<input class="binary" type="checkbox" id="sorted-answers" bind:checked={$sortedAnswers} />
					<label class="option-button icon" for="sorted-answers">
						<div class="material-symbols-outlined">sort</div>
					</label>
				</form>
			{/if}
		</div>
	</div>
</div>

<style>
	.lang-picker-container {
		display: flex;
		justify-content: center;
		position: fixed;
		inline-size: 100%;
		block-size: 100%;
		inset-inline-start: 0;
		inset-block-start: 0;
	}
	.lang-picker-background {
		position: fixed;
		inline-size: 100%;
		block-size: 100%;
		inset-inline-start: 0;
		inset-block-start: 0;
	}
	.lang-picker {
		position: fixed;
		display: flex;
		flex-direction: column;
		align-items: center;
		color: var(--sub-color);
		font-size: 1em;
		background-color: var(--sub-alt-color);
		border-radius: var(--roundness);
		padding: 8px;
	}
	.from-locale {
		text-align: end;
	}
	.to-locale {
		text-align: start;
	}
	.options {
		display: flex;
		flex-direction: row;
		font-size: 24pt;
		border-radius: var(--roundness);
		transition: 0.125s;
	}

	.options > form {
		padding-inline: 0.33rem;
	}
	.picker {
		padding-inline: 0.5rem;
		padding-block: 0.25rem;
	}
	.wordlist-lang-picker {
		display: flex;
		flex-direction: row;
	}
</style>
