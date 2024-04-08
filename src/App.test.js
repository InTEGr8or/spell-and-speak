import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('chip drag-and-drop', () => {
  it('should allow dragging a chip', () => {
    const { getByTestId } = render(<App />);
    const chipTestId = 'character-chip-T-0';
    const chip = getByTestId(chipTestId);
    const dataTransfer = { 
      setData: jest.fn(),
      setDragImage: jest.fn(),
    };

    fireEvent.dragStart(chip, { dataTransfer });

    expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'character-chip-0');
  });

  it('should allow dropping a chip into an input box', async () => {
    const { getByTestId } = render(<App />);
    // Assuming the first character is 'T' and its index would be '0'
    const chipTestId = 'character-chip-T-0';
    const chip = getByTestId(chipTestId);
    const inputBox = getByTestId('input-box-0');
    const dataTransfer = {
      getData: jest.fn(() => chipTestId),
      setDragImage: jest.fn(),
      setData: jest.fn(),
    };

    // Simulate the drag and drop
    fireEvent.dragStart(chip, { dataTransfer });
    fireEvent.dragOver(inputBox, { dataTransfer });
    fireEvent.drop(inputBox, { dataTransfer });

    // Since state updates are asynchronous, we need to wait for the next tick
    await new Promise(resolve => setTimeout(resolve, 0));

    // Now we can check if the chip was moved to the input box
    // Note: This assertion may need to change based on how you're updating the DOM
    expect(inputBox).toContainElement(chip);
  });

  // ... additional tests ...
});