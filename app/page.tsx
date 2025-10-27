'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [username, setUsername] = useState('');
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
      // Check if it's a GitHub URL and add appropriate headers
      const urlObj = new URL(url.trim());
      const headers = [];
      
      if (urlObj.hostname === 'github.com') {
        headers.push('User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
        headers.push('Accept: application/json');
        
        // Add GitHub token if provided
        if (githubToken.trim()) {
          headers.push(`Authorization: Bearer ${githubToken.trim()}`);
        }
      }
      
      console.log('Frontend sending:', { url: url.trim(), headers });
      console.log('URL being requested:', url.trim());

      const response = await fetch('/api/prove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          headers: headers
        }),
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

    if (!username.trim()) {
      setError('Please enter your GitHub username');
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
      
      // Extract contribution data from response body
      let contributionData = null;
      console.log('Response data:', data);
      console.log('Response status:', data.response?.status);
      console.log('Response body:', data.response?.body);
      
      if (data.response && data.response.body) {
        try {
          const contributors = JSON.parse(data.response.body);
          console.log(`Searching through ${contributors.length} contributors for username: ${username.trim()}`);
          
          // Search through all contributors to find the matching username
          const userContributions = contributors.find((contributor: any) => {
            if (contributor.author && contributor.author.login) {
              console.log(`Checking contributor: ${contributor.author.login}`);
              return contributor.author.login.toLowerCase() === username.trim().toLowerCase();
            }
            return false;
          });
          
          if (userContributions) {
            console.log(`Found contributions for ${userContributions.author.login}:`, userContributions);
            contributionData = {
              username: userContributions.author.login,
              total: userContributions.total,
              avatar: userContributions.author.avatar
            };
          } else {
            console.log(`No contributions found for username: ${username.trim()}`);
            console.log('Available contributors:', contributors.map((c: any) => c.author?.login).filter(Boolean));
            setError(`No contributions found for username: ${username.trim()}. Available contributors: ${contributors.map((c: any) => c.author?.login).filter(Boolean).join(', ')}`);
            return;
          }
        } catch (parseError) {
          console.error('Error parsing response body:', parseError);
          setError('Failed to parse contribution data');
          return;
        }
      } else if (data.response && data.response.status === 202) {
        console.log('GitHub returned 202 status - request accepted but body is empty');
        setError('GitHub returned an empty response (status 202). This might be due to rate limiting or the request being processed asynchronously. Please try again in a few moments.');
        return;
      } else {
        console.log('No response body available');
        setError('No response data available from GitHub. Please check the URL and try again.');
        return;
      }

      const resultData = {
        ...data,
        contributionData
      };
      
      console.log('Setting verification result:', resultData);
      console.log('Contribution data:', contributionData);
      
      setResult({ 
        type: 'verify', 
        data: resultData
      });
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
          <h1 className="text-4xl font-light mb-4">vlayer GitHub Prover</h1>
          <p className="text-gray-400 text-lg">Prove contributions to private GitHub repositories</p>
        </div>

        <div className="space-y-8">
          {/* GitHub URL Input */}
          <div className="space-y-4">
            <label htmlFor="url" className="block text-sm font-medium text-gray-300">
              GitHub URL to verify
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/vlayer-xyz/vlayer/graphs/contributors-data"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7235e5] focus:border-transparent text-white placeholder-gray-500"
              disabled={isProving || isVerifying}
            />
          </div>

          {/* GitHub Token Input */}
          <div className="space-y-4">
            <label htmlFor="token" className="block text-sm font-medium text-gray-300">
              GitHub Personal Access Token (for private repos)
            </label>
            <input
              id="token"
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="github_pat_..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7235e5] focus:border-transparent text-white placeholder-gray-500"
              disabled={isProving || isVerifying}
            />
            <p className="text-xs text-gray-500">
              Required for private repositories. Generate one at{' '}
              <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-[#7235e5] hover:underline">
                GitHub Settings → Developer settings → Personal access tokens
              </a>
            </p>
          </div>

          {/* Username Input */}
          <div className="space-y-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              Your GitHub Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="vlayer-xyz"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7235e5] focus:border-transparent text-white placeholder-gray-500"
              disabled={isProving || isVerifying}
            />
            <p className="text-xs text-gray-500">
              Enter your GitHub username to verify your contributions
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleProve}
              disabled={isProving || isVerifying}
              className="flex-1 px-6 py-3 bg-[#7235e5] hover:bg-[#5d2bc7] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isProving ? 'Proving...' : 'Prove Contributions'}
            </button>
            
            <button
              onClick={handleVerify}
              disabled={!presentation || !username.trim() || isProving || isVerifying}
              className="flex-1 px-6 py-3 bg-[#7235e5] hover:bg-[#5d2bc7] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isVerifying ? 'Verifying...' : 'Verify Proof'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Contribution Summary */}
          {result && result.type === 'verify' && result.data.contributionData && (
            <div className="p-6 bg-gradient-to-r from-[#7235e5]/20 to-[#7235e5]/10 border border-[#7235e5]/30 rounded-lg">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-[#7235e5] mb-2">
                  {result.data.contributionData.total} Contributions Verified
                </h2>
                <p className="text-gray-300">
                  @{result.data.contributionData.username} has made <span className="font-semibold text-white">{result.data.contributionData.total}</span> contributions to this repository
                </p>
              </div>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-4">
              {(() => {
                console.log('Rendering result:', result);
                console.log('Result type:', result.type);
                console.log('Has contributionData:', !!result.data.contributionData);
                console.log('ContributionData:', result.data.contributionData);
                return null;
              })()}
              {result.type === 'verify' && result.data.contributionData ? (
                <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-300 mb-4">✅ Verification Successful</h3>
                  <div className="flex items-center space-x-4 mb-4">
                    <img 
                      src={result.data.contributionData.avatar} 
                      alt={result.data.contributionData.username}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="text-white font-medium">@{result.data.contributionData.username}</p>
                      <p className="text-gray-400 text-sm">GitHub Contributor</p>
                    </div>
                  </div>
                  <div className="bg-[#7235e5]/10 border border-[#7235e5]/20 rounded-lg p-4">
                    <p className="text-[#7235e5] font-semibold text-xl">
                      {result.data.contributionData.total} contributions verified
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Your contributions to this repository have been cryptographically verified
                    </p>
                  </div>
                </div>
              ) : result.type === 'verify' ? (
                <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-300 mb-4">✅ Verification Successful</h3>
                  <p className="text-gray-400 mb-4">
                    The proof has been verified successfully, but contribution data could not be extracted.
                  </p>
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer hover:text-gray-400">View raw verification data</summary>
                    <pre className="mt-2 p-2 bg-gray-800 rounded overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">
                    {result.type === 'prove' ? 'GitHub Contribution Proof' : 'Verification Result'}
                  </h3>
                  <pre className="text-xs text-gray-400 overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Powered by vlayer Footer */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex justify-center items-center space-x-2 text-gray-500">
            <span className="text-sm">Powered by</span>
            <img 
              src="/powered-by-vlayer.svg" 
              alt="Vlayer" 
              className="h-5"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
