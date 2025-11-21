<script lang="ts">
	import { fade } from 'svelte/transition';
	import scriptExemplarsJson from '$lib/scriptExemplars.json';
	import scriptFontMap from '$lib/scriptFontMap.json';
	import scriptDirectionJson from '$lib/scriptDirection.json';
	export let name: string;
	const scriptDirection = scriptDirectionJson as { [key: string]: string };
	const scriptExemplars = scriptExemplarsJson as { [key: string]: string };
	const sample = (a: Array<any>) => a[Math.floor(Math.random() * a.length)];
	let dir;
	const scriptFontExemplars = Object.entries(scriptFontMap)
		.map((v) => ({ v, sort: Math.random() }))
		.sort((a, b) => a.sort - b.sort)
		.map(({ v }) => v)
		.slice(0, 3)
		.map(([script, fonts]) => [
			script,
			fonts[0],
			scriptExemplars[script] || '',
			(dir = scriptDirection[script]) === 'vltr'
				? 'vertical-lr'
				: dir === 'vrtl'
					? 'vertical-rl'
					: 'horizontal-tb'
		])
		.filter((e) => e[2]);
</script>

<div out:fade={{ duration: 500 }} class="loading">
	<div in:fade={{ duration: 2000 }} class="logo">{name}</div>
	<div class="cube-container">
		<div class="cube" style:animation-direction={'reverse'}>
			{#each scriptFontExemplars as [script, font, exemplar, writingMode], i}
				<div
					class="face"
					style:font-family={font}
					style:transform={`rotateY(${(i / scriptFontExemplars.length) * 360}deg) translateZ(0px)`}
					style:writing-mode={writingMode}
				>
					{exemplar}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.cube-container {
		inline-size: 48px;
		block-size: 48px;
	}

	.cube {
		inline-size: 100%;
		block-size: 100%;
		position: relative;
		transform-style: preserve-3d;
		animation: rotate 4s infinite linear;
		font-size: 2rem;
	}

	.face {
		position: absolute;
		inline-size: 100%;
		block-size: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-color);
		border-radius: var(--roundness);
		backface-visibility: hidden;
	}

	@keyframes rotate {
		0% {
			transform: rotateY(0deg);
		}
		33% {
			transform: rotateY(120deg);
		}
		66% {
			transform: rotateY(240deg);
		}
		100% {
			transform: rotateY(360deg);
		}
	}
</style>
