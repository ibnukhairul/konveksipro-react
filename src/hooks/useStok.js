import { useState, useEffect, useCallback } from 'react'
import { stokService } from '../services/stokService'

export function useStok() {
  const [stok, setStok] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('nama_bahan')
  const [sortOrder, setSortOrder] = useState('asc')

  const loadStok = useCallback(async () => {
    setLoading(true)
    try {
      let data = await stokService.getAll({ search })
      // Sorting manual karena service mungkin tidak support sorting
      data.sort((a, b) => {
        let valA = a[sortField] ?? ''
        let valB = b[sortField] ?? ''
        if (typeof valA === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA
        }
        valA = String(valA).toLowerCase()
        valB = String(valB).toLowerCase()
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
      setStok(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, sortField, sortOrder])

  useEffect(() => {
    loadStok()
  }, [loadStok])

  const refresh = () => loadStok()
  const handleSearch = (keyword) => setSearch(keyword)
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  return { stok, loading, error, refresh, search: handleSearch, sortField, sortOrder, handleSort }
}