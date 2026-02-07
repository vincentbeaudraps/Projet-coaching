import { useState, useEffect, useCallback } from 'react';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook personnalisé pour simplifier les appels API
 * Remplace le pattern répétitif useState + useEffect + try-catch
 * 
 * @example
 * const { data, loading, error, refetch } = useApi(() => athletesService.getAll());
 */
export function useApi<T>(
  apiCall: () => Promise<{ data: T }>,
  dependencies: any[] = []
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      setData(response.data);
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * Hook pour gérer les soumissions de formulaires
 * 
 * @example
 * const { submit, loading, error } = useApiSubmit((data) => athletesService.create(data));
 */
export function useApiSubmit<TData, TResponse = any>(
  apiCall: (data: TData) => Promise<{ data: TResponse }>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<TResponse | null>(null);

  const submit = async (data: TData): Promise<TResponse | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall(data);
      setResponse(result.data);
      return result.data;
    } catch (err: any) {
      console.error('API Submit Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setResponse(null);
  };

  return { submit, loading, error, response, reset };
}

/**
 * Hook pour gérer un état de chargement global
 * Utile pour afficher un loader pendant plusieurs requêtes
 */
export function useLoadingState(initialState = false) {
  const [loading, setLoading] = useState(initialState);
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set());

  const startLoading = (taskId?: string) => {
    if (taskId) {
      setLoadingTasks(prev => new Set(prev).add(taskId));
    }
    setLoading(true);
  };

  const stopLoading = (taskId?: string) => {
    if (taskId) {
      setLoadingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
    
    // Si plus aucune tâche en cours
    if (taskId && loadingTasks.size === 0) {
      setLoading(false);
    } else if (!taskId) {
      setLoading(false);
    }
  };

  return { loading, startLoading, stopLoading };
}
