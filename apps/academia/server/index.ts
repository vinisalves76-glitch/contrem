import {createPlaybackHandler} from './playback.mjs';
const env=Deno.env.toObject();
// Closed origin list for the central Academy. Provider secrets remain server-only.
env.STREAM_ALLOWED_ORIGINS ||= 'https://contrem.vercel.app,https://contrem-git-feature-aca-7b7922-vinicius-alves-projects-fdea38e8.vercel.app,https://contrem-git-feature-aca-d862b0-vinicius-alves-projects-fdea38e8.vercel.app';
const handler=createPlaybackHandler({env});
Deno.serve(handler);
