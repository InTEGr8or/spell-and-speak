import React, { useCallback, useEffect, useReducer } from 'react';
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
  SET_FADE_OUT: 'SET_FADE_OUT',
};

// Define the reducer function
const reducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_FADE_OUT:
      return {
        ...state,
        fadeOut: action.payload,
      };
    case ActionTypes.DROP_CHIP: {
      const { draggedChipId, targetInputBoxId} = action.payload;
      const existingChipId = state.inputBoxChips[targetInputBoxId];

      // Remove the dragged chip object from characterChips
      const newCharacterChips = state.characterChips.filter(chip => chip.id !== draggedChipId);

      // If there is an existing chip in the target input box, add it back to characterChips
      if(existingChipId) {
        const existingChip = state.characterChips.find(chip => chip.id === existingChipId);
        if(existingChip) {
          newCharacterChips.push(existingChip);
        }
      }

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
        fadeOut: false,
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
    fadeOut: false,
  };
  
  // Use useReducer hook to manage state
  const [state, dispatch] = useReducer(reducer, initialState);

  // Replace useState hooks with values from the state object
  const { currentWord, characterChips, inputBoxChips, hasDropped } = state;

  // Say the characters in the input boxes
  const sayWord = useCallback((word) => {
    if (!word) {
      // Fallback to constructing the word from the inputBoxChips state if no word is provided
      word = Object.keys(state.inputBoxChips)
        .sort() // Sort the keys to ensure the correct order
        .map(boxId => {
          const chipId = (state.inputBoxChips[boxId] ?? ' ').replace('character-chip-', '');
          return chipId[0]; // Assuming chipId is like 'character-chip-A'
        })
        .join('')
        .replace(/\s{2,}/g, ' ');
    }

    // Use the SpeechSynthesis API to pronounce the word
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.6;
    window.speechSynthesis.speak(utterance);
  }, [state.inputBoxChips]); // Include state.inputBoxChips in the dependency array

  // Update the handleSayWord function to accept a word parameter
  const handleSayWord = useCallback((word) => {
    if ('speechSynthesis' in window) {
      // Browser supports speech synthesis
      sayWord(word);
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

    // Remove the drag image from the DOM after the drag operation starts
    setTimeout(() => {
      if(document.body.contains(dragImage)){
        document.body.removeChild(dragImage);
      }
    }, 0); // Use setTimeout to defer the removal until after the drag image is used
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
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

    // Make sure that targetInputBoxId is defined
    if (typeof targetInputBoxId === 'undefined') {
      return; // Exit early if targetInputBoxId is not valid
    }
    dispatch({
      type: ActionTypes.DROP_CHIP,
      payload: { draggedChipId, targetInputBoxId },
    });
  };

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault(); // Prevent the default touch behavior
    const touchLocation = e.changedTouches[0];
    const touchPoint = { x: touchLocation.clientX, y: touchLocation.clientY };
    const draggedChipId = e.target.id;

    const targetInputBoxId
      = Object
        .keys(inputBoxChips)
        .find(id => {
          const inputBox = document.getElementById(id);
          const boxRect = inputBox.getBoundingClientRect();
          return (
            touchPoint.x >= boxRect.left &&
            touchPoint.x <= boxRect.right &&
            touchPoint.y >= boxRect.top &&
            touchPoint.y <= boxRect.bottom
          );
        });


    // If we found a target box, process the chip drop
    if (targetInputBoxId) {
      // You can now use chipChar if needed for further logic
      dispatch({
        type: ActionTypes.DROP_CHIP,
        payload: { draggedChipId, targetInputBoxId }, // Include chipChar in the payload if necessary
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
  }, [inputBoxChips]);

  useEffect(() => {
    const newWord = wordList[Math.floor(Math.random() * wordList.length)];
    const newInputBoxChips = {};
    for (let i = 0; i < newWord.length; i++) {
      newInputBoxChips[`input-box-${i}`] = null;
    }

    // Split the new word into characters and create chips for them
    const wordCharacters = newWord.split('').map((char, index) => ({
      id: `character-chip-${char}-${index}`,
      char: char
    }));

    // Create extra random characters and add them to the array
    const extraChars = Math.ceil(newWord.length * 0.5);
    const randomCharacters = Array.from({ length: extraChars }, (_, i) => {
      const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      return {
        id: `character-chip-${randomChar}-${newWord.length + i}`,
        char: randomChar
      };
    });

    // Combine the word characters with the extra random characters
    const characters = [...wordCharacters, ...randomCharacters];

    // Shuffle the combined characters array
    const shuffledCharacters = characters.sort(() => 0.5 - Math.random());

    // Dispatch the INIT_NEW_WORD action with the new structure
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

  // Call this function to start the fade-out effect
  const startFadeOut = useCallback(() => {
    dispatch({ type: ActionTypes.SET_FADE_OUT, payload: true });

  }, [dispatch]);

  useEffect(() => {
    // If the currentWord changes and is not empty, start the fade-out effect
    if (currentWord) {
      startFadeOut();
    }
  }, [currentWord, startFadeOut]);

  // ... rest of your component ...

  // Determine the class to apply based on the state.fadeOut property
  const wordDisplayClass = state.fadeOut ? 'fade-out' : '';

  return (
    <div className="app">
      <header className="header" onClick={() => handleSayWord(currentWord)}>
        SPELL-AND-SPEAK
      </header>
      <span className="audio-icon" onClick={() => handleSayWord(currentWord)}>🔊</span>
      <div className={`word-display ${wordDisplayClass}`} onClick={() => handleSayWord(currentWord)}>
        {currentWord}
      </div>
      <div
        className="input-boxes">
        {Object.keys(inputBoxChips).map((inputBoxId) => {
          const chipId = inputBoxChips[inputBoxId];
          const chip = chipId ? {id: chipId, char: chipId.substring(15,16)} : null;

          return (
            <div 
              key={inputBoxId} 
              id={inputBoxId} 
              className="input-box"
              onDrop={(event) => handleDrop(event, inputBoxId)} // Pass the inputBoxId to handleDrop
              onDragOver={handleDragOver}>
              {chip ? <CharacterChip {...chip} /> : null}
            </div>
          );
        })}
      </div>
      <div className="character-tray">
        {characterChips.map((chip, index) => (
          <CharacterChip
            key={chip.id}
            id={chip.id}
            data-testid={chip.id}
            char={chip.char} // Make sure to render `chip.char`, not the whole `chip` object
            onDragStart={handleDragStart}
          />
        ))}
      </div>

    </div>
  );
}

export default App;