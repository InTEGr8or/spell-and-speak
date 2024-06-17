---
original file name: Codeium Chat - LHkqppVSv6Y64Yao5chA086DBcMyqnBZ.md
summary: The user wanted to add a confetti celebration when a user correctly spells a word in a React application. They provided a `useEffect` function that checks for the correct word and triggers a celebration. The user asked for the easiest way to add the confetti effect.

I suggested using the `canvas-confetti` package that was already listed in the project's `package.json` file. I provided guidance on how to import and use the `canvas-confetti` function in the `useEffect` to trigger the confetti celebration.

The user confirmed that the solution worked perfectly and then asked how to make the confetti effect bigger and last longer. I provided information on customizing the `confetti()` function call with options such as `particleCount`, `spread`, `startVelocity`, `gravity`, `ticks`, and `origin` to adjust the size and duration of the confetti effect.
date: 2024-06-16T22:01
---

# Codeium Chat Conversation

Note: _This is purely the output of the chat conversation and does not contain any raw data, codebase snippets, etc. used to generate the output._

**User** _at 10:01 pm, Jun 16, 2024_

I want to add a confetti celebration when a user correctly spells a word.

It should be called in this `useEffect`:

```tsx
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
```

What is the easiest way to do that?

---

**Codeium** _at 10:01 pm, Jun 16, 2024_

To add a confetti celebration, you can use the `canvas-confetti` package which is already listed in your `package.json`. First, import the `canvas-confetti` function at the top of your `App.js` file. Then trigger the confetti when the condition `allBoxesString === state.currentWord` is met.

Here's how you can modify your `useEffect`:

```tsx
import confetti from 'canvas-confetti';

// MARK: UseEffects
useEffect(() => {
  // Check if all input-boxes are filled correctly
  const allBoxesString = Object.values(state.inputBoxChips)
    .map(c => (c ?? ' ').substring(15,16)).join('');

  if (allBoxesString === state.currentWord) {
    // Trigger confetti celebration
    confetti();

    dispatch({ type: ActionTypes.CONGRATULATE });

    // Progress to next animal
    setTimeout(() => {
      dispatch({ type: ActionTypes.PROGRESS_TO_NEXT_ANIMAL });
    }, congratulationsMilliseconds)
  }
}, [state.inputBoxChips, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps
```

Make sure `canvas-confetti` is installed in your project. If it's not yet installed, you can add it by running:

```sh
npm install canvas-confetti
```

The `confetti()` function can be called with various options to customize the effect. Since you haven't provided specific requirements for the confetti, the default behavior will be used. To customize, refer to the `canvas-confetti` documentation.

---

**User** _at 10:04 pm, Jun 16, 2024_

That works perfectly. How can I make it bigger and longer?

---

**Codeium** _at 10:05 pm, Jun 16, 2024_

To make the confetti effect bigger and last longer, you can customize the `confetti()` function call with options. Here's an example of how you might adjust the size and duration:

```tsx
confetti({
  particleCount: 150,     // Increase number of particles
  spread: 70,             // Wider spread
  startVelocity: 30,      // Higher initial velocity
  gravity: 0.5,           // Adjust gravity, less means longer float
  ticks: 200,             // Number of times the confetti will move (duration)
  origin: {               // Where on the page the confetti will start
    x: 0.5,               // Horizontal center
    y: 0.5                // Vertical center
  }
});
```

You can tweak these numbers to get the desired effect. The `particleCount` can be increased for more confetti, `spread` to make it spread out more, `startVelocity` for faster initial speed, `gravity` for how quickly they fall, and `ticks` for how long the confetti will animate. The `origin` object determines where the confetti will start on the page, with `x: 0.5` and `y: 0.5` being the center of the page.

Experiment with these values to get the celebration effect you're happy with.