// App.js or your main component file

import React, { useCallback, useEffect, useState, useReducer } from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import wordList from './word-list.json';
import CharacterChip from './components/CharacterChip/CharacterChip';
import './components/CharacterChip/CharacterChip.css';

// Define action types
const ActionTypes = {
  DROP_CHIP: 'DROP_CHIP',
  SET_CHARACTER_CHIPS: 'SET_CHARACTER_CHIPS',
  SET_INPUT_BOX_CHIPS: 'SET_INPUT_BOX_CHIPS',
  SET_HAS_DROPPED: 'SET_HAS_DROPPED',
  INIT_NEW_WORD: 'INIT_NEW_WORD',
};

// Define the reducer function
const reducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.DROP_CHIP: {
      const { draggedChipId, targetInputBoxId } = action.payload;
      const existingChipId = state.inputBoxChips[targetInputBoxId];

      // Create new state for characterChips and inputBoxChips
      const newCharacterChips = existingChipId
        ? state.characterChips.concat(existingChipId)
        : state.characterChips;
      const newInputBoxChips = {
        ...state.inputBoxChips,
        [targetInputBoxId]: draggedChipId,
      };

      return {
        ...state,
        characterChips: newCharacterChips,
        inputBoxChips: newInputBoxChips,
        hasDropped: true,
      };
    }
    case ActionTypes.SET_CHARACTER_CHIPS:
      return {
        ...state,
        characterChips: action.payload,
      };
    case ActionTypes.SET_INPUT_BOX_CHIPS:
      return {
        ...state,
        inputBoxChips: action.payload,
      };
    case ActionTypes.SET_HAS_DROPPED:
      return {
        ...state,
        hasDropped: action.payload,
      };
    case ActionTypes.INIT_NEW_WORD: {
      const { newWord, newInputBoxChips, shuffledCharacters } = action.payload;
      return {
        ...state,
        currentWord: newWord,
        inputBoxChips: newInputBoxChips,
        characterChips: shuffledCharacters,
      };
    }
    default:
      return state;
  }
};

