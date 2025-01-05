import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [inputText, setInputText] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    setInputText(e.target.value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "user",
            content: inputText
          }]
        })
      })

      const data = await response.json()
      setResponse(data.choices[0].message.content)
    } catch (error) {
      console.error('Error:', error)
      setResponse('An error occurred while fetching the response')
    } finally {
      setLoading(false)
    }
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
            className="btn btn-white"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Submit'}
          </button>
          {response && (
            <div className="mt-4 p-4 bg-white/10 rounded">
              <p>{response}</p>
            </div>
          )}
        </form>
        <div></div>
      </div>
    </>
  )
}

export default App
