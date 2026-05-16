import { useState, useEffect, useCallback } from 'react'
import { loadPriceData } from '../services/priceService'

export function usePriceData(initialBrand = 'SERAGAMAN') {
  const [brand, setBrand] = useState(initialBrand)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [fabrics, setFabrics] = useState([])
  const [sizeAdjustments, setSizeAdjustments] = useState([])
  const [error, setError] = useState(null)

  const loadData = useCallback(async (brandName) => {
    setLoading(true)
    setError(null)
    try {
      const data = await loadPriceData(brandName)
      setProducts(data.products)
      setFabrics(data.fabrics)
      setSizeAdjustments(data.sizeAdjustments)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(brand)
  }, [brand, loadData])

  const switchBrand = (newBrand) => {
    setBrand(newBrand)
  }

  return {
    brand,
    loading,
    error,
    products,
    fabrics,
    sizeAdjustments,
    switchBrand
  }
}