import { useState } from 'react'

function App(): React.JSX.Element {
  const [result, setResult] = useState<string>('')

  const handlePing = async (): Promise<void> => {
    const response = await window.api.ping()
    setResult(response)
  }

  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>Stimel-03</h1>
      <p>Boundary check</p>
      <button onClick={handlePing}>Send IPC</button>
      {result && <p>Main process replied: {result}</p>}
    </div>
  )
}

export default App