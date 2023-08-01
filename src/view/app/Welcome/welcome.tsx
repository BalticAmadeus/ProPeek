import * as React from 'react';
import './Welcome.css';
import readme from '../../../../README.md';
// import changelog from '../../../CHANGELOG.md';


import ReactMarkdown from 'react-markdown';


// Welcome.tsx
function Welcome() {
  return (
    <div className="welcome-page">
      <ReactMarkdown>{readme}</ReactMarkdown>
      <hr />
      <h1>DAFSADFASDF</h1>
      {/* <ReactMarkdown>{changelog}</ReactMarkdown> */}
    </div>
  );
}

export { Welcome };
