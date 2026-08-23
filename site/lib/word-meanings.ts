const wordGlossary: Record<string, string> = {
  a: "the (feminine)",
  agua: "water",
  ana: "Ana (name)",
  bilhete: "ticket",
  boa: "good (feminine)",
  bom: "good (masculine)",
  cafe: "coffee",
  "chamo-me": "my name is",
  como: "how",
  conta: "bill",
  de: "from / of",
  dia: "day / morning",
  direita: "right",
  dois: "two",
  e: "and",
  esquerda: "left",
  estacao: "station",
  esta: "are (formal)",
  fica: "is located",
  inglaterra: "England",
  noite: "night",
  ola: "hello",
  onde: "where",
  pao: "bread",
  por: "for",
  prazer: "pleasure",
  queijo: "cheese",
  quero: "I want / I would like",
  se: "yourself (formal form)",
  sou: "I am",
  tarde: "afternoon",
  tres: "three",
  um: "a / one (masculine)",
  voce: "you (formal)",
  favor: "favour / please"
};

function normaliseWord(word: string) {
  return word
    .toLocaleLowerCase("pt-PT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^[^a-zà-ÿ]+|[^a-zà-ÿ-]+$/gi, "");
}

export function splitWordMeanings(portuguese: string, english: string) {
  const words = portuguese.trim().split(/\s+/);
  return words.map((word) => ({
    portuguese: word,
    english: wordGlossary[normaliseWord(word)] ?? (words.length === 1 ? english : `Part of: ${english}`)
  }));
}
