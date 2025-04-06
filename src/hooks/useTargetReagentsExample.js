import { useMemo } from "react";

const exampleTarget = `// basic
Bicaridine 150
Dermaline 200
Dylovene 200

// airloss/blodloss
DexalinPlus 360
Saline 200

// advanced brute
Bruizine 300
Lacerinol 300
Puncturase 300

// advanced physical
Leporazine 280
Pyrazine 300
Insuzine 300

// advanced poison
Diphenhydramine 240
Arithrazine 240

// caustic (rare)
Sigynate 320

// cellular (rare)
Phalanximine 240

// allign numbers
Hydroxide 10
TableSalt 20`;
// TODO: Figure out how to allign the numbers automatically.

export function useTargetReagentsExample(reagents, locale) {
  return useMemo(
    () =>
      reagents &&
      exampleTarget
        .split("\n")
        .map((line) => {
          if (line.startsWith("//")) return line;
          const [reagentId, quantity] = line.split(" ");
          const name = reagents.getLocalizedNameById(reagentId, locale);
          if (!name) return line;
          return `${name} ${quantity}`;
        })
        .join("\n"),
    [reagents, locale],
  );
}
