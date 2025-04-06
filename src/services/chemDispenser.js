export class ChemDispenser {
  constructor({ chemDispenserInventory, jugs }) {
    this.reagents = new Map();
    for (const jugId of chemDispenserInventory) {
      const jugReagents = jugs.getReagents(jugId);
      for (const reagent of jugReagents) {
        const quantity = this.reagents.get(reagent.ReagentId) ?? 0;
        this.reagents.set(reagent.ReagentId, quantity + reagent.Quantity);
      }
    }
  }
}
