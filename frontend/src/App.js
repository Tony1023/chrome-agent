import React, { useState } from 'react';
import './App.css';

export default () => {
  const [browserContent, setBrowserContent] = useState();
  const [instruction, setInstruction] = useState();

  const instruct = e => {
    e.preventDefault();
    setBrowserContent(`
<html><body>
${instruction}
</body></html>
`
    );
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
