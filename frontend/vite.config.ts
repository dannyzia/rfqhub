import { sentrySvelteKit } from "@sentry/sveltekit";
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			org: 'digital-papyrus',
			project: 'node-express',
			adapter: 'vercel',
			telemetry: false,
		}),
		sveltekit(),
	],
});