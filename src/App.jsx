import { useMemo, useState } from "react";
import "./App.css";
import data from "./assets/sunrise-data.json";

function App() {
  const initialTarget = `// earlygame
Бикаридин 150
Дермалин 200
Диловен 200
Дексалин Плюс 360

// brute
Бруизин 300
Лацеринол 300
Пунктураз 300
// blodloss
Столовая соль 200

// phys
Лепоразин 280
Пиразин 300
Инсузин 300

// poison
Дифенгидрамин 240
Аритразин 240

// acid (rare)
Сигинат 320

// cellular (rare)
Фалангимин 240

// cryo
// Cryoxadone 400
// Doxarubixadone 400

// other
//Epinephrine 100
SpaceCleaner 200
//UnstableMutagen 120
//Diethylamine 200 // for botany
//RobustHarvest 200
//Sedin 100 // for botany

// allign numbers
Hydroxide 10
// Dexalin 10
TableSalt 20
// Ammonia: 20`;
  const [targetReagentsValue, setTargetReagents] = useState(initialTarget);
  // const { data, loading, error } = useJson("/sunrise-data.json");

  const [guide, extra] = useMemo(() => {
    if (!data) return [null, null];

    const { jugs, reagents, reactions, chemVendInventory, chemDispenserInventory } = data;

    const mapLocalizedNameToReagentId = Object.values(reagents).reduce((acc, reagent) => {
      acc.set(reagent.localization["ru-RU"].name, reagent.id);
      return acc;
    }, new Map());

    function getJugReagents(id) {
      if (id === "Jug") {
        return [];
      }
      return jugs[id].components.find((c) => c.type === "SolutionContainerManager").solutions.beaker
        .reagents;
    }

    const chemVendReagents = new Map();
    for (const [jugId, jugsCount] of Object.entries(chemVendInventory)) {
      const jugReagents = getJugReagents(jugId);
      for (const reagent of jugReagents) {
        const quantity = chemVendReagents.get(reagent.ReagentId) ?? 0;
        chemVendReagents.set(reagent.ReagentId, quantity + reagent.Quantity * jugsCount);
      }
    }

    const chemDispenserReagents = new Map();
    for (const jugId of chemDispenserInventory) {
      const jugReagents = getJugReagents(jugId);
      for (const reagent of jugReagents) {
        const quantity = chemDispenserReagents.get(reagent.ReagentId) ?? 0;
        chemDispenserReagents.set(reagent.ReagentId, quantity + reagent.Quantity);
      }
    }

    const availableReagents = new Map();
    for (const [reagentId, quantity] of chemDispenserReagents) {
      const currentQuantity = availableReagents.get(reagentId) ?? 0;
      availableReagents.set(reagentId, currentQuantity + quantity);
    }

    const targetReagents = {};
    targetReagentsValue
      .trim()
      .split("\n")
      .forEach((line) => {
        if (line.startsWith("//") || line.trim() === "") return;
        const match = line.match(/^(.*\S)\s+(\d+)$/);
        if (!match) return;
        const [, reagentId, quantity] = match;
        if (reagentId && quantity) {
          const localizedReagentId = mapLocalizedNameToReagentId.get(reagentId.toLowerCase());
          const reagent = reagents[reagentId] ?? reagents[localizedReagentId];
          if (!reagent) {
            console.warn(`Unknown reagent: ${reagentId}`);
            return;
          }
          targetReagents[reagent.id] = parseInt(quantity);
        }
      });

    /**
     * Resolves a reaction down to its basic reactants.
     */
    function resolveToBasicReactants(targetReagentId, requiredQuantity) {
      const basicReactants = {};

      // Check if the reagent can be produced by a reaction
      const reaction = reactions[targetReagentId];
      if (!reaction) {
        return { [targetReagentId]: requiredQuantity };
      }

      // Determine how many times the reaction needs to run
      const outputQuantity = reaction.products[targetReagentId];
      const reactionRuns = requiredQuantity / outputQuantity;

      // Resolve dependencies for the reaction's inputs
      for (const [inputReagentId, { amount = 1, catalyst = false }] of Object.entries(
        reaction.reactants,
      )) {
        const inputRequiredQuantity = catalyst ? 1 : amount * reactionRuns;

        // Recursively resolve the input reagent
        const subReactants = resolveToBasicReactants(
          inputReagentId,
          inputRequiredQuantity,
          reactions,
          availableReagents,
        );

        // Merge the sub-reactants into the basicReactants map
        for (const [basicReagentId, quantity] of Object.entries(subReactants)) {
          basicReactants[basicReagentId] = (basicReactants[basicReagentId] ?? 0) + quantity;
        }
      }

      return basicReactants;
    }

    const productionSteps = [];

    function addProductionSteps(steps) {
      for (const step of steps) {
        const stepId = productionSteps.findIndex((s) => s.reactionId === step.reactionId);
        if (stepId === -1) {
          productionSteps.push(step);
        } else {
          productionSteps[stepId].runs += step.runs;
          for (const [reagentId, quantity] of Object.entries(step.produces)) {
            const existingQuantity = productionSteps[stepId].produces[reagentId] ?? 0;
            productionSteps[stepId].produces[reagentId] = existingQuantity + quantity;
          }
        }
      }
    }

    /**
     * Recursively resolves the steps to produce a reagent using the reactions map.
     */
    function resolveReagentProduction(targetReagentId, requiredQuantity) {
      // Check if the reagent is already available
      const availableQuantity = Math.max(
        0,
        (availableReagents.get(targetReagentId) ?? 0) - (targetReagents[targetReagentId] ?? 0),
      );
      if (availableQuantity >= requiredQuantity) {
        return;
      }

      // Calculate the deficit
      const deficit = requiredQuantity - availableQuantity;

      // Find a reaction that produces the target reagent
      const reaction = reactions[targetReagentId];
      if (!reaction) {
        return; // Simply cause overdraw
      }

      // Determine how many times the reaction needs to run
      const outputQuantity = reaction.products[targetReagentId];
      const reactionRuns = Math.ceil(deficit / outputQuantity / 5) * 5; // Round up to the nearest multiple of 5

      // Resolve dependencies for the reaction's inputs
      for (const [inputReagentId, { amount = 1, catalyst = false }] of Object.entries(
        reaction.reactants,
      )) {
        const inputRequiredQuantity = catalyst ? 1 : amount * reactionRuns;

        // Produce the input reagent if it's not available
        resolveReagentProduction(inputReagentId, inputRequiredQuantity);

        // Consume the input reagent
        const inputAvailableQuantity = availableReagents.get(inputReagentId) ?? 0;
        availableReagents.set(inputReagentId, inputAvailableQuantity - inputRequiredQuantity);
      }

      // Add the reaction step
      addProductionSteps([
        {
          reactionId: reaction.id,
          runs: reactionRuns,
          produces: { [targetReagentId]: outputQuantity * reactionRuns },
        },
      ]);

      // Update the available reagents
      const newAvailableQuantity =
        (availableReagents.get(targetReagentId) ?? 0) + outputQuantity * reactionRuns;
      availableReagents.set(targetReagentId, newAvailableQuantity);
    }

    for (const [targetReagentId, requiredQuantity] of Object.entries(targetReagents)) {
      resolveReagentProduction(targetReagentId, requiredQuantity, availableReagents, reactions);
    }

    const beakerCapacity = 100;
    const jugCapacity = 200;
    // prettier-ignore
    const transferAmounts = {
        jug:           [   5, 10, 25,             50, 100],
        biker:         [   5, 10, 25,             50, 100],
        chemMaster:    [1, 5, 10, 25,             50, 100],
        chemDispenser: [1, 5, 10, 15, 20, 25, 30, 50, 100],
    }

    // Iterate through the production steps adding instructions for each step
    for (const [index, step] of productionSteps.entries()) {
      const reaction = reactions[step.reactionId];

      // Determine the capacity to use (jug or beaker)
      // const capacity = reaction.minTemp ? beakerCapacity : jugCapacity; // unsomment whenever chemmaster gets nerfed
      const capacity = jugCapacity; // for use with lava beaker

      // Calculate the number of containers needed
      const totalInputs = Object.values(reaction.reactants).reduce(
        (sum, { amount = 1 }) => sum + amount * step.runs,
        0,
      );
      const totalProduct = Object.values(step.produces).reduce((sum, qty) => sum + qty, 0);
      const requiredContainers = Math.ceil(Math.max(totalInputs, totalProduct) / capacity);

      // Check if any of the reactants would react from overheating
      const maxTemp = Object.keys(reaction.reactants)
        .flatMap((reactantId) =>
          Array.from(
            Object.values(reactions).map((reaction) => {
              if (
                Object.keys(reaction.reactants).length === 1 &&
                reaction.reactants[reactantId]?.amount
              ) {
                return reaction.minTemp;
              }
            }),
          ),
        )
        .filter(Number.isFinite)
        .reduce((max, minTemp) => Math.max(max, minTemp), 0);

      const instructions = {
        requiredContainers,
        minTemp: reaction.minTemp,
        ...(reaction.minTemp && maxTemp && maxTemp > reaction.minTemp ? { maxTemp } : {}),
        reactants: [],
        hints: {},
      };

      for (const reagentId of Object.keys(step.produces)) {
        // Add "target-reached" hint
        if (targetReagents[reagentId]) {
          instructions.hints["target-reached"] = { reagentId, amount: targetReagents[reagentId] };
        }

        // Add "next step" hint
        for (const nextStep of productionSteps.slice(index + 1)) {
          const reaction = reactions[nextStep.reactionId];
          for (const [nexstStepReagentId, { amount = 1 }] of Object.entries(reaction.reactants)) {
            if (nexstStepReagentId === reagentId) {
              if (reaction.minTemp) {
                instructions.hints["move-to-chemmaster-next"] = {
                  reagentId,
                  amount: amount * nextStep.runs,
                };
              } else {
                const totalNextInputs = Object.values(reaction.reactants).reduce(
                  (sum, { amount = 1 }) => sum + amount * nextStep.runs,
                  0,
                );
                const totalNextProduct = Object.values(nextStep.produces).reduce(
                  (sum, qty) => sum + qty,
                  0,
                );
                const requiredContainers = Math.ceil(
                  Math.max(totalNextInputs, totalNextProduct) / capacity,
                );
                instructions.hints["move-to-jugs-next"] = {
                  reagentId,
                  amount: amount * nextStep.runs,
                  requiredContainers,
                };
              }
            }
          }
        }
      }

      // Distribute reactants into the container based on the determined transfer amount
      for (const [reactantId, { amount = 1, catalyst = false }] of Object.entries(
        reaction.reactants,
      )) {
        if (catalyst) {
          instructions.reactants.push({ reactantId, amount: 1 });
          continue; // Skip catalysts for further calculations
        }
        const amountToAdd = (amount * step.runs) / requiredContainers;
        instructions.reactants.push({ reactantId, amount: amountToAdd });
      }

      // Update the step with instructions
      step.instructions = instructions;
    }

    const md = true;

    function _(reagentId, html = md) {
      const reagent = reagents[reagentId];
      const name = reagent.localization["ru-RU"].name;
      const Name = name.charAt(0).toUpperCase() + name.slice(1);
      if (html) {
        // return `<font color="${reagent.color}">&#9615;</font>${Name}`;
        return `<font color="${reagent.color}">◆</font>${Name}`;
      } else {
        return Name;
      }
    }

    const sp = md ? "" : " ";

    const guideLines = [];
    for (const step of productionSteps) {
      const { reactionId, produces } = step;
      const { minTemp, maxTemp, reactants, requiredContainers, hints } = step.instructions;
      let guide = "";
      if (minTemp && maxTemp) {
        guide += `<em>${minTemp}K–${maxTemp}K</em><br>`;
      } else if (minTemp) {
        guide += `<em>${minTemp}K</em><br>`;
      }
      guide += `${_(reactionId)} ${produces[reactionId]} `;
      guide += `(<br>${sp}`;
      guide += reactants
        .map(({ reactantId, amount }) => `${amount} ${_(reactantId)}`)
        .join(`<br>${sp}`);
      guide += `) × ${requiredContainers}`;
      if (hints["target-reached"] && hints["target-reached"].amount > 50) {
        if (
          jugCapacity > hints["target-reached"].amount &&
          hints["target-reached"].amount < produces[hints["target-reached"].reagentId]
        ) {
          guide += `<br><em>выдать ${hints["target-reached"].amount}</em>`;
        } else {
          //guide += `\n_выдать кувшин ${_(hints['target-reached'].reagentId)}_`;
        }
      } else if (hints["move-to-chemmaster-next"]) {
        //guide += `\n_перелить в ХимМастер_`;
      } else if (hints["move-to-jugs-next"]) {
        // guide += `<br><em>оставить в кувшине</em>`;
        //guide += `\n_распределить в ${hints['move-to-jugs-next'].requiredContainers} кувшинa по ${hints['move-to-jugs-next'].amount / hints['move-to-jugs-next'].requiredContainers}_`;
      }
      guideLines.push(guide);
      // console.log(guide);
    }

    const extraReagents = Object.fromEntries(
      Array.from(availableReagents.entries())
        .filter(([, amount]) => amount < 0)
        .map(([reagentId, amount]) => [_(reagentId, false), -amount]),
    );

    return [guideLines, extraReagents];
  }, [data, targetReagentsValue]);

  return (
    <>
      <textarea
        rows="10"
        cols="50"
        placeholder=""
        value={targetReagentsValue}
        onChange={(e) => setTargetReagents(e.target.value)}
      ></textarea>
      <textarea
        rows="10"
        cols="50"
        value={Object.entries(extra ?? {})
          .map(([reagent, amount]) => `${reagent} ${amount}`)
          .join("\n")}
        readOnly={true}
      ></textarea>
      {data && (
        <div>
          <h1>Guide</h1>
          <div
            style={{ textAlign: "left" }}
            dangerouslySetInnerHTML={{ __html: guide.join("<br><br>") }}
          />
          {/* <pre>{JSON.stringify(guide, null, 2)}</pre> */}
        </div>
      )}
    </>
  );
}

export default App;
