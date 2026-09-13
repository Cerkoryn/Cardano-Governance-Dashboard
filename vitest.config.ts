import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
	resolve: {
		alias: { $lib: resolve('./src/lib') }
	},
	test: {
		environment: 'node',
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
