import React, { useCallback, useState, useRef, useEffect, useReducer } from 'react';
import './App.css';
import animals from './resources/animals.json';
import CharacterChip from './components/CharacterChip/CharacterChip';
import './components/CharacterChip/CharacterChip.css';
import AWS from 'aws-sdk';
import { CognitoIdentityCredentials, config as AWSConfig } from 'aws-sdk';
import Polly from 'aws-sdk/clients/polly';

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
  CONGRATULATE: 'CONGRATULATE',
};

AWS.config.region = 'us-east-1';
AWS.config.credentials = new CognitoIdentityCredentials({
  IdentityPoolId: 'us-east-1:5ee4b58d-942a-4568-a4d5-4dcc551259c3',
})

// Define the reducer function
const reducer = (state, action) => {
  //MARK: Reducer
  switch (action.type) {
    case ActionTypes.SET_FADE_OUT:
      return {
        ...state,
        fadeOut: action.payload,
      };

    case ActionTypes.MOVE_CHIP: {
      const { sourceChipId, sourceLocation, targetInputBoxId } = action.payload;
      if(!targetInputBoxId) return state;
      if(targetInputBoxId === sourceLocation){
        // This is a character tap.
        // TODO: Add logic to handle character tap like make pronounce it
        return state;
      }

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
      const newWord = animals[incrementedIndex].name;
      localStorage.setItem('currentWord', newWord);
      // ... logic to update state based on incrementedIndex ...
      return {
        ...state,
        currentWord: newWord,
        resetWord: true,
        animalIndex: incrementedIndex,
        // fadeOut: true,
        // ... other state updates if needed ...
      };
    }
    case ActionTypes.DECREMENT_ANIMAL_INDEX: {
      const decrementedIndex = (state.animalIndex - 1 + animals.length) % animals.length;
      localStorage.setItem('animalIndex', decrementedIndex);
      const newWord = animals[decrementedIndex].name;
      localStorage.setItem('currentWord', newWord);
      // ... logic to update state based on decrementedIndex ...
      return {
        ...state,
        currentWord: newWord,
        resetWord: true,
        animalIndex: decrementedIndex,
        // fadeOut: true,
        // ... other state updates if needed ...
      };
    }

    case ActionTypes.PROGRESS_TO_NEXT_ANIMAL: {
      let nextAnimalIndex = (state.animalIndex + 1) % animals.length; // Wraps around to the beginning
      localStorage.setItem('animalIndex', nextAnimalIndex); // Save the new index to localStorage
      let newWordObject = animals[nextAnimalIndex];
      let newWord = newWordObject.name;
      localStorage.setItem('currentWord', newWord);
      let newInputBoxChips = {};

      for (let i = 0; i < newWord.length; i++) {
        newInputBoxChips[`input-box-${i}`] = null;
      }

      return {
        ...state,
        animalIndex: nextAnimalIndex,
        currentWord: newWord,
        resetWord: true,
        inputBoxChips: newInputBoxChips,
        // fadeOut: true,
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
      debugger;
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
      debugger;
      return {
        ...state,
        hasDropped: action.payload,
      };
    case ActionTypes.CONGRATULATE: {
      // Set each input box border to solid green and then fade them out
      const inputBoxElements = document.querySelectorAll('.input-box');
      inputBoxElements.forEach(inputBox => {
        inputBox.style.border = '2px solid green';
      });
      setTimeout(() => {
        inputBoxElements.forEach(inputBox => {
          inputBox.style.transition = 'opacity 1s ease-in-out';
          inputBox.style.opacity = 0;
        });
      }, 1000);
      return {
        ...state,
        // Reset any other relevant state properties as needed
      };
    }
    case ActionTypes.INIT_NEW_WORD: {
      const { newWord, newInputBoxChips, shuffledCharacters } = action.payload;
      console.log('INIT_NEW_WORD newInputBoxChips', newInputBoxChips);
      const inputBoxElements = document.querySelectorAll('.input-box');
      inputBoxElements.forEach(inputBox => {
        inputBox.style.border = '1px dashed grey';
        inputBox.style.opacity = 1;
        inputBox.style.transition = null;
      });
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

const letterSounds = {
  'A': 'ah or ay',
  'B': 'beh',
  'C': 'keh or seh',
  'D': 'deh',
  'E': 'eh or ee',
  'F': 'feh',
  // Add other letters and their phonetic sounds here
};

const getVoice = () => {
  // Select the best voice based on the current word
  // This is a placeholder; you'll need to replace it with your actual logic
  const voices = window.speechSynthesis.getVoices();
  let naturalEnglishVoices = voices.filter(v => v.name.match('Natural.*English.*United States'));
  const emma = naturalEnglishVoices.find(v => v.name.match('Emma')) || null;
  let voice = emma 
    ||(naturalEnglishVoices.length ? naturalEnglishVoices[0] : window.speechSynthesis.getVoices()[0]) 
    || null ;
  console.log('Useing voice', voice);
  return voice;
}

function pronounceLetterSound(letter) {
  const sound = letterSounds[letter.toUpperCase()];
  if (sound) {
    const utterance = new SpeechSynthesisUtterance(sound);
    utterance.voice = getVoice(); // Make sure you've defined selectVoice() to choose the best voice
    utterance.rate = 0.6; // You can adjust the rate and other properties as needed
    window.speechSynthesis.speak(utterance);
  } else {
    console.error('Sound not found for letter:', letter);
  }
}

function App() {
  //MARK: App
  const congratulationsMilliseconds = 1500;
  const wordFadeOutMilliseconds = 1000;
  const usePolly = false;
  // Define the initial state within the App or import from another file

  let storedInputBoxChips = JSON.parse(localStorage.getItem('inputBoxChips')) || {};
  const initialState = {
    characterChips: [], // Initialize with your character chips data
    inputBoxChips: storedInputBoxChips, // Initialize with your input boxes data
    hasDropped: false,
    fadeOut: false,
    resetWord: false,
    animalIndex: parseInt(localStorage.getItem('animalIndex'), 10) || 0,
  };
  
  console.log("Animals: ", animals.length);

  // Use useReducer hook to manage state
  const [state, dispatch] = useReducer(reducer, initialState);
  // Replace useState hooks with values from the state object
  const { currentWord, characterChips, inputBoxChips, hasDropped } = state;

  const [chipRefs, setChipRefs] = useState({});

  // Store previous value of currentWord to determine if it has changed
  const prevWordRef = {current: useRef(state.currentWord)};

  useEffect(() => {
    prevWordRef.current = state.currentWord;
  });

  const getInputBoxWord = () => {
    let word = Object.keys(state.inputBoxChips)
      .sort() // Sort the keys to ensure the correct order
      .map(boxId => {
        const chipId = (state.inputBoxChips[boxId] ?? ' ').replace('character-chip-', '');
        return chipId[0]; // Assuming chipId is like 'character-chip-A'
      })
      .join('')
      .replace(/\s{2,}/g, ' ');
    return word;
  }

  // MARK: sayWord and useEffets
  // Say the characters in the input boxes
  const sayWordWithBrowser = useCallback((word) => {
    // Use the SpeechSynthesis API to pronounce the word
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.6;
    utterance.voice = getVoice();
    window.speechSynthesis.speak(utterance);
  }, [state.inputBoxChips]); // Include state.inputBoxChips in the dependency array

  const sayWithPolly = (word) => {
    const polly = new Polly({ apiVersion: '2016-06-10' });

    const params = {
      OutputFormat: 'mp3', // You can also choose other formats like 'ogg_vorbis'
      Text: word,
      VoiceId: 'Joanna', // Choose a voice ID from those available in Polly
      TextType: 'text' // You can also use ssml if your text contains SSML tags
    };

    polly.synthesizeSpeech(params, (err, response) => {
      if (err) {
        console.error(err.message);
      } else if (response) {
        // Play the audio stream returned by Polly
        const audioBlob = new Blob([response.AudioStream], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      }
    });
  }
  const sayWithBrowser = (word) => {
    if ('speechSynthesis' in window) {
      // Browser supports speech synthesis
      sayWordWithBrowser(word);
    } else {
      // Handle the error, possibly by informing the user
      console.error('Speech synthesis not supported in this browser.');
    }
  }

  // Update the handleSayWord function to accept a word parameter
  const handleSayWord = useCallback((word) => {
    word = word ?? getInputBoxWord();

    if(usePolly){
      sayWithPolly(word);
    } else {
      sayWithBrowser(word);
    }
  }, [sayWordWithBrowser]);

  // This function is called only when the currentWord changes.
  const pronounceCurrentWord = useCallback(() => {
    // I have kind of man-handled the word display fade out here because React was eating the update latency.
    // I need the word to display breifly, often, and then fade out.
    if(document.getElementById('word-display')){
      if(document.getElementById('word-display').classList?.contains('fade-out')){
        document.getElementById('word-display').classList.remove('fade-out');
        setTimeout(() => {
          document.getElementById('word-display').classList.add('fade-out');
        }, wordFadeOutMilliseconds);
      }
    }
    if (currentWord) {
      handleSayWord(currentWord);
    }
  }, [currentWord]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    pronounceCurrentWord();
  }, [state.currentWord]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Set fadOut to false when the current word changes
    dispatch({ type: ActionTypes.SET_FADE_OUT, payload: true });
    console.log('Current word is now:', state.currentWord);
    console.log('useEfect triggered for currentWord inputBoxChips:', state.inputBoxChips);
    if (prevWordRef.current !== undefined && prevWordRef.current !== state.currentWord) {
      dispatch({ type: ActionTypes.SET_INPUT_BOX_CHIPS, payload: {} });
    }
  }, [state.currentWord]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // If fadeOut is true, start the fade-out effect
    dispatch({ type: ActionTypes.SET_FADE_OUT, payload: true });
  }, [state.fadeOut]); // eslint-disable-line react-hooks/exhaustive-deps

  // This function is called when a chip is dropped into an input-box.
  const pronounceInputBoxes = useCallback(() => {
    // Assuming handleSayWord can handle undefined to construct the word from input boxes
    handleSayWord();
  }, [handleSayWord]);

  useEffect(() => {
    console.log('useEffect triggered for inputBoxChips:', inputBoxChips);
    pronounceInputBoxes();
  }, [inputBoxChips]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect((e) => {
    // Save input-boxes state to local storage when it changes
    console.log('storing inputBoxChips:', inputBoxChips);
    console.log('characterChips:', characterChips);
    console.log('currentWord:', currentWord);
    console.log('prevWordRef.current:', prevWordRef.current);
    localStorage.setItem('inputBoxChips', JSON.stringify(inputBoxChips));
  }, [inputBoxChips]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check for stored input-boxes state on component mount and restore it
  useEffect(() => {
    const storedInputBoxChips = localStorage.getItem('inputBoxChips') || '{}';
    console.log('storedInputBoxChips:', storedInputBoxChips);
    if (storedInputBoxChips) {
      const parsedInputBoxChips = JSON.parse(storedInputBoxChips);
      dispatch({ type: ActionTypes.SET_INPUT_BOX_CHIPS, payload: parsedInputBoxChips });
    }
  }, []);

  // MARK: Functions
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
    // console.log('handleTouchMove', e);
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

    // Don't drag an input box.
    if(draggedChipId.includes("input-box-")) return;

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
    // MARK: Handle touch end
    console.log("handleTouchEnd", e);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // MARK: UseEffects
  useEffect(() => {
    // Check if all input-boxes are filled correctly
    const allBoxesString = Object.values(state.inputBoxChips)
      .map(c => (c ?? ' ').substring(15,16)).join('');

    if (allBoxesString === state.currentWord) {
      // TODO: Celebrate success better
      dispatch({ type: ActionTypes.CONGRATULATE });

      // Progress to next animal
      setTimeout(() => {
        dispatch({ type: ActionTypes.PROGRESS_TO_NEXT_ANIMAL });
      }, congratulationsMilliseconds)
    }
  }, [state.inputBoxChips, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Select an animal from the animal list
    const newWord = animals[state.animalIndex].name;
    let newInputBoxChips = JSON.parse(localStorage.getItem('inputBoxChips')) || {};

    if(state.resetWord){
      newInputBoxChips = {};
      for (let i = 0; i < newWord.length; i++) {
        newInputBoxChips[`input-box-${i}`] = null;
      }
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
  }, [state.animalIndex, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Use an effect to call your callback after the state has been updated
  useEffect(() => {
    if (hasDropped) {
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
      // console.log('handleTouchMove in useEffect', e);
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

  // MARK: return JSX
  return (
    <div className="app">
      <div>
        <header className="header" >
          spell-and-speak.com
        </header>
        {/* Display the current word and its image (if applicable) */}
        {currentWord && (
          <>
            <img
              onClick={() => pronounceCurrentWord(currentWord)}
              className="word-image"
              src={`/assets/images/${currentWord}.webp`}  alt={currentWord} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="nav-buttons" onClick={() => dispatch({ type: ActionTypes.DECREMENT_ANIMAL_INDEX })}>
                &larr;
              </div>
              <label
                id="word-display"
                onClick={() => pronounceCurrentWord(currentWord)}
                className={`word-display ${wordDisplayClass}`}
                >{currentWord}</label>
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
          } : null;
          return (
            <div
              key={inputBoxId}
              id={inputBoxId}
              className="input-box"
              onDrop={(event) => handleDrop(event, inputBoxId)} // Pass the inputBoxId to handleDrop
              // onTouchEnd={handleTouchEnd}
              onDragOver={handleDragOver}
              >
              {chip ? <CharacterChip
                ref={chipRefs[chip.id]} // Attach the correct ref for this chip
                key={chip.id}
                id={chip.id}
                char={chip.char}
                onDragStart={handleDragStart}
                onTouchEnd={handleTouchEnd}
                // onTouchMove and onTouchEnd are now handled by the added event listener
              /> : null}
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