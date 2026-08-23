"use client";

import { useEffect, useState } from "react";

type ScenarioAnswer = {
  prompt: string;
  correctAnswer: string;
  learnerAnswer: string;
  correct: boolean;
};

type TouristScenarioGameProps = {
  onAnswer: (answer: ScenarioAnswer) => void;
  canAccessSmooth: boolean;
  canAccessSturdy: boolean;
};

type Level = "Beginner" | "Intermediate" | "Advanced";

type CurriculumSentence = {
  portuguese: string;
  meaning: string;
};

type ScenarioSeed = {
  title: string;
  situation: string;
  answer: number;
  options: [number, number, number];
};

export const sentenceBanks: Record<Level, CurriculumSentence[]> = {
  Beginner: [
    { portuguese: "Olá, bom dia.", meaning: "Hello, good morning." },
    { portuguese: "Boa tarde / Boa noite.", meaning: "Good afternoon / Good evening or good night." },
    { portuguese: "Como está?", meaning: "How are you?" },
    { portuguese: "Tudo bem, obrigado/a.", meaning: "Everything is good, thank you." },
    { portuguese: "Por favor / Se faz favor.", meaning: "Please." },
    { portuguese: "De nada.", meaning: "You are welcome." },
    { portuguese: "Chamo-me [nome].", meaning: "My name is [name]." },
    { portuguese: "Prazer em conhecê-lo/a.", meaning: "Nice to meet you." },
    { portuguese: "Desculpe.", meaning: "Excuse me / Sorry." },
    { portuguese: "Fala inglês?", meaning: "Do you speak English?" },
    { portuguese: "Não percebo.", meaning: "I do not understand." },
    { portuguese: "Pode repetir, por favor?", meaning: "Can you repeat that, please?" },
    { portuguese: "Como se diz isto em português?", meaning: "How do you say this in Portuguese?" },
    { portuguese: "Onde fica o metro / a casa de banho?", meaning: "Where is the metro / bathroom?" },
    { portuguese: "Quanto custa isto?", meaning: "How much does this cost?" },
    { portuguese: "A conta, por favor.", meaning: "The bill, please." },
    { portuguese: "Queria um café, por favor.", meaning: "I would like a coffee, please." },
    { portuguese: "Onde posso comprar bilhetes?", meaning: "Where can I buy tickets?" },
    { portuguese: "Está aberto / fechado?", meaning: "Is it open / closed?" },
    { portuguese: "Adeus, até amanhã.", meaning: "Goodbye, see you tomorrow." }
  ],
  Intermediate: [
    { portuguese: "Já moro em Portugal há seis meses.", meaning: "I have been living in Portugal for six months." },
    { portuguese: "Estou a tentar aprender português, mas ainda é difícil.", meaning: "I am trying to learn Portuguese, but it is still difficult." },
    { portuguese: "O que é que me recomenda fazer por aqui?", meaning: "What do you recommend I do around here?" },
    { portuguese: "Combinado, encontramo-nos às oito horas.", meaning: "It is a deal; we will meet at eight o'clock." },
    { portuguese: "Fiquei muito contente por o/a ver hoje.", meaning: "I was very happy to see you today." },
    { portuguese: "Sabe se há alguma farmácia ou supermercado por perto?", meaning: "Do you know if there is a pharmacy or supermarket nearby?" },
    { portuguese: "Queria marcar uma consulta / uma mesa para amanhã.", meaning: "I would like to book an appointment / a table for tomorrow." },
    { portuguese: "Aceitam pagamento com cartão ou tem de ser em dinheiro?", meaning: "Do you accept card payments or does it have to be cash?" },
    { portuguese: "Pode dizer-me onde fica a paragem de autocarro mais próxima?", meaning: "Can you tell me where the nearest bus stop is?" },
    { portuguese: "Disseram-me que este restaurante era muito bom.", meaning: "They told me this restaurant was very good." },
    { portuguese: "Desculpe o atraso, houve muito trânsito no caminho.", meaning: "Sorry for the delay; there was a lot of traffic on the way." },
    { portuguese: "O meu telemóvel ficou sem bateria, pode ajudar-me?", meaning: "My phone ran out of battery; can you help me?" },
    { portuguese: "Acho que me perdi, pode mostrar-me o caminho no mapa?", meaning: "I think I am lost; can you show me the way on the map?" },
    { portuguese: "Há algum problema com o meu pedido, falta aqui um prato.", meaning: "There is a problem with my order; a dish is missing." },
    { portuguese: "Acho que vai chover mais tarde, é melhor levar o guarda-chuva.", meaning: "I think it will rain later; it is better to take an umbrella." },
    { portuguese: "No próximo fim de semana gostava de ir passear a Sintra.", meaning: "Next weekend I would like to take a trip to Sintra." },
    { portuguese: "Diverti-me imenso e a comida estava deliciosa.", meaning: "I had a great time and the food was delicious." },
    { portuguese: "Se eu tiver tempo amanhã, passo por tua casa.", meaning: "If I have time tomorrow, I will stop by your house." },
    { portuguese: "Não sei se concordo com isso, mas compreendo o teu ponto.", meaning: "I do not know if I agree, but I understand your point." },
    { portuguese: "Tenho de ir embora agora, senão vou perder o comboio.", meaning: "I have to leave now, otherwise I will miss the train." }
  ],
  Advanced: [
    { portuguese: "Gostaria que revíssemos os termos do contrato antes de avançarmos.", meaning: "I would like us to review the contract terms before moving forward." },
    { portuguese: "Caso surja algum imprevisto, entrarei em contacto imediatamente.", meaning: "If an unexpected issue arises, I will contact you immediately." },
    { portuguese: "Ficou acordado que a entrega seria feita até ao final da semana.", meaning: "It was agreed that delivery would be made by the end of the week." },
    { portuguese: "Precisamos de otimizar este processo para evitar desperdício de tempo.", meaning: "We need to optimise this process to avoid wasting time." },
    { portuguese: "Agradeço desde já a sua disponibilidade para reunir comigo.", meaning: "Thank you in advance for your availability to meet with me." },
    { portuguese: "Se eu soubesse que ia demorar tanto, teria saído mais cedo.", meaning: "If I had known it would take so long, I would have left earlier." },
    { portuguese: "Desde que faças a tua parte, não haverá qualquer problema.", meaning: "As long as you do your part, there will not be any problem." },
    { portuguese: "Por mais que tente, ainda me custa habituar ao sotaque daqui.", meaning: "No matter how hard I try, I still find the local accent difficult." },
    { portuguese: "Oxalá a situação se resolva o mais rapidamente possível.", meaning: "Hopefully the situation will be resolved as quickly as possible." },
    { portuguese: "A menos que surjam objeções, daremos o projeto por concluído.", meaning: "Unless objections arise, we will consider the project complete." },
    { portuguese: "Temos de encarar os factos, as coisas não correram como planeado.", meaning: "We have to face the facts; things did not go as planned." },
    { portuguese: "Vale mais prevenir do que remediar, por isso convém ter cuidado.", meaning: "It is better to be safe than sorry, so it is best to be careful." },
    { portuguese: "Isso não faz o menor sentido, estás a ver as coisas ao contrário.", meaning: "That makes no sense; you are looking at things backwards." },
    { portuguese: "No que toca a este assunto, prefiro manter-me neutro.", meaning: "On this matter, I prefer to remain neutral." },
    { portuguese: "Não vale a pena chorar sobre o leite derramado, temos de avançar.", meaning: "There is no use crying over spilled milk; we must move forward." },
    { portuguese: "Estás a dar graxa ao chefe para ver se consegues uma promoção?", meaning: "Are you flattering the boss to try to get a promotion?" },
    { portuguese: "Ficámos a ver navios, porque o fornecedor falhou o prazo.", meaning: "We were left empty-handed because the supplier missed the deadline." },
    { portuguese: "Não fiques a engolir sapos, diz claramente o que pensas.", meaning: "Do not bite your tongue; say clearly what you think." },
    { portuguese: "Aquela conversa foi só para inglês ver, nada vai mudar realmente.", meaning: "That conversation was just for show; nothing will really change." },
    { portuguese: "Calma, não ponhas a carroça à frente dos bois.", meaning: "Calm down; do not put the cart before the horse." }
  ]
};

