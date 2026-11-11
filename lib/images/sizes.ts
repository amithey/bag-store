// The `sizes` hint tells the browser how wide a photo is actually drawn, which
// decides which resized file it downloads. These strings live in one place
// because the background image warm-up must ask for exactly the same files the
// cards do; if the two drifted apart it would download images nobody uses.

// A card in the collection grid.
export const GRID_CARD_SIZES = "(min-width: 1024px) 31vw, (min-width: 768px) 46vw, 100vw";

// A card in the scrolling gallery strip (fixed 230px on phones, 280px above).
export const STRIP_CARD_SIZES = "(min-width: 768px) 280px, 230px";
