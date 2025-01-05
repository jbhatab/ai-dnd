import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [inputText, setInputText] = useState('')
  const [bio, setBio] = useState('')
  const [story, setStory] = useState('')
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    setInputText(e.target.value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // BIO
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
            content: `Write me a fantastical biography for a dnd 5e character. Keep it to 200 words. Write it in the style of dnd writing. Here is the prompt ${inputText}`
          }]
        })
      })

      const data = await response.json()
      setBio(data.choices[0].message.content)
    } catch (error) {
      console.error('Error:', error)
      setBio('An error occurred while fetching the response')
    } finally {
      setLoading(false)
    }


    // STORY
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
            content: `Write a story for this character. It should define their goals in life, their backstory, what they want to do in the world, and their mission. Here was the user prompt about the character: ${inputText}`
          }]
        })
      })

      const data = await response.json()
      setStory(data.choices[0].message.content)
    } catch (error) {
      console.error('Error:', error)
      setStory('An error occurred while fetching the response')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className='container mx-auto'>
        <div className='grid grid-cols-10 pb-4'>
          <div></div>
          <form onSubmit={handleSubmit} className='col-span-8 place-items-center flex'>
            <input 
              type="text"
              value={inputText}
              onChange={handleInputChange}
              className="w-full px-4 py-2 text-gray-700 bg-white border rounded-lg focus:outline-none focus:border-blue-500 flex mr-4"
              placeholder="Enter your text"
            />
            <button 
              type="submit"
              className="btn btn-white flex"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Submit'}
            </button>
          </form>
          <div></div>
        </div>
        <div className="p-8 shadow-lg rounded-lg bg-[#E0E8DE]">
          <div className='grid grid-cols-2'>
            <div className='image'>
              <img src="/gnome.png" alt="Character" className="w-full h-auto rounded" />
            </div>
            {bio && (
              <div className='bio bg-white'>
                {bio}
              </div>

            )}
          </div>
          <div className='grid'>
            {story && (
              <div className='story bg-white'>
                {story}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default App
