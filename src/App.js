// App.js or your main component file

import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import wordList from './word-list.json';
import CharacterChip from './components/CharacterChip/CharacterChip';

function App() {
  const [currentWord, setCurrentWord] = useState('');
  const [characterChips, setCharacterChips] = useState([]);
  const [inputBoxChips, setInputBoxChips] = useState({});


  const handleDrop = (event, targetInputBoxId) => {
    // Prevent the default behavior
    event.preventDefault();

    // Get the character-chip that is being dragged
    const draggedChipId = event.dataTransfer.getData("text/plain");

    // Update state to reflect the new arrangement of character chips
    setInputBoxChips(prevState => {
      // Find if the dragged chip was already in an input box
      const currentBoxId = Object.keys(prevState).find(key => prevState[key] === draggedChipId);
      // If so, set that input box to null (remove the chip)
      if (currentBoxId) {
        prevState[currentBoxId] = null;
      }

      // Move the existing chip in the target input box back to the tray
      // const existingChipId = prevState[targetInputBoxId];
      // Set the target input box to the dragged chip
      prevState[targetInputBoxId] = draggedChipId;

      // Return the updated state
      return { ...prevState };
    });
  };

  const sayWord = useCallback(() => {
    const inputBoxes = document.querySelectorAll('.input-box');
    let wordToSay = '';

    inputBoxes.forEach(box => {
      // If the box has a child node (the character chip), use its text content
      // Otherwise, use a space to represent an empty box
      wordToSay += box.childNodes[0] ? box.childNodes[0].textContent : ' ';
    });

    // Use the SpeechSynthesis API to pronounce the word
    const utterance = new SpeechSynthesisUtterance(wordToSay);
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleSayWord = useCallback(() => {
    if ('speechSynthesis' in window) {
      // Browser supports speech synthesis
      sayWord();
    } else {
      // Handle the error, possibly by informing the user
      console.error('Speech synthesis not supported in this browser.');
    }
  }, [sayWord]);

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

  const handleTouchMove = (e) => {
    e.target.classList.add('dragging');
    // Get the touch coordinates
    const touchLocation = e.targetTouches[0];
    // Set the style to move the element with the touch
    e.target.style.position = 'absolute';
    e.target.style.left = `${touchLocation.pageX - e.target.offsetWidth / 2}px`;
    e.target.style.top = `${touchLocation.pageY - e.target.offsetHeight / 2}px`;
  };

  const handleTouchEnd = useCallback((e) => {
    // Get the location of the touch event
    const touchLocation = e.changedTouches[0];

    // Find all input boxes
    const inputBoxes = document.querySelectorAll('.input-box');

    // Get the touch point coordinates
    const touchPoint = {
      x: touchLocation.clientX,
      y: touchLocation.clientY
    };

    // Determine if touch point is inside any input box
    let targetBox = null;
    inputBoxes.forEach(box => {
      const boxRect = box.getBoundingClientRect();
      if (
        touchPoint.x >= boxRect.left &&
        touchPoint.x <= boxRect.right &&
        touchPoint.y >= boxRect.top &&
        touchPoint.y <= boxRect.bottom
      ) {
        // The touch point is inside this box
        targetBox = box;
      }
    });

    if (targetBox) {
      // If we have a target box, append the character chip to it
      targetBox.appendChild(e.target);
      handleSayWord();
    } else {
      // If no target box was found, reset the drag or move back to original position
      // This logic depends on how you want to handle an unsuccessful drop
    }

    // Reset styles or any state as needed
    e.target.classList.remove('dragging');
    e.target.style.position = '';
    e.target.style.left = '';
    e.target.style.top = '';
  }, [handleSayWord]);

  useEffect(() => {
    // Pick a new word from the list
    const newWord = wordList[Math.floor(Math.random() * wordList.length)];
    setCurrentWord(newWord);

    // Create initial state for inputBoxChips based on the length of the new word
    const newInputBoxChips = {};
    for (let i = 0; i < newWord.length; i++) {
      newInputBoxChips[`input-box-${i}`] = null; // Initially, no input boxes have chips
    }

    // Create character chips for the new word
    const characters = newWord.split('');
    // Add 50% extra random characters
    const extraChars = Math.ceil(characters.length * 0.5);
    for (let i = 0; i < extraChars; i++) {
      const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      characters.push(randomChar);
    }

    // Shuffle the array of characters
    const shuffledCharacters = characters.sort(() => 0.5 - Math.random());

    setInputBoxChips(newInputBoxChips);
    setCharacterChips(shuffledCharacters);
  }, []);

  useEffect(() => {
    // Attach touch event listeners
    const characterChipsElements = document.querySelectorAll('.character-chip');
    characterChipsElements.forEach((chip) => {
      chip.addEventListener('touchmove', handleTouchMove);
      chip.addEventListener('touchend', handleTouchEnd);
      // Add any other event listeners you need here
    });

    // Cleanup function to remove event listeners
    return () => {
      characterChipsElements.forEach((chip) => {
        chip.removeEventListener('touchmove', handleTouchMove);
        chip.removeEventListener('touchend', handleTouchEnd);
        // Remove any other event listeners you added
      });
    };
  }, [characterChips, handleTouchEnd]); // Dependency array includes characterChips to re-run the effect when it changes

  return (
    <div className="app">
      <header className="header">
        SPELL-AND-SPEAK
      </header>
      <span className="audio-icon">🔊</span>
      <div className="word-display">
        {currentWord}
      </div>
      <div 
       className="input-boxes">
        {currentWord.split('').map((_, index) => {
            const boxId = `input-box-${index}`;
            return (

            <div
              key={boxId}
              id={boxId}
              onDragOver={handleDragOver}
              onDrop={(event) => handleDrop(event, boxId)}
              className="input-box"
              >
                {inputBoxChips[boxId] && (
                  <CharacterChip
                    id={inputBoxChips[boxId]}
                    // other props
                  />
                )}
            </div>
          );
        })}
      </div>
      <div className="character-tray">
        {characterChips.map((char, index) => (
          <CharacterChip
            key={index}
            id={`character-chip-${index}`}
            char={char}
            onDragStart={handleDragStart}
          />
        ))}
      </div>

    </div>
  );
}

export default App;