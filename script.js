/* =========================================================
   Procure a Luz — site de fã de The Last of Us
   JavaScript puro (sem frameworks). Usa os componentes JS do Bootstrap 5.
   ========================================================= */

/* Espera o HTML carregar antes de rodar qualquer coisa */
document.addEventListener('DOMContentLoaded', () => {
  iniciarNavbar();
  iniciarLanterna();
  iniciarVagalumes();
  iniciarSpoilers();
  iniciarTimeline();
  iniciarModalJogos();
  renderizarPersonagens();
  iniciarBuscaElenco();
  iniciarInfectados();
  iniciarQuiz();
  iniciarRevelarAoRolar();
  iniciarVoltarTopo();
});

/* Verifica se o usuário pediu menos animações no sistema */
const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Lê e grava preferências com segurança (o armazenamento pode estar bloqueado) */
function lerPreferencia(chave) {
  try { return localStorage.getItem(chave); } catch (e) { return null; }
}
function salvarPreferencia(chave, valor) {
  try { localStorage.setItem(chave, valor); } catch (e) { /* ignora */ }
}

/* ---------------------------------------------------------
   1. Navbar: fica mais opaca ao rolar e fecha no celular ao clicar num link
   --------------------------------------------------------- */
function iniciarNavbar() {
  const navbar = document.querySelector('.navbar-tlou');
  const menu = document.getElementById('navConteudo');

  const atualizar = () => navbar.classList.toggle('rolou', window.scrollY > 40);
  atualizar();
  window.addEventListener('scroll', atualizar, { passive: true });

  // No celular, fecha o menu depois de escolher uma seção
  menu.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (menu.classList.contains('show')) {
        bootstrap.Collapse.getOrCreateInstance(menu).hide();
      }
    });
  });
}

/* ---------------------------------------------------------
   2. Efeito de lanterna no herói: a luz segue o cursor ou o dedo
   --------------------------------------------------------- */
function iniciarLanterna() {
  const hero = document.getElementById('inicio');
  const camada = document.getElementById('lanterna');
  let usuarioMexeu = false;

  // Converte a posição do ponteiro em porcentagem dentro do herói
  function moverLuz(clienteX, clienteY) {
    const r = hero.getBoundingClientRect();
    const x = ((clienteX - r.left) / r.width) * 100;
    const y = ((clienteY - r.top) / r.height) * 100;
    camada.style.setProperty('--x', x + '%');
    camada.style.setProperty('--y', y + '%');
  }

  hero.addEventListener('pointermove', (e) => {
    usuarioMexeu = true;
    moverLuz(e.clientX, e.clientY);
  });

  // Enquanto ninguém mexe, a lanterna "procura" sozinha pela cena
  if (!menosMovimento) {
    let t = 0;
    const passear = () => {
      if (!usuarioMexeu) {
        t += 0.008;
        const x = 55 + Math.sin(t) * 22;
        const y = 38 + Math.cos(t * 1.3) * 12;
        camada.style.setProperty('--x', x + '%');
        camada.style.setProperty('--y', y + '%');
        requestAnimationFrame(passear);
      }
    };
    requestAnimationFrame(passear);
  }
}

/* ---------------------------------------------------------
   3. Vaga-lumes: pontinhos de luz flutuando num <canvas>
   --------------------------------------------------------- */
