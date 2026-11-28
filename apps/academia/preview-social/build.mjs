import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

const directory = 'dist/academia/preview-social';
const source = new URL('./', import.meta.url);
const inheritedScripts = new Set([
  'assets/contrem.js', 'assets/assessment-core.js', 'assets/student-navigation.js',
]);

export async function buildSocialPreview(academyHtml) {
  const form = /<form id="cloudLoginForm"[\s\S]*?<\/form>\s*<p class="cloud-login-note">[\s\S]*?<\/p>/;
  if (!form.test(academyHtml) || !academyHtml.includes('<script src="assets/cloud-store.js">')) {
    throw Error('A estrutura de entrada da Academia mudou. Revise a prévia social.');
  }

  const head = `<base href="/academia/">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://image.mux.com; connect-src 'none'; frame-src https://player.mux.com; form-action 'none'">`;
  const roles = `<div class="social-role-options" aria-label="Perfis de teste">
  <button type="button" class="primary" data-social-role="student">Entrar como aluno</button>
  <button type="button" class="outline" data-social-role="admin">Entrar como ADM</button>
</div>
<p class="cloud-login-note">Use os perfis de teste para publicar, conversar e moderar. As alterações ficam neste navegador.</p>`;
  const html = academyHtml
    .replace(/<title>[^<]+<\/title>/, '<title>Comunidade e Fórum | CONTREM Academia</title>')
    .replace(/<link[^>]*rel="manifest"[^>]*>/, '')
    .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + head + '\n')
    .replace('</head>', '<link rel="stylesheet" href="preview-social/social.css">\n</head>')
    .replace(/<h2>Bem-vindo à<br>CONTREM Academia\.<\/h2>/, '<h2>Comunidade e Fórum</h2>')
    .replace(/<p class="login-intro">[^<]+<\/p>/, '<p class="login-intro">Prévia da área do aluno e da moderação da CONTREM Academia.</p>')
    .replace(form, roles)
    .replace(/<button[^>]*data-install-app[^>]*>[\s\S]*?<\/button>/g, '')
    .replace('<script src="assets/cloud-store.js">', '<script src="preview-social/preview-storage.js">')
    .replace(/<script src="([^"]+)" defer><\/script>/g, (element, path) => inheritedScripts.has(path) ? element : '')
    .replace('</body>', `<script src="preview-social/social-data.js" defer></script>
<script src="preview-social/social-ui.js" defer></script>
</body>`);

  await mkdir(directory, { recursive: true });
  const store = await readFile(new URL('../src/assets/cloud-store.js', source), 'utf8');
  await Promise.all([
    writeFile(directory + '/index.html', html),
    writeFile(directory + '/preview-storage.js', store.replace('contrem-adm-preview-v1:', 'contrem-social-preview-learning-v1:')),
    ...['social.css', 'social-data.js', 'social-ui.js'].map(name => copyFile(new URL(name, source), directory + '/' + name)),
  ]);
}
