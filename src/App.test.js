import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('chip drag-and-drop', () => {
  it('should allow dragging a chip', () => {
    const { getByTestId } = render(<App />);
    const chipIndex = 0; // Choose the index of the chip you want to test
    const chipTestId = `character-chip-${chipIndex}`;
    const chip = getByTestId(chipTestId);
    const dataTransfer = { 
      setData: jest.fn(),
      setDragImage: jest.fn(),
    };

    fireEvent.dragStart(chip, { dataTransfer });

    expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'character-chip-0');
  });

  it('should allow dropping a chip into an input box', () => {
    const { getByTestId } = render(<App />);
    const chips = getAllByTestId('character-chip-0'); // Use `data-testid` on your chips
    const inputBox = getByTestId('input-box-0'); // Use `data-testid` on your input boxes
    const dataTransfer = { 
      getData: jest.fn(() => 'character-chip-0'),
      setDragImage: jest.fn(),
      setData: jest.fn(),
    };

    // Simulate the drag and drop
    let chip = chips[0];
    fireEvent.dragStart(chip, { dataTransfer });
    fireEvent.dragOver(inputBox, { dataTransfer });
    fireEvent.drop(inputBox, { dataTransfer });

    // Since state updates are asynchronous, we need to wait for the next tick
    return new Promise(resolve => {
      setTimeout(() => {
        // Now we can check if the chip was moved to the input box
        expect(inputBox).toContainElement(chip);
        resolve();
      }, 0);
    });
  });

  // ... additional tests ...
});