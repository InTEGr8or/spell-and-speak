// App.js or your main component file

import React from 'react';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="header">
        SPELL-AND-SPEAK
      </header>
      <div className="word-display">
        <span className="word">CAT</span>
        <span className="audio-icon">🔊</span>
      </div>
      <div className="input-boxes">
        <div className="input-box"></div>
        <div className="input-box"></div>
        <div className="input-box"></div>
      </div>
      <div className="character-tray">
        <div className="character-chip">A</div>
        <div className="character-chip">S</div>
        <div className="character-chip">C</div>
        <div className="character-chip">E</div>
        <div className="character-chip">T</div>
        {/* Add more character chips as needed */}
      </div>
    </div>
  );
}

export default App;