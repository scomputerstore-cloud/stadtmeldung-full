import React, { createContext, useContext } from 'react'

const Ctx = createContext(null)

export function Select({ value, onValueChange, children }){
  return <Ctx.Provider value={{value, onValueChange}}>{children}</Ctx.Provider>
}
export function SelectTrigger({ children, className='' }){
  // simple wrapper (not interactive)
  return <div className={`border border-gray-300 rounded px-3 py-2 text-sm bg-white ${className}`}>{children}</div>
}
export function SelectValue({ placeholder }){
  const ctx = useContext(Ctx) || {}
  return <span>{ctx.value || placeholder}</span>
}
export function SelectContent({ children }){
  const ctx = useContext(Ctx) || {}
  const items = React.Children.toArray(children).filter(Boolean)
  return (
    <select
      value={ctx.value || ''}
      onChange={e => ctx.onValueChange && ctx.onValueChange(e.target.value)}
      className="border border-gray-300 rounded px-3 py-2 text-sm bg-white"
    >
      {/* inject a placeholder as empty option if none selected */}
      {!ctx.value && <option value="">-- auswählen --</option>}
      {items.map((child, i) => {
        if(!child || !child.props) return null
        return <option key={i} value={child.props.value}>{child.props.children}</option>
      })}
    </select>
  )
}
export function SelectItem({ children }){
  // only used as a container in SelectContent mapping
  return <>{children}</>
}
export default { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
