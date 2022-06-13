import { Tracing, ignoreIncomingRequestUrl, ignoreOutgoingRequestPath } from '@map-colonies/telemetry';
import { IGNORED_INCOMING_TRACE_ROUTES, IGNORED_OUTGOING_TRACE_ROUTES } from './constants';

const tracing = new Tracing(undefined, {
  ['@opentelemetry/instrumentation-http']: {
    ignoreIncomingRequestHook: ignoreIncomingRequestUrl(IGNORED_INCOMING_TRACE_ROUTES),
    ignoreOutgoingRequestHook: ignoreOutgoingRequestPath(IGNORED_OUTGOING_TRACE_ROUTES),
  },
});

tracing.start();

export { tracing };
