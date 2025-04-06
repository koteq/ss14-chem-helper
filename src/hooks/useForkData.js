import { useState, useMemo } from "react";
import { useQuery } from "./useQuery";

const modules = import.meta.glob("../assets/*-data.json");

function getForkId(path) {
  return path.match(/([^/]+)-data\.json/)?.[1];
}

const moduleByFork = Object.fromEntries(
  Object.entries(modules).map(([path, module]) => [getForkId(path), module]),
);
const forks = Object.keys(moduleByFork);
const firstFork = forks.at(0);

export function useForkData() {
  const [fork, setFork] = useState(firstFork);
  const queryData = useMemo(() => async () => await moduleByFork[fork](), [fork]);
  const { data, error, loading } = useQuery(queryData);

  return {
    data,
    error,
    loading,

    forks: Object.keys(moduleByFork),
    fork,
    setFork,
  };
}
