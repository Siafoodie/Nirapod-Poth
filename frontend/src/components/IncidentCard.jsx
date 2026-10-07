import React, { useState } from 'react';
import { api } from '../api';

export default function IncidentCard({ report }) {
  const [votes, setVotes] = useState(report?.score ?? 0);
  const [userVote, setUserVote] = useState(null); // 'up', 'down', or null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpvote = async () => {
    const previousVotes = votes;
    const previousUserVote = userVote;

    if (userVote === 'up') {
      setVotes(votes - 1);
      setUserVote(null);
    } else if (userVote === 'down') {
      setVotes(votes + 2);
      setUserVote('up');
    } else {
      setVotes(votes + 1);
      setUserVote('up');
    }

    if (!report?._id) {
      setError('This report cannot be voted on because it has no ID.');
      setVotes(previousVotes);
      setUserVote(previousUserVote);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await api(`/reports/${report._id}/upvote`, {
        method: 'POST',
      });
      if (response.score !== undefined) setVotes(response.score);
    } catch (error) {
      setVotes(previousVotes);
      setUserVote(previousUserVote);
      setError(error.message || 'Unable to submit your vote.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownvote = async () => {
    const previousVotes = votes;
    const previousUserVote = userVote;

    if (userVote === 'down') {
      setVotes(votes + 1);
      setUserVote(null);
    } else if (userVote === 'up') {
      setVotes(votes - 2);
      setUserVote('down');
    } else {
      setVotes(votes - 1);
      setUserVote('down');
    }

    if (!report?._id) {
      setError('This report cannot be voted on because it has no ID.');
      setVotes(previousVotes);
      setUserVote(previousUserVote);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await api(`/reports/${report._id}/downvote`, {
        method: 'POST',
      });
      if (response.score !== undefined) setVotes(response.score);
    } catch (error) {
      setVotes(previousVotes);
      setUserVote(previousUserVote);
      setError(error.message || 'Unable to submit your vote.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 12px 30px rgba(124, 58, 237, 0.08)',
      border: '1px solid rgba(124, 58, 237, 0.12)',
      padding: '24px',
      maxWidth: '520px',
      margin: '20px auto',
      fontFamily: 'Inter, system-ui, sans-serif',
      transition: 'all 0.3s ease'
    }}>
      {/* Card Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #f3f0ff',
        paddingBottom: '14px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: '#f5f3ff',
            color: '#7c3aed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            🛡️
          </div>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#2d1b4e', fontWeight: '700' }}>
            {report?.incidentType || "Test Incident Report"}
          </h3>
        </div>
        <span style={{
          fontSize: '12px',
          padding: '4px 12px',
          borderRadius: '20px',
          background: '#f3f4f6',
          color: '#4b5563',
          fontWeight: '500'
        }}>
          Active
        </span>
      </div>

      {/* Description */}
      <p style={{
        color: '#4b5563',
        fontSize: '14px',
        lineHeight: '1.6',
        marginBottom: '24px',
        marginTop: 0
      }}>
        {report?.description || "This is a test incident report detailing an event that requires review and action."}
      </p>

      {/* Voting Footer */}
      {error && (
        <p role="alert" style={{ color: '#b42318', fontSize: '12px' }}>
          {error}
        </p>
      )}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#faf8ff',
        padding: '14px 20px',
        borderRadius: '14px',
        border: '1px solid #f0ebff'
      }}>
        <button
          onClick={handleUpvote}
          disabled={loading}
          style={{
            background: userVote === 'up' ? '#7c3aed' : '#ffffff',
            color: userVote === 'up' ? '#ffffff' : '#7c3aed',
            border: '1px solid #7c3aed',
            padding: '8px 18px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: userVote === 'up' ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          ↑ Upvote
        </button>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', fontWeight: '700' }}>
            Score
          </span>
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#1f2937' }}>
            {votes}
          </span>
        </div>

        <button
          onClick={handleDownvote}
          disabled={loading}
          style={{
            background: userVote === 'down' ? '#6b7280' : '#ffffff',
            color: userVote === 'down' ? '#ffffff' : '#4b5563',
            border: '1px solid #d1d5db',
            padding: '8px 18px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          ↓ Downvote
        </button>
      </div>
    </div>
  );
}  