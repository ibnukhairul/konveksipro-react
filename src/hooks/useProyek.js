import { useState, useEffect, useCallback } from 'react'
import { proyekService } from '../services/proyekService'

export function useProyek() {
  const [proyek, setProyek] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ search: '', status_bayar: '', status_produksi: '' })
  const [sortField, setSortField] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const loadProyek = useCallback(async () => {
    setLoading(true)
    try {
      let data = await proyekService.getAll(filters)
      // Sorting manual
      data.sort((a, b) => {
        let valA = a[sortField] ?? ''
        let valB = b[sortField] ?? ''
        if (sortField === 'total_harga') {
          valA = Number(valA) || 0
          valB = Number(valB) || 0
        } else {
          valA = String(valA).toLowerCase()
          valB = String(valB).toLowerCase()
        }
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
      setProyek(data)
    } catch (err) {
      console.error('Load proyek error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters, sortField, sortOrder])

  useEffect(() => {
    loadProyek()
  }, [loadProyek])

  const refresh = () => loadProyek()
  const setSearch = (search) => setFilters(prev => ({ ...prev, search }))
  const setStatusBayar = (status_bayar) => setFilters(prev => ({ ...prev, status_bayar }))
  const setStatusProduksi = (status_produksi) => setFilters(prev => ({ ...prev, status_produksi }))
  const resetFilters = () => setFilters({ search: '', status_bayar: '', status_produksi: '' })
  const sort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  return {
    proyek,
    loading,
    error,
    refresh,
    setSearch,
    setStatusBayar,
    setStatusProduksi,
    resetFilters,
    sortField,
    sortOrder,
    sort
  }
}