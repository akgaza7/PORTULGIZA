export type GenderCue = {
  gender: "masculine" | "feminine";
  appliesTo: "noun" | "speaker" | "listener" | "agreement";
  word: string;
  counterpart?: string;
  explanation: string;
};

export type LessonPhrase = {
  portuguese: string;
  english: string;
  tip: string;
  genderCue?: GenderCue;
};

export type QuizQuestion = {
  prompt: string;
  options: string[];
  answer: string;
  audioByOption?: Record<string, {
    text: string;
    voiceGender?: GenderCue["gender"];
  }>;
};

export type CategoryLesson = {
  slug: string;
  level: "beginner";
  order: number;
  title: string;
  subtitle: string;
  description: string;
  accentHint: string;
  phrases: LessonPhrase[];
  quiz: QuizQuestion[];
};

type LessonSeed = Omit<CategoryLesson, "level" | "order">;

function createPhraseQuiz(phrases: LessonPhrase[]): QuizQuestion[] {
  const optionPhrases = (index: number) =>
    [0, 1, 2, 3].map((offset) => phrases[(index + offset) % phrases.length]);

  const portugueseQuestions = phrases.map((phrase, index) => {
    const choices = optionPhrases(index);
    return {
      prompt: `Which Portuguese phrase means “${phrase.english}”?`,
      options: choices.map((choice) => choice.portuguese),
      answer: phrase.portuguese,
      audioByOption: Object.fromEntries(
        choices.map((choice) => [
          choice.portuguese,
          { text: choice.portuguese, voiceGender: choice.genderCue?.gender }
        ])
      )
    };
  });

  const meaningQuestions = phrases.map((phrase, index) => {
    const choices = optionPhrases(index);
    return {
      prompt: `What does “${phrase.portuguese}” mean?`,
      options: choices.map((choice) => choice.english),
      answer: phrase.english,
      audioByOption: Object.fromEntries(
        choices.map((choice) => [
          choice.english,
          { text: choice.portuguese, voiceGender: choice.genderCue?.gender }
        ])
      )
    };
  });

  return [...portugueseQuestions, ...meaningQuestions].slice(0, 10);
}

function createBeginnerLesson(input: Omit<LessonSeed, "quiz">): LessonSeed {
  return { ...input, quiz: createPhraseQuiz(input.phrases) };
}

