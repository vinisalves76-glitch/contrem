// Pure build-configuration contracts; all values are synthetic and no network is used.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAcademiaConfig} from '../scripts/academia-config.mjs';
const connected={ACADEMY_MODE:'connected',SUPABASE_URL:'https://contract-test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_contract_test_only'};
const jwt=role=>['eyJhbGciOiJIUzI1NiJ9',Buffer.from(JSON.stringify({role,ref:'contract-test'})).toString('base64url'),'test-signature'].join('.');
test('development defaults to isolated preview',()=>{const config=createAcademiaConfig({});assert.equal(config.preview,true);assert.notEqual(config.mode,'connected');});
test('production without explicit connected mode fails closed',()=>{assert.throws(()=>createAcademiaConfig({VERCEL_ENV:'production'}));assert.throws(()=>createAcademiaConfig({VERCEL_ENV:'production',ACADEMY_MODE:'preview'}));});
test('unknown operating modes are rejected',()=>{for(const mode of ['production','real','Connected','false'])assert.throws(()=>createAcademiaConfig({...connected,ACADEMY_MODE:mode}));});
test('connected config exposes only public integration settings',()=>{
 const config=createAcademiaConfig({...connected,VERCEL_ENV:'production',SUPABASE_SERVICE_ROLE_KEY:'private-server-only-marker',MUX_TOKEN_SECRET:'mux-server-only-marker',MUX_SIGNING_PRIVATE_KEY:'private-signing-marker'});
 assert.equal(config.mode,'connected');assert.equal(config.preview,false);assert.equal(config.url,connected.SUPABASE_URL);assert.equal(config.publishableKey,connected.SUPABASE_PUBLISHABLE_KEY);assert.equal(config.playbackFunction,'academy-playback');
 const serialized=JSON.stringify(config);for(const secret of ['private-server-only-marker','mux-server-only-marker','private-signing-marker','SUPABASE_SERVICE_ROLE_KEY','MUX_TOKEN_SECRET','MUX_SIGNING_PRIVATE_KEY'])assert(!serialized.includes(secret));
});
test('connected mode requires URL and public key even outside production',()=>{assert.throws(()=>createAcademiaConfig({ACADEMY_MODE:'connected'}));assert.throws(()=>createAcademiaConfig({...connected,SUPABASE_URL:''}));assert.throws(()=>createAcademiaConfig({...connected,SUPABASE_PUBLISHABLE_KEY:''}));});
for(const url of ['http://contract-test.supabase.co','https://supabase.co','https://contract-test.supabase.co.attacker.invalid','https://attacker.invalid','https://user:password@contract-test.supabase.co','https://contract-test.supabase.co/path','https://contract-test.supabase.co?x=1'])test('rejects invalid Supabase URL '+url,()=>{assert.throws(()=>createAcademiaConfig({...connected,SUPABASE_URL:url}));});
test('accepts legacy anon JWT public key for compatibility',()=>{const key=jwt('anon');assert.equal(createAcademiaConfig({...connected,SUPABASE_PUBLISHABLE_KEY:key}).publishableKey,key);});
for(const key of ['sb_secret_server_test_only',jwt('service_role'),jwt('authenticated'),'arbitrary-key','not.a.jwt'])test('rejects secret or nonpublic key '+key.slice(0,24),()=>{assert.throws(()=>createAcademiaConfig({...connected,SUPABASE_PUBLISHABLE_KEY:key}));});
test('invalid configuration errors never echo secret input',()=>{const secret='sb_secret_sensitive_marker';try{createAcademiaConfig({...connected,SUPABASE_PUBLISHABLE_KEY:secret});assert.fail('secret key accepted');}catch(error){assert(!String(error).includes(secret));}});

test('anon JWT must belong to the configured Supabase project',()=>{const payload=Buffer.from(JSON.stringify({role:'anon',ref:'another-project'})).toString('base64url');assert.throws(()=>createAcademiaConfig({...connected,SUPABASE_PUBLISHABLE_KEY:'eyJhbGciOiJIUzI1NiJ9.'+payload+'.fake'}));});
for(const name of ['../other','https://attacker.invalid','bad name','UPPERCASE',''])test('invalid playback function name '+JSON.stringify(name),()=>{if(name==='')assert.equal(createAcademiaConfig({...connected,ACADEMY_PLAYBACK_FUNCTION:name}).playbackFunction,'academy-playback');else assert.throws(()=>createAcademiaConfig({...connected,ACADEMY_PLAYBACK_FUNCTION:name}));});
