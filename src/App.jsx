import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [inputText, setInputText] = useState('')
  const [bio, setBio] = useState('')
  const [story, setStory] = useState('')
  const [voices, setVoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [voiceLoading, setVoiceLoading] = useState(false)
  const [picture, setPicture] = useState('')

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      setInputText(transcript);
    };

    recognition.start();

    const getVoices = async () => {
      try {
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
          method: 'GET', 
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': `${import.meta.env.VITE_11_LABS_KEY}`
          }
        });
  
        if (!response.ok) {
          throw new Error('Failed to get voices');
        }
        
        const voices = await response.json();
        setVoices(voices)
        console.log('Available voices:', voices);
      } catch (error) {
        console.error('Error getting voices:', error);
      }
    };
  
    getVoices();
  }, []);

  const handleInputChange = (e) => {
    setInputText(e.target.value)
  }

  const generateVoice = async (text) => {
    setVoiceLoading(true)

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/CTkkk2CUbffAC8HmgZPq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': `${import.meta.env.VITE_11_LABS_KEY}`  // You'll need to add this to your .env file
        },
        body: JSON.stringify({
          text: text,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      })

      if (!response.ok) {
        throw new Error('Voice generation failed')
      }

      const audioBlob = await response.blob()
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
      // Play audio immediately after generating
      const audio = new Audio(url)
      audio.play()
    } catch (error) {
      console.error('Error generating voice:', error)
    } finally {
      setVoiceLoading(false)
    }
  }

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const generateBio = async () => {
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
        generateVoice(data.choices[0].message.content)
      } catch (error) {
        console.error('Error:', error)
        setBio('An error occurred while fetching the response')
      }
    }

    const generateStory = async () => {
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
      }
    }

    const generateImage = async() => {
      try {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
              prompt: `Now generate an image of this character. Keep it in the official DND books artstyle: ${inputText}`,
              n: 1,           // Number of images to generate
              size: "1024x1024" // Image size
          }),
      });
        const imageJson = await response.json()
        setPicture(await imageJson.data[0].url)
        console.log(picture)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false);
      }
    }

    try {
      // Run both API calls in parallel
      await Promise.all([
        generateBio(),
        generateStory(),
        generateImage()
      ])
    } catch (error) {
      console.error('Error in parallel execution:', error)
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
              <img src={picture} alt="Character" className="w-full h-auto rounded" />
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
