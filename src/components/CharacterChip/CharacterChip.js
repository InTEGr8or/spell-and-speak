
const CharacterChip = (props) => {
  return (
    <div
      id={props.id}
      data-testid={props.id}
      className="character-chip"
      draggable="true"
      onDragStart={props.onDragStart}
    >
      {props.char}
    </div>
  );
};

export default CharacterChip;