function App() {
  // Define the initial state within the App or import from another file
  const initialState = {
    currentWord: '', // Assuming you want to manage this in the reducer as well
    characterChips: [], // Initialize with your character chips data
    inputBoxChips: {}, // Initialize with your input boxes data
    hasDropped: false,
  };
  
  // Use useReducer hook to manage state
  const [state, dispatch] = useReducer(reducer, initialState);

  // Replace useState hooks with values from the state object
  const { currentWord, characterChips, inputBoxChips, hasDropped } = state;

  // Say the characters in the input boxes
  const sayWord = useCallback(() => {
    // Construct the word from the inputBoxChips state
    const wordToSay = Object.keys(state.inputBoxChips)
      .sort() // Sort the keys to ensure the correct order
      .map(boxId => {
        const chipId = state.inputBoxChips[boxId];
        return chipId ? chipId.replace('character-chip-', '') : ' '; // Assuming chipId is like 'character-chip-A'
      })
      .join('');

    // Use the SpeechSynthesis API to pronounce the word
    const utterance = new SpeechSynthesisUtterance(wordToSay);
    window.speechSynthesis.speak(utterance);
  }, [state.inputBoxChips]); // Include state.inputBoxChips in the dependency array

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
    const { id } = e.currentTarget;
    e.dataTransfer.setData('text/plain', id);

    // Create a drag image
    const dragImage = e.currentTarget.cloneNode(true);
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-99999px'; // Position the drag image off-screen
    document.body.appendChild(dragImage);

    // Use the off-screen element as the drag image
    e.dataTransfer.setDragImage(
      dragImage, 
      dragImage.offsetWidth / 2, 
      dragImage.offsetHeight / 2
    );
    // Remove the temporary drag image after the drag starts
    e.currentTarget.addEventListener('dragstart', () => {
      if(!document.body.hasChildNodes(dragImage)){return;}
      try{
        document.body.removeChild(dragImage);
        ReactDOM.unmountComponentAtNode(dragImage);
      }
      catch(e){}
    });
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

  const handleDrop = (event, targetInputBoxId) => {
    event.preventDefault();
    const draggedChipId = event.dataTransfer.getData("text/plain");
    dispatch({
      type: ActionTypes.DROP_CHIP,
      payload: { draggedChipId, targetInputBoxId },
    });
  };

  const handleTouchEnd = useCallback((e) => {
    const touchLocation = e.changedTouches[0];
    const touchPoint = { x: touchLocation.clientX, y: touchLocation.clientY };
    const draggedChipId = e.target.id;

    const targetBoxId
      = Object
        .keys(inputBoxChips)
        .find(id => {
          // Referring to the input box element using the id
          const inputBox = document.getElementById(id);
          const boxRect = inputBox.getBoundingClientRect();
          const touchLocation = e.changedTouches[0];
          const touchPoint = { x: touchLocation.clientX, y: touchLocation.clientY };
          return (
            touchPoint.x >= boxRect.left &&
            touchPoint.x <= boxRect.right &&
            touchPoint.y >= boxRect.top &&
            touchPoint.y <= boxRect.bottom
          );
        });

    // If we found a target box, process the chip drop
    if (targetBoxId) {
      // processChipDrop(draggedChipId, targetBoxId);
      dispatch({
        type: ActionTypes.DROP_CHIP,
        payload: { draggedChipId, targetBoxId },
      });
    } else {
      // Logic for unsuccessful drop (e.g., move back to original position)
    }

    // Reset styles or any state as needed
    e.target.classList.remove('dragging');
    e.target.removeAttribute('style');
    e.target.style.position = '';
    e.target.style.left = '';
    e.target.style.top = '';
  }, [handleSayWord, sayWord]);

  useEffect(() => {
    const newWord = wordList[Math.floor(Math.random() * wordList.length)];
    const newInputBoxChips = {};
    for (let i = 0; i < newWord.length; i++) {
      newInputBoxChips[`input-box-${i}`] = null;
    }

    const characters = newWord.split('');
    const extraChars = Math.ceil(characters.length * 0.5);
    for (let i = 0; i < extraChars; i++) {
      const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      characters.push(randomChar);
    }

    const shuffledCharacters = characters.sort(() => 0.5 - Math.random());

    dispatch({
      type: ActionTypes.INIT_NEW_WORD,
      payload: {
        newWord,
        newInputBoxChips,
        shuffledCharacters,
      },
    });
  }, [dispatch]);

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
  
  // Use an effect to call your callback after the state has been updated
  useEffect(() => {
    if (hasDropped) {
      // Call your callback function
      handleSayWord();

      // Reset the drop indicator
      dispatch({ type: ActionTypes.SET_HAS_DROPPED, payload: false })
    }
  }, [hasDropped, handleSayWord, dispatch]); // Make sure to list all dependencies here
  
  useEffect(() => {
    // Perform any necessary cleanup
    return () => {
      // Remove any cloned elements that might have been appended to the body
      const dragImages = document.querySelectorAll('.drag-image'); // Use a specific class or identifier for your drag images
      dragImages.forEach(img => img.remove());
    };
  }, []); // Empty dependency array ensures this runs on mount and unmount only

  console.log(state);
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
          {Object.keys(inputBoxChips).map((inputBoxId) => {
            const chipId = inputBoxChips[inputBoxId];
            const chip = chipId ? characterChips.find(c => c.id === chipId) : null;

            return (
              <div 
                key={inputBoxId} 
                id={inputBoxId} 
                className="input-box"
                onDrop={handleDrop} 
                onDragOver={handleDragOver}>
                {chip ? <CharacterChip {...chip} /> : null}
              </div>
            );
          })}
      </div>
      <div className="character-tray">
        {characterChips.map((char, index) => (
          <CharacterChip
            key={index}
            id={`character-chip-${index}`}
            data-testid={`character-chip-${index}`}
            char={char}
            onDragStart={handleDragStart}
          />
        ))}
      </div>

    </div>
  );
}

export default App;