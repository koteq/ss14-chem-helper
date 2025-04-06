export class Jugs {
  constructor({ jugs }) {
    this.jugs = jugs;
  }

  getReagents(id) {
    if (id === "Jug") {
      return [];
    }
    return this.jugs[id]?.components.find((c) => c.type === "SolutionContainerManager")?.solutions
      .beaker.reagents;
  }
}
