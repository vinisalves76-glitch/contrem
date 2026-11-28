/* Interactive student and moderator workspaces, mounted only in the isolated preview. */
(() => {
  'use strict';

  const data = window.ContremSocialPreview;
  const byId = id => document.getElementById(id);
  const app = byId('app');
  const studentNav = byId('studentNav');
  const adminNav = byId('adminNav');
  const community = workspace('socialCommunity', 'community', 'Comunidade');
  const forum = workspace('socialForum', 'forum', 'Fórum');
  const moderation = workspace('socialModeration', '', 'Moderação');
  let role = '';
  let openPost = '';
  let openTopic = '';
  let modKind = 'posts';
  let removal = null;
  const date = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });

  function workspace(id, area, label) {
    const section = document.createElement('section');
    section.id = id;
    section.className = 'social-workspace student-nav-area';
    section.hidden = true;
    if (area) {
      section.dataset.studentSection = area;
      section.dataset.label = label;
    }
    return section;
  }

  function navButton(label, icon) {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = `<span aria-hidden="true">${icon}</span> ${label}`;
    return button;
  }

  const communityTab = navButton('Comunidade', '◉');
  const forumTab = navButton('Fórum', '▤');
  const modTab = navButton('Moderação', '▤');
  communityTab.dataset.studentArea = 'community';
  forumTab.dataset.studentArea = 'forum';
  byId('studentTab').after(communityTab, forumTab);
  adminNav.append(modTab);
  byId('studentView').append(community, forum);
  byId('adminView').append(moderation);

  // Mount the Academy list expected by the standard student navigation.
  const academies = document.createElement('section');
  academies.id = 'connectedMyAcademies';
  academies.className = 'panel';
  academies.innerHTML = '<h2>Minhas Academias</h2><p>Nenhuma matrícula de exemplo nesta prévia.</p>';
  byId('studentView').append(academies);

  const labels = {
    posts: { one: 'publicação', child: 'comentário', children: 'comments', location: 'no feed da Comunidade' },
    topics: { one: 'tópico', child: 'resposta', children: 'replies', location: 'no Fórum' },
  };
  const count = (amount, one, many) => `${amount} ${amount === 1 ? one : many}`;
  const time = item => `<time datetime="${esc(item.createdAt)}">${date.format(new Date(item.createdAt))}</time>`;
  const avatar = author => `<span class="social-avatar" aria-hidden="true">${esc(author.name.split(' ').slice(0, 2).map(part => part[0]).join(''))}</span>`;
  const authorBox = item => `<div class="social-author">${avatar(item.author)}<div><strong>${esc(item.author.name)}</strong>
    <small>${esc(item.author.role)} <span aria-hidden="true">·</span> ${time(item)}</small></div></div>`;
  const body = item => `<p class="social-user-text">${esc(item.text)}</p>`;
  const categories = data.categories.map(category => `<option>${esc(category)}</option>`).join('');
  const heading = (title, intro, action = '') => `<header class="social-heading"><div><h1 tabindex="-1">${title}</h1><p>${intro}</p></div>${action}</header>`;
  const status = '<p class="social-status" role="status" aria-live="polite"></p>';

  community.innerHTML = heading('Comunidade', 'Compartilhe fotos, aprendizados e experiências de trabalho com outros alunos.') + `
    <div class="social-layout">
      <div class="social-feed-column">
        <form class="social-card social-compose" data-social-form="post">
          <div class="social-author">${avatar(data.me)}<h2>Nova publicação</h2></div>
          <label for="social-post-text">O que você aprendeu no trabalho?</label>
          <textarea id="social-post-text" name="text" maxlength="1600" rows="3" required></textarea>
          <div id="social-photo-fields" class="social-file" hidden>
            <label for="social-post-photo">Foto da publicação</label>
            <input id="social-post-photo" name="image" type="file" accept="image/jpeg,image/png,image/webp">
            <small>JPG, PNG ou WebP, até 10 MB.</small>
            <label for="social-photo-description">Descrição da foto (opcional)</label>
            <input id="social-photo-description" name="alt" maxlength="140" type="text">
          </div>
          <div class="social-actions social-compose-actions">
            <button type="button" class="outline" data-social-action="photo" aria-expanded="false" aria-controls="social-photo-fields">Adicionar foto</button>
            <button class="primary" type="submit">Publicar</button>
          </div>
        </form>
        ${status}
        <div class="social-list" data-feed aria-label="Publicações dos alunos"></div>
      </div>
      <aside class="social-card social-aside">
        <h2>Fórum técnico</h2>
        <p>Precisa de ajuda com um caso de campo? Abra uma pergunta e acompanhe as respostas dos colegas.</p>
        <button type="button" class="outline" data-student-area="forum">Abrir Fórum</button>
      </aside>
    </div>`;

  forum.innerHTML = heading('Fórum', 'Tire dúvidas de cursos e compartilhe casos técnicos do dia a dia.',
    '<button type="button" class="primary" data-social-action="question" aria-expanded="false" aria-controls="social-question">Nova pergunta</button>') + `
    ${status}
    <form id="social-question" class="social-card social-compose social-question" data-social-form="topic" hidden>
      <h2>Faça uma pergunta</h2>
      <div class="social-filter-grid">
        <div><label for="social-title">Título</label><input id="social-title" name="title" maxlength="110" required></div>
        <div><label for="social-category">Categoria</label><select id="social-category" name="category" required>
          <option value="">Selecione</option>${categories}</select></div>
      </div>
      <label for="social-question-text">Descreva a situação</label>
      <textarea id="social-question-text" name="text" rows="4" maxlength="2000" required></textarea>
      <div class="social-actions social-compose-actions">
        <button type="button" class="outline" data-social-action="question">Cancelar</button>
        <button type="submit" class="primary">Publicar pergunta</button>
      </div>
    </form>
    <div data-forum-index>
      <div class="social-card social-filter-grid social-filters">
        <div><label for="social-topic-search">Buscar tópico</label><input id="social-topic-search" type="search" placeholder="Ex. motor diesel"></div>
        <div><label for="social-topic-category">Categoria</label><select id="social-topic-category"><option value="">Todas</option>${categories}</select></div>
      </div>
      <div class="social-list" data-topics></div>
    </div>
    <article class="social-card social-topic-detail" data-topic-detail hidden></article>`;

  moderation.innerHTML = heading('Moderação', 'Consulte e exclua publicações, comentários, tópicos e respostas dos alunos.') + `
    <div class="social-actions social-mod-menu" aria-label="Áreas para moderar">
      <button type="button" class="outline" data-social-action="mod-filter" data-kind="posts" aria-pressed="true">Comunidade</button>
      <button type="button" class="outline" data-social-action="mod-filter" data-kind="topics" aria-pressed="false">Fórum</button>
    </div>
    ${status}<div class="social-list" data-mod-list></div>
    <dialog class="social-dialog" aria-labelledby="social-remove-title">
      <h2 id="social-remove-title"></h2>
      <p data-removal-context></p>
      <div class="social-actions social-compose-actions">
        <button type="button" class="outline" data-social-action="cancel-remove" autofocus>Cancelar</button>
        <button type="button" class="social-danger" data-social-action="confirm-remove">Excluir</button>
      </div>
    </dialog>`;

  const removalDialog = moderation.querySelector('dialog');

  function tell(panel, message = '', error = false) {
    const result = panel.querySelector('.social-status');
    result.textContent = message;
    result.classList.toggle('error', error);
  }

  function responseList(items, kind, parentId) {
    const isComment = kind === 'comment';
    const label = isComment ? 'Comentar' : 'Responder';
    const title = isComment ? 'Comentários' : 'Respostas';
    return `<section class="social-responses" aria-label="${title}"><h3>${title}</h3>
      ${items.length ? items.map(item => `<article>${authorBox(item)}${body(item)}</article>`).join('')
        : `<p class="social-muted">Nenhum${isComment ? ' comentário' : 'a resposta'} ainda.</p>`}
      <form class="social-response-form" data-social-form="${kind}" data-id="${esc(parentId)}">
        <label for="social-${kind}-text">${isComment ? 'Seu comentário' : 'Sua resposta'}</label>
        <textarea id="social-${kind}-text" name="text" maxlength="1000" rows="2" required></textarea>
        <button type="submit" class="primary">${label}</button>
      </form></section>`;
  }

  function renderFeed() {
    const { posts } = data.read();
    community.querySelector('[data-feed]').innerHTML = posts.map(post => {
      const expanded = post.id === openPost;
      const picture = post.image ? `<img class="social-post-photo" src="${esc(post.image)}" alt="${esc(post.alt)}">` : '';
      return `<article class="social-card social-post">
        <div class="social-post-body">${authorBox(post)}${body(post)}</div>
        ${picture}
        <div class="social-actions social-post-actions">
          <button class="outline" type="button" data-social-action="like" data-id="${esc(post.id)}" aria-pressed="${post.liked}">${post.liked ? 'Curtido' : 'Curtir'} · ${post.likes}</button>
          <button class="outline" type="button" data-social-action="comments" data-id="${esc(post.id)}" aria-expanded="${expanded}">${count(post.comments.length, 'comentário', 'comentários')}</button>
        </div>
        ${expanded ? responseList(post.comments, 'comment', post.id) : ''}
      </article>`;
    }).join('') || '<p class="social-card social-empty">A comunidade ainda não tem publicações.</p>';
  }

  const searchKey = value => value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{M}/gu, '');
  const badge = topic => `<span class="social-badge${topic.resolved ? ' resolved' : ''}">${topic.resolved ? 'Resolvido' : 'Em aberto'}</span>`;

  function renderForum() {
    const { topics } = data.read();
    const detail = forum.querySelector('[data-topic-detail]');
    const index = forum.querySelector('[data-forum-index]');
    const topic = topics.find(item => item.id === openTopic);
    detail.hidden = !topic;
    index.hidden = Boolean(topic);

    if (topic) {
      detail.innerHTML = `
        <button class="outline" type="button" data-social-action="topics">Voltar aos tópicos</button>
        <div class="social-topic-meta"><span class="social-category">${esc(topic.category)}</span>${badge(topic)}</div>
        <h2 tabindex="-1">${esc(topic.title)}</h2>
        ${authorBox(topic)}${body(topic)}
        ${topic.author.name === data.me.name ? `<button class="outline" type="button" data-social-action="resolve" data-id="${esc(topic.id)}">${topic.resolved ? 'Reabrir tópico' : 'Marcar como resolvido'}</button>` : ''}
        ${responseList(topic.replies, 'reply', topic.id)}`;
      return;
    }

    openTopic = '';
    detail.replaceChildren();
    const search = searchKey(byId('social-topic-search').value.trim());
    const category = byId('social-topic-category').value;
    const filtered = topics.filter(item => (!category || item.category === category)
      && searchKey(`${item.title} ${item.text} ${item.category}`).includes(search));

    forum.querySelector('[data-topics]').innerHTML = filtered.map(item => `
      <article class="social-card social-topic">
        <div class="social-topic-meta"><span class="social-category">${esc(item.category)}</span>${badge(item)}</div>
        <h2><button type="button" class="social-topic-link" data-social-action="open-topic" data-id="${esc(item.id)}">${esc(item.title)}</button></h2>
        ${body(item)}
        <div class="social-topic-foot"><span>${esc(item.author.name)} <span aria-hidden="true">·</span> ${time(item)}</span><strong>${count(item.replies.length, 'resposta', 'respostas')}</strong></div>
      </article>`).join('') || '<p class="social-card social-empty">Nenhum tópico encontrado.</p>';
  }

  function removalButton(kind, id, parent = '') {
    const title = labels[kind][parent ? 'child' : 'one'];
    return `<button type="button" class="outline social-remove" data-social-action="remove" data-kind="${kind}" data-id="${esc(id)}" data-parent="${esc(parent)}">Excluir ${title}</button>`;
  }

  function renderModeration() {
    const items = data.read()[modKind];
    const type = labels[modKind];
    for (const button of moderation.querySelectorAll('[data-social-action="mod-filter"]')) {
      button.setAttribute('aria-pressed', String(button.dataset.kind === modKind));
    }
    moderation.querySelector('[data-mod-list]').innerHTML = items.map(item => `
      <article class="social-card social-mod-item">
        <div class="social-mod-row"><div>${item.title ? `<h2>${esc(item.title)}</h2>` : ''}${authorBox(item)}</div>${removalButton(modKind, item.id)}</div>
        ${body(item)}
        ${item.image ? `<img class="social-mod-photo" src="${esc(item.image)}" alt="${esc(item.alt)}">` : ''}
        ${item[type.children].map(child => `<article class="social-mod-child">
          <div class="social-mod-row">${authorBox(child)}${removalButton(modKind, child.id, item.id)}</div>${body(child)}
        </article>`).join('')}
      </article>`).join('') || `<p class="social-card social-empty">Nenhum conteúdo para moderar ${type.location}.</p>`;
  }

  function toggleQuestion(visible) {
    const form = byId('social-question');
    form.hidden = !visible;
    const button = forum.querySelector('header button');
    button.setAttribute('aria-expanded', String(visible));
    if (visible) byId('social-title').focus();
    else button.focus();
  }

  function showModeration() {
    if (role !== 'admin') return;
    show('adminView');
    moderation.hidden = false;
    modTab.classList.add('active');
    modTab.setAttribute('aria-current', 'page');
    byId('workspaceLabel').textContent = 'Moderação';
    renderModeration();
  }

  function enter(next) {
    role = next;
    const student = role === 'student';
    studentNav.hidden = !student;
    adminNav.hidden = student;
    byId('sidebarContext').textContent = student ? 'AMBIENTE DE APRENDIZAGEM' : 'GESTÃO DA ACADEMIA';
    document.querySelector('.demo-chip').textContent = student ? 'ALUNO · PRÉVIA' : 'ADM MASTER · PRÉVIA';
    document.querySelector('.skip-link').href = location.pathname + (student ? '#studentView' : '#adminView');
    byId('login').classList.add('hidden');
    app.classList.remove('hidden');
    if (student) {
      show('studentView');
      studentName = data.me.name;
      byId('hello').textContent = studentName;
      window.dispatchEvent(new CustomEvent('contrem:academy-session-ready', { detail: { role, name: studentName } }));
      window.CONTREM_STUDENT_NAV.go('community');
      renderFeed();
      renderForum();
      community.querySelector('h1').focus();
    } else {
      showModeration();
      moderation.querySelector('h1').focus();
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  for (const button of document.querySelectorAll('[data-social-role]')) {
    button.addEventListener('click', () => enter(button.dataset.socialRole));
  }
  for (const button of adminNav.querySelectorAll('button')) {
    if (button !== modTab) button.hidden = true;
  }
  byId('adminView').classList.add('social-admin-preview');
  byId('exit').textContent = 'Trocar perfil';
  document.querySelector('.mobile-exit').textContent = 'Trocar perfil';
  document.querySelector('.mobile-exit').setAttribute('aria-label', 'Trocar perfil');
  byId('exit').addEventListener('click', () => {
    window.dispatchEvent(new Event('contrem:academy-session-ended'));
    role = '';
    openPost = '';
    openTopic = '';
    removalDialog.close();
    for (const panel of [community, forum, moderation]) tell(panel);
    document.querySelector('[data-social-role="student"]').focus();
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  modTab.addEventListener('click', showModeration);
  byId('social-topic-search').addEventListener('input', renderForum);
  byId('social-topic-category').addEventListener('change', renderForum);

  app.addEventListener('click', async event => {
    const button = event.target.closest('[data-social-action]');
    if (!button) return;
    const { socialAction, id, kind, parent } = button.dataset;
    const panel = button.closest('.social-workspace');
    if (role !== (panel === moderation ? 'admin' : 'student')) return;

    try {
      switch (socialAction) {
        case 'photo': {
          const fields = community.querySelector('.social-file');
          fields.hidden = !fields.hidden;
          button.setAttribute('aria-expanded', String(!fields.hidden));
          if (!fields.hidden) byId('social-post-photo').focus();
          else {
            byId('social-post-photo').value = '';
            byId('social-photo-description').value = '';
          }
          break;
        }
        case 'like': {
          button.disabled = true;
          let likedPost;
          await data.write(state => {
            likedPost = data.find(state.posts, id);
            likedPost.liked = !likedPost.liked;
            likedPost.likes += likedPost.liked ? 1 : -1;
          });
          button.textContent = `${likedPost.liked ? 'Curtido' : 'Curtir'} · ${likedPost.likes}`;
          button.setAttribute('aria-pressed', String(likedPost.liked));
          button.disabled = false;
          break;
        }
        case 'comments':
          openPost = openPost === id ? '' : id;
          renderFeed();
          community.querySelector(openPost ? '#social-comment-text' : `[data-social-action="comments"][data-id="${CSS.escape(id)}"]`)?.focus();
          break;
        case 'question':
          toggleQuestion(byId('social-question').hidden);
          break;
        case 'open-topic':
          openTopic = id;
          toggleQuestion(false);
          renderForum();
          forum.querySelector('[data-topic-detail] h2')?.focus();
          break;
        case 'topics':
          openTopic = '';
          renderForum();
          byId('social-topic-search').focus();
          break;
        case 'resolve':
          await data.write(state => {
            const topic = data.find(state.topics, id);
            if (topic.author.name === data.me.name) topic.resolved = !topic.resolved;
          });
          renderForum();
          forum.querySelector('[data-social-action="resolve"]')?.focus();
          break;
        case 'mod-filter':
          modKind = kind;
          tell(moderation);
          renderModeration();
          break;
        case 'remove': {
          removal = { kind, id, parent };
          const type = labels[kind];
          byId('social-remove-title').textContent = `Excluir ${parent ? type.child : type.one}?`;
          removalDialog.querySelector('[data-removal-context]').textContent = parent
            ? `O conteúdo sairá da visualização dos alunos ${type.location}.`
            : 'O conteúdo e as mensagens associadas sairão da visualização dos alunos.';
          removalDialog.showModal();
          break;
        }
        case 'cancel-remove':
          removalDialog.close();
          removal = null;
          break;
        case 'confirm-remove': {
          if (!removal) return;
          const target = removal;
          button.disabled = true;
          await data.write(state => {
            if (target.parent) {
              const record = data.find(state[target.kind], target.parent);
              const children = labels[target.kind].children;
              record[children] = record[children].filter(item => item.id !== target.id);
            } else {
              state[target.kind] = state[target.kind].filter(item => item.id !== target.id);
            }
          });
          removalDialog.close();
          removal = null;
          renderModeration();
          tell(moderation, 'Conteúdo excluído.');
          moderation.querySelector('h1').focus();
          break;
        }
      }
    } catch (error) {
      if (removalDialog.open) removalDialog.close();
      tell(panel, error.message, true);
    } finally {
      button.disabled = false;
    }
  });

  app.addEventListener('submit', async event => {
    const form = event.target;
    const kind = form.dataset.socialForm;
    if (!kind) return;
    event.preventDefault();
    if (role !== 'student' || form.getAttribute('aria-busy') === 'true') return;

    const panel = form.closest('.social-workspace');
    const send = form.querySelector('button[type="submit"]');
    const fields = new FormData(form);
    const text = fields.get('text').trim();
    if (!text) {
      tell(panel, 'Escreva uma mensagem antes de publicar.', true);
      form.elements.text.focus();
      return;
    }

    form.setAttribute('aria-busy', 'true');
    send.disabled = true;
    tell(panel);
    try {
      const message = data.addMessage(text);
      if (kind === 'post') {
        const image = await data.photo(form.elements.image.files[0]);
        if (role !== 'student') return;
        const alt = fields.get('alt').trim() || 'Foto enviada por ' + data.me.name;
        await data.write(state => state.posts.unshift({ ...message, image, alt, likes: 0, liked: false, comments: [] }));
        community.querySelector('.social-file').hidden = true;
        community.querySelector('[data-social-action="photo"]').setAttribute('aria-expanded', 'false');
        renderFeed();
        tell(community, 'Publicação adicionada à Comunidade.');
      } else if (kind === 'topic') {
        const title = fields.get('title').trim();
        const category = fields.get('category');
        if (!title || !data.categories.includes(category)) throw Error('Informe o título e escolha uma categoria.');
        await data.write(state => state.topics.unshift({ ...message, title, category, resolved: false, replies: [] }));
        openTopic = message.id;
        toggleQuestion(false);
        renderForum();
        tell(forum, 'Pergunta publicada.');
        forum.querySelector('[data-topic-detail] h2').focus();
      } else if (kind === 'comment') {
        await data.write(state => data.find(state.posts, form.dataset.id).comments.push(message));
        renderFeed();
        tell(community, 'Comentário publicado.');
        byId('social-comment-text')?.focus();
      } else if (kind === 'reply') {
        await data.write(state => data.find(state.topics, form.dataset.id).replies.push(message));
        renderForum();
        tell(forum, 'Resposta publicada.');
        byId('social-reply-text')?.focus();
      }
      form.reset();
    } catch (error) {
      tell(panel, error.message, true);
    } finally {
      send.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });

  window.addEventListener('storage', event => {
    if (event.key !== data.storageKey) return;
    if (role === 'student') {
      renderFeed();
      renderForum();
    } else if (role === 'admin') renderModeration();
  });
})();
