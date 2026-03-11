import React from 'react';
import './SeedPhraseDisplay.css';

interface SeedPhraseDisplayProps {
  words: string[];
  showWarning?: boolean;
}

const SeedPhraseDisplay: React.FC<SeedPhraseDisplayProps> = ({ words, showWarning = true }) => {
  return (
    <div className="seed-phrase-display">
      {showWarning && (
        <div className="warning-banner">
          <span className="warning-icon">⚠️</span>
          <div className="warning-text">
            <strong>WRITE THIS DOWN!</strong>
            <p>Store these words in a safe place. Anyone with these words can access your funds.</p>
          </div>
        </div>
      )}
      
      <div className="seed-phrase-grid">
        {words.map((word, index) => (
          <div key={index} className="seed-word-item">
            <span className="word-number">{index + 1}.</span>
            <span className="word-text">{word}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeedPhraseDisplay;
