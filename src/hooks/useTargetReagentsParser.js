import { useMemo } from "react";

export function useTargetReagentsParser(value, reagents) {
  return useMemo(() => {
    const result = {};
    if (!reagents) return result;
    value
      .trim()
      .split("\n")
      .forEach((line) => {
        if (line.startsWith("//") || line.startsWith("#") || line.trim() === "") return;
        const match = line.match(/^(.+?)\s+(\d+)/);
        if (!match) return;
        const [, reagentName, quantity] = match;
        if (reagentName && quantity) {
          const reagent = reagents.getByLocalizedName(reagentName);
          if (!reagent) {
            console.warn(`Unknown reagent: ${reagentName}`);
            return;
          }
          result[reagent.id] = parseInt(quantity);
        }
      });
    return result;
  }, [value, reagents]);
}
