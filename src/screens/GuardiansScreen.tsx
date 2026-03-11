import React, { useState, useEffect } from 'react';
import './GuardiansScreen.css';
import GuardianService, { Guardian } from '../services/GuardianService';

interface GuardiansScreenProps {
  onBack: () => void;
}

const GuardiansScreen: React.FC<GuardiansScreenProps> = ({ onBack }) => {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadGuardians();
  }, []);

  const loadGuardians = async () => {
    try {
      setLoading(true);
      const data = await GuardianService.getAllGuardians();
      setGuardians(data);
    } catch (err) {
      console.error('Failed to load guardians');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!email.trim() && !phone.trim()) {
      setError('At least one contact method is required');
      return;
    }

    try {
      await GuardianService.addGuardian({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        relationship: relationship.trim() || 'Contact',
      });

      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setRelationship('');
      setShowAddForm(false);
      
      // Reload guardians
      await loadGuardians();
    } catch (err) {
      setError('Failed to add guardian');
    }
  };

  const handleRemoveGuardian = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this guardian?')) {
      return;
    }

    try {
      await GuardianService.removeGuardian(id);
      await loadGuardians();
    } catch (err) {
      console.error('Failed to remove guardian');
    }
  };

  const handleVerifyGuardian = async (id: string) => {
    try {
      await GuardianService.verifyGuardian(id);
      await loadGuardians();
    } catch (err) {
      console.error('Failed to verify guardian');
    }
  };

  return (
    <div className="guardians-screen">
      <div className="guardians-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h1>Recovery Guardians</h1>
      </div>

      <div className="guardians-content">
        <div className="guardians-info">
          <div className="info-icon">🛡️</div>
          <h2>Trusted Recovery Contacts</h2>
          <p>
            Add trusted friends or family members who can help you recover your wallet
            if you lose access. Multiple guardians must approve recovery requests.
          </p>
        </div>

        {loading ? (
          <div className="loading">Loading guardians...</div>
        ) : (
          <>
            <div className="guardians-stats">
              <div className="stat-item">
                <div className="stat-value">{guardians.length}</div>
                <div className="stat-label">Total Guardians</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {guardians.filter(g => g.verified).length}
                </div>
                <div className="stat-label">Verified</div>
              </div>
            </div>

            {guardians.length === 0 ? (
              <div className="empty-state">
                <p>No guardians added yet</p>
                <p className="empty-hint">Add at least 2-3 trusted contacts for recovery</p>
              </div>
            ) : (
              <div className="guardians-list">
                {guardians.map((guardian) => (
                  <div key={guardian.id} className="guardian-card">
                    <div className="guardian-info">
                      <div className="guardian-header">
                        <h3>{guardian.name}</h3>
                        {guardian.verified ? (
                          <span className="verified-badge">✓ Verified</span>
                        ) : (
                          <span className="unverified-badge">Unverified</span>
                        )}
                      </div>
                      <p className="guardian-relationship">{guardian.relationship}</p>
                      {guardian.email && (
                        <p className="guardian-contact">📧 {guardian.email}</p>
                      )}
                      {guardian.phone && (
                        <p className="guardian-contact">📱 {guardian.phone}</p>
                      )}
                      <p className="guardian-date">
                        Added: {new Date(guardian.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="guardian-actions">
                      {!guardian.verified && (
                        <button
                          className="verify-btn"
                          onClick={() => handleVerifyGuardian(guardian.id)}
                        >
                          Verify
                        </button>
                      )}
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveGuardian(guardian.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!showAddForm ? (
          <button className="add-guardian-btn" onClick={() => setShowAddForm(true)}>
            + Add Guardian
          </button>
        ) : (
          <div className="add-guardian-form">
            <h3>Add New Guardian</h3>
            <form onSubmit={handleAddGuardian}>
              {error && <div className="form-error">{error}</div>}
              
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div className="form-group">
                <label>Relationship</label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="Friend, Family, Colleague, etc."
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  Add Guardian
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowAddForm(false);
                    setError('');
                    setName('');
                    setEmail('');
                    setPhone('');
                    setRelationship('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuardiansScreen;
