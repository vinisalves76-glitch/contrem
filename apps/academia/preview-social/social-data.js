(() => {
  'use strict';

  const storageKey = 'contrem-academia-social-preview-v1';
  const me = { name: 'Aluno de teste', role: 'Aluno da CONTREM' };
  const rafael = { name: 'Rafael Lima', role: 'Mecânico de manutenção' };
  const juliana = { name: 'Juliana Martins', role: 'Técnica de manutenção' };
  const andre = { name: 'André Nunes', role: 'Mecânico de campo' };
  const categories = ['Motores diesel', 'Hidráulica', 'Elétrica', 'Manutenção e segurança'];
  const ago = hours => new Date(Date.now() - hours * 3600000).toISOString();
  const message = (id, author, text, hours) => ({ id, author, text, createdAt: ago(hours) });

  function sample() {
    return {
      posts: [
        {
          ...message('field-notes', rafael, 'Hoje acompanhei a revisão de uma escavadeira e organizei o que aprendi numa ficha de inspeção. O que mais me ajudou foi separar o que observei do que ainda precisava confirmar. Como vocês registram os aprendizados de campo?', 4),
          image: 'assets/campo.webp',
          alt: 'Equipe técnica e escavadeira em uma área de manutenção',
          likes: 8,
          liked: false,
          comments: [message('field-reply', juliana, 'Na nossa equipe a gente anota a condição em que o sintoma apareceu e depois confere o registro com quem acompanhou o serviço.', 2)],
        },
        {
          ...message('study-notes', juliana, 'Revendo os materiais de motores diesel, montei um resumo visual dos caminhos do ar e dos gases de escape. Separar os dois caminhos me ajudou a entender a função de cada lado do turbo.', 25),
          likes: 4,
          liked: false,
          comments: [],
        },
      ],
      topics: [
        {
          ...message('diesel-question', andre, 'Quero melhorar o registro antes de levar o caso para a equipe. Quais informações sobre carga, rotação e momento em que o sintoma aparece vocês costumam anotar?', 5),
          title: 'Perda de potência sob carga. O que anotar primeiro?',
          category: categories[0],
          resolved: false,
          replies: [message('diesel-reply', rafael, 'Anoto o horário, a atividade que a máquina estava executando, as mensagens no painel e quando o sintoma começou. Isso ajuda a equipe a reproduzir a condição e consultar o manual do modelo.', 3)],
        },
        {
          ...message('hydraulics-question', juliana, 'Estou revisando o básico e ainda confundo as duas grandezas quando olho um diagrama. Alguém tem um jeito fácil de lembrar?', 18),
          title: 'Como diferenciar pressão e vazão?',
          category: categories[1],
          resolved: true,
          replies: [message('hydraulics-reply', andre, 'Penso em pressão como força por área e em vazão como volume por tempo. No diagrama, confiro qual grandeza o ponto de medição representa.', 14)],
        },
        {
          ...message('electrical-question', rafael, 'Quero me acostumar com a leitura dos símbolos e com a legenda do fabricante. Por onde vocês começaram a estudar?', 27),
          title: 'Dicas para começar a ler esquemas elétricos',
          category: categories[2],
          resolved: false,
          replies: [],
        },
      ],
    };
  }

  function read() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (Array.isArray(saved?.posts) && Array.isArray(saved?.topics)) return saved;
    } catch {}
    return sample();
  }

  function write(change) {
    const commit = () => {
      const state = read();
      change(state);
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch {
        throw Error('O navegador não conseguiu salvar a alteração. Confira o espaço disponível ou tente outro navegador.');
      }
    };
    return navigator.locks?.request(storageKey, commit) ?? Promise.resolve().then(commit);
  }

  function find(records, id) {
    const item = records.find(record => record.id === id);
    if (!item) throw Error('Este conteúdo não está mais disponível.');
    return item;
  }

  function addMessage(text) {
    return message(crypto.randomUUID(), me, text, 0);
  }

  async function photo(file) {
    if (!file) return '';
    const supported = /^image\/(jpeg|png|webp)$/.test(file.type)
      || (!file.type && /\.(jpe?g|png|webp)$/i.test(file.name));
    if (!supported) throw Error('Escolha uma foto JPG, PNG ou WebP.');
    if (file.size > 10 * 1024 * 1024) throw Error('Escolha uma foto de até 10 MB.');

    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const scale = Math.min(1, 1280 / image.naturalWidth, 1280 / image.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw Error('Canvas indisponível.');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.82);
    } catch {
      throw Error('Não foi possível abrir essa foto. Selecione outro arquivo.');
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  window.ContremSocialPreview = { me, categories, storageKey, read, write, find, addMessage, photo };
})();
