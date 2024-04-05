// App.js or your main component file

import React, { useEffect } from 'react';
import './App.css';

function App() {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', e.target.id);
    // Optionally, add a drag image and set an offset to position it under the pointer
    const dragImage = e.target.cloneNode(true);
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, dragImage.width / 2, dragImage.height / 2);
    // Remove the temporary drag image after the drag starts
    dragImage.addEventListener('dragstart', () => document.body.removeChild(dragImage));
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedCharacter = e.dataTransfer.getData('text/plain');
    const characterChip = document.getElementById(droppedCharacter);
    // Append the character chip to the input box or handle as needed
    e.target.appendChild(characterChip);
  };

  const handleTouchMove = (e) => {
    e.target.classList.add('dragging');
    // Get the touch coordinates
    const touchLocation = e.targetTouches[0];
    // Set the style to move the element with the touch
    e.target.style.position = 'absolute';
    e.target.style.left = `${touchLocation.pageX - e.target.offsetWidth / 2}px`;
    e.target.style.top = `${touchLocation.pageY - e.target.offsetHeight / 2}px`;
  };

  const handleTouchEnd = (e) => {
    e.target.classList.remove('dragging');
    // Logic to determine if the element was dropped over an input box
    // This could involve checking the position of the touch event and the position of the input boxes
    e.target.style.position = ''; // Reset styles or move the element to a drop target
    // More logic here...
  };

  useEffect(() => {
    // Attach touch event listeners
    const characterChips = document.querySelectorAll('.character-chip');
    characterChips.forEach((chip) => {
      chip.addEventListener('touchmove', handleTouchMove);
      chip.addEventListener('touchend', handleTouchEnd);
    });

    // Remember to clean up event listeners
    return () => {
      characterChips.forEach((chip) => {
        chip.removeEventListener('touchmove', handleTouchMove);
        chip.removeEventListener('touchend', handleTouchEnd);
      });
    };
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <div className="app">
      <header className="header">
        SPELL-AND-SPEAK
      </header>
      <span className="audio-icon">🔊</span>
      <div className="word-display">
        <span className="word">CAT</span>
      </div>
      <div 
       className="input-boxes">
        <div onDragOver={handleDragOver} onDrop={handleDrop} className="input-box"></div>
        <div onDragOver={handleDragOver} onDrop={handleDrop} className="input-box"></div>
        <div onDragOver={handleDragOver} onDrop={handleDrop} className="input-box"></div>
      </div>
      <div className="character-tray">
        <div onDragStart={handleDragStart} draggable="true" className="character-chip">A</div>
        <div onDragStart={handleDragStart} draggable="true" className="character-chip">S</div>
        <div onDragStart={handleDragStart} draggable="true" className="character-chip">C</div>
        <div onDragStart={handleDragStart} draggable="true" className="character-chip">E</div>
        <div onDragStart={handleDragStart} draggable="true" className="character-chip">T</div>
        {/* Add more character chips as needed */}
      </div>
    </div>
  );
}

export default App;