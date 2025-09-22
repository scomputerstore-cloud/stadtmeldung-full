import React from 'react'
export function Textarea({ className='', ...props }){
  const cls = `border border-gray-300 rounded px-3 py-2 text-sm min-h-[80px] ${className}`
  return <textarea className={cls} {...props} />
}
export default Textarea
