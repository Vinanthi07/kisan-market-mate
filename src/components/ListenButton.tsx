import { Volume2 } from "lucide-react";
import { useState } from "react";
import { useSettings } from "@/lib/store";
import { speak } from "@/lib/voice";

export function ListenButton({ text, className = "" }: { text: string; className?: string }) {
  const { s, t } = useSettings();
  const [fail, setFail] = useState(false);
  return (
    <div className={className}>
      <button
        onClick={async () => setFail(!(await speak(text, s.lang)))}
        aria-label={t.listen}
        className="flex min-h-12 items-center gap-2 rounded-xl bg-primary px-4 text-lg font-bold text-primary-foreground"
      >
        <Volume2 className="size-6" aria-hidden />
        {t.listen}
      </button>
      {fail && (
        <p role="alert" className="mt-2 rounded-lg bg-muted p-2 text-base">
          {t.noVoice}
        </p>
      )}
    </div>
  );
}
