// src/data/mentors.ts

export type Category = 'decisions' | 'thinking' | 'action' | 'relationships' | 'energy' | 'perspective';

export const categoryLabels: Record<Category, string> = {
  decisions: 'Decisoes',
  thinking: 'Pensamento',
  action: 'Acao',
  relationships: 'Relacoes',
  energy: 'Energia',
  perspective: 'Perspectiva',
};

export const categoryColors: Record<Category, string> = {
  decisions: '#4a7aad',
  thinking: '#8b6aad',
  action: '#4aad6a',
  relationships: '#c27a5a',
  energy: '#2B4A3E',
  perspective: '#ada45a',
};

export interface Principle {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  mentorSlug: string;
  categories: Category[];
  relatedToolSlug?: string;
}

export interface Mentor {
  slug: string;
  name: string;
  tagline: string;
  bio: string;
  books: { title: string; highlight?: boolean }[];
  quotes: string[];
  primaryCategory: Category;
  principles: Principle[];
  connections: { mentorSlug: string; reason: string }[];
}

// ---------------------------------------------------------------------------
// Mentors
// ---------------------------------------------------------------------------

export const mentors: Mentor[] = [
  // -----------------------------------------------------------------------
  // 1. Derek Sivers
  // -----------------------------------------------------------------------
  {
    slug: 'derek-sivers',
    name: 'Derek Sivers',
    tagline: 'Simplicidade radical para decisoes que importam',
    bio: `Derek Sivers e empreendedor, escritor e programador, mais conhecido por ter fundado o CD Baby, que se tornou o maior vendedor online de musica independente. Depois de vender a empresa por 22 milhoes de dolares e doar o valor para caridade, passou a se dedicar a escrever e compartilhar ideias sobre decisoes, prioridades e filosofia de vida.

Seus livros — Hell Yeah or No, Anything You Want, Useful Not True e How to Live — sao guias curtos e densos sobre como pensar com clareza e viver com intencionalidade. Sivers e conhecido por seu estilo direto, quase aforistico, e pela capacidade de destilar ideias complexas em principios simples e acionaveis.`,
    books: [
      { title: 'Hell Yeah or No', highlight: true },
      { title: 'Anything You Want' },
      { title: 'Useful Not True' },
      { title: 'How to Live' },
    ],
    quotes: [
      'If you\'re not saying "HELL YEAH!" about something, say no.',
      'Most of us have lives filled with mediocrity. We said yes to things that we felt half-hearted about.',
      'Saying no makes your yes more powerful.',
    ],
    primaryCategory: 'decisions',
    principles: [
      {
        id: 'hell-yeah-or-no',
        name: 'Hell Yeah or No',
        shortDescription: 'Se nao e um SIM INTEIRO, e nao.',
        description:
          'Quando voce sente algo menos que entusiasmo genuino — "Uau, isso seria incrivel!" — a resposta e nao. Dizer nao para quase tudo libera espaco para dar atencao total ao que realmente importa.',
        mentorSlug: 'derek-sivers',
        categories: ['decisions'],
        relatedToolSlug: 'sim-inteiro',
      },
      {
        id: 'useful-not-true',
        name: 'Util, Nao Verdadeiro',
        shortDescription: 'Crencas sao ferramentas — use as que funcionam.',
        description:
          'Em vez de debater se uma ideia e objetivamente verdadeira, pergunte se ela e util para voce agora. Crencas sao lentes: troque-as quando pararem de ajudar.',
        mentorSlug: 'derek-sivers',
        categories: ['thinking', 'decisions'],
      },
      {
        id: 'do-this-not-that',
        name: 'Faca Isso, Nao Aquilo',
        shortDescription: 'Clareza vem de contrastes, nao de listas.',
        description:
          'Definir o que voce NAO quer e tao importante quanto definir o que quer. Contrastes criam bordas nitidas que facilitam decisoes no dia a dia.',
        mentorSlug: 'derek-sivers',
        categories: ['decisions', 'action'],
      },
    ],
    connections: [
      { mentorSlug: 'tim-ferriss', reason: 'Ambos focam em eliminacao como estrategia: Sivers elimina compromissos, Ferriss elimina medos.' },
      { mentorSlug: 'marcus-aurelius', reason: 'Compartilham a busca por clareza interior e o desapego de opinioes alheias.' },
      { mentorSlug: 'tim-urban', reason: 'Ambos usam frames simples para decisoes de vida — Sivers com "Hell Yeah", Urban com "The Tail End".' },
    ],
  },

  // -----------------------------------------------------------------------
  // 2. Tim Ferriss
  // -----------------------------------------------------------------------
  {
    slug: 'tim-ferriss',
    name: 'Tim Ferriss',
    tagline: 'Desconstruir o medo para liberar a acao',
    bio: `Tim Ferriss e autor, investidor e apresentador do podcast The Tim Ferriss Show, um dos mais ouvidos do mundo. Ficou conhecido com o best-seller The 4-Hour Workweek, onde apresentou a ideia de lifestyle design — projetar ativamente a vida que voce quer em vez de seguir o roteiro padrao.

Ferriss e um sistematizador: ele decupa processos complexos em passos replicaveis, do aprendizado de linguas a investimentos. Seu framework de Fear Setting — inspirado no estoicismo de Seneca — se tornou uma das ferramentas mais populares para superar a paralisia por medo.`,
    books: [
      { title: 'The 4-Hour Workweek', highlight: true },
      { title: 'Tools of Titans' },
      { title: 'Tribe of Mentors' },
      { title: 'The 4-Hour Body' },
    ],
    quotes: [
      'What we fear doing most is usually what we most need to do.',
      'Fear-setting has produced my biggest business and personal successes, as well as repeatedly helped me to avoid catastrophic mistakes.',
      '"Someday" is a disease that will take your dreams to the grave with you.',
    ],
    primaryCategory: 'decisions',
    principles: [
      {
        id: 'fear-setting',
        name: 'Fear Setting',
        shortDescription: 'Defina seus medos em vez de seus objetivos.',
        description:
          'Inspirado na premeditatio malorum de Seneca, Fear Setting e um exercicio onde voce lista o pior cenario possivel, as acoes para preveni-lo e o custo de nao agir. Ferriss o faz ao menos uma vez por mes.',
        mentorSlug: 'tim-ferriss',
        categories: ['decisions', 'action'],
        relatedToolSlug: 'medo-na-mesa',
      },
      {
        id: '80-20-principle',
        name: 'Principio 80/20',
        shortDescription: '20% dos esforcos geram 80% dos resultados.',
        description:
          'Identifique os poucos fatores vitais que produzem a maioria dos resultados — e elimine ou delegue o resto. Aplica-se a trabalho, relacionamentos, aprendizado e saude.',
        mentorSlug: 'tim-ferriss',
        categories: ['action', 'decisions'],
      },
      {
        id: 'lifestyle-design',
        name: 'Lifestyle Design',
        shortDescription: 'Projete sua vida em vez de aceitar o padrao.',
        description:
          'Em vez de trabalhar 40 anos para "curtir depois", redistribua mini-aposentadorias ao longo da vida. Questione premissas sobre trabalho, localizacao e cronograma.',
        mentorSlug: 'tim-ferriss',
        categories: ['decisions', 'perspective'],
      },
    ],
    connections: [
      { mentorSlug: 'derek-sivers', reason: 'Sivers apareceu no podcast de Ferriss varias vezes; ambos pensam em termos de sistemas para decisoes.' },
      { mentorSlug: 'marcus-aurelius', reason: 'Ferriss e estudioso do estoicismo e cita Seneca e Marco Aurelio como influencias diretas do Fear Setting.' },
      { mentorSlug: 'andrew-huberman', reason: 'Ambos traduzem ciencia em protocolos praticos — Ferriss para produtividade, Huberman para neurociencia.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 3. Sam Harris
  // -----------------------------------------------------------------------
  {
    slug: 'sam-harris',
    name: 'Sam Harris',
    tagline: 'Investigar a mente com honestidade radical',
    bio: `Sam Harris e neurocientista, filosofo e criador do app de meditacao Waking Up. PhD em neurociencia cognitiva pela UCLA, ele se dedica a explorar consciencia, livre-arbitrio e etica a partir de uma perspectiva secular e cientifica.

Harris argumenta que a meditacao nao e relaxamento, mas investigacao direta da natureza da mente. Em seus livros e no app, ele guia praticantes a perceber que o "eu" que parece estar no centro da experiencia e, na verdade, uma construcao — e que reconhecer isso pode ser profundamente libertador.`,
    books: [
      { title: 'Waking Up', highlight: true },
      { title: 'Free Will' },
      { title: 'The Moral Landscape' },
      { title: 'Lying' },
    ],
    quotes: [
      'Free will is an illusion. Our wills are simply not of our own making.',
      'Thoughts and intentions emerge from background causes of which we are unaware and over which we exert no conscious control.',
      'The "self" — the conventional sense of being a subject living inside one\'s head — is an illusion.',
    ],
    primaryCategory: 'thinking',
    principles: [
      {
        id: 'mindfulness-investigation',
        name: 'Mindfulness como Investigacao',
        shortDescription: 'Meditacao nao e relaxar — e olhar de perto.',
        description:
          'A pratica de mindfulness, para Harris, e uma investigacao rigorosa da experiencia momento a momento. O objetivo nao e esvaziar a mente, mas observar como pensamentos surgem sem autor aparente.',
        mentorSlug: 'sam-harris',
        categories: ['thinking', 'perspective'],
      },
      {
        id: 'no-self',
        name: 'A Ilusao do Eu',
        shortDescription: 'O senso de ser um "eu" separado e uma construcao.',
        description:
          'Se voce prestar atencao, vera que pensamentos aparecem na consciencia sem que voce saiba o proximo. Nao ha um pensador a ser encontrado — apenas pensamentos. Reconhecer isso dissolve muito sofrimento desnecessario.',
        mentorSlug: 'sam-harris',
        categories: ['thinking', 'perspective'],
      },
      {
        id: 'free-will-skepticism',
        name: 'Ceticismo sobre Livre-Arbitrio',
        shortDescription: 'Voce nao escolhe seus pensamentos — eles aparecem.',
        description:
          'Harris argumenta que perder a crenca no livre-arbitrio nao leva ao fatalismo, mas aumenta a sensacao de liberdade. Uma mudanca criativa de inputs — novos habitos, novas habilidades — pode transformar radicalmente sua vida.',
        mentorSlug: 'sam-harris',
        categories: ['thinking'],
      },
    ],
    connections: [
      { mentorSlug: 'henry-shukman', reason: 'Shukman e professor de meditacao no app Waking Up de Harris; ambos exploram a dissolucao do eu.' },
      { mentorSlug: 'marcus-aurelius', reason: 'Ambos praticam observacao dos proprios pensamentos como caminho para liberdade interior.' },
      { mentorSlug: 'bruce-tift', reason: 'Harris e Tift convergem na intersecao entre meditacao e psicologia — a mente que observa a si mesma.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 4. Henry Shukman
  // -----------------------------------------------------------------------
  {
    slug: 'henry-shukman',
    name: 'Henry Shukman',
    tagline: 'Despertar e simples — e ja esta aqui',
    bio: `Henry Shukman e mestre zen, poeta e escritor britanico. Formado em literatura pela Universidade de Oxford, ele descobriu a meditacao zen aos 19 anos durante uma viagem ao Japao, e desde entao se tornou um dos professores zen mais acessiveis do Ocidente. E co-fundador do app The Way e professor guia no Waking Up de Sam Harris.

Shukman ensina que o despertar nao e um evento grandioso reservado a monges — e algo ordinario, acessivel e profundamente amoroso. Seu conceito de "Original Love" propoe que, debaixo de todas as camadas de condicionamento, existe um pertencimento fundamental que pode ser redescoberto.`,
    books: [
      { title: 'Original Love', highlight: true },
      { title: 'One Blade of Grass' },
      { title: 'Arroyo' },
    ],
    quotes: [
      'You discover you belong utterly. And you see that this very moment is a pure gift. It feels like love.',
      'There\'s something about deep wounding that can be a pathway to deep, deep love.',
      'In awakening, one thing vanishes, that sense of self, and another thing appears, which is what that sense of self was occluding.',
    ],
    primaryCategory: 'perspective',
    principles: [
      {
        id: 'original-love',
        name: 'Original Love',
        shortDescription: 'Debaixo de tudo, existe um pertencimento fundamental.',
        description:
          'Original Love e a descoberta de que, antes de qualquer condicionamento, existe um amor e bem-estar intrinsecos a nossa natureza original. Nao e algo a construir, mas a redescobrir.',
        mentorSlug: 'henry-shukman',
        categories: ['perspective', 'relationships'],
      },
      {
        id: 'ordinary-awakening',
        name: 'Despertar Ordinario',
        shortDescription: 'Despertar nao e mistico — e ver o que ja esta aqui.',
        description:
          'Shukman ensina que o despertar nao exige anos em retiros. Pode acontecer em momentos simples: o eu separado se dissolve e o que estava sendo ocultado — presenca, conexao, abertura — aparece naturalmente.',
        mentorSlug: 'henry-shukman',
        categories: ['perspective', 'thinking'],
      },
      {
        id: 'koan-practice',
        name: 'Pratica de Koans',
        shortDescription: 'Perguntas impossiveis que abrem a mente.',
        description:
          'Koans sao perguntas ou historias zen que nao podem ser "resolvidas" pelo intelecto. A pratica de koans convida a mente a soltar suas certezas e encontrar uma forma mais direta de conhecer.',
        mentorSlug: 'henry-shukman',
        categories: ['thinking', 'perspective'],
      },
    ],
    connections: [
      { mentorSlug: 'sam-harris', reason: 'Shukman e professor convidado no app Waking Up; ambos exploram consciencia e dissolucao do eu.' },
      { mentorSlug: 'bruce-tift', reason: 'Ambos integram pratica contemplativa com psicologia — Shukman pelo zen, Tift pela terapia.' },
      { mentorSlug: 'brene-brown', reason: 'Ambos veem feridas emocionais como portas para algo mais profundo — Shukman para o despertar, Brown para a vulnerabilidade.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 5. Andrew Huberman
  // -----------------------------------------------------------------------
  {
    slug: 'andrew-huberman',
    name: 'Andrew Huberman',
    tagline: 'Neurociencia aplicada para otimizar corpo e mente',
    bio: `Andrew Huberman e neurocientista e professor de neurobiologia na Stanford School of Medicine. Seu podcast, Huberman Lab, se tornou uma referencia global para quem quer entender a ciencia por tras de sono, foco, motivacao e regulacao emocional.

Huberman traduz pesquisa neurocientifica em protocolos praticos e acessiveis. Seus episodios sobre dopamina, estresse e ritmos circadianos mudaram a forma como milhoes de pessoas pensam sobre seus habitos diarios e sua biologia.`,
    books: [
      { title: 'Huberman Lab Podcast', highlight: true },
    ],
    quotes: [
      'Dopamine is not about reward but rather about motivation and drive, and a willingness to persist.',
      'Make sure that your dopamine system is attached more to the effort process than it ever is to any external reward.',
      'Addiction is a progressive narrowing of the things that bring you pleasure. Happiness is a progressive expansion of the things that bring you pleasure.',
    ],
    primaryCategory: 'energy',
    principles: [
      {
        id: 'dopamine-protocols',
        name: 'Protocolos de Dopamina',
        shortDescription: 'Conecte dopamina ao esforco, nao a recompensa.',
        description:
          'Huberman ensina que dopamina e sobre motivacao e busca, nao sobre prazer. A chave e vincular seu sistema dopaminergico ao processo de esforco, nao a recompensas externas — evitando picos artificiais que levam a quedas.',
        mentorSlug: 'andrew-huberman',
        categories: ['energy', 'action'],
      },
      {
        id: 'stress-as-enhancer',
        name: 'Estresse como Potencializador',
        shortDescription: 'O estresse certo, na dose certa, melhora performance.',
        description:
          'Nem todo estresse e ruim. Huberman explica como estresse agudo e pontual (como banho frio ou exercicio intenso) ativa respostas neurobiologicas que aumentam foco, resiliencia e capacidade de aprendizado.',
        mentorSlug: 'andrew-huberman',
        categories: ['energy', 'action'],
      },
      {
        id: 'sleep-hygiene',
        name: 'Higiene do Sono',
        shortDescription: 'Sono e o alicerce de tudo — otimize-o primeiro.',
        description:
          'Antes de otimizar qualquer outra coisa, otimize o sono. Huberman ensina protocolos baseados em luz, temperatura e timing para regular ritmos circadianos e maximizar a qualidade do sono.',
        mentorSlug: 'andrew-huberman',
        categories: ['energy'],
      },
    ],
    connections: [
      { mentorSlug: 'peter-attia', reason: 'Ambos traduzem ciencia em protocolos de saude; frequentemente colaboram e se citam mutuamente.' },
      { mentorSlug: 'tim-ferriss', reason: 'Ferriss populariza as ideias de Huberman; ambos pensam em termos de protocolos e experimentos pessoais.' },
      { mentorSlug: 'sam-harris', reason: 'Ambos exploram neurociencia da consciencia — Huberman pelo lado fisiologico, Harris pelo meditativo.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 6. Peter Attia
  // -----------------------------------------------------------------------
  {
    slug: 'peter-attia',
    name: 'Peter Attia',
    tagline: 'Longevidade com qualidade — corpo, mente e emocao',
    bio: `Peter Attia e medico especializado em longevidade e fundador da Early Medical, uma clinica que aplica o que ele chama de "Medicina 3.0" — uma abordagem proativa e personalizada para prevenir doencas cronicas antes que aparecam.

Seu livro Outlive se tornou um best-seller ao propor que longevidade nao e sobre viver mais, mas sobre viver melhor por mais tempo. Attia enfatiza que saude emocional e tao critica quanto exercicio e nutricao — se a "casa emocional" nao esta em ordem, nenhuma otimizacao fisica resolve.`,
    books: [
      { title: 'Outlive: The Science and Art of Longevity', highlight: true },
    ],
    quotes: [
      'I would never want anybody to come away thinking, "I\'m too old to do anything about it." As long as you\'re breathing, you have a chance.',
      'Striving for physical health and longevity while ignoring emotional health could be the ultimate curse.',
    ],
    primaryCategory: 'energy',
    principles: [
      {
        id: 'four-pillars-exercise',
        name: 'Quatro Pilares do Exercicio',
        shortDescription: 'Estabilidade, forca, zona 2 e VO2max.',
        description:
          'Attia organiza exercicio em quatro pilares: estabilidade (a base), forca, cardio de zona 2 (eficiencia metabolica) e VO2max (capacidade aerobica maxima). Juntos, formam o alicerce da longevidade fisica.',
        mentorSlug: 'peter-attia',
        categories: ['energy', 'action'],
      },
      {
        id: 'emotional-health',
        name: 'Saude Emocional',
        shortDescription: 'Sem saude emocional, longevidade e uma maldicao.',
        description:
          'Attia defende que saude emocional e o pilar mais negligenciado da longevidade. Se voce chegar aos 90 sem conseguir se conectar com as pessoas que ama, toda a otimizacao foi em vao.',
        mentorSlug: 'peter-attia',
        categories: ['energy', 'relationships'],
      },
      {
        id: 'centenarian-decathlon',
        name: 'Decatlo do Centenario',
        shortDescription: 'O que voce quer ser capaz de fazer aos 90?',
        description:
          'O Decatlo do Centenario e um framework onde voce define 10 atividades fisicas que quer realizar na ultima decada de vida — e treina agora para garanti-las. Redefine o que e possivel na velhice.',
        mentorSlug: 'peter-attia',
        categories: ['energy', 'perspective'],
      },
    ],
    connections: [
      { mentorSlug: 'andrew-huberman', reason: 'Parceiros frequentes em conversas sobre ciencia aplicada; compartilham foco em protocolos baseados em evidencia.' },
      { mentorSlug: 'tim-urban', reason: 'Ambos usam visualizacoes de tempo para criar urgencia — Attia com o Decatlo, Urban com o Life Calendar.' },
      { mentorSlug: 'brene-brown', reason: 'Attia credita a terapia emocional como a mudanca mais importante de sua vida, ecoando o trabalho de Brown sobre vulnerabilidade.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 7. Bruce Tift
  // -----------------------------------------------------------------------
  {
    slug: 'bruce-tift',
    name: 'Bruce Tift',
    tagline: 'Ja estamos livres — e tudo bem nao parecer assim',
    bio: `Bruce Tift e psicoterapeuta com mais de 45 anos de pratica clinica e praticante de longa data do budismo Vajrayana. Seu trabalho pioneiro integra psicoterapia ocidental com praticas contemplativas orientais de uma forma genuinamente dialoga, sem simplificar nenhum dos lados.

Em seu livro Already Free, Tift apresenta dois caminhos aparentemente contraditorios: o "desenvolvimental" (da terapia, que busca resolver feridas do passado) e o "fruicional" (do budismo, que reconhece que ja somos inteiros). Sua proposta e que ambos sao verdadeiros ao mesmo tempo — e que viver nessa tensao e, em si, libertador.`,
    books: [
      { title: 'Already Free', highlight: true },
    ],
    quotes: [
      'Both psychology and Buddhism seek to provide freedom from suffering, yet each offers a completely different approach for reaching this goal.',
      'Neurosis is always a substitute for experiential intensity.',
      'When we use the Western and Eastern approaches together, they can help us open to all of life — its richness, its disturbances, and its inherent completeness.',
    ],
    primaryCategory: 'thinking',
    principles: [
      {
        id: 'developmental-vs-fruitional',
        name: 'Desenvolvimental vs Fruicional',
        shortDescription: 'Dois caminhos validos que se contradizem — e tudo bem.',
        description:
          'A visao desenvolvimental (terapia) diz que precisamos resolver nosso passado para viver plenamente. A visao fruicional (budismo) diz que ja somos inteiros agora. Tift propoe que manter ambas — sem resolver a tensao — e o caminho mais honesto.',
        mentorSlug: 'bruce-tift',
        categories: ['thinking', 'perspective'],
      },
      {
        id: 'already-whole',
        name: 'Ja Inteiro',
        shortDescription: 'Voce nao precisa se consertar para estar presente.',
        description:
          'A perspectiva fruicional convida a presenca, embodiment e aceitacao de qualquer coisa que surja na experiencia imediata — sem a exigencia de "limpar" o passado como pre-requisito para viver plenamente.',
        mentorSlug: 'bruce-tift',
        categories: ['perspective', 'thinking'],
      },
      {
        id: 'neurotic-intelligence',
        name: 'Inteligencia Neurotica',
        shortDescription: 'Seus padroes "problematicos" foram solucoes inteligentes.',
        description:
          'O que chamamos de neurose foi, em algum momento, uma tentativa inteligente de nos proteger. Tift propoe que, em vez de combater esses padroes, os reconhecamos como formas de intensidade experiencial — e nos abramos a essa intensidade diretamente.',
        mentorSlug: 'bruce-tift',
        categories: ['thinking', 'relationships'],
      },
    ],
    connections: [
      { mentorSlug: 'henry-shukman', reason: 'Ambos navegam entre pratica contemplativa e experiencia humana comum — Tift pela terapia, Shukman pelo zen.' },
      { mentorSlug: 'sam-harris', reason: 'Convergem na investigacao da mente — Harris como neurocientista meditador, Tift como terapeuta contemplativo.' },
      { mentorSlug: 'brene-brown', reason: 'Ambos trabalham com a coragem de ficar com o desconforto — Brown chama de vulnerabilidade, Tift de intensidade experiencial.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 8. Adam Grant
  // -----------------------------------------------------------------------
  {
    slug: 'adam-grant',
    name: 'Adam Grant',
    tagline: 'Repensar e a habilidade mais subestimada',
    bio: `Adam Grant e psicologo organizacional e o professor mais jovem a receber tenure na Wharton School da University of Pennsylvania. Seus livros — Think Again, Give and Take, Originals — exploram como pensamos, colaboramos e inovamos, combinando pesquisa rigorosa com historias envolventes.

Grant defende que a capacidade de repensar e desaprender e mais valiosa do que a inteligencia bruta. Ele ensina que os melhores pensadores operam como cientistas: formam hipoteses, testam, e mudam de ideia quando os dados exigem.`,
    books: [
      { title: 'Think Again', highlight: true },
      { title: 'Give and Take' },
      { title: 'Originals' },
      { title: 'Hidden Potential' },
    ],
    quotes: [
      'If knowledge is power, knowing what we don\'t know is wisdom.',
      'Thinking like a scientist means searching for reasons why we might be wrong — not for reasons why we must be right.',
      'Givers advance the world. Takers advance themselves and hold the world back.',
    ],
    primaryCategory: 'thinking',
    principles: [
      {
        id: 'think-again',
        name: 'Think Again (Repense)',
        shortDescription: 'A marca de inteligencia e a disposicao de mudar de ideia.',
        description:
          'Grant propoe que operemos como cientistas: formulando hipoteses, testando-as e revisando nossas visoes com base no que aprendemos. Quando voce esta errado, nao e motivo de tristeza — e uma descoberta.',
        mentorSlug: 'adam-grant',
        categories: ['thinking'],
      },
      {
        id: 'give-and-take',
        name: 'Dar e Receber',
        shortDescription: 'Generosidade estrategica e a forma mais sustentavel de sucesso.',
        description:
          'Em Give and Take, Grant mostra que "doadores" — pessoas que contribuem sem esperar retorno imediato — tendem a ocupar tanto o topo quanto a base do sucesso. A diferenca esta em doar com limites saudaveis.',
        mentorSlug: 'adam-grant',
        categories: ['relationships', 'action'],
      },
      {
        id: 'originals',
        name: 'Originals',
        shortDescription: 'Pessoas originais agem apesar do medo, nao sem ele.',
        description:
          'Ser original nao exige audacia sobrenatural. Grant mostra que inovadores bem-sucedidos frequentemente sentem tanto medo quanto os outros — mas agem assim mesmo, e geram muitas ideias para encontrar as poucas que funcionam.',
        mentorSlug: 'adam-grant',
        categories: ['action', 'thinking'],
      },
    ],
    connections: [
      { mentorSlug: 'brene-brown', reason: 'Brown e Grant sao amigos e colaboradores; ambos estudam coragem — Brown no campo emocional, Grant no intelectual.' },
      { mentorSlug: 'tim-ferriss', reason: 'Ambos sistematizam principios de alta performance, mas Grant traz a lente da psicologia organizacional.' },
      { mentorSlug: 'maria-popova', reason: 'Ambos sao curadores de ideias que conectam campos distintos — Grant via pesquisa, Popova via literatura.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 9. Brene Brown
  // -----------------------------------------------------------------------
  {
    slug: 'brene-brown',
    name: 'Brene Brown',
    tagline: 'Vulnerabilidade e coragem, nao fraqueza',
    bio: `Brene Brown e pesquisadora, professora da University of Houston e uma das vozes mais influentes do mundo sobre vulnerabilidade, vergonha e coragem. Sua TED Talk "The Power of Vulnerability" e uma das mais assistidas de todos os tempos, com mais de 60 milhoes de visualizacoes.

Com mais de duas decadas de pesquisa, Brown demonstrou que vulnerabilidade nao e fraqueza — e a medida mais precisa de coragem. Seus livros, incluindo Daring Greatly e Braving the Wilderness, oferecem frameworks praticos para construir conexoes autenticas e resiliencia emocional.`,
    books: [
      { title: 'Daring Greatly', highlight: true },
      { title: 'Braving the Wilderness' },
      { title: 'The Gifts of Imperfection' },
      { title: 'Atlas of the Heart' },
    ],
    quotes: [
      'Vulnerability is the birthplace of love, belonging, joy, courage, empathy, and creativity.',
      'Vulnerability sounds like truth and feels like courage. Truth and courage aren\'t always comfortable, but they\'re never weakness.',
      'Owning our story can be hard but not nearly as difficult as spending our lives running from it.',
    ],
    primaryCategory: 'relationships',
    principles: [
      {
        id: 'vulnerability-as-courage',
        name: 'Vulnerabilidade como Coragem',
        shortDescription: 'Mostrar-se de verdade e o ato mais corajoso que existe.',
        description:
          'Brown define vulnerabilidade como incerteza, risco e exposicao emocional. Nao e fraqueza — e a base de toda conexao genuina. Podemos escolher coragem ou conforto, mas nao ambos ao mesmo tempo.',
        mentorSlug: 'brene-brown',
        categories: ['relationships', 'decisions'],
      },
      {
        id: 'shame-resilience',
        name: 'Resiliencia a Vergonha',
        shortDescription: 'Vergonha sobrevive no silencio — e morre na empatia.',
        description:
          'Vergonha e o medo de nao ser bom o suficiente. Brown mostra que quando compartilhamos nossa historia com alguem que responde com empatia, a vergonha nao sobrevive. Resiliencia a vergonha e uma habilidade treinavel.',
        mentorSlug: 'brene-brown',
        categories: ['relationships', 'thinking'],
      },
      {
        id: 'rumbling-with-vulnerability',
        name: 'Enfrentando a Vulnerabilidade',
        shortDescription: 'Entrar na arena mesmo sabendo que vai doer.',
        description:
          'Brown ensina que "ousar grandemente" significa aceitar que vamos levar pancadas. O que importa e estar na arena — com a disposicao de ser visto, errar e tentar de novo.',
        mentorSlug: 'brene-brown',
        categories: ['relationships', 'action'],
      },
    ],
    connections: [
      { mentorSlug: 'adam-grant', reason: 'Colaboradores e amigos; ambos pesquisam coragem — Brown no terreno emocional, Grant no intelectual.' },
      { mentorSlug: 'bruce-tift', reason: 'Ambos trabalham com a disposicao de ficar com o desconforto como caminho de crescimento.' },
      { mentorSlug: 'peter-attia', reason: 'Attia credita o trabalho emocional (alinhado com Brown) como a transformacao mais importante de sua vida.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 10. Maria Popova
  // -----------------------------------------------------------------------
  {
    slug: 'maria-popova',
    name: 'Maria Popova',
    tagline: 'Conectar ideias atraves de seculos para iluminar o presente',
    bio: `Maria Popova e escritora e fundadora de The Marginalian (anteriormente Brain Pickings), um dos blogs mais lidos do mundo sobre livros, arte, filosofia, ciencia e a busca por sentido. Nascida na Bulgaria e baseada nos Estados Unidos, ela escreve desde 2006, tecendo conexoes entre pensadores de epocas e campos diferentes.

Seu livro Figuring explora as vidas entrecruzadas de cientistas, escritoras e artistas, mostrando como o sentido nao e algo que encontramos, mas algo que criamos com as vidas que vivemos. Popova defende que criatividade e combinatoria — tudo se constroi sobre o que veio antes.`,
    books: [
      { title: 'Figuring', highlight: true },
      { title: 'The Marginalian (blog)' },
    ],
    quotes: [
      'Creativity is combinatorial: nothing is entirely original, everything builds on what came before.',
      'We are a collage of our interests, our influences, our inspirations, all the fragmentary impressions we\'ve collected by being alive and awake to the world.',
      'What will survive of us are shoreless seeds and stardust.',
    ],
    primaryCategory: 'perspective',
    principles: [
      {
        id: 'combinatorial-creativity',
        name: 'Criatividade Combinatoria',
        shortDescription: 'Nada e totalmente original — tudo se constroi sobre o que veio antes.',
        description:
          'Popova ensina que criamos recombinando pecas de inspiracao, conhecimento e insight que coletamos ao longo da vida. A originalidade nao vem do nada — vem de conexoes inesperadas entre ideias existentes.',
        mentorSlug: 'maria-popova',
        categories: ['perspective', 'thinking'],
      },
      {
        id: 'figuring',
        name: 'Figuring (Desvendar)',
        shortDescription: 'Sentido nao se encontra — se cria com a vida que vivemos.',
        description:
          'Inspirada nas vidas de cientistas e artistas, Popova propoe que o sentido emerge do ato de viver com curiosidade e coragem, conectando experiencias aparentemente desconexas em uma narrativa propria.',
        mentorSlug: 'maria-popova',
        categories: ['perspective'],
      },
      {
        id: 'shoreless-seeds',
        name: 'Sementes sem Margem',
        shortDescription: 'O que criamos transcende nossa propria vida.',
        description:
          'Popova escreve que nossas ideias, criacoes e influencias persistem muito alem de nos — como "sementes sem margem" que migram entre culturas, seculos e continentes. O legado nao e fama, mas reverberacao.',
        mentorSlug: 'maria-popova',
        categories: ['perspective', 'relationships'],
      },
    ],
    connections: [
      { mentorSlug: 'marcus-aurelius', reason: 'Popova frequentemente escreve sobre filosofia estoica e a busca por sentido diante da impermanencia.' },
      { mentorSlug: 'adam-grant', reason: 'Ambos sao curadores de ideias entre disciplinas — Grant via pesquisa empirica, Popova via literatura e arte.' },
      { mentorSlug: 'henry-shukman', reason: 'Ambos exploram a intersecao entre beleza, impermanencia e sentido — Popova pela escrita, Shukman pelo zen.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 11. Marcus Aurelius
  // -----------------------------------------------------------------------
  {
    slug: 'marcus-aurelius',
    name: 'Marcus Aurelius',
    tagline: 'Controle o que depende de voce — aceite o resto',
    bio: `Marco Aurelio foi imperador romano de 161 a 180 d.C. e um dos mais importantes filosofos estoicos da historia. Suas Meditacoes — escritas como diario pessoal, nunca destinadas a publicacao — se tornaram um dos textos mais influentes da filosofia ocidental.

Governando durante guerras, pragas e traicoes, Marco Aurelio usava a escrita como pratica filosofica diaria: lembrar-se do que pode controlar, da brevidade da vida e da importancia de agir com virtude independentemente das circunstancias. Dois milenios depois, seus principios continuam radicalmente relevantes.`,
    books: [
      { title: 'Meditacoes', highlight: true },
    ],
    quotes: [
      'You could leave life right now. Let that determine what you do and say and think.',
      'Waste no more time arguing about what a good man should be. Be one.',
      'The happiness of your life depends upon the quality of your thoughts.',
      'Very little is needed to make a happy life; it is all within yourself, in your way of thinking.',
    ],
    primaryCategory: 'perspective',
    principles: [
      {
        id: 'dichotomy-of-control',
        name: 'Dicotomia do Controle',
        shortDescription: 'Separe o que depende de voce do que nao depende.',
        description:
          'O principio central do estoicismo: voce controla seu julgamento, intencao, escolhas e atencao. O clima, as motivacoes alheias e os resultados externos sao material com o qual voce trabalha, nao sistemas que voce comanda.',
        mentorSlug: 'marcus-aurelius',
        categories: ['perspective', 'decisions'],
      },
      {
        id: 'memento-mori',
        name: 'Memento Mori',
        shortDescription: 'Lembrar da morte para viver com mais presenca.',
        description:
          'Memento mori — "lembre que voce morrera" — nao encolhe a vida, mas a condensa. Quando o tempo e mantido proximo, busquedas triviais perdem o apelo, a gratidao se aguza e a bondade para de esperar por "depois".',
        mentorSlug: 'marcus-aurelius',
        categories: ['perspective', 'energy'],
      },
      {
        id: 'view-from-above',
        name: 'Visao de Cima',
        shortDescription: 'Veja sua situacao da perspectiva do cosmos.',
        description:
          'Um exercicio estoico de imaginacao: veja-se de cima, depois a cidade, o continente, o planeta, o cosmos. Seus problemas nao desaparecem, mas ganham proporcao. O que parecia urgente pode se revelar trivial.',
        mentorSlug: 'marcus-aurelius',
        categories: ['perspective', 'thinking'],
      },
    ],
    connections: [
      { mentorSlug: 'tim-ferriss', reason: 'Ferriss e estudioso do estoicismo e credita Seneca e Marco Aurelio como inspiracoes diretas para o Fear Setting.' },
      { mentorSlug: 'derek-sivers', reason: 'Ambos buscam clareza interior e independencia de opinioes externas como base para boas decisoes.' },
      { mentorSlug: 'tim-urban', reason: 'Ambos confrontam a mortalidade como ferramenta de clareza — Aurelio via memento mori, Urban via visualizacoes de tempo.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 12. Tim Urban
  // -----------------------------------------------------------------------
  {
    slug: 'tim-urban',
    name: 'Tim Urban',
    tagline: 'Visualizar o tempo para despertar urgencia',
    bio: `Tim Urban e escritor e ilustrador, criador do blog Wait But Why, um dos mais lidos da internet. Suas postagens longas — frequentemente acompanhadas de desenhos simples e humor acessivel — exploram temas como procrastinacao, inteligencia artificial, relacionamentos e o sentido da vida.

Sua TED Talk "Inside the Mind of a Master Procrastinator" e uma das mais assistidas de todos os tempos. Urban tem um talento raro para tornar visivel o que normalmente e abstrato: a passagem do tempo, a finitude da vida e o custo real de adiar.`,
    books: [
      { title: 'What\'s Our Problem?', highlight: true },
      { title: 'Wait But Why (blog)' },
    ],
    quotes: [
      'Everyone is procrastinating on something in life. Take a long, hard look at that calendar.',
      'When I graduated from high school, I had already used up 93% of my in-person parent time. We\'re in the tail end.',
      'Non-procrastinators don\'t exist. All people are procrastinators.',
    ],
    primaryCategory: 'perspective',
    principles: [
      {
        id: 'life-calendar',
        name: 'Life Calendar',
        shortDescription: 'Uma caixa por semana de uma vida de 90 anos. Nao sao tantas.',
        description:
          'O Life Calendar visualiza toda a sua vida como uma grade de caixas — uma por semana. Ver quantas ja foram usadas e quantas restam cria uma urgencia visceral que nenhuma lista de metas consegue.',
        mentorSlug: 'tim-urban',
        categories: ['perspective', 'decisions'],
      },
      {
        id: 'procrastination-matrix',
        name: 'Matriz da Procrastinacao',
        shortDescription: 'A procrastinacao mais perigosa nao tem deadline.',
        description:
          'Urban mostra que tarefas com deadline geram procrastinacao "contida". O perigo real esta nas tarefas sem deadline — os "assassinos silenciosos" como cuidar da saude, sair de um emprego ruim ou fortalecer relacionamentos.',
        mentorSlug: 'tim-urban',
        categories: ['perspective', 'action'],
      },
      {
        id: 'the-tail-end',
        name: 'The Tail End',
        shortDescription: 'Voce pode estar nos ultimos 5% do tempo com quem ama.',
        description:
          'Mesmo que voce nao esteja no fim da vida, pode estar no fim do tempo com as pessoas mais importantes. Se voce ja saiu de casa, ja usou mais de 90% do tempo presencial com seus pais. O que voce faz com os ultimos 5%?',
        mentorSlug: 'tim-urban',
        categories: ['perspective', 'relationships'],
      },
    ],
    connections: [
      { mentorSlug: 'marcus-aurelius', reason: 'Ambos usam a mortalidade como lente para clareza — Aurelio via filosofia estoica, Urban via visualizacoes de dados.' },
      { mentorSlug: 'peter-attia', reason: 'Ambos criam urgencia atraves da visualizacao do tempo — Attia com o Decatlo do Centenario, Urban com o Life Calendar.' },
      { mentorSlug: 'derek-sivers', reason: 'Ambos simplificam decisoes complexas com frames visuais e intuitivos.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

export function getAllPrinciples(): Principle[] {
  return mentors.flatMap((m) => m.principles);
}

export function getMentorBySlug(slug: string): Mentor | undefined {
  return mentors.find((m) => m.slug === slug);
}

export function getPrinciplesByCategory(category: Category): Principle[] {
  return getAllPrinciples().filter((p) => p.categories.includes(category));
}

export function getMentorColor(mentor: Mentor): string {
  return categoryColors[mentor.primaryCategory];
}