function iniciarVagalumes() {
  const canvas = document.getElementById('vagalumes');
  if (!canvas || menosMovimento) return;
  const ctx = canvas.getContext('2d');
  let largura, altura, luzes = [];

  // Ajusta o canvas ao tamanho do herói (considerando telas de alta densidade)
  function redimensionar() {
    const dpr = window.devicePixelRatio || 1;
    largura = canvas.offsetWidth;
    altura = canvas.offsetHeight;
    canvas.width = largura * dpr;
    canvas.height = altura * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Menos vaga-lumes em telas pequenas, para economizar bateria
    const quantidade = largura < 600 ? 18 : 36;
    luzes = Array.from({ length: quantidade }, criarLuz);
  }

  function criarLuz() {
    return {
      x: Math.random() * largura,
      y: Math.random() * altura,
      raio: 1 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.1 - Math.random() * 0.3,
      fase: Math.random() * Math.PI * 2
    };
  }

  function desenhar() {
    ctx.clearRect(0, 0, largura, altura);
    luzes.forEach((l) => {
      l.x += l.vx + Math.sin(l.fase) * 0.2;
      l.y += l.vy;
      l.fase += 0.02;
      // Quando sai pela parte de cima, volta por baixo
      if (l.y < -10) { l.y = altura + 10; l.x = Math.random() * largura; }

      const brilho = 0.35 + Math.abs(Math.sin(l.fase)) * 0.65;
      const grad = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.raio * 6);
      grad.addColorStop(0, `rgba(255, 220, 120, ${brilho})`);
      grad.addColorStop(1, 'rgba(255, 220, 120, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(l.x, l.y, l.raio * 6, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(desenhar);
  }

  redimensionar();
  window.addEventListener('resize', redimensionar);
  requestAnimationFrame(desenhar);
}

/* ---------------------------------------------------------
   4. Spoilers: interruptor global + clique para revelar um trecho
   --------------------------------------------------------- */
function iniciarSpoilers() {
  const chave = document.getElementById('toggleSpoilers');
  const toastElemento = document.getElementById('toastSpoiler');
  const toastTexto = document.getElementById('toastTexto');

  if (!chave || !toastElemento || !toastTexto) return;

  const toast = bootstrap.Toast.getOrCreateInstance(toastElemento);

  // Restaura a escolha anterior do visitante
  if (lerPreferencia('tlou-spoilers') === 'on') {
    chave.checked = true;
    document.body.classList.add('spoilers-on');
  }

  chave.addEventListener('change', () => {
    document.body.classList.toggle('spoilers-on', chave.checked);
    salvarPreferencia('tlou-spoilers', chave.checked ? 'on' : 'off');
    toastTexto.textContent = chave.checked
      ? 'Spoilers visíveis em todo o site.'
      : 'Spoilers escondidos de novo.';
    toast.show();
  });

  // Delegação de eventos: funciona também para spoilers criados depois (nos modais)
  document.addEventListener('click', (e) => {
    const trecho = e.target.closest('.spoiler');
    if (trecho) trecho.classList.add('revelado');
  });
  document.addEventListener('keydown', (e) => {
    const trecho = e.target.closest && e.target.closest('.spoiler');
    if (trecho && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      trecho.classList.add('revelado');
    }
  });
}

/* Gera o HTML de um trecho com spoiler, acessível por teclado */
function htmlSpoiler(texto) {
  return `<p class="aviso-spoiler mb-1"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i> Spoiler · clique para revelar</p>
          <p class="spoiler" tabindex="0" role="button" aria-label="Trecho com spoiler. Pressione Enter para revelar.">${texto}</p>`;
}

/* Liga um grupo de botões de filtro a uma função de filtragem */
function ligarFiltros(seletorBotoes, atributo, aoFiltrar) {
  const botoes = document.querySelectorAll(seletorBotoes);
  botoes.forEach((botao) => {
    botao.addEventListener('click', () => {
      botoes.forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      botao.classList.add('active');
      botao.setAttribute('aria-pressed', 'true');
      aoFiltrar(botao.getAttribute(atributo));
    });
  });
}

/* Busca de elenco (opcional: só entra em ação se o campo existir no HTML) */
function iniciarBuscaElenco() {
  const input = document.getElementById('buscaElenco');
  const tabela = document.getElementById('tabelaElenco');

  if (!input || !tabela) return;

  const linhas = Array.from(tabela.querySelectorAll('tbody tr'));

  const filtrar = () => {
    const termo = input.value.trim().toLowerCase();
    linhas.forEach((linha) => {
      const texto = linha.textContent.toLowerCase();
      linha.hidden = termo !== '' && !texto.includes(termo);
    });
  };

  input.addEventListener('input', filtrar);
  filtrar();
}

/* ---------------------------------------------------------
   5. Linha do tempo com filtro (Tudo / Jogos / Série)
   --------------------------------------------------------- */
function iniciarTimeline() {
  const itens = document.querySelectorAll('.timeline-item');
  ligarFiltros('[data-filtro]', 'data-filtro', (filtro) => {
    itens.forEach((item) => {
      const mostrar = filtro === 'todos' || item.dataset.tipo === filtro;
      item.classList.toggle('oculto', !mostrar);
    });
  });
}

/* ---------------------------------------------------------
   6. Modal com detalhes dos jogos principais
   --------------------------------------------------------- */
const JOGOS = {
  parte1: {
    titulo: 'The Last of Us · Parte I',
    imagem: 'img/ellie-neve.jpg',
    alt: 'Ellie segurando um rifle em uma floresta coberta de neve.',
    texto: `<p>Vinte anos depois do surto, Joel vive de contrabando na zona de quarentena de Boston ao lado de Tess.
            Os Vaga-lumes pedem que eles levem uma garota, Ellie, para fora da cidade. Ela foi mordida e não se transformou.</p>
            <p>A viagem passa por cidades abandonadas, pela comunidade do irmão de Joel, Tommy, e por um inverno rigoroso,
            em que Ellie precisa cuidar de si mesma. Cada estação do ano marca um capítulo da relação entre os dois.</p>`,
    spoiler: `No hospital dos Vaga-lumes, Joel descobre que extrair a possível cura mataria Ellie. Ele invade o local,
              mata quem estiver no caminho, inclusive Marlene, e depois mente para Ellie sobre o que aconteceu.`,
    ficha: [['Lançamento original', '2013 (PS3)'], ['Remake (Part I)', '2022 (PS5)'], ['Expansão', 'Left Behind']]
  },
  parte2: {
    titulo: 'The Last of Us · Parte II',
    imagem: 'img/capa-parte2.jpg',
    alt: 'Capa da Parte II: rosto de Ellie em close, sujo de sangue, ao lado do título do jogo.',
    texto: `<p>Ellie, agora com 19 anos, vive em Jackson ao lado de Joel, Tommy e da namorada, Dina.
            Um acontecimento violento a leva até Seattle, uma cidade dividida entre os Lobos (WLF) e os Serafitas.</p>
            <p>O jogo é contado em dois pontos de vista e trata de como a vingança consome todos os envolvidos.
            A Parte II Remastered inclui o modo roguelike <em>No Return</em> e níveis que não entraram na versão final.</p>`,
    spoiler: `Logo no início, Abby mata Joel na frente de Ellie. Depois descobrimos que o pai de Abby era o médico dos
              Vaga-lumes que ia operar Ellie e foi morto por Joel no hospital.`,
    ficha: [['Lançamento original', '2020 (PS4)'], ['Remastered', '2024 (PS5)'], ['Prêmio', 'Jogo do Ano · The Game Awards 2020']]
  }
};

function iniciarModalJogos() {
  const modal = document.getElementById('modalJogo');
  // Evento do Bootstrap disparado antes do modal abrir
  modal.addEventListener('show.bs.modal', (e) => {
    const jogo = JOGOS[e.relatedTarget.dataset.jogo];
    document.getElementById('modalJogoTitulo').textContent = jogo.titulo;
    const ficha = jogo.ficha.map(([k, v]) => `<li class="list-group-item"><strong>${k}:</strong> ${v}</li>`).join('');
    document.getElementById('modalJogoCorpo').innerHTML = `
      <img src="${jogo.imagem}" alt="${jogo.alt}" class="img-fluid w-100 mb-3" style="max-height:320px;object-fit:cover">
      ${jogo.texto}
      <ul class="list-group list-group-flush mb-3">${ficha}</ul>
      ${htmlSpoiler(jogo.spoiler)}`;
  });
}

/* ---------------------------------------------------------
   7. Personagens: dados → cards → modal
   --------------------------------------------------------- */
const PERSONAGENS = [
  {
    nome: 'Joel', jogos: ['p1', 'p2'], papel: 'Contrabandista de Boston',
    imagem: 'img/joel.webp', alt: 'Joel, homem de barba grisalha e camisa xadrez, olhando com desconfiança.',
    bio: 'Perdeu a filha, Sarah, na noite do surto e passou vinte anos se fechando para o mundo. Sobrevive de contrabando em Boston até aceitar levar Ellie aos Vaga-lumes.',
    spoiler: 'Salva Ellie no hospital ao custo da possível cura. Na Parte II, é morto por Abby perto de Jackson.'
  },
  {
    nome: 'Ellie', jogos: ['p1', 'p2'], papel: 'Imune à infecção',
    imagem: 'img/ellie-neve.jpg', alt: 'Ellie, adolescente de cabelo ruivo preso, segurando um rifle na neve.',
    bio: 'Nasceu depois do surto e cresceu em Boston. Tem 14 anos na Parte I, adora piadas ruins de um livro de trocadilhos e é imune ao Cordyceps. Na Parte II, toca violão e vive em Jackson.',
    spoiler: 'Na Parte II, vai a Seattle em busca de vingança contra Abby, e a jornada lhe custa muito.'
  },
  {
    nome: 'Abby', jogos: ['p2'], papel: 'Soldado da WLF',
    imagem: 'img/abby.webp', alt: 'Abby, mulher de cabelo preso em trança, suada e encarando a câmera em um lugar escuro.',
    bio: 'Integrante dos Lobos em Seattle, forte e treinada. Metade da Parte II é contada do ponto de vista dela.',
    spoiler: 'Seu pai era o médico dos Vaga-lumes morto por Joel no hospital. Em Seattle, cria um laço com os irmãos serafitas Lev e Yara.'
  },
  {
    nome: 'Tommy', jogos: ['p1', 'p2'], papel: 'Irmão de Joel',
    imagem: 'img/tommy.jpg',
    bio: 'Ex-integrante dos Vaga-lumes, ajudou a construir a comunidade de Jackson, no Wyoming, onde vive com Maria.'
  },
  {
    nome: 'Tess', jogos: ['p1'], papel: 'Parceira de Joel',
    imagem: 'img/tess.webp',
    bio: 'Divide com Joel o trabalho de contrabando em Boston. É ela quem fecha o acordo com Marlene para levar Ellie.'
  },
  {
    nome: 'Bill', jogos: ['p1'], papel: 'Sobrevivente solitário',
    imagem: 'img/bill.jpeg',
    bio: 'Vive sozinho em uma cidade cheia de armadilhas e deve favores a Joel. Na série, ganhou um episódio inteiro ao lado de Frank.'
  },
  {
    nome: 'Marlene', jogos: ['p1'], papel: 'Líder dos Vaga-lumes',
    imagem: 'img/marlene.jpeg',
    bio: 'Comanda os Vaga-lumes e protege Ellie, de quem conheceu a mãe. Na série, é vivida pela mesma atriz do jogo, Merle Dandridge.'
  },
  {
    nome: 'Dina', jogos: ['p2'], papel: 'Moradora de Jackson',
    imagem: 'img/dina.jpg',
    bio: 'Namorada de Ellie. Corajosa e bem-humorada, acompanha Ellie até Seattle.'
  }
];

function renderizarPersonagens() {
  const grade = document.getElementById('gradePersonagens');
  const rotuloJogo = { p1: 'Parte I', p2: 'Parte II' };

  // Monta todos os cards de uma vez
  grade.innerHTML = PERSONAGENS.map((p, i) => {
    const visual = p.imagem
      ? `<img src="${p.imagem}" alt="${p.alt}" class="personagem-foto" loading="lazy">`
      : `<div class="personagem-monograma" aria-hidden="true">${p.nome[0]}</div>`;
    return `
      <div class="col-6 col-md-4 col-lg-3 col-personagem revelar" data-jogos="${p.jogos.join(' ')}">
        <button type="button" class="personagem" data-indice="${i}"
                data-bs-toggle="modal" data-bs-target="#modalPersonagem"
                aria-label="Ver detalhes de ${p.nome}">
          ${visual}
          <div class="personagem-info">
            <h3>${p.nome}</h3>
            <p>${p.papel}</p>
            <p class="mt-1">${p.jogos.map((j) => rotuloJogo[j]).join(' · ')}</p>
          </div>
        </button>
      </div>`;
  }).join('');

  // Filtro por jogo
  ligarFiltros('[data-filtro-p]', 'data-filtro-p', (filtro) => {
    grade.querySelectorAll('.col-personagem').forEach((col) => {
      const mostrar = filtro === 'todos' || col.dataset.jogos.includes(filtro);
      col.classList.toggle('oculto', !mostrar);
    });
  });

  // Preenche o modal com o personagem clicado
  document.getElementById('modalPersonagem').addEventListener('show.bs.modal', (e) => {
    const p = PERSONAGENS[e.relatedTarget.dataset.indice];
    document.getElementById('modalPersonagemTitulo').textContent = p.nome;
    document.getElementById('modalPersonagemCorpo').innerHTML = `
      ${p.imagem ? `<img src="${p.imagem}" alt="${p.alt}" class="img-fluid w-100 mb-3" style="max-height:260px;object-fit:cover">` : ''}
      <p class="small text-secundario mb-2">${p.papel} · ${p.jogos.map((j) => rotuloJogo[j]).join(' e ')}</p>
      <p>${p.bio}</p>
      ${p.spoiler ? htmlSpoiler(p.spoiler) : ''}`;
  });
} 

/* ---------------------------------------------------------
   9. Estágios da infecção (controle deslizante)
   --------------------------------------------------------- */
const ESTAGIOS = [
  {
    nome: 'Runner',
    desc: 'O primeiro estágio. A pessoa ainda parece humana, enxerga e corre, mas já perdeu o controle. Costuma atacar em grupo.',
    dica: 'São frágeis, mas um bando de Runners cerca você rápido. Mantenha distância.',
    filtro: 'grayscale(.8) brightness(.55)'
  },
  {
    nome: 'Stalker',
    desc: 'O fungo começa a romper o rosto. Stalkers se escondem nas sombras e atacam de surpresa.',
    dica: 'Fique de olho nos cantos: eles gostam de emboscadas.',
    filtro: 'grayscale(.5) brightness(.7)'
  },
  {
    nome: 'Clicker',
    desc: 'O fungo cobre os olhos e o Clicker fica cego. Ele se orienta por ecolocalização, com os estalos que lhe dão o nome. A mordida é fatal.',
    dica: 'Ande agachado e em silêncio. Se ele chegar perto, é o fim.',
    filtro: 'grayscale(0) brightness(.9)'
  },
  {
    nome: 'Bloater',
    desc: 'Depois de muito tempo infectado, o corpo vira uma armadura de fungo. É lento, muito resistente e arremessa bolsas de esporos.',
    dica: 'Fogo é seu melhor amigo contra um Bloater.',
    filtro: 'saturate(1.4) contrast(1.15) brightness(1)'
  }
];

function iniciarInfectados() {
  const controle = document.getElementById('estagio');
  const img = document.getElementById('imgInfectado');

  if (!controle || !img) return;

  function atualizar() {
    const indice = Number.parseInt(controle.value, 10) || 0;
    const e = ESTAGIOS[indice] || ESTAGIOS[0];
    const nomeEstagio = document.getElementById('nomeEstagio');
    const tituloEstagio = document.getElementById('tituloEstagio');
    const descEstagio = document.getElementById('descEstagio');
    const dicaEstagio = document.getElementById('dicaEstagio');

    if (nomeEstagio) nomeEstagio.textContent = e.nome;
    if (tituloEstagio) tituloEstagio.textContent = e.nome;
    if (descEstagio) descEstagio.textContent = e.desc;
    if (dicaEstagio) dicaEstagio.textContent = e.dica;
    controle.setAttribute('aria-valuetext', e.nome);
    // A imagem fica mais viva conforme a infecção avança
    img.style.filter = e.filtro;
    img.style.transform = `scale(${1 + indice * 0.02})`;
  }

  controle.addEventListener('input', atualizar);
  atualizar();
}

/* ---------------------------------------------------------
   10. Quiz
   --------------------------------------------------------- */
const PERGUNTAS = [
  { p: 'Qual estúdio desenvolveu os jogos de The Last of Us?', opcoes: ['Santa Monica Studio', 'Naughty Dog', 'Insomniac Games', 'Guerrilla Games'], certa: 1,
    explica: 'A Naughty Dog, também conhecida pela série Uncharted.' },
  { p: 'Qual fungo causa a infecção?', opcoes: ['Penicillium', 'Amanita', 'Cordyceps', 'Candida'], certa: 2,
    explica: 'Uma versão mutante do Cordyceps, que na vida real infecta insetos.' },
  { p: 'Quem compôs a trilha sonora dos jogos e da série?', opcoes: ['Hans Zimmer', 'Ramin Djawadi', 'Gustavo Santaolalla', 'Ludwig Göransson'], certa: 2,
    explica: 'O argentino Gustavo Santaolalla.' },
  { p: 'Quem interpreta Joel na série da HBO?', opcoes: ['Pedro Pascal', 'Oscar Isaac', 'Troy Baker', 'Gabriel Luna'], certa: 0,
    explica: 'Pedro Pascal. Troy Baker é o Joel dos jogos, e Gabriel Luna faz o Tommy.' },
  { p: 'Como o Clicker encontra suas presas?', opcoes: ['Pelo olfato', 'Por ecolocalização', 'Pelo calor do corpo', 'Pela visão noturna'], certa: 1,
    explica: 'Ele é cego e usa os estalos para se orientar.' },
  { p: 'Qual é o nome do grupo de resistência que busca a cura?', opcoes: ['FEDRA', 'Serafitas', 'Lobos', 'Vaga-lumes'], certa: 3,
    explica: 'Os Vaga-lumes (Fireflies), liderados por Marlene.' },
  { p: 'Em qual cidade se passa a maior parte da Parte II?', opcoes: ['Seattle', 'Boston', 'Pittsburgh', 'Salt Lake City'], certa: 0,
    explica: 'Seattle, dividida entre os Lobos e os Serafitas.' },
  { p: 'Na expansão Left Behind, Ellie está com qual amiga?', opcoes: ['Dina', 'Riley', 'Tess', 'Maria'], certa: 1,
    explica: 'Riley, sua melhor amiga em Boston.' }
];

function iniciarQuiz() {
  const el = {
    pergunta: document.getElementById('quizPergunta'),
    resultado: document.getElementById('quizResultado'),
    contador: document.getElementById('quizContador'),
    texto: document.getElementById('quizTexto'),
    opcoes: document.getElementById('quizOpcoes'),
    feedback: document.getElementById('quizFeedback'),
    proxima: document.getElementById('quizProxima'),
    progresso: document.getElementById('quizProgresso'),
    barra: document.querySelector('.progress-tlou'),
    placar: document.getElementById('quizPlacar'),
    titulo: document.getElementById('quizTitulo'),
    mensagem: document.getElementById('quizMensagem'),
    reiniciar: document.getElementById('quizReiniciar')
  };

  if (!el.pergunta || !el.resultado || !el.opcoes || !el.proxima || !el.feedback || !el.progresso || !el.reiniciar) return;

  let atual = 0;
  let acertos = 0;

  function atualizarProgresso(valor) {
    const percentual = Math.min(100, Math.max(0, Number(valor) || 0));
    el.progresso.style.width = percentual + '%';
    if (el.barra) el.barra.setAttribute('aria-valuenow', Math.round(percentual));
  }

  // Mostra a pergunta da vez
  function mostrar() {
    const q = PERGUNTAS[atual];
    if (!q) return;

    el.contador.textContent = `Pergunta ${atual + 1} de ${PERGUNTAS.length}`;
    el.texto.textContent = q.p;
    el.feedback.textContent = '';
    el.proxima.classList.add('d-none');
    el.opcoes.innerHTML = '';

    q.opcoes.forEach((texto, i) => {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'btn opcao-quiz';
      botao.textContent = texto;
      botao.addEventListener('click', () => responder(i, botao));
      el.opcoes.appendChild(botao);
    });

    atualizarProgresso((atual / PERGUNTAS.length) * 100);
  }

  // Corrige a resposta e trava as opções
  function responder(i, botao) {
    const q = PERGUNTAS[atual];
    if (!q) return;

    const botoes = el.opcoes.querySelectorAll('button');
    botoes.forEach((b) => (b.disabled = true));
    if (botoes[q.certa]) botoes[q.certa].classList.add('certa');

    if (i === q.certa) {
      acertos++;
      el.feedback.innerHTML = `<i class="bi bi-check-circle text-luz" aria-hidden="true"></i> Certo! ${q.explica}`;
    } else {
      if (botao) botao.classList.add('errada');
      el.feedback.innerHTML = `<i class="bi bi-x-circle" aria-hidden="true"></i> Não foi dessa vez. ${q.explica}`;
    }
    el.proxima.textContent = atual === PERGUNTAS.length - 1 ? 'Ver resultado' : 'Próxima';
    el.proxima.classList.remove('d-none');
    el.proxima.focus();
  }

  el.proxima.addEventListener('click', () => {
    atual++;
    if (atual < PERGUNTAS.length) mostrar();
    else finalizar();
  });

  // Tela final com mensagem de acordo com a pontuação
  function finalizar() {
    atualizarProgresso(100);
    el.pergunta.classList.add('d-none');
    el.resultado.classList.remove('d-none');
    el.placar.textContent = `${acertos}/${PERGUNTAS.length}`;

    let titulo, msg;
    if (acertos === PERGUNTAS.length) { titulo = 'Vaga-lume de verdade'; msg = 'Gabaritou! Você conhece esse mundo como ninguém.'; }
    else if (acertos >= 6) { titulo = 'Sobrevivente experiente'; msg = 'Mandou muito bem. Joel confiaria em você para uma travessia.'; }
    else if (acertos >= 3) { titulo = 'Recém-chegado em Jackson'; msg = 'Bom começo, mas ainda tem muita estrada pela frente.'; }
    else { titulo = 'Ouviu um estalo?'; msg = 'Cuidado, os Clickers estão por perto. Que tal jogar de novo?'; }
    el.titulo.textContent = titulo;
    el.mensagem.textContent = msg;

    // Guarda o melhor resultado neste navegador
    const melhor = Number(lerPreferencia('tlou-quiz-melhor') || 0);
    if (acertos > melhor) salvarPreferencia('tlou-quiz-melhor', acertos);
    el.mensagem.textContent += ` Seu recorde: ${Math.max(acertos, melhor)}/${PERGUNTAS.length}.`;
    el.reiniciar.focus();
  }

  el.reiniciar.addEventListener('click', () => {
    atual = 0;
    acertos = 0;
    el.resultado.classList.add('d-none');
    el.pergunta.classList.remove('d-none');
    mostrar();
  });

  mostrar();
}

/* ---------------------------------------------------------
   11. Animação de entrada dos blocos ao rolar a página
   --------------------------------------------------------- */
function iniciarRevelarAoRolar() {
  // Marca blocos principais para animar (além dos cards de personagem)
  document.querySelectorAll('.secao .row > [class*="col-"], .timeline-item').forEach((n) => n.classList.add('revelar'));
  const alvos = document.querySelectorAll('.revelar');

  if (menosMovimento || !('IntersectionObserver' in window)) {
    alvos.forEach((a) => a.classList.add('visivel'));
    return;
  }
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((ent) => {
      if (ent.isIntersecting) {
        ent.target.classList.add('visivel');
        observador.unobserve(ent.target);
      }
    });
  }, { threshold: 0.12 });
  alvos.forEach((a) => observador.observe(a));
}

/* ---------------------------------------------------------
   12. Botão de voltar ao topo
   --------------------------------------------------------- */
function iniciarVoltarTopo() {
  document.getElementById('voltarTopo').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: menosMovimento ? 'auto' : 'smooth' });
  });
}
