import adapter from '@sveltejs/adapter-vercel';
import type { Config } from '@sveltejs/kit';

const config: Config = {
	kit: {
		adapter: adapter(),
		experimental: {
			tracing: { server: true },
			instrumentation: { server: true },
		},
	},
};

export default config;
