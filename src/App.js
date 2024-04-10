import React, { useCallback, useEffect, useReducer } from 'react';
import './App.css';
import animals from './resources/animals.json';
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
  PROGRESS_TO_NEXT_ANIMAL: 'PROGRESS_TO_NEXT_ANIMAL',
};

// Define the reducer function
const reducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_FADE_OUT:
      return {
        ...state,
        fadeOut: action.payload,
      };
    // Inside the reducer function
    case ActionTypes.PROGRESS_TO_NEXT_ANIMAL: {
      let nextAnimalIndex = (state.animalIndex + 1) % animals.length; // Wraps around to the beginning
      localStorage.setItem('animalIndex', nextAnimalIndex); // Save the new index to localStorage
      let newWordObject = animals[nextAnimalIndex];
      let newWord = newWordObject.name;
      let newInputBoxChips = {};

      for (let i = 0; i < newWord.length; i++) {
        newInputBoxChips[`input-box-${i}`] = null;
      }

      return {
        ...state,
        animalIndex: nextAnimalIndex,
        currentWord: newWord,
        inputBoxChips: newInputBoxChips,
        // Reset any other relevant state properties as needed
      };
    }
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
    characterChips: [], // Initialize with your character chips data
    inputBoxChips: {}, // Initialize with your input boxes data
    hasDropped: false,
    fadeOut: false,
    animalIndex: parseInt(localStorage.getItem('animalIndex'), 10) || 0,
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
    console.log('Utterance.text:', utterance.text);
    window.speechSynthesis.speak(utterance);
  }, [state.inputBoxChips]); // Include state.inputBoxChips in the dependency array

  // Update the handleSayWord function to accept a word parameter
  const handleSayWord = useCallback((word) => {
    console.log('handleSayWord called with word:', word);
    if ('speechSynthesis' in window) {
      // Browser supports speech synthesis
      sayWord(word);
    } else {
      // Handle the error, possibly by informing the user
      console.error('Speech synthesis not supported in this browser.');
    }
  }, [sayWord]);

  // This function is called only when the currentWord changes.
  const pronounceCurrentWord = useCallback(() => {
    if (currentWord) {
      handleSayWord(currentWord);
    }
  }, [currentWord, handleSayWord]);

  // This function is called when a chip is dropped into an input-box.
  const pronounceInputBoxes = useCallback(() => {
    // Assuming handleSayWord can handle undefined to construct the word from input boxes
    handleSayWord();
  }, [handleSayWord]);

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
    // Check if all input-boxes are filled correctly
    const allBoxesString = Object.values(state.inputBoxChips)
      .map(c => (c ?? ' ').substring(15,16)).join('');

    if (allBoxesString === state.currentWord) {
      dispatch({ type: ActionTypes.PROGRESS_TO_NEXT_ANIMAL });
    }
  }, [state.inputBoxChips, dispatch]);

  useEffect(() => {
    // Select an animal from the animal list
    const newWord = animals[state.animalIndex].name;
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
  }, [state.animalIndex, dispatch]);

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

    };
  }, [characterChips, handleTouchEnd]); // Dependency array includes characterChips to re-run the effect when it changes
  
  // Use an effect to call your callback after the state has been updated
  useEffect(() => {
    console.log('Current word is now:', currentWord);
    if (hasDropped) {
      // Call your callback function
      pronounceInputBoxes();

      // Reset the drop indicator
      dispatch({ type: ActionTypes.SET_HAS_DROPPED, payload: false })
    }
  }, [hasDropped, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps
  
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
    pronounceCurrentWord();
    // Start fade-out effect or any other related logic for new word initialization here.
    startFadeOut();
  }, [currentWord]); // eslint-disable-line react-hooks/exhaustive-deps

  // Determine the class to apply based on the state.fadeOut property
  const wordDisplayClass = state.fadeOut ? 'fade-out' : '';

  return (
    <div className="app">
      <div onClick={() => pronounceCurrentWord(currentWord)}>
        <header className="header" >
          SPELL-AND-SPEAK
        </header>
        {/* Display the current word and its image (if applicable) */}
        {currentWord && (
          <>
          <img class="word-image" src={`/assets/images/${currentWord}.webp`}  alt={currentWord} />
          <div className={`word-display ${wordDisplayClass}`}>
            <div>{currentWord}</div>
          </div>
          </>
        )}
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
        {characterChips.map((chip) => (
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