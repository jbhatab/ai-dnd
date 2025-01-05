import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [inputText, setInputText] = useState('')

  const handleInputChange = (e) => {
    setInputText(e.target.value)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Submitted text:', inputText)
  }

  return (
    <>
      <div className='grid grid-cols-3 place-items-center'>
        <div></div>
        <form onSubmit={handleSubmit} className='place-items-center'>
          <input 
            type="text"
            value={inputText}
            onChange={handleInputChange}
            className="main-input"
            placeholder="Enter your text"
          />
          <button 
            type="submit"
            className="submit-button"
          >
            Submit
          </button>
        </form>
        
        <div></div>
      </div>
    </>
  )
}

export default App
