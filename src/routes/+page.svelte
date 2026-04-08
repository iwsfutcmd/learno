<script lang="ts">
	import { onMount } from 'svelte';
	import LangPicker from '$lib/LangPicker.svelte';
	import FirstLoad from '$lib/FirstLoad.svelte';
	import {
		randomizeFromFont,
		randomizeToFont,
		fromFont,
		fromFonts,
		toFont,
		toFonts,
		baseLocale,
		baseLocaleString,
		toLocale,
		toLocaleString,
		fromLocale,
		fromLocaleString,
		withCase,
		loading,
		firstLoad,
		initialFetch,
		numAnswers,
		showWeight,
		addInversions,
		offline,
		sortedAnswers,
		fromFontSize,
		toFontSize
	} from '../stores';
	import scriptDirectionJson from '$lib/scriptDirection.json';
	const scriptDirection = scriptDirectionJson as { [key: string]: string };
	import scriptFontMapJson from '$lib/scriptFontMap.json';
	const scriptFontMap = scriptFontMapJson as { [key: string]: string[] };
	import symmetricalH from '$lib/symmetricalH.json';

	const invH = '\u0091';
	const invV = '\u0092';
	let toDir = 'ltr';
	let fromDir = 'ltr';
	let questions: { [key: string]: string } = {};
	const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));

	const getCharlist = async (autodetectScript = false) => {
		$loading = true;
		if ($baseLocale.language && $baseLocale.script && (autodetectScript || $fromLocale.script))
			return fetch('api/charlist', {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					from: autodetectScript ? 'autodetect' : $fromLocale.script,
					lang: $baseLocale.language,
					script: $baseLocale.script
				})
			})
				.then((response) => response.json())
				.then((result) => {
					fromDir = scriptDirection[$fromLocale.script ?? ''] ?? fromDir;
					$fromFonts = scriptFontMap[$fromLocale.script ?? ''] || [];
					$fromFont = $fromFonts[0];
					toDir = scriptDirection[$toLocale.script ?? ''] ?? toDir;
					$toFonts = scriptFontMap[$toLocale.script ?? ''] || [];
					$toFont = $toFonts[0];
					let charlist: Set<string> = new Set();
					result
						.map((char: string) =>
							transliterate($baseLocaleString, $fromLocaleString, char.normalize('NFD'))
						)
						.map((char: string) =>
							$withCase === 1
								? char.toLocaleLowerCase($fromLocaleString)
								: $withCase === 2
									? char.toLocaleUpperCase($fromLocaleString)
									: char
						)
						.forEach((char: string) => charlist.add(char));
					questions = [...charlist].reduce(
						(acc, char) => ({
							...acc,
							[char]: transliterate($fromLocaleString, $toLocaleString, char).normalize('NFD')
						}),
						{}
					);
				})
				.then(() => {
					$firstLoad = false;
					$loading = false;
					weightCache = {};
					nextPrompt();
				});
	};

	const shuffle = (a: Array<any>) =>
		a
			.map((v) => ({ v, sort: Math.random() }))
			.sort((a, b) => a.sort - b.sort)
			.map(({ v }) => v);

	const sample = (a: Array<any>, n = 1) => shuffle(a).slice(0, n);

	const weightedSample = (weights: { [key: string]: number }, n: number) =>
		shuffle(
			Object.entries(weights).reduce(
				(acc, [v, weight]) => [...Array(Math.pow(weight, 4)).fill(v), ...acc],
				[] as string[]
			)
		)
			.filter((item, index, self) => self.indexOf(item) === index)
			.slice(0, n);

	const getAnswers = async (prompt: string, questions: { [key: string]: string }) => {
		const correctAnswer = questions[prompt];
		let weights = weightCache[prompt];
		if (!weights) {
			const promptWeights = await fetch('api/learno_get', {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					fromLocale: $fromLocaleString,
					toLocale: $toLocaleString,
					question: prompt
				})
			}).then((r) => r.json());
			const answers = Object.values(questions);
			weights = [
				...answers.filter((answer) => answer !== questions[prompt]),
				...($addInversions
					? answers
							.filter((answer) => !symmetricalH.includes(answer))
							.map((answer) => invH + answer)
					: [])
			].reduce((acc, answer) => ({ ...acc, [answer]: (promptWeights[answer] ?? 0) + 1 }), {});
			weightCache[prompt] = weights;
		}
		const answers = [correctAnswer, ...weightedSample(weights, $numAnswers - 1)];
		return $sortedAnswers ? answers.sort() : shuffle(answers);
	};

	const checkAnswer = (prompt: string, answer: string, questions: { [key: string]: string }) =>
		!!(prompt && answer && questions[prompt] === answer);

	let selectedCorrectAnswer = false;
	const selectAnswer = async (answer: string) => {
		if (answer && checkAnswer(prompt, answer, questions)) {
			if (correct) numberCorrect += 1;
			numberAnswered += 1;
			selectedCorrectAnswer = true;
			await nextPrompt();
		} else {
			correct = false;
			mistakes = [answer, ...mistakes];
			weightCache[prompt][answer] += 1;
			fetch('api/learno_update', {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					fromLocale: $fromLocaleString,
					toLocale: $toLocaleString,
					question: prompt,
					answer: answer,
					inc: 1
				})
			});
		}
	};

	const nextPrompt = async () => {
		selectedCorrectAnswer = false;
		correct = true;
		mistakes = [];
		answers = [];
		while (true) {
			prompt = sample(Object.keys(questions), 1)[0];
			answers = await getAnswers(prompt, questions);
			if (answers.length > 1) {
				break;
			}
		}
		if ($randomizeFromFont) $fromFont = sample($fromFonts)[0] ?? '';
		if ($randomizeToFont) $toFont = sample($toFonts)[0] ?? '';
	};

	// const keyMap: { [key: string]: number } = {
	// 	q: 0,
	// 	w: 1,
	// 	e: 2,
	// 	r: 3,
	// 	u: 4,
	// 	i: 5,
	// 	o: 6,
	// 	p: 7,
	// 	a: 8,
	// 	s: 9,
	// 	d: 10,
	// 	f: 11,
	// 	j: 12,
	// 	k: 13,
	// 	l: 14,
	// 	';': 15
	// };

	const keyMap: { [key: string]: number } = {
		Numpad7: 0,
		Numpad8: 1,
		Numpad9: 2,
		Numpad4: 3,
		Numpad5: 4,
		Numpad6: 5,
		Numpad1: 6,
		Numpad2: 7,
		Numpad3: 8
	};

	const handleKeypress = (e: KeyboardEvent) => {
		const index = keyMap[e.code] ?? null;
		const answer = answers[index];
		if (index !== null && answer && !mistakes.includes(answer)) selectAnswer(answer);
	};

	let correct = true;
	let numberCorrect = 0;
	let numberAnswered = 0;
	let prompt = '';
	let answers: string[] = [];
	let mistakes: string[] = [];
	let optionsOpen = false;
	let segmenter: Intl.Segmenter | null = null;
	if (Intl.hasOwnProperty('Segmenter')) {
		segmenter = new Intl.Segmenter();
	}
	let weightCache: { [key: string]: { [key: string]: number } } = {};
	let transliterate = (from: string, to: string, text: string) => '';

	onMount(async () => {
		const url = new URL(window.location.href);
		if (url.searchParams.get('preset') === 'mahjong') {
			url.searchParams.delete('preset');
			url.searchParams.set('base', 'mis-Zzzz-Mahjong');
			url.searchParams.set('from', 'mis-Zzzz-Mahjong');
			url.searchParams.set('to', 'mis-Latn-Mahjong');
			window.location.href = url.toString();
		}
		({ transliterate } = await import('$lib/transliterate'));
		baseLocaleString.subscribe(() => !$initialFetch && getCharlist(false));
		fromLocaleString.subscribe(() => !$initialFetch && getCharlist(false));
		toLocaleString.subscribe(() => !$initialFetch && getCharlist(false));
		withCase.subscribe(() => !$initialFetch && getCharlist(false));
		getCharlist();
		$initialFetch = false;
	});
