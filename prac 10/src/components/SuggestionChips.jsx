const CHIPS = [
  'How do I apply?',
  'What courses are offered?',
  'Tell me about hostels',
  'How are placements?',
];

export default function SuggestionChips({ onPick }) {
  return (
    <div className="suggestion-chips">
      {CHIPS.map((chip) => (
        <button
          key={chip}
          type="button"
          className="chip"
          onClick={() => onPick(chip)}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
