"""Validação ESTÁTICA da configuração do piloto; não executa agentes IA."""
from pathlib import Path
import tomllib

root = Path(__file__).resolve().parents[1]
settings = tomllib.loads((root / '.codex/config.toml').read_text(encoding='utf8'))
assert settings['agents']['enabled'] is True
assert 1 <= settings['agents']['max_concurrent_threads_per_session'] <= 3

agents_dir = root / '.codex/agents'
files = sorted(agents_dir.glob('*.toml'))
assert {f.stem for f in files} == {'desenvolvedor', 'testes', 'seguranca'}
configs = {p.stem: tomllib.loads(p.read_text(encoding='utf8')) for p in files}
for name, item in configs.items():
    assert item.get('name') == name, f'Agente {name}: nome incorreto'
    for k in ['description', 'developer_instructions']:
        assert isinstance(item.get(k), str) and len(item[k].strip()) > 80, (name, k)

dev = configs['desenvolvedor']['developer_instructions']
qa = configs['testes']['developer_instructions']
sec = configs['seguranca']['developer_instructions']
root_policy = (root/'AGENTS.md').read_text(encoding='utf8')
docs = (root/'docs/AGENTES_PILOTO.md').read_text(encoding='utf8')
assert 'feature/*' in dev and 'fix/*' in dev and 'develop' in dev
assert 'main' in dev and 'Supabase' in dev and 'Mux' in dev
assert 'npm run check' in qa and 'npm run test:central' in qa
assert 'INCONCLUSIVO' in qa and 'REPROVADO' in qa
assert 'RLS' in sec and 'role' in sec and 'INCONCLUSIVO' in sec
assert '## Coordenação entre agentes (piloto)' in root_policy
assert 'preventiva' in root_policy and '125h' in root_policy
assert 'Mux' in root_policy and 'YouTube' in root_policy
assert 'não substitui' in root_policy and 'aprovação' in root_policy
assert 'somente leitura' in docs and 'sem mudança' in docs
assert 'não prova' in docs.lower() or 'não provam' in docs.lower()
print('APROVADO: configuração estrutural, papéis, instruções e regras preservadas. Subagentes ainda NÃO executados.')
