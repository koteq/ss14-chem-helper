import { useEffect, useState } from "react";

export function useJson(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;
    (async function fetchJson() {
      setError(null);
      setLoading(true);
      try {
        const result = await fetch(url);
        if (!result.ok) {
          throw new Error("Network response was not ok");
        }
        const json = await result.json();
        if (!canceled) {
          setData(json);
        }
      } catch (error) {
        if (!canceled) {
          setError(error);
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      canceled = true;
      setLoading(false);
    };
  }, [url]);

  return { data, error, loading };
}
