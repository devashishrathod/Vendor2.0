import React from 'react';
import { STATIC_TEXT } from '../constants/subscription.constants';

export default function PageHeader() {
  return (
    <div className="sub-page-header">
      <h1>{STATIC_TEXT.PAGE_TITLE}</h1>
      <p>{STATIC_TEXT.PAGE_SUBTITLE}</p>
    </div>
  );
}
