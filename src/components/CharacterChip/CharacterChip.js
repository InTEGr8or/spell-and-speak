import React from 'react';

const CharacterChip = React.forwardRef((props, ref) => {
  return (
    <div
      ref={ref}
      id={props.id}
      data-testid={props.id}
      className="character-chip"
      draggable="true"
      onDragStart={props.onDragStart}
      onTouchEnd={props.onTouchEnd}
      // onTouchMove and onTouchEnd are handled differently now
    >
      {props.char}
    </div>
  );
});

export default CharacterChip;