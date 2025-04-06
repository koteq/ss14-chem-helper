import { deburr } from "../utils/deburr";

export class Reagents {
  constructor({ reagents }) {
    this.reagents = reagents;
    this.reagentIdByLocalizedName = Object.values(reagents).reduce((acc, reagent) => {
      Object.entries(reagent.localization).forEach(([locale, { name }]) => {
        if (!name) {
          //console.debug(`Missing reagent name for ${reagent.id} in ${locale}`);
          return;
        }
        const deburredName = deburr(name).toLowerCase();
        if (acc.has(deburredName) && acc.get(deburredName).id !== reagent.id) {
          // TODO: Prefer to use reagent with more reactions instead of just the first one
          console.warn(
            `Duplicate reagent name "${name}" found for ${reagent.id} and ${acc.get(deburredName).id} in ${locale}`,
          );
          return;
        }
        acc.set(deburredName, { id: reagent.id, locale });
      });
      return acc;
    }, new Map());
  }

  getById(id) {
    return this.reagents[id] ?? null;
  }

  getByLocalizedName(name) {
    return this.reagents[this.getReagentIdByLocalizedName(name)] ?? null;
  }

  getReagentIdByLocalizedName(name) {
    const deburredName = deburr(name).toLowerCase();
    return this.reagentIdByLocalizedName.get(deburredName)?.id;
  }

  getLocalizedNameById(id, locale) {
    return this.reagents[id]?.localization[locale]?.name;
  }
}
