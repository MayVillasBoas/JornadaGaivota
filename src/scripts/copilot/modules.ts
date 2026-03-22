// src/scripts/copilot/modules.ts

export interface ModuleStep {
  question: string;
  guidance: string;
  placeholder: string;
}

export interface ModuleDefinition {
  slug: string;
  title: string;
  source: string;
  layer: 'feel' | 'see' | 'think' | 'act';
  description: string;
  activity: string;
  steps: ModuleStep[];
}

export const MODULES: Record<string, ModuleDefinition> = {
  'body-scan': {
    slug: 'body-scan',
    title: 'Escuta do Corpo',
    source: 'Damasio (Somatic Markers) + Polyvagal Theory',
    layer: 'feel',
    description: 'Seu corpo sabe antes da sua mente.',
    activity: 'Vou te guiar a imaginar cada opção e notar o que seu corpo sente.',
    steps: [
      {
        question: 'Feche os olhos. Imagine escolher o primeiro caminho que está considerando. Fique com essa imagem. O que acontece no seu corpo?',
        guidance: 'Algo aperta? Abre? Sua respiração muda? Observe ombros, peito, estômago, mandíbula.',
        placeholder: 'Quando imagino essa opção, meu corpo...',
      },
      {
        question: 'Agora imagine o outro caminho. Fique com ele. O que seu corpo faz? Qual opção pareceu mais expansão e qual mais contração?',
        guidance: 'Expansão (alívio, abertura, energia) costuma sinalizar alinhamento. Contração (aperto, peso) costuma sinalizar resistência.',
        placeholder: 'Quando imagino essa opção, meu corpo...',
      },
    ],
  },
  'parts-mapping': {
    slug: 'parts-mapping',
    title: 'Mapa de Partes',
    source: 'Internal Family Systems (Richard Schwartz)',
    layer: 'see',
    description: 'Partes diferentes de você querem coisas diferentes.',
    activity: 'Vamos mapear as vozes internas que puxam em direções diferentes.',
    steps: [
      {
        question: 'Tem uma voz dentro de você que quer uma coisa, e outra puxando diferente. Descreva as duas — o que cada uma quer? O que cada uma teme?',
        guidance: 'Dê nomes se conseguir. "O provedor" ou "O aventureiro." Do que cada parte está te protegendo?',
        placeholder: 'Uma parte de mim quer... porque teme...\nOutra parte quer... porque teme...',
      },
      {
        question: 'Dando um passo atrás das duas partes — como um mediador sábio — o que você percebe? Existe um jeito de honrar o que as duas realmente precisam?',
        guidance: 'Você não é suas partes. Você é quem consegue ver as duas. O que essa perspectiva revela?',
        placeholder: 'Dando um passo atrás, percebo...',
      },
    ],
  },
  'first-principles': {
    slug: 'first-principles',
    title: 'Primeiros Princípios',
    source: 'Charlie Munger + Elon Musk',
    layer: 'think',
    description: 'Tire as suposições. O que é realmente verdade?',
    activity: 'Vamos separar fatos verificáveis de suposições que você trata como verdade.',
    steps: [
      {
        question: 'Escreva cada crença sobre essa situação — cada "eu tenho que", "eu não posso", "eles esperam que eu". Depois marque: é um FATO verificável ou uma suposição?',
        guidance: 'Um fato: "Meu contrato acaba em junho." Uma suposição: "Eles nunca vão me contratar de novo." Seja implacável.',
        placeholder: 'Fatos:\n\nSuposições:',
      },
      {
        question: 'Olhando só para os fatos — qual suposição você vem tratando como fato que, se desafiada, mudaria tudo?',
        guidance: 'Essa costuma ser a alavanca escondida. Aquela coisa que todo mundo "sabe" mas que talvez não seja verdade.',
        placeholder: 'A suposição que mudaria tudo é...',
      },
    ],
  },
  'regret-minimization': {
    slug: 'regret-minimization',
    title: 'Minimização de Arrependimento',
    source: 'Jeff Bezos',
    layer: 'think',
    description: 'Se projete aos 80 anos. Olhe pra trás.',
    activity: 'Vamos imaginar qual arrependimento pesaria mais daqui a décadas.',
    steps: [
      {
        question: 'Você tem 80 anos, olhando pra trás. Escolheu o caminho A e viveu com isso por décadas. Agora imagine que escolheu o caminho B. Qual arrependimento pesa mais?',
        guidance: 'Não pense no mês que vem. Pense no arco da sua vida. Arrependimento de ter feito vs arrependimento de não ter feito.',
        placeholder: 'O arrependimento mais pesado seria...',
      },
      {
        question: 'O que a versão de 80 anos de você diria pra você de agora? Se pudesse mandar uma mensagem de volta no tempo, o que seria?',
        guidance: 'A sabedoria muitas vezes mora nessa distância entre o seu medo presente e a perspectiva do seu eu futuro.',
        placeholder: 'Meu eu de 80 anos diria...',
      },
    ],
  },
  'decision-memo': {
    slug: 'decision-memo',
    title: 'Memo de Decisão',
    source: 'Farnam Street Decision Journal',
    layer: 'act',
    description: 'Tudo que você descobriu, compilado em clareza.',
    activity: 'Vamos compilar tudo em opções concretas, trade-offs e um próximo passo.',
    steps: [
      {
        question: 'Com base em tudo — sinais do corpo, partes internas, fatos vs suposições, arrependimento — quais são suas OPÇÕES REAIS e seus trade-offs?',
        guidance: 'Inclua a opção que você tem medo de escrever. Talvez seja a verdadeira.',
        placeholder: 'Opção 1: Eu ganho... mas abro mão de...\nOpção 2: Eu ganho... mas abro mão de...',
      },
      {
        question: 'Agora, o que seu instinto diz? Se tivesse que escolher em 10 segundos, o que escolheria? Escreva antes da sua mente argumentar.',
        guidance: 'Essa não é sua resposta final. É um sinal. Confie o suficiente pra escrever.',
        placeholder: 'Meu instinto diz...',
      },
      {
        question: 'Qual é o menor próximo passo que você pode dar nas próximas 24 horas?',
        guidance: 'Uma conversa. Um e-mail. Uma caminhada pra pensar. Uma micro-ação que quebra a paralisia.',
        placeholder: 'Nas próximas 24 horas, eu vou...',
      },
    ],
  },
};

export const MODULE_ORDER = ['body-scan', 'parts-mapping', 'first-principles', 'regret-minimization', 'decision-memo'];

// Frameworks available for user selection (excludes decision-memo which is always auto-appended)
export const PICKABLE_MODULES = MODULE_ORDER.filter(slug => slug !== 'decision-memo');
