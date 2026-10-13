import { SPEECH, type Lang } from "./i18n";

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((res) => {
    const v = speechSynthesis.getVoices();
    if (v.length) return res(v);
    const done = () => res(speechSynthesis.getVoices());
    speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1200);
  });
}

/** Speaks text; resolves false when no voice for the language is installed. */
export async function speak(text: string, lang: Lang): Promise<boolean> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const code = SPEECH[lang];
  const voices = await loadVoices();
  const voice =
    voices.find((v) => v.lang === code) ?? voices.find((v) => v.lang.startsWith(code.slice(0, 2)));
  if (!voice) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = code;
  u.voice = voice;
  u.rate = 0.9;
  speechSynthesis.speak(u);
  return true;
}

type Rec = {
  lang: string;
  onresult: (e: { results: { 0: { transcript: string } }[] }) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
};
export function getRecognition(lang: Lang): Rec | null {
  if (typeof window === "undefined") return null;
  const W = window as unknown as {
    SpeechRecognition?: new () => Rec;
    webkitSpeechRecognition?: new () => Rec;
  };
  const R = W.SpeechRecognition ?? W.webkitSpeechRecognition;
  if (!R) return null;
  const r = new R();
  r.lang = SPEECH[lang];
  return r;
}
