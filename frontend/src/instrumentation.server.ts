import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  dsn: 'https://dfd0a72f26b8699a9c560c641ea5f037@o4510957324795904.ingest.de.sentry.io/4510957405143120',

  tracesSampleRate: 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: import.meta.env.DEV,
});