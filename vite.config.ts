import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

const rbtMinify = {
	name: 'rbt-minify',
	transform(code: string, id: string) {
		if (id.endsWith('.rbt?raw')) {
			return code.replace(/(\\n)+/g, '\\n');
		}
	}
};

const config: UserConfig = {
	plugins: [
		rbtMinify,
		sveltekit(),
		visualizer({ open: true, emitFile: true, filename: 'stats.html' })
	],
	build: {
		target: 'esnext',
		commonjsOptions: {
			transformMixedEsModules: true
		}
	},
	envPrefix: 'KV_'
};

export default config;
