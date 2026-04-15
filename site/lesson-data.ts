export type LessonPhrase = {
  portuguese: string;
  english: string;
  tip: string;
};

export type QuizQuestion = {
  prompt: string;
  options: string[];
  answer: string;
};

export type ConversationTurn = {
  speaker: "guide" | "learner";
  portuguese: string;
  english: string;
};

export type CategoryLesson = {
  slug: "greetings" | "numbers" | "food" | "travel";
  title: string;
  subtitle: string;
  description: string;
  accentHint: string;
  phrases: LessonPhrase[];
  quiz: QuizQuestion[];
  conversation: ConversationTurn[];
};

export const lessons: CategoryLesson[] = [
  {
    slug: "greetings",
    title: "Greetings",
    subtitle: "Polite everyday hellos",
    description: "Start with warm, simple phrases used in Portugal in shops, cafes, and daily chats.",
    accentHint: "European Portuguese often reduces unstressed vowels, so words sound tighter than Brazilian Portuguese.",
    phrases: [
      { portuguese: "Olá", english: "Hello", tip: "A neutral all-purpose hello." },
      { portuguese: "Bom dia", english: "Good morning", tip: "Used until lunchtime." },
      { portuguese: "Boa tarde", english: "Good afternoon", tip: "Common from lunch until evening." },
      { portuguese: "Boa noite", english: "Good evening / good night", tip: "Used for evening greetings and goodnight." },
      { portuguese: "Como está?", english: "How are you?", tip: "A polite form for someone you do not know well." }
    ],
    quiz: [
      { prompt: "How do you say 'Good morning'?", options: ["Boa tarde", "Bom dia", "Boa noite", "Olá"], answer: "Bom dia" },
      { prompt: "Which phrase is a polite way to ask 'How are you?'", options: ["Como está?", "Até logo", "Obrigado", "Desculpe"], answer: "Como está?" },
      { prompt: "Which phrase works for evening or bedtime?", options: ["Boa noite", "Bom dia", "Muito bem", "Até amanhã"], answer: "Boa noite" }
    ],
    conversation: [
      { speaker: "guide", portuguese: "Olá! Bom dia.", english: "Hello! Good morning." },
      { speaker: "learner", portuguese: "Bom dia! Como está?", english: "Good morning! How are you?" },
      { speaker: "guide", portuguese: "Estou bem, obrigado.", english: "I am well, thank you." }
    ]
  },
  {
    slug: "numbers",
    title: "Numbers",
    subtitle: "Counting with confidence",
    description: "Build your core number vocabulary for prices, dates, and phone numbers.",
    accentHint: "Notice the crisp final sounds in words like 'três' and 'seis'.",
    phrases: [
      { portuguese: "um", english: "one", tip: "Masculine form of one." },
      { portuguese: "dois", english: "two", tip: "Useful for quantities and time." },
      { portuguese: "três", english: "three", tip: "The accent marks the open vowel." },
      { portuguese: "quatro", english: "four", tip: "Often heard in addresses and room numbers." },
      { portuguese: "cinco", english: "five", tip: "Good to pair with prices." }
    ],
    quiz: [
      { prompt: "What is 'three' in Portuguese?", options: ["dois", "cinco", "três", "quatro"], answer: "três" },
      { prompt: "Which word means 'five'?", options: ["quatro", "cinco", "um", "seis"], answer: "cinco" },
      { prompt: "What is 'two' in Portuguese?", options: ["dois", "dez", "três", "nove"], answer: "dois" }
    ],
    conversation: [
      { speaker: "guide", portuguese: "Quantos cafés?", english: "How many coffees?" },
      { speaker: "learner", portuguese: "Dois cafés, por favor.", english: "Two coffees, please." },
      { speaker: "guide", portuguese: "São quatro euros.", english: "That is four euros." }
    ]
  },
  {
    slug: "food",
    title: "Food",
    subtitle: "Ordering simple meals",
    description: "Learn beginner vocabulary for cafes, markets, and casual restaurant moments.",
    accentHint: "Listen for softer consonants in phrases like 'por favor'.",
    phrases: [
      { portuguese: "Quero um café", english: "I would like a coffee", tip: "A direct, useful ordering phrase." },
      { portuguese: "água", english: "water", tip: "The stress falls early: AH-gwa." },
      { portuguese: "pão", english: "bread", tip: "The tilde marks a nasal sound." },
      { portuguese: "Queijo", english: "cheese", tip: "The 'quei' part sounds close to 'kay'." },
      { portuguese: "A conta, por favor", english: "The bill, please", tip: "Perfect for the end of a meal." }
    ],
    quiz: [
      { prompt: "How do you ask for the bill?", options: ["Um café, por favor", "A conta, por favor", "Onde fica?", "Bom apetite"], answer: "A conta, por favor" },
      { prompt: "What does 'água' mean?", options: ["bread", "water", "juice", "milk"], answer: "water" },
      { prompt: "Which word means 'bread'?", options: ["queijo", "pão", "café", "sopa"], answer: "pão" }
    ],
    conversation: [
      { speaker: "guide", portuguese: "Bom dia. O que deseja?", english: "Good morning. What would you like?" },
      { speaker: "learner", portuguese: "Quero um café e água, por favor.", english: "I would like a coffee and water, please." },
      { speaker: "guide", portuguese: "Claro. Mais alguma coisa?", english: "Of course. Anything else?" }
    ]
  },
  {
    slug: "travel",
    title: "Travel",
    subtitle: "Getting around in Portugal",
    description: "Practice the phrases you need for stations, directions, and hotel check-ins.",
    accentHint: "European Portuguese often blends words together in fast speech, so short set phrases help a lot.",
    phrases: [
      { portuguese: "Onde fica a estação?", english: "Where is the station?", tip: "Useful for buses and trains." },
      { portuguese: "Bilhete", english: "ticket", tip: "A key travel word at stations." },
      { portuguese: "À esquerda", english: "To the left", tip: "The accent marks stress on the first sound." },
      { portuguese: "À direita", english: "To the right", tip: "Great for following directions." },
      { portuguese: "Tenho uma reserva", english: "I have a reservation", tip: "Very handy at a hotel." }
    ],
    quiz: [
      { prompt: "How do you say 'ticket'?", options: ["reserva", "estação", "bilhete", "viagem"], answer: "bilhete" },
      { prompt: "What does 'À direita' mean?", options: ["straight ahead", "to the left", "to the right", "next to"], answer: "to the right" },
      { prompt: "Which phrase means 'I have a reservation'?", options: ["Tenho uma reserva", "Onde fica a estação?", "Boa noite", "A conta, por favor"], answer: "Tenho uma reserva" }
    ],
    conversation: [
      { speaker: "guide", portuguese: "Boa tarde. Posso ajudar?", english: "Good afternoon. Can I help?" },
      { speaker: "learner", portuguese: "Sim, onde fica a estação?", english: "Yes, where is the station?" },
      { speaker: "guide", portuguese: "É à direita e depois em frente.", english: "It is to the right and then straight ahead." }
    ]
  }
];

export function getLessonBySlug(slug: string) {
  return lessons.find((lesson) => lesson.slug === slug);
}
