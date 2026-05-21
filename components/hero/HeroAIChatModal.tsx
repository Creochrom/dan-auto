"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import {
  Bot,
  FileImage,
  Film,
  Send,
  Upload,
} from "lucide-react";
import type { VehicleResult } from "@/lib/types/vehicle";
import { HeroFloatingWindow } from "@/components/hero/HeroFloatingWindow";

type UploadedFile = {
  id: string;
  file: File;
  url: string;
  kind: "image" | "video";
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type Props = {
  vehicle: VehicleResult;
  open: boolean;
  minimized: boolean;
  stackDepth: number;
  entranceDelay?: number;
  focusBoost?: number;
  dragConstraints?: RefObject<HTMLElement | null>;
  defaultPosition?: { x: number; y: number };
  onMinimize: () => void;
  onRestore: () => void;
  onClose: () => void;
  onActivate?: () => void;
};

export function HeroAIChatModal({
  vehicle,
  open,
  minimized,
  stackDepth,
  entranceDelay = 0,
  focusBoost = 0,
  dragConstraints,
  defaultPosition,
  onMinimize,
  onRestore,
  onClose,
  onActivate,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [estimateLine, setEstimateLine] = useState<string | null>(null);

  const addFiles = useCallback((list: FileList | null) => {
    if (!list?.length) return;
    const next: UploadedFile[] = [];
    Array.from(list).forEach((file) => {
      const kind = file.type.startsWith("video/") ? "video" : "image";
      next.push({
        id: `${file.name}-${file.lastModified}`,
        file,
        url: URL.createObjectURL(file),
        kind,
      });
    });
    setFiles((prev) => [...prev, ...next].slice(0, 6));
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text && files.length === 0) return;
    if (isSending) return;

    setIsSending(true);
    setEstimateLine(null);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: text || "Uploaded media for analysis",
    };
    setMessages((m) => [...m, userMsg]);
    setDraft("");

    window.setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: vehicle.unknown
          ? "We could not match full DVLA data for this registration. Describe symptoms and our team will verify on inspection."
          : "Based on the uploaded information, possible causes may include suspension wear, brake imbalance, or wheel alignment issues. A workshop inspection would confirm the exact fault.",
      };
      setMessages((m) => [...m, aiMsg]);
      setEstimateLine(
        vehicle.unknown
          ? "Inspection quote from £95"
          : `Estimated repair cost: £${vehicle.estimatedFrom}–£${vehicle.estimatedTo}`
      );
      setIsSending(false);
    }, 1100);
  }, [draft, files.length, isSending, vehicle]);

  if (!open) return null;

  return (
    <HeroFloatingWindow
      title="AI Vehicle Assistant"
      windowId="chat"
      stackDepth={stackDepth}
      entranceDelay={entranceDelay}
      focusBoost={focusBoost}
      dragConstraints={dragConstraints}
      defaultPosition={defaultPosition}
      width={380}
      minimized={minimized}
      onMinimize={onMinimize}
      onRestore={onRestore}
      onClose={onClose}
      onActivate={onActivate}
      ariaLabel="AI Vehicle Assistant"
    >
      <div className="hero-modal-content flex flex-col gap-3">
        <div className="shrink-0 border-b border-[#d4a63c]/12 pb-2.5">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 shrink-0 text-[#d4a63c]" aria-hidden />
            <p className="text-[11px] text-zinc-400">
              Describe your issue — attach photos or video for analysis.
            </p>
          </div>
          <p className="mt-1 font-mono text-[10px] text-[#d4a63c]/75">{vehicle.reg}</p>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="hero-modal-chat-messages space-y-2 pr-1">
            {messages.length === 0 && (
              <p className="text-[12px] text-zinc-500">
                Tell us what you are experiencing with your{" "}
                {vehicle.unknown ? "vehicle" : vehicle.makeModel}.
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
                  msg.role === "user"
                    ? "ml-6 bg-[#d4a63c]/12 text-[#f5e6b8]"
                    : "mr-4 border border-white/[0.06] bg-black/50 text-zinc-200"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {estimateLine && (
              <p className="rounded-xl border border-[#d4a63c]/25 bg-[#d4a63c]/8 px-3 py-2 text-[12px] font-semibold text-[#d4a63c]">
                {estimateLine}
              </p>
            )}
            {isSending && (
              <p className="text-[11px] text-[#d4a63c]/80">Analysing your message…</p>
            )}
          </div>

          <div
            className="shrink-0 rounded-xl border border-dashed border-[#d4a63c]/28 bg-black/40 p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4a63c]/80">
                Upload media
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-lg border border-[#d4a63c]/30 px-2 py-1 text-[10px] font-semibold text-[#d4a63c]"
              >
                <Upload className="h-3 w-3" aria-hidden />
                Browse
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {files.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {files.map((f) => (
                  <div key={f.id} className="relative">
                    {f.kind === "image" ? (
                      <img
                        src={f.url}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-black/60">
                        <Film className="h-4 w-4 text-[#d4a63c]" aria-hidden />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] text-white"
                      aria-label="Remove file"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 flex items-center gap-1 text-[10px] text-zinc-500">
              <FileImage className="h-3 w-3" aria-hidden />
              Images and videos accepted
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Describe the issue…"
              className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-black/55 px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#d4a63c]/40"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#d4a63c] px-3.5 text-black disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </HeroFloatingWindow>
  );
}
