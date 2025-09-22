import React from 'react'
export function Input({ className='', ...props }){
  const cls = `border border-gray-300 rounded px-3 py-2 text-sm ${className}`
  return <input className={cls} {...props} />
}
export default Input
