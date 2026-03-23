import type { Category } from './mentors';

export interface Book {
  title: string;
  author: string;
  subtitle: string;
  domain: Category;
  highlights: string[];
}

export const books: Book[] = [
  {
    title: 'Already Free',
    author: 'Bruce Tift',
    subtitle: 'Buddhism Meets Psychotherapy on the Path of Liberation',
    domain: 'relationships',
    highlights: [
      'Sanity is a counter-instinctual process.',
      'We experience life as suffering because of how we relate to reality, not because reality itself is inherently a problem.',
    ],
  },
  {
    title: 'When Einstein Walked with Gödel',
    author: 'Jim Holt',
    subtitle: 'Excursions to the Edge of Thought',
    domain: 'meaning',
    highlights: [
      'Irresistibly, irreversibly, we are being borne toward our deaths at the stark rate of one second per second.',
      'Time is nature\'s way to keep everything from happening all at once.',
    ],
  },
  {
    title: 'My Stroke of Insight',
    author: 'Jill Bolte Taylor',
    subtitle: 'A neuroscientist\'s journey between left and right brain',
    domain: 'bodyMind',
    highlights: [
      'To the right mind, no time exists other than the present moment, and each moment is vibrant with sensation.',
      'I don\'t have to think thoughts that bring me pain. It is freeing to know that I have the conscious power to stop thinking those thoughts when I am satiated.',
      'I must be willing to give up what I am in order to become what I will be.',
    ],
  },
  {
    title: 'Notes on Complexity',
    author: 'Neil Theise',
    subtitle: 'A Scientific Theory of Connection, Consciousness, and Being',
    domain: 'meaning',
    highlights: [
      'Life is ceaseless movement; stability is found in balance, not rigidity.',
      'In complexity, the whole is unpredictably greater than the sum of its parts. Kind of like the world. Kind of like our lives.',
      'At the atomic scale, each one of us is both our own separate self and, in complementarity, also just walking, talking Earth.',
    ],
  },
  {
    title: 'Life in Three Dimensions',
    author: 'Shigehiro Oishi',
    subtitle: 'How Curiosity, Exploration, and Experience Make a Fuller, Better Life',
    domain: 'meaning',
    highlights: [
      'A psychologically rich life is a life filled with diverse, unusual, interesting experiences that change your perspective; a life with twists and turns; a life that feels like a long, winding hike rather than many laps of the same racing circuit.',
      'The purpose of life, after all, is to live it, to taste experience to the utmost, to reach out eagerly and without fear for newer and richer experience. - Eleanor Roosevelt',
      'Just as you can accumulate wealth and become materially rich, you can accumulate experiences and become psychologically rich.',
    ],
  },
  {
    title: 'Big Magic',
    author: 'Elizabeth Gilbert',
    subtitle: 'Creative Living Beyond Fear',
    domain: 'work',
    highlights: [
      'I\'m talking about living a life that is driven more strongly by curiosity than by fear.',
      'A creative life is an amplified life. It\'s a bigger life, a happier life, an expanded life, and a hell of a lot more interesting life.',
      'You can measure your worth by your dedication to your path, not by your successes or failures.',
    ],
  },
  {
    title: 'The Unbearable Lightness of Being',
    author: 'Milan Kundera',
    subtitle: 'A dark and brilliant achievement',
    domain: 'relationships',
    highlights: [
      'We can never know what to want, because, living only one life, we can neither compare it with our previous lives nor perfect it in our lives to come.',
      'The goals we pursue are always veiled. A girl who longs for marriage longs for something she knows nothing about. The boy who hankers after fame has no idea what fame is. The thing that gives our every move its meaning is always totally unknown to us.',
      'Love begins with a metaphor. Which is to say, love begins at the point when a woman enters her first word into our poetic memory.',
    ],
  },
  {
    title: 'Clear Thinking',
    author: 'Shane Parrish',
    subtitle: 'Turning Ordinary Moments into Extraordinary Results',
    domain: 'work',
    highlights: [
      'The truth is that we make repeated choices in life that become habits, those habits determine our paths, and those paths determine our outcomes.',
      'Knowing your vulnerability to social pressure and the limits of your power to resist it requires self-knowledge. Deciding to do something about this vulnerability requires self-confidence. Following the rule you\'ve made for yourself takes self-accountability. And overcoming short-term discomfort for long-term gain displays self-control.',
    ],
  },
  {
    title: 'The Tools',
    author: 'Phil Stutz & Barry Michels',
    subtitle: 'Five Tools to Help You Find Courage, Creativity, and Willpower',
    domain: 'bodyMind',
    highlights: [
      'The Comfort Zone is supposed to keep your life safe, but what it really does is keep your life small.',
      'A sense of purpose doesn\'t come from thinking about it. It comes from taking action that moves you toward the future.',
      'Inner strength comes only to those who move forward in the face of adversity. His energy is wasted insisting it shouldn\'t have happened in the first place.',
    ],
  },
  {
    title: 'Essentialism',
    author: 'Greg McKeown',
    subtitle: 'The Disciplined Pursuit of Less',
    domain: 'work',
    highlights: [
      'Only once you give yourself permission to stop trying to do it all, to stop saying yes to everyone, can you make your highest contribution towards the things that really matter.',
      'Essentialists see trade-offs as an inherent part of life, not as an inherently negative part of life. Instead of asking, "What do I have to give up?" they ask, "What do I want to go big on?"',
      'What am I deeply passionate about? What taps my talent? What meets a significant need in the world?',
    ],
  },
  {
    title: 'The Gifts of Imperfection',
    author: 'Brené Brown',
    subtitle: 'Let Go of Who You Think You\'re Supposed to Be and Embrace Who You Are',
    domain: 'relationships',
    highlights: [
      'True belonging only happens when we present our authentic, imperfect selves to the world. Our sense of belonging can never be greater than our level of self-acceptance.',
      'To be nobody-but-yourself in a world which is doing its best, night and day, to make you everybody but yourself - means to fight the hardest battle which any human being can fight - and never stop fighting. - E. E. Cummings',
      'Don\'t ask what the world needs. Ask what makes you come alive, and go do it. Because what the world needs is people who have come alive.',
    ],
  },
  {
    title: 'The Comfort Crisis',
    author: 'Michael Easter',
    subtitle: 'Embrace Discomfort To Reclaim Your Wild, Happy, Healthy Self',
    domain: 'bodyMind',
    highlights: [
      'As we experience fewer problems, we don\'t become more satisfied. We just lower our threshold for what we consider a problem. We end up with the same number of troubles. Except our new problems are progressively more hollow.',
      'What are you mentally and spiritually willing to put yourself through to be a better human?',
      'The hero exits the comfort of home for adventure. He\'s hit with a challenge. It tests his physical, psychological, and spiritual fortitude. He struggles. Yet he manages to prevail. He returns with heightened knowledge, skills, confidence, and experience, and a clearer sense of his place in the world.',
    ],
  },
  {
    title: 'The Great Work of Your Life',
    author: 'Stephen Cope',
    subtitle: 'A Guide for the Journey to Your True Calling',
    domain: 'meaning',
    highlights: [
      'People actually feel happiest and most fulfilled when meeting the challenge of their dharma in the world, when bringing highly concentrated effort to some compelling activity for which they have a true calling.',
      'Fulfillment happens not in retreat from the world, but in advance - and profound engagement.',
    ],
  },
  {
    title: 'The Wisdom of a Broken Heart',
    author: 'Susan Piver',
    subtitle: 'An Uncommon Guide to Healing, Insight, and Love',
    domain: 'relationships',
    highlights: [
      'By discovering that sadness is a form of gentleness, loneliness is a form of fearlessness, and heartbreak is a form of intelligence, I\'ve learned that what I thought were the worst things about me were actually the best.',
      'How truly can you be in your own life? How sharply can you feel your own joy and how deeply can you experience your sorrows? This is what seems to lead to happiness, not chasing after good experiences and strategizing away bad ones.',
      'Give yourself over to what you feel. Naturalness and authenticity are being who you are and feeling what you feel from moment to moment, without judging your experience as in or out of line with who you hoped you were or read you were supposed to be.',
    ],
  },
  {
    title: 'Stay or Leave',
    author: 'The School of Life',
    subtitle: 'How to remain in, or end your relationship',
    domain: 'relationships',
    highlights: [
      'What ultimately counts for the success of love is not whether there are differences, but how differences are handled - whether with curiosity, a willingness to change, mutual forgiveness and modesty.',
      'The lover we desperately need is not the person who shares our every taste and interest; it is the kindly soul who has learnt to negotiate differences in taste with modesty and curiosity.',
      'It is entirely possible both to quit and to love.',
    ],
  },
  {
    title: 'This Is Me Letting You Go',
    author: 'Heidi Priebe',
    subtitle: '',
    domain: 'relationships',
    highlights: [
      'If there\'s one thing we all need to stop doing, it\'s waiting around for someone else to show up and change our lives. Just be the person you\'ve been waiting for. Live your life as if you are the love of it.',
    ],
  },
];

export interface Quote {
  text: string;
  author: string;
  title: string;
}

export function getAllQuotes(excludeDomains?: Category[]): Quote[] {
  const quotes: Quote[] = [];
  for (const book of books) {
    if (excludeDomains && excludeDomains.includes(book.domain)) continue;
    for (const highlight of book.highlights) {
      quotes.push({ text: highlight, author: book.author, title: book.title });
    }
  }
  return quotes;
}

export function getRandomQuote(excludeDomains?: Category[]): Quote {
  const all = getAllQuotes(excludeDomains);
  return all[Math.floor(Math.random() * all.length)];
}
