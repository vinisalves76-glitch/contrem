import {createPlaybackHandler} from './playback.mjs';
const env=Deno.env.toObject();
// Closed origin list for the central Academy. Provider secrets remain server-only.
env.STREAM_ALLOWED_ORIGINS ||= 'https://contrem.vercel.app';
const handler=createPlaybackHandler({env});
Deno.serve(handler);
