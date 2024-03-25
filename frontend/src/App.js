import useWebSocket, { ReadyState } from "react-use-websocket";
import React, { useState, useEffect } from 'react';
import './App.css';

const WS_URL = "ws://127.0.0.1:7999"

const App = () => {
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    WS_URL,
    {
      share: false,
      shouldReconnect: () => true,
    },
  )
  const [browserContent, setBrowserContent] = useState();
  const [instruction, setInstruction] = useState();

  useEffect(() => {
    try {
      const htmlContent = lastJsonMessage.html ?? '';
      setBrowserContent(htmlContent);
    } catch (e) {
      console.log(e);
    }
  }, [lastJsonMessage]);

  const instruct = (e) => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        instruction: instruction
      });
    }
    e.preventDefault();
  }

  return (
    <>
      <iframe title='browser' className='browser-window' srcDoc={browserContent} />
      <form onSubmit={instruct}>
        <label>
          <input type="text" value={instruction} onChange={e => setInstruction(e.target.value)} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    </>
  );
};

export default App;
