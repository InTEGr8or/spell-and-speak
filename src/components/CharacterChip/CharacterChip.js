
const CharacterChip = ({ id, char, onDragStart }) => {
  return (
    <div
      id={id}
      data-testid={id}
      className="character-chip"
      draggable="true"
      onDragStart={onDragStart}
    >
      {char}
    </div>
  );
};

export default CharacterChip;