const scenarioSets: Record<Level, ScenarioSeed[]> = {
  Beginner: [
    { title: "Morning at the hotel", situation: "You greet the hotel receptionist, what would you say?", answer: 0, options: [0, 1, 19] },
    { title: "Checking on someone", situation: "You politely ask a new person how they are.", answer: 2, options: [2, 7, 5] },
    { title: "Introducing yourself", situation: "You meet another traveller and want to tell them your name.", answer: 6, options: [9, 6, 2] },
    { title: "Asking for English", situation: "You need help and want to know whether the station employee speaks English.", answer: 9, options: [10, 12, 9] },
    { title: "Please repeat", situation: "The ticket seller spoke too quickly. Ask them to say it again.", answer: 11, options: [11, 10, 8] },
    { title: "Finding the bathroom", situation: "You are in a museum and need to ask where the bathroom is.", answer: 13, options: [17, 13, 18] },
    { title: "Shopping for a souvenir", situation: "You pick up a souvenir and want to ask its price.", answer: 14, options: [14, 15, 17] },
    { title: "Ordering at a café", situation: "You are at a café and would like to order one coffee politely.", answer: 16, options: [4, 16, 15] },
    { title: "Buying train tickets", situation: "At the station, ask where you can buy tickets.", answer: 17, options: [13, 17, 14] },
    { title: "Finishing a meal", situation: "You have finished dinner and want to ask the waiter for the bill.", answer: 15, options: [16, 5, 15] }
  ],
  Intermediate: [
    { title: "Talking about Portugal", situation: "Someone asks how long you have lived in Portugal. Say it has been six months.", answer: 0, options: [0, 15, 3] },
    { title: "Explaining your learning", situation: "Tell a local person that you are learning Portuguese but still find it difficult.", answer: 1, options: [7, 1, 18] },
    { title: "Tourist recommendation", situation: "Ask a local person what they recommend doing nearby.", answer: 2, options: [9, 2, 15] },
    { title: "Meeting at eight", situation: "Agree to meet your new friends at eight o'clock.", answer: 3, options: [17, 3, 19] },
    { title: "Finding a pharmacy", situation: "You need medicine and ask whether a pharmacy or supermarket is nearby.", answer: 5, options: [8, 12, 5] },
    { title: "Booking a table", situation: "Telephone a restaurant and ask to reserve a table for tomorrow.", answer: 6, options: [6, 9, 13] },
    { title: "Paying in a shop", situation: "Before buying something, ask whether you can pay by card or need cash.", answer: 7, options: [7, 5, 10] },
    { title: "Looking for the bus stop", situation: "Ask someone where the nearest bus stop is.", answer: 8, options: [12, 8, 2] },
    { title: "Lost in the city", situation: "You think you are lost and ask someone to show you the route on a map.", answer: 12, options: [11, 8, 12] },
    { title: "Rain later", situation: "The forecast looks wet. Say it may rain later and an umbrella is a good idea.", answer: 14, options: [14, 15, 19] }
  ],
  Advanced: [
    { title: "Unexpected travel problem", situation: "Your host asks what you will do if an unexpected travel problem occurs.", answer: 1, options: [8, 1, 11] },
    { title: "A very long queue", situation: "After waiting for hours at passport control, say you would have left earlier if you had known.", answer: 5, options: [5, 10, 14] },
    { title: "Understanding the accent", situation: "Explain that, despite trying hard, you still find the local accent difficult.", answer: 7, options: [12, 7, 13] },
    { title: "Delayed luggage", situation: "Your suitcase has not arrived. Express hope that the problem is resolved quickly.", answer: 8, options: [1, 8, 10] },
    { title: "Cancelled plans", situation: "Bad weather ruined the day's plans. Acknowledge that things did not go as expected.", answer: 10, options: [10, 14, 19] },
    { title: "Keeping valuables safe", situation: "A friend asks why you keep copies of your documents. Explain that caution is best.", answer: 11, options: [6, 11, 8] },
    { title: "Wrong directions", situation: "Someone's directions point the opposite way from the map. Say that it makes no sense.", answer: 12, options: [12, 13, 7] },
    { title: "Avoiding an argument", situation: "Two travellers disagree about their plans. Say you prefer to remain neutral.", answer: 13, options: [17, 13, 12] },
    { title: "Moving on after a mistake", situation: "You missed a train, but dwelling on it will not help. Say that you must move forward.", answer: 14, options: [14, 5, 10] },
    { title: "Planning the itinerary", situation: "Your friend wants to book everything before checking the dates. Tell them not to rush ahead.", answer: 19, options: [19, 11, 8] }
  ]
};

