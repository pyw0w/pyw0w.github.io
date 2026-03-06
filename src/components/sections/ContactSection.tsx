import type { ContactLink } from '../../types';
import { RevealSection } from '../ui/RevealSection';

interface ContactSectionProps {
  summary: string;
  contacts: ContactLink[];
}

export function ContactSection({ summary, contacts }: ContactSectionProps) {
  return (
    <RevealSection
      id="contact"
      eyebrow="Контакт"
      title="Если нужен сильный visual direction с нормальной инженерной дисциплиной, можно писать."
      subtitle={summary}
    >
      <div className="contact-grid">
        {contacts.map((contact) => (
          <a key={contact.href} className="contact-card" href={contact.href} target="_blank" rel="noreferrer">
            <span className="contact-label">{contact.label}</span>
            <strong>{contact.note}</strong>
          </a>
        ))}
      </div>
    </RevealSection>
  );
}