</script>

{#if $firstLoad}
	<FirstLoad name={'learno'} />
{/if}

<svelte:window on:keydown={handleKeypress} />
<div class="app">
	<header>
		<div class="logo">learno</div>
		<button class="open-options option-button" on:click={() => (optionsOpen = true)}>
			<span class="material-symbols-outlined">settings</span>
		</button>

		<div class="score">
			<div>{numberCorrect} / {numberAnswered}</div>
		</div>
	</header>
	<main>
		<div
			class="prompt"
			style:font-family={$fromFont}
			style:font-size={`${$fromFontSize}pt`}
			dir={fromDir === 'rtl' ? 'rtl' : 'ltr'}
		>
			{prompt?.replace(' ', '\u00A0') ?? '\u00A0'}
		</div>
		<div
			class="answers"
			style:font-family={$toFont}
			style:grid-template-columns={`repeat(${Math.sqrt($numAnswers)}, 1fr)`}
			dir={toDir === 'rtl' ? 'rtl' : 'ltr'}
		>
			{#each answers as answer, i}
				{@const flipH = answer?.startsWith(invH)}
				{@const disabled = mistakes.includes(answer)}
				<button
					{disabled}
					style:font-size={`${$toFontSize}pt`}
					class:correct={selectedCorrectAnswer && answer === questions[prompt]}
					on:click={() => selectAnswer(answer)}
				>
					<span class:flip-h={flipH}
						>{answer?.replace(' ', '\u00A0').replace(invH, '') ?? '\u00A0'}</span
					>
					{#if $showWeight || disabled}
						<div class="hint weight">
							{(weightCache?.[prompt]?.[answer] ?? 1) - 1}
						</div>
					{/if}
					{#if disabled}
						<div style:font-family={$fromFont} class="hint trans">
							{transliterate(
								$toLocaleString,
								$fromLocaleString,
								answer.replace(invH, '').normalize('NFD')
							)}
						</div>
						{#if flipH}
							<div class="hint inv-h material-symbols-outlined">compare_arrows</div>
						{/if}
					{/if}
				</button>
			{/each}
		</div>
	</main>
	<footer>
		<div class="buttonbar" dir={toDir === 'rtl' ? 'rtl' : 'ltr'}>
			<div>
				<button class="option-button" on:mousedown|preventDefault={nextPrompt}>
					<span
						class="material-symbols-outlined"
						style:transform={toDir.startsWith('v')
							? 'rotate(90deg)'
							: toDir === 'rtl'
								? 'scaleX(-1)'
								: ''}>skip_next</span
					>
				</button>
			</div>
			<div>
				<button
					class="option-button"
					on:mousedown|preventDefault={() => {
						$numAnswers = $numAnswers === 4 ? 9 : $numAnswers === 9 ? 16 : 4;
						nextPrompt();
					}}
				>
					<span class="material-symbols-outlined"
						>{$numAnswers === 16
							? 'background_grid_small'
							: $numAnswers === 9
								? 'grid_on'
								: 'window'}</span
					>
				</button>
			</div>
		</div>
	</footer>
	{#if optionsOpen}
		<LangPicker onClose={() => (optionsOpen = false)} {transliterate} />
	{/if}
</div>

<style>
	.app {
		margin: 8px;
		font-family: 'Noto Sans', sans-serif;
		max-inline-size: 800px;
		inline-size: 100%;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	header {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		justify-content: space-between;
		position: fixed;
		inset-block-start: 16px;
		inset-inline: 16px;
	}

	header > * {
		flex: 1;
	}

	.score {
		color: var(--sub-color);
		display: flex;
		justify-content: end;
	}

	.score > * {
		font-size: 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-inline: 2px;
		padding-block: 0px;
		text-wrap: nowrap;
	}

	main {
		display: flex;
		align-items: center;
		flex-direction: column;
		font-size: 4rem;
		margin-block-start: 16px;
	}

	.prompt {
		padding: 32px;
	}
	.answers {
		display: grid;
		grid-auto-flow: row;
		gap: 8px;
		padding: 8px;
		inline-size: 100%;
		block-size: 100%;
	}

	.answers > button:disabled {
		color: var(--error-color);
		border-color: var(--error-color);
	}

	.answers > button {
		color: var(--text-color);
		border: 2px solid var(--sub-color);
		border-radius: var(--roundness);
		font-size: 2rem;
		inline-size: 100%;
		aspect-ratio: 1 / 1;
		display: inline-flex;
		justify-content: center;
		align-items: center;
		justify-self: center;
		align-self: center;
		user-select: none;
		overflow: hidden;
		position: relative;
	}

	.answers > button.correct {
		color: var(--main-color);
	}

	.answers > button:active {
		background-color: var(--sub-color);
	}

	.flip-h {
		transform: scaleX(-1);
	}

	.answers .hint {
		font-size: 1rem;
		position: absolute;
	}

	.answers .weight {
		inset-inline-end: 0.5rem;
		inset-block-end: 0.5rem;
		color: var(--sub-color);
	}

	.answers .trans {
		inset-inline-end: 0.5rem;
		inset-block-start: 0.5rem;
		color: var(--main-color);
	}

	.answers .inv-h {
		inset-block-start: 0.5rem;
		color: var(--main-color);
	}

	footer {
		position: fixed;
		inset-block-end: 16px;
		inset-inline: 16px;
	}

	.buttonbar {
		display: flex;
		justify-content: space-between;
		font-size: 32pt;
	}
</style>
