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
  const [activeVoiceId, setActiveVoiceId] = useState('')
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [voiceLoading, setVoiceLoading] = useState(false)
  const [picture, setPicture] = useState('')
  const [recordedText, setRecordedText] = useState('');
  const [summary, setSummary] = useState('');
  const [recording, setRecording] = useState(false);

  useEffect(() => {

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
        
        const voiceList = await response.json();
        setVoices(voiceList.voices)
        console.log('Available voices:', voiceList);
      } catch (error) {
        console.error('Error getting voices:', error);
      }
    };
  
    getVoices();
  }, []);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0])
      .map(result => result.transcript)
      .join('');
      setRecordedText(transcript);
  };

  const handleRecordClick = (e) => {
    e.preventDefault();
    if (!recording) {
      startRecording()
    } else {
      stopRecording()
    }
  }

  function startRecording() {
    setRecording(true);
    setRecordedText("");
    recognition.start()
  }

  function stopRecording() {
    setRecording(false);
    recognition.stop()
    createSummary()
  }

  async function createSummary() {
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
            content: `Create a summary of the following recorded conversation from a DnD campaign: ${recordedText}`
          }]
        })
      })
      const data = await response.json()
      setSummary(data.choices[0].message.content)
    } catch (error) {
      console.error('Error:', error)
      setBio('An error occurred while fetching the response')
    }
  }

  const handleInputChange = (e) => {
    setInputText(e.target.value)
  }

  const generateVoice = async (text, voiceId) => {
    setVoiceLoading(true)
    debugger

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
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

    const selectVoice = async () => {
      try {
        const character_description = `${inputText}`
        
        const filteredVoices = voices
          .slice(20)
          .map(voice => ({
            voice_id: voice.voice_id,
            description: voice.description
          }));

        const prompt = `
        Based on the following character description:
        
        ${character_description}
        
        Choose the best matching voice from the list below:
        
        ${JSON.stringify(filteredVoices, null, 2)}
        
        Return ONLY the "voice_id" of the chosen voice as a plain string. Do not include any additional text, explanation, or formatting.
        `
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: [
              {"role": "system", "content": "You are an expert in matching voices to character descriptions."},
              {"role": "user", "content": prompt}
            ]
          })
        })

        if (!response.ok) {
          throw new Error('Failed to get voice match')
        }

        const data = await response.json()
        const best_match = data.choices[0].message.content.replace(/['"]/g, '')
        setActiveVoiceId(best_match)
        console.log("Best Match:", best_match)
        return best_match
      } catch (error) {
        console.error('Error selecting voice:', error)
        throw error
      }
    }

    const generateBio = async (voiceId) => {
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
        generateVoice(data.choices[0].message.content, voiceId)
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
      // First get the voice ID
      const voiceId = await selectVoice()
      
      // Then run the rest of the API calls in parallel
      await Promise.all([
        generateBio(voiceId),
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
            <button 
              onClick={handleRecordClick}
              className="btn btn-white flex"
            >
              {recording ? 'Recording...' : 'Start Recording'}
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
              <div className='bio text-black'>
                {bio}
              </div>
            )}
          </div>
          <div className='grid'>
            {story && (
              <div className='story text-black'>
                {story}
              </div>
            )}
          </div>
          <div>
              <div className='story bg-white'>
                {summary}
              </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