const levelStyles: Record<Level, string> = {
  Beginner: "bg-portugalGreen text-white",
  Intermediate: "bg-portugalBlue text-white",
  Advanced: "bg-portugalGold text-black"
};

const learnedCounts: Record<Level, number> = { Beginner: 20, Intermediate: 40, Advanced: 60 };
const levelLabels: Record<Level, string> = {
  Beginner: "Start Here",
  Intermediate: "Smooth",
  Advanced: "Sturdy"
};

export function TranslateCrisisGame({ onAnswer, canAccessSmooth, canAccessSturdy }: TouristScenarioGameProps) {
  const [level, setLevel] = useState<Level>("Beginner");
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const scenario = scenarioSets[level][scenarioIndex];
  const curriculum = sentenceBanks[level];
  const answer = curriculum[scenario.answer];
  const isCorrect = selected === scenario.answer;

  useEffect(() => {
    const requestedLevel = new URLSearchParams(window.location.search).get("level");
    if (requestedLevel !== "Beginner" && requestedLevel !== "Intermediate" && requestedLevel !== "Advanced") return;
    if (requestedLevel === "Intermediate" && !canAccessSmooth) return;
    if (requestedLevel === "Advanced" && !canAccessSturdy) return;

    setLevel(requestedLevel);
    setScenarioIndex(0);
    setSelected(null);
    setCorrectCount(0);
  }, [canAccessSmooth, canAccessSturdy]);

  const chooseLevel = (nextLevel: Level) => {
    if (nextLevel === "Intermediate" && !canAccessSmooth) return;
    if (nextLevel === "Advanced" && !canAccessSturdy) return;
    setLevel(nextLevel);
    setScenarioIndex(0);
    setSelected(null);
    setCorrectCount(0);
  };

  const chooseAnswer = (sentenceIndex: number) => {
    if (selected !== null) return;
    const correct = sentenceIndex === scenario.answer;
    setSelected(sentenceIndex);
    if (correct) setCorrectCount((current) => current + 1);
    onAnswer({
      prompt: `${levelLabels[level]} tourist scenario — ${scenario.title}: ${scenario.situation}`,
      correctAnswer: answer.portuguese,
      learnerAnswer: curriculum[sentenceIndex].portuguese,
      correct
    });
  };

  const nextScenario = () => {
    if (scenarioIndex === scenarioSets[level].length - 1) {
      setScenarioIndex(0);
      setCorrectCount(0);
    } else {
      setScenarioIndex((current) => current + 1);
    }
    setSelected(null);
  };

  return (
    <section id="translate-crisis-game" className="card-surface scroll-mt-6 overflow-hidden" aria-labelledby="tourist-scenario-heading">
      <div className="bg-ink p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-portugalGold">Tourist sentence challenge</p>
            <h3 id="tourist-scenario-heading" className="mt-2 font-display text-3xl font-bold sm:text-4xl">Choose the Right Sentence</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              Ten real travel situations at each level. Every answer comes from sentences already taught in the curriculum.
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${levelStyles[level]}`}>{levelLabels[level]}</span>
            <p className="mt-2 text-sm text-white/60">{scenarioIndex + 1}/10 · {correctCount} correct</p>
          </div>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-3" aria-label="Choose a learning level">
          {(Object.keys(scenarioSets) as Level[]).map((levelOption) => {
            const locked = (levelOption === "Intermediate" && !canAccessSmooth)
              || (levelOption === "Advanced" && !canAccessSturdy);
            const isSturdy = levelOption === "Advanced";

            return (
              <button
                key={levelOption}
                type="button"
                onClick={() => chooseLevel(levelOption)}
                disabled={locked}
                aria-pressed={level === levelOption}
                aria-label={`${levelLabels[levelOption]}${locked ? " locked — pass START and subscribe to unlock" : ""}`}
                className={`rounded-2xl border px-4 py-3 text-left uppercase text-ink transition ${isSturdy ? "border-portugalGold bg-portugalGold text-black" : "border-[#d8c6ae] bg-[#f3e4cf]"} ${locked
                  ? "cursor-not-allowed opacity-55"
                  : level === levelOption
                    ? isSturdy ? "ring-2 ring-white/80" : "border-[#d6aa67] ring-2 ring-[#e2bd82]"
                    : isSturdy ? "hover:brightness-95" : "hover:bg-[#ead8bf]"}`}
              >
                <span className="flex items-center justify-between gap-2 text-sm font-bold">
                  {levelLabels[levelOption]}
                  {locked ? <span aria-hidden="true">🔒</span> : null}
                </span>
                <span className="mt-1 block text-xs text-ink/65">
                  {locked ? "Pass START and subscribe to unlock" : `${learnedCounts[levelOption]} sentences learned`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <h4 className="font-display text-2xl font-bold">Scenario</h4>
        <p className="mt-2 max-w-3xl leading-7 text-ink/65">{scenario.situation}</p>

        <div className="mt-4 grid gap-3">
          {scenario.options.map((sentenceIndex, index) => {
            const option = curriculum[sentenceIndex];
            const chosen = selected === sentenceIndex;
            const correctOption = selected !== null && sentenceIndex === scenario.answer;

            return (
              <button
                key={`${level}-${scenarioIndex}-${sentenceIndex}`}
                type="button"
                disabled={selected !== null}
                onClick={() => chooseAnswer(sentenceIndex)}
                className={`flex gap-4 rounded-2xl border p-4 text-left transition ${
                  correctOption
                    ? "border-portugalGreen bg-portugalGreen/10 text-portugalGreen"
                    : chosen
                      ? "border-portugalRed bg-portugalRed/5 text-portugalRed"
                      : "border-ink/10 bg-white text-ink hover:border-portugalBlue/35"
                }`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/5 text-sm font-bold">{index + 1}</span>
                <span lang="pt-PT" className="pt-1 font-semibold leading-6">{option.portuguese}</span>
              </button>
            );
          })}
        </div>

        {selected !== null ? (
          <div className={`mt-5 rounded-2xl p-4 ${isCorrect ? "bg-portugalGreen/10" : "bg-portugalRed/5"}`} role="status">
            <p className={`font-bold ${isCorrect ? "text-portugalGreen" : "text-portugalRed"}`}>
              {isCorrect ? "Correct — that is the sentence for this situation." : "Not this time — add this sentence to your practice list."}
            </p>
            <p lang="pt-PT" className="mt-2 font-display text-lg font-bold text-ink">{answer.portuguese}</p>
            <p className="mt-1 text-sm leading-6 text-ink/60">{answer.meaning}</p>
          </div>
        ) : null}

        <button
          type="button"
          disabled={selected === null}
          onClick={nextScenario}
          className="mt-5 rounded-full bg-portugalBlue px-5 py-3 text-sm font-bold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-ink/10 disabled:text-ink/40"
        >
          {scenarioIndex === 9 ? "Play this level again" : "Next tourist situation"}
        </button>
      </div>
    </section>
  );
}
