import React, { useCallback, useState, useEffect, useReducer } from 'react';
import './App.css';
import animals from './resources/animals.json';
import CharacterChip from './components/CharacterChip/CharacterChip';
import './components/CharacterChip/CharacterChip.css';

// Define action types
const ActionTypes = {
  MOVE_CHIP: 'MOVE_CHIP',
  DROP_CHIP: 'DROP_CHIP',
  SET_CHARACTER_CHIPS: 'SET_CHARACTER_CHIPS',
  SET_INPUT_BOX_CHIPS: 'SET_INPUT_BOX_CHIPS',
  SET_HAS_DROPPED: 'SET_HAS_DROPPED',
  INIT_NEW_WORD: 'INIT_NEW_WORD',
  SET_FADE_OUT: 'SET_FADE_OUT',
  PROGRESS_TO_NEXT_ANIMAL: 'PROGRESS_TO_NEXT_ANIMAL',
  INCREMENT_ANIMAL_INDEX: 'INCREMENT_ANIMAL_INDEX',
  DECREMENT_ANIMAL_INDEX: 'DECREMENT_ANIMAL_INDEX',
};

// Define the reducer function
const reducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_FADE_OUT:
      return {
        ...state,
        fadeOut: action.payload,
      };

    case ActionTypes.MOVE_CHIP: {
      const { sourceChipId, sourceLocation, targetInputBoxId } = action.payload;

      // Logic to remove the chip from its source
      const newCharacterChips = sourceLocation === 'character-tray'
        ? state.characterChips.filter(chip => chip.id !== sourceChipId)
        : state.characterChips.slice(); // Create a shallow copy to modify

      const newInputBoxChips = { ...state.inputBoxChips };

      // If the source is an input box, clear the chip from that input box
      if (sourceLocation.includes('input-box')) {
        newInputBoxChips[sourceLocation] = null;
      }

      // Check if there's already a chip in the target input box
      const replacedChipId = state.inputBoxChips[targetInputBoxId];
      if (replacedChipId) {
        // Add the replaced chip back to the character tray
        newCharacterChips.push({
          id: replacedChipId,
          // You may need to include other properties to construct the chip object
          // For example, if you need the character (char) associated with the chip
          char: replacedChipId.substring(15,16), // Modify depending on your ID structure
        });
      }

      // Logic to place the new chip into the target box
      newInputBoxChips[targetInputBoxId] = sourceChipId;

      return {
        ...state,
        characterChips: newCharacterChips,
        inputBoxChips: newInputBoxChips,
      };
    }

    case ActionTypes.INCREMENT_ANIMAL_INDEX: {
      const incrementedIndex = (state.animalIndex + 1) % animals.length;
      localStorage.setItem('animalIndex', incrementedIndex);
      // ... logic to update state based on incrementedIndex ...
      return {
        ...state,
        animalIndex: incrementedIndex,
        // ... other state updates if needed ...
      };
    }
    case ActionTypes.DECREMENT_ANIMAL_INDEX: {
      const decrementedIndex = (state.animalIndex - 1 + animals.length) % animals.length;
      localStorage.setItem('animalIndex', decrementedIndex);
      // ... logic to update state based on decrementedIndex ...
      return {
        ...state,
        animalIndex: decrementedIndex,
        // ... other state updates if needed ...
      };
    }

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
  const [chipRefs, setChipRefs] = useState({});

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
    e.dataTransfer.setData('parentId', e.nativeEvent.target.parentNode.id);

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

  const handleTouchMove = useCallback((e) => {
    e.target.classList.add('dragging');
    e.parentId =e.target.parentNode.id;
    // Get the touch coordinates
    const touchLocation = e.targetTouches[0];
    // Set the style to move the element with the touch
    e.target.style.position = 'absolute';
    e.target.style.left = `${touchLocation.pageX - e.target.offsetWidth / 2}px`;
    e.target.style.top = `${touchLocation.pageY - e.target.offsetHeight / 2}px`;
  }, []);

  const handleDrop = (event, targetInputBoxId) => {
    event.preventDefault();
    // Get the dragged chip ID either from touch or mouse dataTransfer
    const draggedChipId 
      = event.dataTransfer
      ? event.dataTransfer.getData("text/plain")
      : event.target.id; // Assuming the touch event sets the id on the target

    let draggedFromLocation 
      = event.dataTransfer
      ? event.dataTransfer.getData("parentId")
      : event.parentId; // 'characterChips' or 'inputBoxChips'

    const droppedIntoInputBoxId = targetInputBoxId;
    // Update the state to reflect the chip moving from the source to the destination
    dispatch({
      type: ActionTypes.MOVE_CHIP,
      payload: {
        sourceChipId: draggedChipId,
        sourceLocation: draggedFromLocation, // 'characterChips' or 'inputBoxChips'
        targetInputBoxId: droppedIntoInputBoxId, // This might be undefined if dropping back to character tray
      },
    });
  };

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault(); // Prevent the default touch behavior
    const touchLocation = e.changedTouches[0];
    const touchPoint = { x: touchLocation.clientX, y: touchLocation.clientY };
    const draggedChipId = e.target.id;
    // const sourceLocation = /* determine if the chip came from an input box or the character tray */;

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

    // Reset styles or any state as needed
    e.target.classList.remove('dragging');
    e.target.removeAttribute('style');
    e.target.style.position = '';
    e.target.style.left = '';
    e.target.style.top = '';
    // Determine if the chip was dragged from an input box or the character tray for touch or click.
    const parentId 
      = e.target.parentNode
      ? e.target.parentNode.id
      : document.getElementById(e.target.id).parentNode.id;
    // Call handleDrop with the necessary information
    handleDrop({
      preventDefault: () => {}, // Mock preventDefault function
      dataTransfer: false, // Mock dataTransfer
      parentId: parentId,
      target: { id: draggedChipId }, // Set the id of the dragged chip
    }, targetInputBoxId);
  }, [inputBoxChips]);

  useEffect(() => {
    // Check if all input-boxes are filled correctly
    const allBoxesString = Object.values(state.inputBoxChips)
      .map(c => (c ?? ' ').substring(15,16)).join('');

    if (allBoxesString === state.currentWord) {
      dispatch({ type: ActionTypes.PROGRESS_TO_NEXT_ANIMAL });
    }
  }, [state.inputBoxChips, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

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
  
  // Use an effect to call your callback after the state has been updated
  useEffect(() => {
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
  }, [state.currentWord]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Create a ref for each character chip
    const newChipRefs = characterChips.reduce((acc, chip) => {
      acc[chip.id] = React.createRef();
      return acc;
    }, {});

    setChipRefs(newChipRefs);
  }, [characterChips]);

  useEffect(() => {
    const handleTouchMove = (e) => {
      e.preventDefault(); // This should prevent the default scrolling behavior
      // Duplicated from handleTouchMove
      e.target.classList.add('dragging');
      e.parentId =e.target.parentNode.id;
      // Get the touch coordinates
      const touchLocation = e.targetTouches[0];
      // Set the style to move the element with the touch
      e.target.style.position = 'absolute';
      e.target.style.left = `${touchLocation.pageX - e.target.offsetWidth / 2}px`;
      e.target.style.top = `${touchLocation.pageY - e.target.offsetHeight / 2}px`;
    };
    // Attach the event listener to each chip
    Object.values(chipRefs).forEach(ref => {
      const chipElement = ref.current;
      if (chipElement) {
        chipElement.addEventListener('touchmove', handleTouchMove, { passive: false });
      }
    });

    // Cleanup function to remove the event listeners
    return () => {
      Object.values(chipRefs).forEach(ref => {
        const chipElement = ref.current;
        if (chipElement) {
          chipElement.removeEventListener('touchmove', handleTouchMove);
        }
      });
    };
  }, [chipRefs, handleTouchMove]); // Run this effect whenever chipRefs changes

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
            <img className="word-image" src={`/assets/images/${currentWord}.webp`}  alt={currentWord} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="nav-buttons" onClick={() => dispatch({ type: ActionTypes.DECREMENT_ANIMAL_INDEX })}>
                &larr;
              </div>
              <div className={`word-display ${wordDisplayClass}`}>{currentWord}</div>
              <div className="nav-buttons"onClick={() => dispatch({ type: ActionTypes.INCREMENT_ANIMAL_INDEX })}>
                &rarr;
              </div>
            </div>
          </>
        )}
      </div>
      <div
        id="input-boxes"
        className="input-boxes">
        {Object.keys(inputBoxChips).map((inputBoxId) => {
          const chipId = inputBoxChips[inputBoxId];
          const chip = chipId ? {
            id: chipId, 
            char: chipId.substring(15,16),
            onDragStart: handleDragStart,
          } : null;
          return (
            <div 
              key={inputBoxId} 
              id={inputBoxId} 
              className="input-box"
              onDrop={(event) => handleDrop(event, inputBoxId)} // Pass the inputBoxId to handleDrop
              onTouchEnd={handleTouchEnd}
              onDragOver={handleDragOver}>
              {chip ? <CharacterChip {...chip} /> : null}
            </div>
          );
        })}
      </div>
      <div
        id="character-tray" 
        className="character-tray" >
        {characterChips.map((chip) => (
          <CharacterChip
            ref={chipRefs[chip.id]} // Attach the correct ref for this chip
            key={chip.id}
            id={chip.id}
            char={chip.char}
            onDragStart={handleDragStart}
            onTouchEnd={handleTouchEnd}
            // onTouchMove and onTouchEnd are now handled by the added event listener
          />
        ))}
      </div>

    </div>
  );
}

export default App;