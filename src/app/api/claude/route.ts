import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobDetails, resumeText } = body;

    // Trim content to reduce token usage
    const trimmedDescription = jobDetails.description.slice(0, 500);
    const trimmedResume = resumeText.slice(0, 1000);

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-api-key': process.env.ANTHROPIC_API_KEY,
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 150,
        temperature: 0, // Add this for more consistent responses
        system: "You are a job matching analyzer. You must always respond with valid JSON only, no explanatory text.",
        messages: [{
          role: 'user',
          content: `Analyze this job match and respond with ONLY a JSON object, no other text.

Job:
Title: ${jobDetails.title}
Company: ${jobDetails.company}
Description: ${trimmedDescription}

Resume:
${trimmedResume}

You must respond with exactly this JSON structure and nothing else:
{
  "score": <number 0-100>,
  "matchDetails": {
    "skillsMatch": <number 0-100>,
    "experienceMatch": <number 0-100>,
    "educationMatch": <number 0-100>,
    "roleMatch": <number 0-100>
  }
}`
        }]
      })
    });

    const responseText = await claudeResponse.text();
    
    if (!claudeResponse.ok) {
      return NextResponse.json(
        { error: `Claude API error: ${claudeResponse.status}`, details: responseText },
        { status: claudeResponse.status }
      );
    }

    try {
      const data = JSON.parse(responseText);
      // Extract the actual response content
      const content = data.content?.[0]?.text || data.content;
      
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysisData = JSON.parse(jsonMatch[0]);
        return NextResponse.json(analysisData);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError, 'Response:', responseText);
      return NextResponse.json(
        { error: 'Invalid response format from Claude API', details: responseText },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Server error in Claude route:', error);
    return NextResponse.json(
      { error: 'Internal server error processing Claude request' },
      { status: 500 }
    );
  }
}