I had been using this:

```js
// Use an effect to call your callback after the state has been updated
useEffect(() => {
  if (hasDropped) {
    // Call your callback function
    handleSayWord();

    // Reset the drop indicator
    dispatch({ type: ActionTypes.SET_HAS_DROPPED, payload: true })
  }
}, [hasDropped, handleSayWord, dispatch]); // Make sure to list all dependencies here
```

I am not sure if that is still needed, or how I should call `handleSayWord()` in the `reducer()` way of state management and `ActionTypes`

These are both in `reducer()`:

```js
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
```
and

```js
    case ActionTypes.SET_HAS_DROPPED:
      return {
        ...state,
        hasDropped: action.payload,
      };
```

and I have this:

```js
  const handleDrop = (event, targetInputBoxId) => {
    event.preventDefault();
    const draggedChipId = event.dataTransfer.getData("text/plain");
    dispatch({
      type: ActionTypes.DROP_CHIP,
      payload: { draggedChipId, targetInputBoxId },
    });
  };
```