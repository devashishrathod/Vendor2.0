import React from 'react';

/**
 * Generic 4-column responsive grid of label/value pairs.
 * `items` is an array of { label, value, link: { text, href, onClick } }
 */
export function InfoGrid({ items }) {
  return (
    <dl className="sub-info-grid">
      {items.map((item, idx) => (
        <div className="sub-info-item" key={idx}>
          <dt>{item.label}</dt>
          <dd>
            {item.value && <span className="sub-sub-label">{item.value}</span>}
            {item.link &&
              (item.link.href ? (
                <a href={item.link.href}>{item.link.text}</a>
              ) : (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    item.link.onClick?.();
                  }}
                >
                  {item.link.text}
                </a>
              ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function InfoSection({ title, children }) {
  return (
    <section className="sub-info-section">
      <h4 className="sub-info-section__title">{title}</h4>
      {children}
    </section>
  );
}
