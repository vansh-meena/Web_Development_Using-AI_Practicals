export default function Faq({ items }) {
  return (
    <div className="faq-list">
      {items.map((item) => (
        <details className="faq-item" key={item.question}>
          <summary><span>{item.question}</span><span className="faq-plus" aria-hidden="true">+</span></summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
