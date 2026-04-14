// Portugal-inspired accent palette
// Deep blue primary stays unchanged (#2563eb)

export const PT = {
  // Core accents
  green:     "#046A38",   // correct answers · success
  greenBg:   "#e6f4ed",   // light green bg
  greenBorder: "#7bbf9a",

  red:       "#DA291C",   // wrong answers · errors
  redBg:     "#fdecea",   // light red bg
  redBorder: "#f09090",

  gold:      "#FFCC29",   // streaks · rewards · highlights
  goldBg:    "#fffbe6",   // light gold bg
  goldBorder:"#f5d96b",
  goldText:  "#92650a",   // readable gold text on light bg

  // Keep primary blue for UI chrome
  blue:      "#2563eb",
  blueBg:    "#dbeafe",
} as const;
