import { Hono } from 'hono';

export const ttsRoute = new Hono();

// TODO: ElevenLabs Flash TTS integration
// - Read text from POST body
// - Stream audio/mpeg back from ElevenLabs Flash API
// - Use ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID env vars
// Marked out-of-scope for MVP at user's request — Widget falls back to no audio.
ttsRoute.post('/', (c) => {
  return c.json(
    {
      error: 'not_implemented',
      todo: 'ElevenLabs Flash TTS — wired up post-MVP',
    },
    501,
  );
});
