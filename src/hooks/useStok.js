import { useState, useEffect, useCallback, useRef } from 'react'
import { stokService } from '../services/stokService'

export function useStok() {
  const [stok, setStok] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('nama_bahan')
  const [sortOrder, setSortOrder] = useState('asc')
  
  // 🔥 Gunakan ref untuk mencegah infinite loop
  const searchTimeout = useRef(null)

  const loadStok = useCallback(async () => {
    setLoading(true)
    try {
      let data = await stokService.getAll({})
      
      // Filter di frontend
      if (search.trim() !== '') {
        const searchLower = search.toLowerCase()
        data = data.filter(item => 
          (item.nama_bahan && item.nama_bahan.toLowerCase().includes(searchLower)) ||
          (item.kategori && item.kategori.toLowerCase().includes(searchLower)) ||
          (item.gramasi && item.gramasi.toLowerCase().includes(searchLower)) ||
          (item.size && item.size.toLowerCase().includes(searchLower)) ||
          (item.catatan && item.catatan.toLowerCase().includes(searchLower))
        )
      }
      
      // Sorting
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
  
  // 🔥 Handle search dengan debounce di sini (pindah dari komponen)
  const handleSearch = (keyword) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    searchTimeout.current = setTimeout(() => {
      setSearch(keyword)
    }, 400)
  }
  
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