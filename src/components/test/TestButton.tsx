'use client'

export function TestButton() {
  const handleClick = () => {
    alert('Button clicked!')
    console.log('Test button clicked at:', new Date().toISOString())
  }

  return (
    <button
      onClick={handleClick}
      className="fixed top-20 left-4 z-[99999] px-4 py-2 bg-red-500 text-white rounded-lg"
      style={{ position: 'fixed', top: '100px', left: '20px', zIndex: 999999 }}
    >
      TEST BUTTON
    </button>
  )
}