'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isProving, setIsProving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [presentation, setPresentation] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProve = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setIsProving(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/prove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          headers: []
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPresentation(data);
      setResult({ type: 'prove', data });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to prove URL');
    } finally {
      setIsProving(false);
    }
  };

  const handleVerify = async () => {
    if (!presentation) {
      setError('Please prove a URL first');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(presentation)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult({ type: 'verify', data });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify presentation');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light mb-4">URL Verifier</h1>
          <p className="text-gray-400 text-lg">Prove and verify web content authenticity</p>
        </div>

        <div className="space-y-8">
          {/* URL Input */}
          <div className="space-y-4">
            <label htmlFor="url" className="block text-sm font-medium text-gray-300">
              Enter URL to verify
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
              disabled={isProving || isVerifying}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleProve}
              disabled={isProving || isVerifying}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isProving ? 'Proving...' : 'Prove'}
            </button>
            
            <button
              onClick={handleVerify}
              disabled={!presentation || isProving || isVerifying}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  {result.type === 'prove' ? 'Proof Result' : 'Verification Result'}
                </h3>
                <pre className="text-xs text-gray-400 overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