const beginnerLessonSeeds: LessonSeed[] = [
  {
    slug: "greetings",
    title: "Greetings",
    subtitle: "Polite everyday hellos",
    description: "Start with warm, simple phrases used in Portugal in shops, cafes, and daily chats.",
    accentHint: "European Portuguese often reduces unstressed vowels, so words sound tighter than Brazilian Portuguese.",
    phrases: [
      { portuguese: "Olá", english: "Hello", tip: "A neutral all-purpose hello." },
      { portuguese: "Bom dia", english: "Good morning", tip: "Used until lunchtime.", genderCue: { gender: "masculine", appliesTo: "noun", word: "dia", explanation: "Dia is a masculine noun, so the greeting uses bom." } },
      { portuguese: "Boa tarde", english: "Good afternoon", tip: "Common from lunch until evening.", genderCue: { gender: "feminine", appliesTo: "noun", word: "tarde", explanation: "Tarde is a feminine noun, so the greeting uses boa." } },
      { portuguese: "Boa noite", english: "Good evening / good night", tip: "Used for evening greetings and goodnight.", genderCue: { gender: "feminine", appliesTo: "noun", word: "noite", explanation: "Noite is a feminine noun, so the greeting uses boa." } },
      { portuguese: "Como está?", english: "How are you?", tip: "A polite form for someone you do not know well." },
      { portuguese: "Obrigado", english: "Thank you (male speaker)", tip: "Use obrigado when the person speaking is male.", genderCue: { gender: "masculine", appliesTo: "speaker", word: "Obrigado", counterpart: "Obrigada", explanation: "A male speaker says obrigado." } },
      { portuguese: "Obrigada", english: "Thank you (female speaker)", tip: "Use obrigada when the person speaking is female.", genderCue: { gender: "feminine", appliesTo: "speaker", word: "Obrigada", counterpart: "Obrigado", explanation: "A female speaker says obrigada." } },
      { portuguese: "Por favor", english: "Please", tip: "A polite phrase for requests." },
      { portuguese: "De nada", english: "You're welcome", tip: "A common reply after someone thanks you." },
      { portuguese: "Adeus", english: "Goodbye", tip: "A standard way to say goodbye." }
    ],
    quiz: [
      { prompt: "How do you say 'Good morning'?", options: ["Boa tarde", "Bom dia", "Boa noite", "Olá"], answer: "Bom dia" },
      { prompt: "Which phrase is a polite way to ask 'How are you?'", options: ["Como está?", "Até logo", "Obrigado", "Desculpe"], answer: "Como está?" },
      { prompt: "Which phrase works for evening or bedtime?", options: ["Boa noite", "Bom dia", "Muito bem", "Até amanhã"], answer: "Boa noite" }
    ],
  },
  {
    slug: "numbers",
    title: "Numbers",
    subtitle: "Counting with confidence",
    description: "Build your core number vocabulary for prices, dates, and phone numbers.",
    accentHint: "Notice the crisp final sounds in words like 'três' and 'seis'.",
    phrases: [
      { portuguese: "um", english: "one", tip: "Masculine form of one.", genderCue: { gender: "masculine", appliesTo: "agreement", word: "um", counterpart: "uma", explanation: "Use um with a masculine noun. The feminine form is uma." } },
      { portuguese: "dois", english: "two", tip: "Useful for quantities and time." },
      { portuguese: "três", english: "three", tip: "The accent marks the open vowel." },
      { portuguese: "quatro", english: "four", tip: "Often heard in addresses and room numbers." },
      { portuguese: "cinco", english: "five", tip: "Good to pair with prices." },
      { portuguese: "seis", english: "six", tip: "Listen for the final 'sh' sound in European Portuguese." },
      { portuguese: "sete", english: "seven", tip: "Useful for times, dates, and quantities." },
      { portuguese: "oito", english: "eight", tip: "The first sound is close to 'oy'." },
      { portuguese: "nove", english: "nine", tip: "Keep the final vowel light in European Portuguese." },
      { portuguese: "dez", english: "ten", tip: "A common number for prices and time." }
    ],
    quiz: [
      { prompt: "What is 'three' in Portuguese?", options: ["dois", "cinco", "três", "quatro"], answer: "três" },
      { prompt: "Which word means 'five'?", options: ["quatro", "cinco", "um", "seis"], answer: "cinco" },
      { prompt: "What is 'two' in Portuguese?", options: ["dois", "dez", "três", "nove"], answer: "dois" }
    ],
  },
  {
    slug: "food",
    title: "Food",
    subtitle: "Core food and drink words",
    description: "Learn ten everyday food and drink words before using them in a conversation.",
    accentHint: "Listen to each word, then match it to its English meaning.",
    phrases: [
      { portuguese: "água", english: "water", tip: "The stress falls early: AH-gwa.", genderCue: { gender: "feminine", appliesTo: "noun", word: "água", explanation: "Água is a feminine noun: a água." } },
      { portuguese: "pão", english: "bread", tip: "The tilde marks a nasal sound.", genderCue: { gender: "masculine", appliesTo: "noun", word: "pão", explanation: "Pão is a masculine noun: o pão." } },
      { portuguese: "queijo", english: "cheese", tip: "The 'quei' part sounds close to 'kay'.", genderCue: { gender: "masculine", appliesTo: "noun", word: "queijo", explanation: "Queijo is a masculine noun: o queijo." } },
      { portuguese: "sopa", english: "soup", tip: "A useful word when reading a menu.", genderCue: { gender: "feminine", appliesTo: "noun", word: "sopa", explanation: "Sopa is a feminine noun: a sopa." } },
      { portuguese: "leite", english: "milk", tip: "Useful when ordering coffee or breakfast.", genderCue: { gender: "masculine", appliesTo: "noun", word: "leite", explanation: "Leite is a masculine noun: o leite." } },
      { portuguese: "café", english: "coffee", tip: "A useful café word.", genderCue: { gender: "masculine", appliesTo: "noun", word: "café", explanation: "Café is a masculine noun: o café." } },
      { portuguese: "chá", english: "tea", tip: "A common hot drink.", genderCue: { gender: "masculine", appliesTo: "noun", word: "chá", explanation: "Chá is a masculine noun: o chá." } },
      { portuguese: "açúcar", english: "sugar", tip: "Useful when choosing how you take a drink.", genderCue: { gender: "masculine", appliesTo: "noun", word: "açúcar", explanation: "Açúcar is normally a masculine noun: o açúcar." } },
      { portuguese: "arroz", english: "rice", tip: "A common part of Portuguese meals.", genderCue: { gender: "masculine", appliesTo: "noun", word: "arroz", explanation: "Arroz is a masculine noun: o arroz." } },
      { portuguese: "peixe", english: "fish", tip: "A useful menu word in Portugal.", genderCue: { gender: "masculine", appliesTo: "noun", word: "peixe", explanation: "Peixe is a masculine noun: o peixe." } }
    ],
    quiz: [
      { prompt: "What does 'água' mean?", options: ["bread", "water", "juice", "milk"], answer: "water" },
      { prompt: "Which word means 'bread'?", options: ["queijo", "pão", "café", "sopa"], answer: "pão" },
      { prompt: "Which word means 'fish'?", options: ["arroz", "chá", "peixe", "leite"], answer: "peixe" }
    ],
  },
  {
    slug: "travel",
    title: "Travel",
    subtitle: "Getting around in Portugal",
    description: "Practise the phrases you need for stations, directions, and hotel check-ins.",
    accentHint: "European Portuguese often blends words together in fast speech, so short set phrases help a lot.",
    phrases: [
      { portuguese: "Onde fica a estação?", english: "Where is the station?", tip: "Useful for buses and trains.", genderCue: { gender: "feminine", appliesTo: "noun", word: "estação", explanation: "Estação is a feminine noun, so say a estação." } },
      { portuguese: "Bilhete", english: "ticket", tip: "A key travel word at stations.", genderCue: { gender: "masculine", appliesTo: "noun", word: "Bilhete", explanation: "Bilhete is a masculine noun: o bilhete." } },
      { portuguese: "À esquerda", english: "To the left", tip: "The grave accent shows the contraction of 'a + a'; it does not mark stress.", genderCue: { gender: "feminine", appliesTo: "noun", word: "esquerda", explanation: "Esquerda is feminine here; à combines a + a." } },
      { portuguese: "À direita", english: "To the right", tip: "Great for following directions.", genderCue: { gender: "feminine", appliesTo: "noun", word: "direita", explanation: "Direita is feminine here; à combines a + a." } },
      { portuguese: "Tenho uma reserva", english: "I have a reservation", tip: "Very handy at a hotel.", genderCue: { gender: "feminine", appliesTo: "noun", word: "reserva", explanation: "Reserva is a feminine noun, so use uma reserva." } },
      { portuguese: "Onde fica a paragem?", english: "Where is the stop?", tip: "Useful when looking for a bus or tram stop.", genderCue: { gender: "feminine", appliesTo: "noun", word: "paragem", explanation: "Paragem is a feminine noun, so say a paragem." } },
      { portuguese: "O metro", english: "The metro", tip: "Useful when asking about underground transport.", genderCue: { gender: "masculine", appliesTo: "noun", word: "metro", explanation: "Metro is a masculine noun: o metro." } },
      { portuguese: "Em frente", english: "Straight ahead", tip: "A common direction when walking." },
      { portuguese: "Quanto custa o bilhete?", english: "How much does the ticket cost?", tip: "Useful before buying a ticket.", genderCue: { gender: "masculine", appliesTo: "noun", word: "bilhete", explanation: "Bilhete is a masculine noun, so say o bilhete." } },
      { portuguese: "Preciso de um táxi", english: "I need a taxi", tip: "Useful at a station, airport, or hotel.", genderCue: { gender: "masculine", appliesTo: "noun", word: "táxi", explanation: "Táxi is a masculine noun, so say um táxi." } }
    ],
    quiz: [
      { prompt: "How do you say 'ticket'?", options: ["reserva", "estação", "bilhete", "viagem"], answer: "bilhete" },
      { prompt: "What does 'À direita' mean?", options: ["straight ahead", "to the left", "to the right", "next to"], answer: "to the right" },
      { prompt: "Which phrase means 'I have a reservation'?", options: ["Tenho uma reserva", "Onde fica a estação?", "Boa noite", "A conta, por favor"], answer: "Tenho uma reserva" }
    ],
  },
  createBeginnerLesson({
    slug: "introductions",
    title: "Introductions",
    subtitle: "Say who you are",
    description: "Introduce yourself and ask another person their name in a natural, friendly way.",
    accentHint: "In European Portuguese, 'chamo-me' is often spoken quickly as one smooth unit.",
    phrases: [
      { portuguese: "Chamo-me Ana", english: "My name is Ana", tip: "Replace Ana with your own name." },
      { portuguese: "Como se chama?", english: "What is your name?", tip: "A polite question for a new person." },
      { portuguese: "Sou de Inglaterra", english: "I am from England", tip: "Use 'sou de' with your country or city." },
      { portuguese: "Muito prazer", english: "Nice to meet you", tip: "A warm phrase after introductions." },
      { portuguese: "E você?", english: "And you?", tip: "Keeps the conversation moving." }
    ],
  }),
  createBeginnerLesson({
    slug: "polite-phrases",
    title: "Polite Phrases",
    subtitle: "Please, thanks, and sorry",
    description: "Use the small words that make everyday Portuguese sound warm and respectful.",
    accentHint: "Obrigado changes to obrigada when the speaker is female; both mean thank you.",
    phrases: [
      { portuguese: "Por favor", english: "Please", tip: "Useful in every request." },
      { portuguese: "Muito obrigado", english: "Thank you very much", tip: "Use obrigada if you are female.", genderCue: { gender: "masculine", appliesTo: "speaker", word: "obrigado", counterpart: "obrigada", explanation: "A male speaker says obrigado; a female speaker says obrigada." } },
      { portuguese: "Com licença", english: "Excuse me", tip: "Use this before passing or interrupting." },
      { portuguese: "Peço desculpa", english: "I am sorry", tip: "A polite apology." },
      { portuguese: "Não faz mal", english: "No problem", tip: "A reassuring reply to an apology." }
    ],
  }),
  createBeginnerLesson({
    slug: "time-dates",
    title: "Time and Dates",
    subtitle: "Plan the day",
    description: "Ask the time and understand simple times, days, and dates.",
    accentHint: "The question 'Que horas são?' is usually said as one connected phrase.",
    phrases: [
      { portuguese: "Que horas são?", english: "What time is it?", tip: "The standard way to ask the time." },
      { portuguese: "É uma hora", english: "It is one o'clock", tip: "Use singular with one o'clock." },
      { portuguese: "São duas horas", english: "It is two o'clock", tip: "Use plural from two onward." },
      { portuguese: "Hoje é segunda-feira", english: "Today is Monday", tip: "Weekdays are not normally capitalised." },
      { portuguese: "Amanhã de manhã", english: "Tomorrow morning", tip: "Useful when making a plan." }
    ],
  }),
  createBeginnerLesson({
    slug: "family",
    title: "Family",
    subtitle: "Talk about people close to you",
    description: "Name close family members and say who someone is.",
    accentHint: "Possessives such as 'meu' and 'minha' agree with the noun that follows.",
    phrases: [
      { portuguese: "Esta é a minha mãe", english: "This is my mother", tip: "Use esta for a woman or feminine noun." },
      { portuguese: "Este é o meu pai", english: "This is my father", tip: "Use este for a man or masculine noun." },
      { portuguese: "Tenho uma irmã", english: "I have a sister", tip: "Tenho means I have." },
      { portuguese: "Tenho um irmão", english: "I have a brother", tip: "Use um before a masculine noun." },
      { portuguese: "A minha família", english: "My family", tip: "A useful topic phrase." }
    ],
  }),
  createBeginnerLesson({
    slug: "home",
    title: "At Home",
    subtitle: "Rooms and everyday objects",
    description: "Describe simple places and objects around your home.",
    accentHint: "The nasal sound in 'onde' is subtle; listen for the soft ending.",
    phrases: [
      { portuguese: "Esta é a cozinha", english: "This is the kitchen", tip: "Cozinha means kitchen." },
      { portuguese: "O quarto é pequeno", english: "The bedroom is small", tip: "Adjectives often follow the noun." },
      { portuguese: "A casa de banho", english: "The bathroom", tip: "The usual term in Portugal." },
      { portuguese: "Onde está a chave?", english: "Where is the key?", tip: "Use onde está for a single object." },
      { portuguese: "A chave está na mesa", english: "The key is on the table", tip: "Na combines em plus a." }
    ],
  }),
  createBeginnerLesson({
    slug: "daily-routine",
    title: "Daily Routine",
    subtitle: "Describe a normal day",
    description: "Talk about getting up, eating, working, and going to bed.",
    accentHint: "Reflexive words such as 'me' are short and often blend into the verb.",
    phrases: [
      { portuguese: "Acordo às sete", english: "I wake up at seven", tip: "Use às with a plural hour." },
      { portuguese: "Tomo o pequeno-almoço", english: "I have breakfast", tip: "Portugal uses pequeno-almoço for breakfast." },
      { portuguese: "Vou para o trabalho", english: "I go to work", tip: "Vou para indicates movement toward a place." },
      { portuguese: "Janto às oito", english: "I have dinner at eight", tip: "Jantar is the evening meal." },
      { portuguese: "Deito-me cedo", english: "I go to bed early", tip: "The pronoun follows the verb here." }
    ],
  }),
  createBeginnerLesson({
    slug: "shopping",
    title: "Shopping",
    subtitle: "Find and buy what you need",
    description: "Ask about prices, sizes, colours, and payment in a shop.",
    accentHint: "The sound written 'lh' in 'vermelho' is similar to the middle sound in million.",
    phrases: [
      { portuguese: "Quanto custa isto?", english: "How much does this cost?", tip: "Point to an item while asking." },
      { portuguese: "Tem um tamanho maior?", english: "Do you have a larger size?", tip: "Useful when trying on clothes." },
      { portuguese: "Quero o azul", english: "I want the blue one", tip: "Colours can stand in for the item." },
      { portuguese: "Posso experimentar?", english: "May I try it on?", tip: "Ask this before using a fitting room." },
      { portuguese: "Pago com cartão", english: "I will pay by card", tip: "A useful phrase at the till." }
    ],
  }),
  createBeginnerLesson({
    slug: "directions",
    title: "Directions",
    subtitle: "Find your way",
    description: "Ask where places are and understand simple route instructions.",
    accentHint: "Listen for contractions such as 'ao' and 'à' in direction phrases.",
    phrases: [
      { portuguese: "Onde fica o centro?", english: "Where is the centre?", tip: "Swap centro for another destination." },
      { portuguese: "Siga em frente", english: "Go straight ahead", tip: "A common direction instruction." },
      { portuguese: "Vire à esquerda", english: "Turn left", tip: "Vire means turn." },
      { portuguese: "Vire à direita", english: "Turn right", tip: "The grave accent belongs in à." },
      { portuguese: "É perto daqui", english: "It is near here", tip: "A helpful answer about distance." }
    ],
  }),
  createBeginnerLesson({
    slug: "public-transport",
    title: "Public Transport",
    subtitle: "Buses, trains, and tickets",
    description: "Buy a ticket and ask about departures and destinations.",
    accentHint: "The final r in infinitives such as 'partir' is light in European Portuguese.",
    phrases: [
      { portuguese: "Um bilhete para Lisboa", english: "A ticket to Lisbon", tip: "Use para with your destination." },
      { portuguese: "A que horas parte?", english: "What time does it leave?", tip: "Use this for trains and buses." },
      { portuguese: "É este o comboio?", english: "Is this the train?", tip: "Comboio is the European Portuguese word for train." },
      { portuguese: "Onde é a paragem?", english: "Where is the stop?", tip: "Paragem is used for a bus or tram stop." },
      { portuguese: "Quero ida e volta", english: "I want a return ticket", tip: "Literally, going and return." }
    ],
  }),
  createBeginnerLesson({
    slug: "hotel",
    title: "At a Hotel",
    subtitle: "Check in and ask for help",
    description: "Use simple phrases at reception and understand basic hotel information.",
    accentHint: "In 'tenho', the 'nh' sound is similar to the middle of canyon.",
    phrases: [
      { portuguese: "Tenho uma reserva", english: "I have a reservation", tip: "The key phrase for checking in." },
      { portuguese: "O quarto está pronto?", english: "Is the room ready?", tip: "Pronto means ready." },
      { portuguese: "Qual é a palavra-passe?", english: "What is the password?", tip: "Useful for asking about Wi-Fi." },
      { portuguese: "Preciso de uma toalha", english: "I need a towel", tip: "Preciso de means I need." },
      { portuguese: "A que horas é o pequeno-almoço?", english: "What time is breakfast?", tip: "A practical reception question." }
    ],
  }),
  createBeginnerLesson({
    slug: "weather",
    title: "Weather",
    subtitle: "Talk about the day",
    description: "Describe common weather and ask what the forecast is like.",
    accentHint: "Portuguese often uses 'está' for today's changing weather conditions.",
    phrases: [
      { portuguese: "Está bom tempo", english: "The weather is good", tip: "A common positive comment." },
      { portuguese: "Está a chover", english: "It is raining", tip: "Está a plus infinitive describes an action happening now." },
      { portuguese: "Hoje está frio", english: "It is cold today", tip: "Frio means cold." },
      { portuguese: "Amanhã vai estar sol", english: "Tomorrow will be sunny", tip: "Vai estar describes a forecast." },
      { portuguese: "Leve um casaco", english: "Take a coat", tip: "A useful piece of advice." }
    ],
  }),
  createBeginnerLesson({
    slug: "hobbies",
    title: "Hobbies",
    subtitle: "Say what you enjoy",
    description: "Talk simply about music, reading, sport, and free time.",
    accentHint: "Gosto de joins together quickly in natural speech.",
    phrases: [
      { portuguese: "Gosto de música", english: "I like music", tip: "Use gosto de before a noun or activity." },
      { portuguese: "Gosto de ler", english: "I like reading", tip: "Use the infinitive after gosto de." },
      { portuguese: "Jogo futebol", english: "I play football", tip: "Jogo means I play." },
      { portuguese: "Vejo filmes", english: "I watch films", tip: "Vejo means I watch or I see." },
      { portuguese: "O que gosta de fazer?", english: "What do you like doing?", tip: "A friendly conversation question." }
    ],
  }),
  createBeginnerLesson({
    slug: "work-study",
    title: "Work and Study",
    subtitle: "Describe what you do",
    description: "Say where you work or study and ask someone about their occupation.",
    accentHint: "Profissão has a nasal ending; let the final sound resonate through the nose.",
    phrases: [
      { portuguese: "Trabalho num escritório", english: "I work in an office", tip: "Num combines em plus um." },
      { portuguese: "Estudo português", english: "I study Portuguese", tip: "Languages are usually lower-case in Portuguese." },
      { portuguese: "Qual é a sua profissão?", english: "What is your profession?", tip: "A polite question about work." },
      { portuguese: "Sou estudante", english: "I am a student", tip: "Sou introduces identity or occupation." },
      { portuguese: "Trabalho de manhã", english: "I work in the morning", tip: "De manhã means in the morning." }
    ],
  }),
  createBeginnerLesson({
    slug: "health-basics",
    title: "Health Basics",
    subtitle: "Ask for simple help",
    description: "Explain a basic problem and understand simple health questions.",
    accentHint: "Dói is one syllable and carries a clear open vowel sound.",
    phrases: [
      { portuguese: "Não me sinto bem", english: "I do not feel well", tip: "A general way to say you feel unwell." },
      { portuguese: "Dói-me a cabeça", english: "My head hurts", tip: "Literally, the head hurts me." },
      { portuguese: "Preciso de uma farmácia", english: "I need a pharmacy", tip: "Farmácia has stress on má." },
      { portuguese: "Tem alguma alergia?", english: "Do you have any allergy?", tip: "A common health question." },
      { portuguese: "Quero marcar uma consulta", english: "I want to book an appointment", tip: "Consulta means a medical appointment." }
    ],
  }),
  createBeginnerLesson({
    slug: "making-plans",
    title: "Making Plans",
    subtitle: "Arrange a simple meeting",
    description: "Invite someone, suggest a time, and agree where to meet.",
    accentHint: "Vamos can mean both we go and let's go, depending on context.",
    phrases: [
      { portuguese: "Quer tomar um café?", english: "Would you like to have a coffee?", tip: "A friendly invitation." },
      { portuguese: "Sim, com prazer", english: "Yes, with pleasure", tip: "A warm way to accept." },
      { portuguese: "A que horas?", english: "At what time?", tip: "A short follow-up question." },
      { portuguese: "Encontramo-nos às três", english: "We will meet at three", tip: "A useful arrangement phrase." },
      { portuguese: "Até logo", english: "See you later", tip: "Use this when you expect to meet again soon." }
    ],
  }),
  createBeginnerLesson({
    slug: "beginner-review",
    title: "Start Here Review",
    subtitle: "Bring everything together",
    description: "Use greetings, questions, directions, and everyday requests in one final Start Here lesson.",
    accentHint: "Focus on rhythm rather than perfect individual sounds; connected speech builds confidence.",
    phrases: [
      { portuguese: "Olá, chamo-me Maria", english: "Hello, my name is Maria", tip: "Combine a greeting and introduction." },
      { portuguese: "Queria um café, por favor", english: "I would like a coffee, please", tip: "A complete polite order." },
      { portuguese: "Onde fica a estação?", english: "Where is the station?", tip: "A key travel question." },
      { portuguese: "Encontramo-nos às três", english: "We will meet at three", tip: "A simple arrangement." },
      { portuguese: "Muito obrigado pela ajuda", english: "Thank you very much for the help", tip: "A warm way to finish an exchange." }
    ],
  })
];

const startLessonSlugs = ["greetings", "food", "numbers", "travel"] as const;

export const lessons: CategoryLesson[] = startLessonSlugs.map((slug, index) => {
  const lesson = beginnerLessonSeeds.find((candidate) => candidate.slug === slug);

  if (!lesson) {
    throw new Error(`Missing Start lesson: ${slug}`);
  }

  return {
    ...lesson,
    quiz: createPhraseQuiz(lesson.phrases),
    level: "beginner",
    order: index + 1
  };
});

export function getLessonBySlug(slug: string) {
  return lessons.find((lesson) => lesson.slug === slug);
}
