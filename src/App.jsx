import "./App.css";
import { ChemGuide } from "./components/ChemGuide";
import { useForkData } from "./hooks/useForkData";

function App() {
  const { data, error, loading, forks, fork, setFork } = useForkData();

  return (
    <>
      {loading && <h2>🌀 Loading...</h2>}
      {error && <h2>❌ Error: {error.message}</h2>}
      {data && <ChemGuide data={data} forks={forks} fork={fork} setFork={setFork} />}
    </>
  );
}

export default App;
