// TODO: ElevenLabs Flash TTS integration (post-MVP)
// - POST text to backend /tts route
// - Stream audio/mpeg response
// - Auto-play after assistant message arrives, with pause control
// - Add UI: pause/resume button in chat panel
// Marked out-of-scope for MVP at user's request.
export const TTS_ENABLED = false;

export async function speak(_text: string): Promise<void> {
  // intentional no-op until ElevenLabs is wired up
}
