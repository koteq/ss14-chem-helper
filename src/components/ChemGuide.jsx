import { useMemo, useState } from "react";
import { Jugs } from "../services/jugs";
import { Reagents } from "../services/reagents";
import { Reactions } from "../services/reactions";
import { ChemVend } from "../services/chemVend";
import { ChemDispenser } from "../services/chemDispenser";
import { useTargetReagentsExample } from "../hooks/useTargetReagentsExample";
import { useTargetReagentsParser } from "../hooks/useTargetReagentsParser";
import { useChemGuide } from "../hooks/useChemGuide";

export function ChemGuide({ data, forks, fork, setFork }) {
  const jugs = useMemo(() => data && new Jugs(data), [data]);
  const reagents = useMemo(() => data && new Reagents(data), [data]);
  const reactions = useMemo(() => data && new Reactions(data), [data]);
  const chemVend = useMemo(() => data && new ChemVend({ ...data, jugs }), [data, jugs]);
  const chemDispenser = useMemo(() => data && new ChemDispenser({ ...data, jugs }), [data, jugs]);

  const exampleTarget = useTargetReagentsExample(reagents, "ru-RU");
  const [targetReagentsValue, setTargetReagents] = useState(exampleTarget);
  const targetReagents = useTargetReagentsParser(targetReagentsValue, reagents);
  const [guide, extra] = useChemGuide({ reagents, reactions, chemDispenser, targetReagents });

  return (
    <>
      <select value={fork} onChange={(e) => setFork(e.target.value)}>
        {forks.map((fork) => (
          <option key={fork} value={fork}>
            {fork}
          </option>
        ))}
      </select>
      <textarea
        rows="10"
        cols="50"
        placeholder=""
        value={targetReagentsValue ?? ""}
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
