import { useEffect, useState } from "react";

export function useQuery(queryFn) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;
    (async function () {
      setError(null);
      setLoading(true);
      try {
        const result = await queryFn();
        if (!canceled) {
          setData(result);
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
  }, [queryFn]);

  return { data, error, loading };
}
