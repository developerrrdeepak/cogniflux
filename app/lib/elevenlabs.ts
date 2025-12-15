'use server'

import ElevenLabs from 'elevenlabs';

const elevenlabs = new ElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function textToSpeech(text: string) {
  try {
    const response = await elevenlabs.textToSpeech({
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      text,
      modelId: 'eleven_multilingual_v2',
    });

    if (response.status === 'ok' && response.data) {
      return Buffer.from(response.data as ArrayBuffer).toString('base64');
    }

    console.error('ElevenLabs API error:', response.status);
    return null;
  } catch (error) {
    console.error('Error converting text to speech:', error);
    return null;
  }
}
