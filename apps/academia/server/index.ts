import {createPlaybackHandler} from './playback.mjs';
const handler=createPlaybackHandler({env:Deno.env.toObject()});
Deno.serve(handler);
