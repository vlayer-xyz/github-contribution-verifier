import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const requestBody = {
      url: body.url,
      headers: body.headers || []
    };
    
    console.log('Sending to vlayer API:', JSON.stringify(requestBody, null, 2));
    console.log('URL being proved:', requestBody.url);
    console.log('Headers being sent:', requestBody.headers);
    
    const response = await fetch('https://web-prover.vlayer.xyz/api/v1/prove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vlayer API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('Vlayer API response:', JSON.stringify(data, null, 2));
    console.log('Response status from vlayer:', data.response?.status);
    console.log('Response body length:', data.response?.body?.length || 'null');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Prove API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to prove URL' },
      { status: 500 }
    );
  }
}
