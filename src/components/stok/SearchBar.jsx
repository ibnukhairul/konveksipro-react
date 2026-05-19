import { useRef, useEffect } from 'react'

export default function SearchBar({ value, onChange, placeholder, disabled }) {
  const inputRef = useRef(null)

  // 🔥 Simpan nilai di localStorage agar tidak hilang saat re-render
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus()
    }
  }, [disabled])

  return (
    <input
      ref={inputRef}
      type="text"
      className="kpro-input"
      placeholder={placeholder || "🔍 Cari..."}
      style={{ width: '320px' }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  )
}