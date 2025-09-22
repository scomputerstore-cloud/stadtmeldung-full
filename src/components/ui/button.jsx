import React from 'react'
export function Button({ children, className='', variant, ...props }){
  const base = 'inline-flex items-center gap-2 px-3 py-2 rounded border text-sm'
  const variants = {
    outline: 'bg-white border-gray-300',
    destructive: 'bg-red-600 text-white border-red-700',
    secondary: 'bg-gray-100 border-gray-300',
    default: 'bg-blue-600 text-white border-blue-700',
  }
  const cls = `${base} ${variants[variant] || variants.default} ${className}`
  return <button className={cls} {...props}>{children}</button>
}
export default Button
