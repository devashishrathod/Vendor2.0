import React from 'react';
import { STATIC_TEXT } from '../constants/subscription.constants';

export default function SectionHeader() {
  return (
    <div className="sub-section-header">
      <h2>{STATIC_TEXT.SECTION_TITLE}</h2>
      <p>{STATIC_TEXT.SECTION_SUBTITLE}</p>
    </div>
  );
}
