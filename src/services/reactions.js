export class Reactions {
  constructor({ reactions }) {
    this.reactions = reactions;
    this.singleReagentReactions = Object.values(reactions)
      .filter((reaction) => Object.keys(reaction.reactants).length === 1)
      .reduce((acc, reaction) => {
        const reagentId = Object.keys(reaction.reactants)[0];
        if (!acc[reagentId]) {
          acc[reagentId] = [];
        }
        acc[reagentId].push(reaction);
        return acc;
      }, {});
  }

  getById(id) {
    return this.reactions[id];
  }

  getMaxTemp(id) {
    return (
      this.singleReagentReactions[id]?.reduce((max, reaction) => {
        if (reaction.minTemp > max) {
          return reaction.minTemp;
        }
        return max;
      }, 0) ?? 0
    );
  }
}
