Create a web app to help 3-year-olds learn to read and write.  

It will be an interactive TypeScript web app that focuses on a simple-to-use mobile-friendly front end. 

The first page of the application, which I will call spell-and-speak, will present the user with a word such as "Cat". 

It will pronounce the word using a text-to-speech library and display the word for a configurable period starting with 2 seconds and then the word will fade out over 1 second. 

Below where the word was displayed there will be several boxes corresponding to the number of characters in the word, called the `input-box`es. 

Below the `input-box`es will be a `character-tray`, which will contain a set of random `character-chip`s, which be graphical squares each containing a single character. 

The `character-tray` will contain all the characters needed to spell the word, plus 50% more random characters. 

Each `character-chip` will be movable by tapping on it and moving it with your finger. 

The child will be able to move any of the characters into any `input-box`, at which point it will be centered into the box. 

Each `input-box` can hold only one character. 

Dragging a new character into an `input-box` will replace any existing content of that `input-box` and put that content back into the `character-tray`. 

Each time the child places a character into an input box the application will pronounce the string of characters that are in the `input-boxes` parsing any empty boxes as a space key.
