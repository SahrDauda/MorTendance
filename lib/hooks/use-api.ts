"use client"

import { useState, useEffect } from "react"
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from "@/lib/api-client"

export function useApi<T>(endpoint: string | null, options?: { enabled?: boolean }) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!endpoint || options?.enabled === false) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    apiGet<T>(endpoint)
      .then((response: any) => {
        // Handle different response shapes
        const result = response.data || response
        setData(result)
      })
      .catch((err: any) => {
        // Extract error message from ApiError or use default
        let error: Error
        if (err instanceof ApiError) {
          // Use the ApiError message directly
          error = err
        } else if (err instanceof Error) {
          error = err
        } else if (err?.message) {
          error = new Error(err.message)
        } else if (typeof err === 'string') {
          error = new Error(err)
        } else {
          error = new Error(err?.details?.message || err?.error || "An error occurred")
        }
        console.error("useApi error:", error)
        setError(error)
        setData(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [endpoint, options?.enabled])

  const refetch = async () => {
    if (!endpoint) return

    setLoading(true)
    setError(null)

    try {
      const response: any = await apiGet<T>(endpoint)
      const result = response.data || response
      setData(result)
    } catch (err: any) {
      let error: Error
      if (err instanceof ApiError) {
        error = err
      } else if (err instanceof Error) {
        error = err
      } else if (err?.message) {
        error = new Error(err.message)
      } else if (typeof err === 'string') {
        error = new Error(err)
      } else {
        error = new Error(err?.details?.message || err?.error || "An error occurred")
      }
      console.error("useApi refetch error:", error)
      setError(error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch }
}

export function useMutation<TData, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = async (variables: TVariables) => {
    setLoading(true)
    setError(null)

    try {
      const result = await mutationFn(variables)
      return { data: result, error: null }
    } catch (err) {
      const error = err instanceof ApiError ? err : new Error("An error occurred")
      setError(error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  return { mutate, loading, error }
}

