// src/data/mentors.ts

export type Category = 'decisions' | 'thinking' | 'action' | 'relationships' | 'energy' | 'perspective';

export const categoryLabels: Record<Category, string> = {
  decisions: 'Decisions',
  thinking: 'Thinking',
  action: 'Action',
  relationships: 'Relationships',
  energy: 'Energy',
  perspective: 'Perspective',
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
    tagline: 'Radical simplicity for decisions that matter',
    bio: `Derek Sivers is an entrepreneur, writer, and programmer, best known for founding CD Baby, which became the largest online seller of independent music. After selling the company for $22 million and donating the proceeds to charity, he dedicated himself to writing and sharing ideas about decisions, priorities, and life philosophy.

His books - Hell Yeah or No, Anything You Want, Useful Not True, and How to Live - are short, dense guides on thinking clearly and living with intentionality. Sivers is known for his direct, almost aphoristic style and his ability to distill complex ideas into simple, actionable principles.`,
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
        shortDescription: 'If it\'s not a HELL YEAH, it\'s a no.',
        description:
          'When you feel anything less than genuine enthusiasm - "Wow, that would be amazing!" - the answer is no. Saying no to almost everything frees up space to give your full attention to what truly matters.',
        mentorSlug: 'derek-sivers',
        categories: ['decisions'],
        relatedToolSlug: 'sim-inteiro',
      },
      {
        id: 'useful-not-true',
        name: 'Useful, Not True',
        shortDescription: 'Beliefs are tools - use the ones that work.',
        description:
          'Instead of debating whether an idea is objectively true, ask whether it\'s useful to you right now. Beliefs are lenses: swap them out when they stop helping.',
        mentorSlug: 'derek-sivers',
        categories: ['thinking', 'decisions'],
      },
      {
        id: 'do-this-not-that',
        name: 'Do This, Not That',
        shortDescription: 'Clarity comes from contrasts, not lists.',
        description:
          'Defining what you DON\'T want is as important as defining what you do. Contrasts create sharp edges that make everyday decisions easier.',
        mentorSlug: 'derek-sivers',
        categories: ['decisions', 'action'],
      },
    ],
    connections: [
      { mentorSlug: 'tim-ferriss', reason: 'Both focus on elimination as strategy: Sivers eliminates commitments, Ferriss eliminates fears.' },
      { mentorSlug: 'marcus-aurelius', reason: 'Both seek inner clarity and detachment from others\' opinions.' },
      { mentorSlug: 'tim-urban', reason: 'Both use simple frames for life decisions - Sivers with "Hell Yeah", Urban with "The Tail End".' },
    ],
  },

  // -----------------------------------------------------------------------
  // 2. Tim Ferriss
  // -----------------------------------------------------------------------
  {
    slug: 'tim-ferriss',
    name: 'Tim Ferriss',
    tagline: 'Deconstruct fear to unlock action',
    bio: `Tim Ferriss is an author, investor, and host of The Tim Ferriss Show, one of the most listened-to podcasts in the world. He became known with the best-seller The 4-Hour Workweek, where he introduced the idea of lifestyle design - actively designing the life you want instead of following the default script.

Ferriss is a systematizer: he breaks down complex processes into replicable steps, from language learning to investing. His Fear Setting framework - inspired by Seneca's Stoicism - has become one of the most popular tools for overcoming fear-based paralysis.`,
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
        shortDescription: 'Define your fears instead of your goals.',
        description:
          'Inspired by Seneca\'s premeditatio malorum, Fear Setting is an exercise where you list the worst-case scenario, the actions to prevent it, and the cost of inaction. Ferriss does it at least once a month.',
        mentorSlug: 'tim-ferriss',
        categories: ['decisions', 'action'],
        relatedToolSlug: 'medo-na-mesa',
      },
      {
        id: '80-20-principle',
        name: '80/20 Principle',
        shortDescription: '20% of efforts generate 80% of results.',
        description:
          'Identify the vital few factors that produce most results - and eliminate or delegate the rest. Applies to work, relationships, learning, and health.',
        mentorSlug: 'tim-ferriss',
        categories: ['action', 'decisions'],
      },
      {
        id: 'lifestyle-design',
        name: 'Lifestyle Design',
        shortDescription: 'Design your life instead of accepting the default.',
        description:
          'Instead of working 40 years to "enjoy later," redistribute mini-retirements throughout life. Question assumptions about work, location, and schedule.',
        mentorSlug: 'tim-ferriss',
        categories: ['decisions', 'perspective'],
      },
    ],
    connections: [
      { mentorSlug: 'derek-sivers', reason: 'Sivers has appeared on Ferriss\'s podcast multiple times; both think in terms of systems for decisions.' },
      { mentorSlug: 'marcus-aurelius', reason: 'Ferriss is a student of Stoicism and credits Seneca and Marcus Aurelius as direct inspirations for Fear Setting.' },
      { mentorSlug: 'andrew-huberman', reason: 'Both translate science into practical protocols - Ferriss for productivity, Huberman for neuroscience.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 3. Sam Harris
  // -----------------------------------------------------------------------
  {
    slug: 'sam-harris',
    name: 'Sam Harris',
    tagline: 'Investigate the mind with radical honesty',
    bio: `Sam Harris is a neuroscientist, philosopher, and creator of the meditation app Waking Up. With a PhD in cognitive neuroscience from UCLA, he explores consciousness, free will, and ethics from a secular, scientific perspective.

Harris argues that meditation is not relaxation but a direct investigation of the nature of the mind. In his books and app, he guides practitioners to notice that the "self" that seems to be at the center of experience is actually a construction - and that recognizing this can be profoundly liberating.`,
    books: [
      { title: 'Waking Up', highlight: true },
      { title: 'Free Will' },
      { title: 'The Moral Landscape' },
      { title: 'Lying' },
    ],
    quotes: [
      'Free will is an illusion. Our wills are simply not of our own making.',
      'Thoughts and intentions emerge from background causes of which we are unaware and over which we exert no conscious control.',
      'The "self" - the conventional sense of being a subject living inside one\'s head - is an illusion.',
    ],
    primaryCategory: 'thinking',
    principles: [
      {
        id: 'mindfulness-investigation',
        name: 'Mindfulness as Investigation',
        shortDescription: 'Meditation isn\'t relaxation - it\'s looking closely.',
        description:
          'For Harris, mindfulness practice is a rigorous investigation of moment-to-moment experience. The goal isn\'t to empty the mind but to observe how thoughts arise without an apparent author.',
        mentorSlug: 'sam-harris',
        categories: ['thinking', 'perspective'],
      },
      {
        id: 'no-self',
        name: 'The Illusion of Self',
        shortDescription: 'The sense of being a separate "self" is a construction.',
        description:
          'If you pay attention, you\'ll notice that thoughts appear in consciousness without you knowing the next one. There is no thinker to be found - only thoughts. Recognizing this dissolves much unnecessary suffering.',
        mentorSlug: 'sam-harris',
        categories: ['thinking', 'perspective'],
      },
      {
        id: 'free-will-skepticism',
        name: 'Free Will Skepticism',
        shortDescription: 'You don\'t choose your thoughts - they just appear.',
        description:
          'Harris argues that losing the belief in free will doesn\'t lead to fatalism but increases the feeling of freedom. A creative change of inputs - new habits, new skills - can radically transform your life.',
        mentorSlug: 'sam-harris',
        categories: ['thinking'],
      },
    ],
    connections: [
      { mentorSlug: 'henry-shukman', reason: 'Shukman is a meditation teacher on Harris\'s Waking Up app; both explore the dissolution of self.' },
      { mentorSlug: 'marcus-aurelius', reason: 'Both practice observing one\'s own thoughts as a path to inner freedom.' },
      { mentorSlug: 'bruce-tift', reason: 'Harris and Tift converge at the intersection of meditation and psychology - the mind observing itself.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 4. Henry Shukman
  // -----------------------------------------------------------------------
  {
    slug: 'henry-shukman',
    name: 'Henry Shukman',
    tagline: 'Awakening is simple - and already here',
    bio: `Henry Shukman is a Zen master, poet, and British writer. Educated in literature at Oxford University, he discovered Zen meditation at 19 during a trip to Japan, and has since become one of the most accessible Zen teachers in the West. He is co-founder of the app The Way and a guiding teacher on Sam Harris's Waking Up.

Shukman teaches that awakening is not a grand event reserved for monks - it is ordinary, accessible, and profoundly loving. His concept of "Original Love" proposes that beneath all layers of conditioning, there is a fundamental belonging that can be rediscovered.`,
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
        shortDescription: 'Beneath everything, there is a fundamental belonging.',
        description:
          'Original Love is the discovery that before any conditioning, there is an intrinsic love and well-being native to our original nature. It\'s not something to build, but to rediscover.',
        mentorSlug: 'henry-shukman',
        categories: ['perspective', 'relationships'],
      },
      {
        id: 'ordinary-awakening',
        name: 'Ordinary Awakening',
        shortDescription: 'Awakening isn\'t mystical - it\'s seeing what\'s already here.',
        description:
          'Shukman teaches that awakening doesn\'t require years on retreat. It can happen in simple moments: the separate self dissolves and what was being hidden - presence, connection, openness - appears naturally.',
        mentorSlug: 'henry-shukman',
        categories: ['perspective', 'thinking'],
      },
      {
        id: 'koan-practice',
        name: 'Koan Practice',
        shortDescription: 'Impossible questions that open the mind.',
        description:
          'Koans are Zen questions or stories that can\'t be "solved" by the intellect. Koan practice invites the mind to release its certainties and find a more direct way of knowing.',
        mentorSlug: 'henry-shukman',
        categories: ['thinking', 'perspective'],
      },
    ],
    connections: [
      { mentorSlug: 'sam-harris', reason: 'Shukman is a guest teacher on the Waking Up app; both explore consciousness and the dissolution of self.' },
      { mentorSlug: 'bruce-tift', reason: 'Both integrate contemplative practice with psychology - Shukman through Zen, Tift through therapy.' },
      { mentorSlug: 'brene-brown', reason: 'Both see emotional wounds as doorways to something deeper - Shukman to awakening, Brown to vulnerability.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 5. Andrew Huberman
  // -----------------------------------------------------------------------
  {
    slug: 'andrew-huberman',
    name: 'Andrew Huberman',
    tagline: 'Applied neuroscience to optimize body and mind',
    bio: `Andrew Huberman is a neuroscientist and professor of neurobiology at Stanford School of Medicine. His podcast, Huberman Lab, has become a global reference for understanding the science behind sleep, focus, motivation, and emotional regulation.

Huberman translates neuroscience research into practical, accessible protocols. His episodes on dopamine, stress, and circadian rhythms have changed how millions of people think about their daily habits and biology.`,
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
        name: 'Dopamine Protocols',
        shortDescription: 'Attach dopamine to effort, not reward.',
        description:
          'Huberman teaches that dopamine is about motivation and pursuit, not pleasure. The key is linking your dopamine system to the effort process, not to external rewards - avoiding artificial spikes that lead to crashes.',
        mentorSlug: 'andrew-huberman',
        categories: ['energy', 'action'],
      },
      {
        id: 'stress-as-enhancer',
        name: 'Stress as Enhancer',
        shortDescription: 'The right stress, in the right dose, improves performance.',
        description:
          'Not all stress is bad. Huberman explains how acute, short-term stress (like cold exposure or intense exercise) activates neurobiological responses that enhance focus, resilience, and learning capacity.',
        mentorSlug: 'andrew-huberman',
        categories: ['energy', 'action'],
      },
      {
        id: 'sleep-hygiene',
        name: 'Sleep Hygiene',
        shortDescription: 'Sleep is the foundation of everything - optimize it first.',
        description:
          'Before optimizing anything else, optimize sleep. Huberman teaches protocols based on light, temperature, and timing to regulate circadian rhythms and maximize sleep quality.',
        mentorSlug: 'andrew-huberman',
        categories: ['energy'],
      },
    ],
    connections: [
      { mentorSlug: 'peter-attia', reason: 'Both translate science into health protocols; they frequently collaborate and cite each other.' },
      { mentorSlug: 'tim-ferriss', reason: 'Ferriss popularizes Huberman\'s ideas; both think in terms of protocols and personal experiments.' },
      { mentorSlug: 'sam-harris', reason: 'Both explore the neuroscience of consciousness - Huberman from the physiological side, Harris from the meditative.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 6. Peter Attia
  // -----------------------------------------------------------------------
  {
    slug: 'peter-attia',
    name: 'Peter Attia',
    tagline: 'Longevity with quality - body, mind, and emotion',
    bio: `Peter Attia is a physician specializing in longevity and founder of Early Medical, a clinic that applies what he calls "Medicine 3.0" - a proactive, personalized approach to preventing chronic diseases before they appear.

His book Outlive became a best-seller by proposing that longevity isn't about living longer, but about living better for longer. Attia emphasizes that emotional health is as critical as exercise and nutrition - if the "emotional house" isn't in order, no amount of physical optimization will help.`,
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
        name: 'Four Pillars of Exercise',
        shortDescription: 'Stability, strength, zone 2, and VO2max.',
        description:
          'Attia organizes exercise into four pillars: stability (the foundation), strength, zone 2 cardio (metabolic efficiency), and VO2max (peak aerobic capacity). Together, they form the bedrock of physical longevity.',
        mentorSlug: 'peter-attia',
        categories: ['energy', 'action'],
      },
      {
        id: 'emotional-health',
        name: 'Emotional Health',
        shortDescription: 'Without emotional health, longevity is a curse.',
        description:
          'Attia argues that emotional health is the most neglected pillar of longevity. If you reach 90 without being able to connect with the people you love, all the optimization was in vain.',
        mentorSlug: 'peter-attia',
        categories: ['energy', 'relationships'],
      },
      {
        id: 'centenarian-decathlon',
        name: 'Centenarian Decathlon',
        shortDescription: 'What do you want to be able to do at 90?',
        description:
          'The Centenarian Decathlon is a framework where you define 10 physical activities you want to perform in your last decade of life - and train now to ensure them. It redefines what\'s possible in old age.',
        mentorSlug: 'peter-attia',
        categories: ['energy', 'perspective'],
      },
    ],
    connections: [
      { mentorSlug: 'andrew-huberman', reason: 'Frequent partners in conversations about applied science; both focus on evidence-based protocols.' },
      { mentorSlug: 'tim-urban', reason: 'Both use time visualizations to create urgency - Attia with the Decathlon, Urban with the Life Calendar.' },
      { mentorSlug: 'brene-brown', reason: 'Attia credits emotional therapy as the most important change in his life, echoing Brown\'s work on vulnerability.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 7. Bruce Tift
  // -----------------------------------------------------------------------
  {
    slug: 'bruce-tift',
    name: 'Bruce Tift',
    tagline: 'We\'re already free - and it\'s okay if it doesn\'t feel that way',
    bio: `Bruce Tift is a psychotherapist with over 45 years of clinical practice and a long-time practitioner of Vajrayana Buddhism. His pioneering work integrates Western psychotherapy with Eastern contemplative practices in a genuinely dialogical way, without oversimplifying either side.

In his book Already Free, Tift presents two seemingly contradictory paths: the "developmental" (from therapy, which seeks to resolve past wounds) and the "fruitional" (from Buddhism, which recognizes that we are already whole). His proposition is that both are true at the same time - and that living in this tension is, in itself, liberating.`,
    books: [
      { title: 'Already Free', highlight: true },
    ],
    quotes: [
      'Both psychology and Buddhism seek to provide freedom from suffering, yet each offers a completely different approach for reaching this goal.',
      'Neurosis is always a substitute for experiential intensity.',
      'When we use the Western and Eastern approaches together, they can help us open to all of life - its richness, its disturbances, and its inherent completeness.',
    ],
    primaryCategory: 'thinking',
    principles: [
      {
        id: 'developmental-vs-fruitional',
        name: 'Developmental vs Fruitional',
        shortDescription: 'Two valid paths that contradict each other - and that\'s okay.',
        description:
          'The developmental view (therapy) says we need to resolve our past to live fully. The fruitional view (Buddhism) says we are already whole right now. Tift proposes that holding both - without resolving the tension - is the most honest path.',
        mentorSlug: 'bruce-tift',
        categories: ['thinking', 'perspective'],
      },
      {
        id: 'already-whole',
        name: 'Already Whole',
        shortDescription: 'You don\'t need to fix yourself to be present.',
        description:
          'The fruitional perspective invites presence, embodiment, and acceptance of whatever arises in immediate experience - without the requirement of "cleaning up" the past as a prerequisite for living fully.',
        mentorSlug: 'bruce-tift',
        categories: ['perspective', 'thinking'],
      },
      {
        id: 'neurotic-intelligence',
        name: 'Neurotic Intelligence',
        shortDescription: 'Your "problematic" patterns were intelligent solutions.',
        description:
          'What we call neurosis was, at some point, an intelligent attempt to protect ourselves. Tift proposes that instead of fighting these patterns, we recognize them as forms of experiential intensity - and open ourselves to that intensity directly.',
        mentorSlug: 'bruce-tift',
        categories: ['thinking', 'relationships'],
      },
    ],
    connections: [
      { mentorSlug: 'henry-shukman', reason: 'Both navigate between contemplative practice and ordinary human experience - Tift through therapy, Shukman through Zen.' },
      { mentorSlug: 'sam-harris', reason: 'They converge on investigating the mind - Harris as a meditating neuroscientist, Tift as a contemplative therapist.' },
      { mentorSlug: 'brene-brown', reason: 'Both work with the courage to stay with discomfort - Brown calls it vulnerability, Tift calls it experiential intensity.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 8. Adam Grant
  // -----------------------------------------------------------------------
  {
    slug: 'adam-grant',
    name: 'Adam Grant',
    tagline: 'Rethinking is the most underrated skill',
    bio: `Adam Grant is an organizational psychologist and the youngest professor to earn tenure at the Wharton School of the University of Pennsylvania. His books - Think Again, Give and Take, Originals - explore how we think, collaborate, and innovate, combining rigorous research with engaging stories.

Grant argues that the ability to rethink and unlearn is more valuable than raw intelligence. He teaches that the best thinkers operate like scientists: they form hypotheses, test them, and change their minds when the data demands it.`,
    books: [
      { title: 'Think Again', highlight: true },
      { title: 'Give and Take' },
      { title: 'Originals' },
      { title: 'Hidden Potential' },
    ],
    quotes: [
      'If knowledge is power, knowing what we don\'t know is wisdom.',
      'Thinking like a scientist means searching for reasons why we might be wrong - not for reasons why we must be right.',
      'Givers advance the world. Takers advance themselves and hold the world back.',
    ],
    primaryCategory: 'thinking',
    principles: [
      {
        id: 'think-again',
        name: 'Think Again',
        shortDescription: 'The hallmark of intelligence is the willingness to change your mind.',
        description:
          'Grant proposes that we operate like scientists: forming hypotheses, testing them, and revising our views based on what we learn. When you\'re wrong, it\'s not cause for sadness - it\'s a discovery.',
        mentorSlug: 'adam-grant',
        categories: ['thinking'],
      },
      {
        id: 'give-and-take',
        name: 'Give and Take',
        shortDescription: 'Strategic generosity is the most sustainable form of success.',
        description:
          'In Give and Take, Grant shows that "givers" - people who contribute without expecting immediate return - tend to occupy both the top and the bottom of the success ladder. The difference lies in giving with healthy boundaries.',
        mentorSlug: 'adam-grant',
        categories: ['relationships', 'action'],
      },
      {
        id: 'originals',
        name: 'Originals',
        shortDescription: 'Original people act despite fear, not without it.',
        description:
          'Being original doesn\'t require supernatural boldness. Grant shows that successful innovators often feel just as much fear as everyone else - but they act anyway, and generate many ideas to find the few that work.',
        mentorSlug: 'adam-grant',
        categories: ['action', 'thinking'],
      },
    ],
    connections: [
      { mentorSlug: 'brene-brown', reason: 'Brown and Grant are friends and collaborators; both study courage - Brown in the emotional field, Grant in the intellectual.' },
      { mentorSlug: 'tim-ferriss', reason: 'Both systematize high-performance principles, but Grant brings the lens of organizational psychology.' },
      { mentorSlug: 'maria-popova', reason: 'Both are curators of ideas connecting distinct fields - Grant through research, Popova through literature.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 9. Brene Brown
  // -----------------------------------------------------------------------
  {
    slug: 'brene-brown',
    name: 'Brene Brown',
    tagline: 'Vulnerability is courage, not weakness',
    bio: `Brene Brown is a researcher, professor at the University of Houston, and one of the most influential voices in the world on vulnerability, shame, and courage. Her TED Talk "The Power of Vulnerability" is one of the most-watched of all time, with over 60 million views.

With more than two decades of research, Brown has demonstrated that vulnerability is not weakness - it is the most accurate measure of courage. Her books, including Daring Greatly and Braving the Wilderness, offer practical frameworks for building authentic connections and emotional resilience.`,
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
        name: 'Vulnerability as Courage',
        shortDescription: 'Showing up fully is the most courageous act there is.',
        description:
          'Brown defines vulnerability as uncertainty, risk, and emotional exposure. It\'s not weakness - it\'s the foundation of all genuine connection. We can choose courage or comfort, but not both at the same time.',
        mentorSlug: 'brene-brown',
        categories: ['relationships', 'decisions'],
      },
      {
        id: 'shame-resilience',
        name: 'Shame Resilience',
        shortDescription: 'Shame survives in silence - and dies in empathy.',
        description:
          'Shame is the fear of not being good enough. Brown shows that when we share our story with someone who responds with empathy, shame cannot survive. Shame resilience is a trainable skill.',
        mentorSlug: 'brene-brown',
        categories: ['relationships', 'thinking'],
      },
      {
        id: 'rumbling-with-vulnerability',
        name: 'Rumbling with Vulnerability',
        shortDescription: 'Entering the arena knowing it\'s going to hurt.',
        description:
          'Brown teaches that "daring greatly" means accepting that we\'re going to get knocked down. What matters is being in the arena - with the willingness to be seen, to fail, and to try again.',
        mentorSlug: 'brene-brown',
        categories: ['relationships', 'action'],
      },
    ],
    connections: [
      { mentorSlug: 'adam-grant', reason: 'Collaborators and friends; both research courage - Brown in the emotional terrain, Grant in the intellectual.' },
      { mentorSlug: 'bruce-tift', reason: 'Both work with the willingness to stay with discomfort as a path to growth.' },
      { mentorSlug: 'peter-attia', reason: 'Attia credits emotional work (aligned with Brown) as the most important transformation of his life.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 10. Maria Popova
  // -----------------------------------------------------------------------
  {
    slug: 'maria-popova',
    name: 'Maria Popova',
    tagline: 'Connecting ideas across centuries to illuminate the present',
    bio: `Maria Popova is a writer and founder of The Marginalian (formerly Brain Pickings), one of the most widely read blogs in the world about books, art, philosophy, science, and the search for meaning. Born in Bulgaria and based in the United States, she has been writing since 2006, weaving connections between thinkers across eras and fields.

Her book Figuring explores the intertwined lives of scientists, writers, and artists, showing how meaning is not something we find but something we create with the lives we live. Popova argues that creativity is combinatorial - everything builds on what came before.`,
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
        name: 'Combinatorial Creativity',
        shortDescription: 'Nothing is entirely original - everything builds on what came before.',
        description:
          'Popova teaches that we create by recombining pieces of inspiration, knowledge, and insight we\'ve collected throughout life. Originality doesn\'t come from nothing - it comes from unexpected connections between existing ideas.',
        mentorSlug: 'maria-popova',
        categories: ['perspective', 'thinking'],
      },
      {
        id: 'figuring',
        name: 'Figuring',
        shortDescription: 'Meaning isn\'t found - it\'s created with the life we live.',
        description:
          'Inspired by the lives of scientists and artists, Popova proposes that meaning emerges from the act of living with curiosity and courage, connecting seemingly disconnected experiences into a narrative of one\'s own.',
        mentorSlug: 'maria-popova',
        categories: ['perspective'],
      },
      {
        id: 'shoreless-seeds',
        name: 'Shoreless Seeds',
        shortDescription: 'What we create transcends our own life.',
        description:
          'Popova writes that our ideas, creations, and influences persist far beyond us - like "shoreless seeds" that migrate between cultures, centuries, and continents. Legacy is not fame, but reverberation.',
        mentorSlug: 'maria-popova',
        categories: ['perspective', 'relationships'],
      },
    ],
    connections: [
      { mentorSlug: 'marcus-aurelius', reason: 'Popova frequently writes about Stoic philosophy and the search for meaning in the face of impermanence.' },
      { mentorSlug: 'adam-grant', reason: 'Both are curators of ideas across disciplines - Grant through empirical research, Popova through literature and art.' },
      { mentorSlug: 'henry-shukman', reason: 'Both explore the intersection of beauty, impermanence, and meaning - Popova through writing, Shukman through Zen.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 11. Marcus Aurelius
  // -----------------------------------------------------------------------
  {
    slug: 'marcus-aurelius',
    name: 'Marcus Aurelius',
    tagline: 'Control what depends on you - accept the rest',
    bio: `Marcus Aurelius was Roman Emperor from 161 to 180 AD and one of the most important Stoic philosophers in history. His Meditations - written as a personal journal, never intended for publication - became one of the most influential texts in Western philosophy.

Ruling during wars, plagues, and betrayals, Marcus Aurelius used writing as a daily philosophical practice: reminding himself of what he could control, the brevity of life, and the importance of acting with virtue regardless of circumstances. Two millennia later, his principles remain radically relevant.`,
    books: [
      { title: 'Meditations', highlight: true },
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
        name: 'Dichotomy of Control',
        shortDescription: 'Separate what depends on you from what doesn\'t.',
        description:
          'The central principle of Stoicism: you control your judgment, intention, choices, and attention. The weather, others\' motivations, and external outcomes are material you work with, not systems you command.',
        mentorSlug: 'marcus-aurelius',
        categories: ['perspective', 'decisions'],
      },
      {
        id: 'memento-mori',
        name: 'Memento Mori',
        shortDescription: 'Remember death to live with more presence.',
        description:
          'Memento mori - "remember you will die" - doesn\'t shrink life but condenses it. When time is kept close, trivial pursuits lose their appeal, gratitude sharpens, and kindness stops waiting for "later."',
        mentorSlug: 'marcus-aurelius',
        categories: ['perspective', 'energy'],
      },
      {
        id: 'view-from-above',
        name: 'View from Above',
        shortDescription: 'See your situation from the perspective of the cosmos.',
        description:
          'A Stoic exercise in imagination: see yourself from above, then the city, the continent, the planet, the cosmos. Your problems don\'t disappear, but they gain proportion. What seemed urgent may reveal itself as trivial.',
        mentorSlug: 'marcus-aurelius',
        categories: ['perspective', 'thinking'],
      },
    ],
    connections: [
      { mentorSlug: 'tim-ferriss', reason: 'Ferriss is a student of Stoicism and credits Seneca and Marcus Aurelius as direct inspirations for Fear Setting.' },
      { mentorSlug: 'derek-sivers', reason: 'Both seek inner clarity and independence from external opinions as the basis for good decisions.' },
      { mentorSlug: 'tim-urban', reason: 'Both confront mortality as a tool for clarity - Aurelius via memento mori, Urban via time visualizations.' },
    ],
  },

  // -----------------------------------------------------------------------
  // 12. Tim Urban
  // -----------------------------------------------------------------------
  {
    slug: 'tim-urban',
    name: 'Tim Urban',
    tagline: 'Visualize time to awaken urgency',
    bio: `Tim Urban is a writer and illustrator, creator of the blog Wait But Why, one of the most widely read on the internet. His long-form posts - often accompanied by simple drawings and accessible humor - explore topics like procrastination, artificial intelligence, relationships, and the meaning of life.

His TED Talk "Inside the Mind of a Master Procrastinator" is one of the most-watched of all time. Urban has a rare talent for making visible what is normally abstract: the passage of time, the finitude of life, and the real cost of putting things off.`,
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
        shortDescription: 'One box per week of a 90-year life. There aren\'t that many.',
        description:
          'The Life Calendar visualizes your entire life as a grid of boxes - one per week. Seeing how many have already been used and how many remain creates a visceral urgency that no goals list can match.',
        mentorSlug: 'tim-urban',
        categories: ['perspective', 'decisions'],
      },
      {
        id: 'procrastination-matrix',
        name: 'Procrastination Matrix',
        shortDescription: 'The most dangerous procrastination has no deadline.',
        description:
          'Urban shows that tasks with deadlines generate "contained" procrastination. The real danger lies in tasks without deadlines - the "silent killers" like taking care of your health, leaving a bad job, or strengthening relationships.',
        mentorSlug: 'tim-urban',
        categories: ['perspective', 'action'],
      },
      {
        id: 'the-tail-end',
        name: 'The Tail End',
        shortDescription: 'You may be in the last 5% of time with the people you love.',
        description:
          'Even if you\'re not at the end of your life, you may be at the end of your time with the most important people. If you\'ve already left home, you\'ve used over 90% of your in-person time with your parents. What do you do with the last 5%?',
        mentorSlug: 'tim-urban',
        categories: ['perspective', 'relationships'],
      },
    ],
    connections: [
      { mentorSlug: 'marcus-aurelius', reason: 'Both use mortality as a lens for clarity - Aurelius via Stoic philosophy, Urban via data visualizations.' },
      { mentorSlug: 'peter-attia', reason: 'Both create urgency through time visualization - Attia with the Centenarian Decathlon, Urban with the Life Calendar.' },
      { mentorSlug: 'derek-sivers', reason: 'Both simplify complex decisions with visual, intuitive frames.' },
    ],
  },
  {
    slug: 'antonio-damasio',
    name: 'António Damasio',
    tagline: 'Your body knows before your mind does',
    bio: 'Neuroscientist whose work on somatic markers revealed that emotions are not obstacles to rational thinking - they are essential components of it. His research shows the body sends signals that guide decisions before conscious reasoning even begins.',
    books: [
      { title: "Descartes' Error", highlight: true },
      { title: 'The Feeling of What Happens' },
      { title: 'Self Comes to Mind' },
      { title: 'Looking for Spinoza' },
    ],
    quotes: [
      'The body is the main stage for emotions.',
      'Feelings are not a luxury. They are a means of communicating our states of mind to others.',
    ],
    primaryCategory: 'thinking' as Category,
    principles: [
      {
        id: 'somatic-markers',
        name: 'Somatic Markers',
        shortDescription: 'Your body signals guide decisions before your mind catches up.',
        description:
          'Somatic markers are body signals - a gut feeling, a tightness in the chest, a wave of calm - that arise from past emotional experiences and help guide present decisions. Damasio showed that people with damage to the brain regions processing these signals make catastrophically poor decisions, even when their logical reasoning is intact.',
        mentorSlug: 'antonio-damasio',
        categories: ['thinking', 'decisions'] as Category[],
      },
      {
        id: 'embodied-decision-making',
        name: 'Embodied Decision-Making',
        shortDescription: 'Rational thought depends on the body\'s emotional signals.',
        description:
          'Pure logic alone leads to poor choices. Damasio\'s research demonstrates that the body and emotions are not noise interfering with reason - they are the substrate on which reason operates. Every "rational" decision is shaped by emotional signals you may not even notice.',
        mentorSlug: 'antonio-damasio',
        categories: ['thinking', 'energy'] as Category[],
      },
    ],
    connections: [
      { mentorSlug: 'sam-harris', reason: 'Both explore consciousness from a scientific perspective - Damasio through neuroscience, Harris through contemplative practice.' },
      { mentorSlug: 'andrew-huberman', reason: 'Both bridge neuroscience and practical living - Huberman with protocols, Damasio with understanding.' },
      { mentorSlug: 'stephen-porges', reason: 'Both study the body-brain connection - Damasio through somatic markers, Porges through the vagus nerve.' },
    ],
  },
  {
    slug: 'richard-schwartz',
    name: 'Richard Schwartz',
    tagline: 'Every voice inside you is trying to help',
    bio: 'Creator of Internal Family Systems (IFS) therapy. His model treats the mind as a family of sub-personalities - parts - each with positive intent. Beneath the protective parts lies a core Self characterized by curiosity, compassion, and calm.',
    books: [
      { title: 'No Bad Parts', highlight: true },
      { title: 'Introduction to the Internal Family Systems Model' },
      { title: "You Are the One You've Been Waiting For" },
    ],
    quotes: [
      'All parts are welcome.',
      'The goal is not to eliminate parts, but to help them find their non-extreme roles.',
    ],
    primaryCategory: 'relationships' as Category,
    principles: [
      {
        id: 'parts-work',
        name: 'Parts Work',
        shortDescription: 'Conflicting inner voices are parts with protective roles, not character flaws.',
        description:
          'When you feel torn between wanting to stay safe and wanting to take a risk, that\'s not indecision - those are two parts of you, each trying to protect you in their own way. Parts work means recognizing these voices, understanding what they\'re afraid of, and helping them trust that you can handle what comes.',
        mentorSlug: 'richard-schwartz',
        categories: ['relationships', 'thinking'] as Category[],
      },
      {
        id: 'self-energy',
        name: 'Self-Energy',
        shortDescription: 'Underneath all parts, there is a core Self - curious, compassionate, calm.',
        description:
          'IFS posits that beneath the noise of protective parts lies what Schwartz calls Self - a state characterized by the 8 C\'s: curiosity, calm, clarity, compassion, confidence, courage, creativity, and connectedness. Accessing Self is not about becoming someone new; it\'s about uncovering who you already are.',
        mentorSlug: 'richard-schwartz',
        categories: ['relationships', 'energy'] as Category[],
      },
      {
        id: 'internal-family-systems',
        name: 'Internal Family Systems',
        shortDescription: 'Healing comes from befriending your parts, not exiling them.',
        description:
          'Most approaches to inner conflict try to silence, override, or "fix" the difficult voices. IFS does the opposite: it turns toward each part with curiosity. A part that seems destructive (procrastination, self-sabotage, anxiety) is often a protector carrying a burden from the past. When you listen, it can relax.',
        mentorSlug: 'richard-schwartz',
        categories: ['relationships', 'perspective'] as Category[],
      },
    ],
    connections: [
      { mentorSlug: 'bruce-tift', reason: 'Both work with inner conflict therapeutically - Tift through developmental vs fruitional tension, Schwartz through parts.' },
      { mentorSlug: 'brene-brown', reason: 'Both emphasize compassion toward vulnerable parts of self as the path to wholeness.' },
      { mentorSlug: 'stephen-porges', reason: 'IFS parts map onto nervous system states - protectors activate fight/flight, exiles carry freeze.' },
    ],
  },
  {
    slug: 'charlie-munger',
    name: 'Charlie Munger',
    tagline: 'Strip away assumptions. What\'s actually true?',
    bio: 'Investor, vice chairman of Berkshire Hathaway, and one of the most celebrated thinkers on mental models. Munger advocated building a latticework of frameworks from multiple disciplines - psychology, physics, biology, history - to avoid the blind spots that come from seeing the world through a single lens.',
    books: [
      { title: "Poor Charlie's Almanack", highlight: true },
      { title: 'Seeking Wisdom: From Darwin to Munger' },
    ],
    quotes: [
      'Invert, always invert.',
      'I never allow myself to have an opinion on anything that I don\'t know the other side\'s argument better than they do.',
    ],
    primaryCategory: 'thinking' as Category,
    principles: [
      {
        id: 'mental-models',
        name: 'Mental Models',
        shortDescription: 'Build a latticework of frameworks to see reality more clearly.',
        description:
          'A person who only knows accounting will try to solve every problem with accounting. Munger\'s insight is that the best thinkers collect models from many fields - evolution, psychology, physics, economics - and use them in combination. The more models you have, the fewer blind spots.',
        mentorSlug: 'charlie-munger',
        categories: ['thinking', 'decisions'] as Category[],
      },
      {
        id: 'inversion',
        name: 'Inversion',
        shortDescription: 'Instead of asking how to succeed, ask what would guarantee failure.',
        description:
          'Most people think forward: "How do I get what I want?" Munger inverts: "What would guarantee I fail?" Then avoid that. Want a good relationship? Instead of listing what you want, list what would destroy one. Inversion reveals blind spots that forward thinking misses.',
        mentorSlug: 'charlie-munger',
        categories: ['thinking', 'decisions'] as Category[],
      },
      {
        id: 'first-principles-thinking',
        name: 'First Principles Thinking',
        shortDescription: 'Break problems down to their fundamental truths before reasoning up.',
        description:
          'Most reasoning is by analogy - "this is like that, so do the same thing." First principles thinking strips away assumptions and conventions to find what\'s fundamentally true, then builds up from there. It\'s slower but finds solutions that analogy-based thinking can\'t.',
        mentorSlug: 'charlie-munger',
        categories: ['thinking'] as Category[],
      },
    ],
    connections: [
      { mentorSlug: 'shane-parrish', reason: 'Parrish built Farnam Street largely around Munger\'s ideas - the site is named after Berkshire Hathaway\'s street.' },
      { mentorSlug: 'derek-sivers', reason: 'Both favor radical simplicity in thinking and ruthless elimination of what doesn\'t matter.' },
      { mentorSlug: 'jeff-bezos', reason: 'Both use inversion and long-term thinking as core decision-making tools.' },
    ],
  },
  {
    slug: 'jeff-bezos',
    name: 'Jeff Bezos',
    tagline: 'Project yourself to 80. Which regret weighs more?',
    bio: 'Founder of Amazon. Known in decision-making circles for the Regret Minimization Framework - imagining yourself at 80 and asking which choice you would regret not making. Also advocates Day 1 thinking: maintaining the urgency and customer focus of a startup, no matter how large you grow.',
    books: [
      { title: 'Invent and Wander', highlight: true },
      { title: 'The Everything Store' },
    ],
    quotes: [
      'I knew that when I was 80, I was not going to regret having tried this.',
      'If you decide that you\'re going to do only the things you know are going to work, you\'re going to leave a lot of opportunity on the table.',
    ],
    primaryCategory: 'decisions' as Category,
    principles: [
      {
        id: 'regret-minimization',
        name: 'Regret Minimization',
        shortDescription: 'Project yourself to age 80 and ask which path you would regret not taking.',
        description:
          'When Bezos was deciding whether to leave his Wall Street job to start Amazon, he imagined himself at 80 looking back. He knew he wouldn\'t regret trying and failing. But he would deeply regret never trying. This framework cuts through noise by shifting the time horizon from months to decades.',
        mentorSlug: 'jeff-bezos',
        categories: ['decisions', 'perspective'] as Category[],
      },
      {
        id: 'day-1-thinking',
        name: 'Day 1 Thinking',
        shortDescription: 'Treat every day as Day 1: stay curious, decide quickly, resist complacency.',
        description:
          'Day 2 is stasis, followed by irrelevance, followed by excruciating decline. Day 1 means staying in startup mode: making decisions with 70% of the information you wish you had, staying close to the people you serve, and being willing to be misunderstood for long periods.',
        mentorSlug: 'jeff-bezos',
        categories: ['decisions', 'action'] as Category[],
      },
    ],
    connections: [
      { mentorSlug: 'tim-ferriss', reason: 'Both use structured frameworks to cut through decision paralysis - Ferriss with Fear Setting, Bezos with Regret Minimization.' },
      { mentorSlug: 'charlie-munger', reason: 'Both favor long-term thinking and inversion as core decision-making tools.' },
      { mentorSlug: 'shane-parrish', reason: 'Parrish has extensively analyzed Bezos\'s decision frameworks on Farnam Street.' },
    ],
  },
  {
    slug: 'shane-parrish',
    name: 'Shane Parrish',
    tagline: 'Turn ordinary moments into better decisions',
    bio: 'Creator of Farnam Street and the Knowledge Project podcast. Former intelligence analyst who turned to studying mental models, decision-making, and clear thinking. His work synthesizes ideas from Munger, Kahneman, and others into practical frameworks anyone can use.',
    books: [
      { title: 'Clear Thinking', highlight: true },
      { title: 'The Great Mental Models Vol. 1' },
      { title: 'The Great Mental Models Vol. 2' },
    ],
    quotes: [
      'The quality of your thinking determines the quality of your life.',
      'Most errors come from defaults, not reasoning.',
    ],
    primaryCategory: 'decisions' as Category,
    principles: [
      {
        id: 'decision-journal',
        name: 'Decision Journal',
        shortDescription: 'Write down your reasoning before you know the outcome.',
        description:
          'A decision journal captures what you decided, why, what you expected to happen, and how you felt - before the outcome is known. Reviewing it over time reveals patterns in your thinking: where you\'re consistently right, where you fool yourself, and which emotions lead you astray.',
        mentorSlug: 'shane-parrish',
        categories: ['decisions', 'thinking'] as Category[],
      },
      {
        id: 'clear-thinking',
        name: 'Clear Thinking',
        shortDescription: 'Most errors come from defaults, not reasoning.',
        description:
          'Parrish argues that the biggest thinking errors don\'t happen during deliberation - they happen when we\'re on autopilot. Social defaults, emotional defaults, ego defaults, and inertia defaults hijack our choices before we even realize we\'re making one. Clear thinking means catching yourself in the ordinary moments.',
        mentorSlug: 'shane-parrish',
        categories: ['thinking', 'decisions'] as Category[],
      },
      {
        id: 'second-order-thinking',
        name: 'Second-Order Thinking',
        shortDescription: 'Ask "and then what?" to see beyond immediate consequences.',
        description:
          'First-order thinking asks: "What happens if I do this?" Second-order thinking asks: "And then what? What are the consequences of the consequences?" Most people stop at the first order. The best decisions come from thinking at least two steps ahead.',
        mentorSlug: 'shane-parrish',
        categories: ['decisions', 'perspective'] as Category[],
      },
    ],
    connections: [
      { mentorSlug: 'charlie-munger', reason: 'Farnam Street is named after Berkshire Hathaway\'s street - Parrish is a devoted student of Munger\'s mental models.' },
      { mentorSlug: 'tim-ferriss', reason: 'Both are systematizers of practical wisdom - Ferriss through experiments, Parrish through synthesis.' },
      { mentorSlug: 'adam-grant', reason: 'Both bridge academic research and applied decision-making for a general audience.' },
    ],
  },
  {
    slug: 'stephen-porges',
    name: 'Stephen Porges',
    tagline: 'Your nervous system is always listening',
    bio: 'Neuroscientist and creator of the Polyvagal Theory, which describes how the autonomic nervous system shapes our sense of safety, connection, and threat. His work explains why we sometimes freeze, fight, or shut down - and how co-regulation with others can restore a sense of safety.',
    books: [
      { title: 'The Polyvagal Theory', highlight: true },
      { title: 'The Pocket Guide to the Polyvagal Theory' },
      { title: 'Polyvagal Exercises for Safety and Connection' },
    ],
    quotes: [
      'Safety is not the absence of threat. It is the presence of connection.',
      'The nervous system is not asking "Is this dangerous?" It is asking "Is this safe?"',
    ],
    primaryCategory: 'energy' as Category,
    principles: [
      {
        id: 'polyvagal-theory',
        name: 'Polyvagal Theory',
        shortDescription: 'Your nervous system cycles between safety, fight-or-flight, and shutdown.',
        description:
          'The autonomic nervous system has three states: ventral vagal (safe and social - you can connect, think clearly, be creative), sympathetic (fight or flight - mobilized, anxious, reactive), and dorsal vagal (shutdown - frozen, numb, collapsed). Understanding which state you\'re in is the first step to shifting it.',
        mentorSlug: 'stephen-porges',
        categories: ['energy', 'relationships'] as Category[],
      },
      {
        id: 'neuroception',
        name: 'Neuroception',
        shortDescription: 'Your body detects safety or danger below conscious awareness.',
        description:
          'Before you consciously assess a situation, your nervous system has already decided whether it\'s safe or threatening. This below-awareness scanning - neuroception - explains why you might feel uneasy in a "safe" situation or calm in a "dangerous" one. Your body\'s reading may not match reality, but it always drives behavior.',
        mentorSlug: 'stephen-porges',
        categories: ['energy', 'thinking'] as Category[],
      },
      {
        id: 'window-of-tolerance',
        name: 'Window of Tolerance',
        shortDescription: 'The zone where you can process experiences without being overwhelmed.',
        description:
          'The window of tolerance is the bandwidth within which you can think, feel, and function effectively. Too much activation pushes you into hyperarousal (anxiety, panic). Too little drops you into hypoarousal (numbness, disconnection). The goal is not to avoid stress but to widen the window so you can handle more while staying regulated.',
        mentorSlug: 'stephen-porges',
        categories: ['energy', 'relationships'] as Category[],
      },
    ],
    connections: [
      { mentorSlug: 'antonio-damasio', reason: 'Both study the body\'s role in cognition and emotion - Damasio through somatic markers, Porges through the vagus nerve.' },
      { mentorSlug: 'andrew-huberman', reason: 'Both translate neuroscience into body-based protocols for managing stress and state.' },
      { mentorSlug: 'richard-schwartz', reason: 'IFS parts map onto polyvagal states - protectors activate sympathetic, exiles carry dorsal vagal freeze.' },
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
