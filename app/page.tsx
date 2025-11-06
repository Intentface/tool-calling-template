"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/conversation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Command,
  Loader2,
  Rocket,
  SendHorizontal,
  ShieldHalf,
  Sparkles,
  Wand2,
} from "lucide-react";

import type {
  CelestialEventFeed,
  HazardScanReport,
  NavigationWindowGuide,
  WeatherResult,
  WeatherWear,
  WeatherWearItem,
} from "./api/chat/route";

const quickPrompts = [
  {
    label: "Europa dive briefing",
    prompt:
      "Give me the weather, hazard scan, navigation windows, and gear for a guided ocean dive on Europa this weekend.",
  },
  {
    label: "Rings Bazaar fly-in",
    prompt:
      "I want to visit the Rings Bazaar around Saturn. Scan weather, hazards, and best arrival windows, then outfit me.",
  },
  {
    label: "Neptune night cruise",
    prompt:
      "Plan a relaxed night cruise near Neptune's halo. Include celestial events worth catching and what to wear.",
  },
];

const keyboardShortcuts = [
  { combo: "⌘⏎ / Ctrl⏎", label: "Send transmission" },
  { combo: "Esc", label: "Clear draft" },
  { combo: "⇧⏎", label: "Insert new line" },
];

const hazardBadgeStyles: Record<HazardScanReport["riskLevel"], string> = {
  Low: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
  Elevated: "border-amber-400/40 bg-amber-500/15 text-amber-100",
  Critical: "border-rose-500/45 bg-rose-500/20 text-rose-100",
};

const statusDetailsMap: Record<
  string,
  { label: string; description: string; badgeClass: string }
> = {
  streaming: {
    label: "Streaming response",
    description: "Vox Solaris is transmitting fresh telemetry.",
    badgeClass: "border-sky-400/40 bg-sky-500/20 text-sky-100",
  },
  loading: {
    label: "Routing tools",
    description: "Linking weather, hazard, and navigation modules.",
    badgeClass: "border-indigo-400/40 bg-indigo-500/20 text-indigo-100",
  },
  ready: {
    label: "Standing by",
    description: "Console idle and ready for your next prompt.",
    badgeClass: "border-white/20 bg-white/10 text-slate-200",
  },
  idle: {
    label: "Standing by",
    description: "Console idle and ready for your next prompt.",
    badgeClass: "border-white/20 bg-white/10 text-slate-200",
  },
  error: {
    label: "Transmission glitch",
    description: "Interference hit the feed. Try again in a beat.",
    badgeClass: "border-rose-500/45 bg-rose-500/20 text-rose-100",
  },
  errored: {
    label: "Transmission glitch",
    description: "Interference hit the feed. Try again in a beat.",
    badgeClass: "border-rose-500/45 bg-rose-500/20 text-rose-100",
  },
};

export default function Home() {
  const { messages, sendMessage, status, setMessages, clearError } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isStreaming = status === "streaming" || status === "loading";
  const characterCount = input.trim().length;

  const statusDetails = statusDetailsMap[status] ?? statusDetailsMap.ready;

  const toolActivations = useMemo(
    () =>
      messages.reduce((count, message) => {
        const parts = (message.parts ?? []) as Array<any>;
        return (
          count +
          parts.filter(
            (part) =>
              typeof part?.type === "string" &&
              part.type.startsWith("tool-") &&
              part.state === "output-available"
          ).length
        );
      }, 0),
    [messages]
  );

  const focusInput = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) {
      return;
    }
    sendMessage({ text: trimmed });
    setInput("");
  }, [input, isStreaming, sendMessage]);

  const handleQuickPrompt = useCallback(
    (prompt: string) => {
      sendMessage({ text: prompt });
      focusInput();
    },
    [sendMessage, focusInput]
  );

  const handleClearDraft = useCallback(() => {
    setInput("");
    focusInput();
  }, [focusInput]);

  const handleClear = useCallback(() => {
    setMessages([]);
    clearError();
    handleClearDraft();
  }, [clearError, handleClearDraft, setMessages]);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        handleSubmit();
      } else if (event.key === "Escape" && input) {
        event.preventDefault();
        handleClearDraft();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSubmit, handleClearDraft, input]);

  const hasMessages = messages.length > 0;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_180%_at_70%_10%,rgba(56,189,248,0.18),transparent_60%),radial-gradient(80%_120%_at_10%_90%,rgba(59,130,246,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[conic-gradient(from_120deg_at_50%_50%,rgba(56,189,248,0.25),rgba(147,51,234,0.25),transparent)] opacity-70 blur-3xl animate-aurora" />
      <div className="pointer-events-none absolute -bottom-32 right-[-10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.25),transparent_60%)] opacity-50 blur-3xl animate-orbit" />
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-12 sm:pt-16 lg:px-10">
        <header className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/5 px-6 py-8 shadow-[0_40px_120px_-60px_rgba(59,130,246,0.55)] backdrop-blur-3xl sm:px-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(147,51,234,0.12),transparent_55%)] opacity-70" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-white/20 bg-black/30 text-sky-100 shadow-inner shadow-sky-500/40">
                  <Rocket className="size-6" />
                </div>
                <div>
                  <p className="text-[0.7rem] uppercase tracking-[0.5em] text-slate-300/70">
                    Stellar Skies Console
                  </p>
                  <h1 className="text-3xl font-semibold text-slate-100 sm:text-4xl">
                    Mission Control: Weatherworks
                  </h1>
                </div>
              </div>
              <p className="max-w-2xl text-sm text-slate-200/80 sm:text-base">
                Chart safer journeys with Vox Solaris—your flamboyant intergalactic meteorologist. Blend weather, hazard scans, celestial spectacles, and gear load-outs in one flowing exchange.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {quickPrompts.map((item) => (
                  <Button
                    key={item.label}
                    type="button"
                    onClick={() => handleQuickPrompt(item.prompt)}
                    variant="ghost"
                    className="group rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-slate-100/90 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400/40 hover:bg-white/20"
                  >
                    <Sparkles className="size-4 text-sky-200 transition-transform duration-200 group-hover:rotate-12" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
            <Badge
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-[0.65rem] uppercase tracking-[0.4em] ${statusDetails.badgeClass}`}
            >
              {isStreaming ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              {statusDetails.label}
            </Badge>
          </div>
        </header>
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(260px,1fr)]">
          <section className="relative flex h-[calc(100dvh-260px)] min-h-[560px] flex-col overflow-hidden rounded-[32px] border border-white/12 bg-white/5 shadow-[0_45px_120px_-70px_rgba(147,197,253,0.45)] backdrop-blur-3xl">
            <div className="pointer-events-none absolute inset-0 backdrop-grid opacity-[0.15]" />
            {isStreaming && (
              <div className="absolute left-0 right-0 top-0 h-[3px] overflow-hidden">
                <div className="h-full w-full animate-pulse-line bg-gradient-to-r from-transparent via-sky-400/80 to-transparent" />
              </div>
            )}
            <div className="relative flex flex-1 min-h-0 flex-col">
              <Conversation className="flex-1 min-h-0">
                <ConversationContent className="flex flex-col gap-6 px-6 pb-36 pt-8 sm:px-8 sm:pt-10">
                  {!hasMessages ? (
                    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center text-slate-200/80">
                      <div className="rounded-full border border-white/20 bg-white/10 p-4 text-sky-200">
                        <Wand2 className="size-6" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-semibold text-slate-100">
                          Console primed and humming.
                        </h2>
                        <p className="text-sm text-slate-200/70">
                          Ask about pirate storms on Titan, safe warp windows, or which suit to pack for the Rings Bazaar. Tap a quick prompt above or launch your own transmission.
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isUser = message.role === "user";
                      return (
                        <div
                          key={message.id}
                          className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`flex max-w-2xl items-start gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                          >
                            <Avatar
                              className={`size-10 border border-white/15 bg-black/50 shadow-[0_0_0_3px_rgba(15,23,42,0.55)] ${isUser ? "ring-2 ring-sky-400/40" : "ring-2 ring-indigo-400/30"}`}
                            >
                              {isUser ? (
                                <>
                                  <AvatarImage
                                    src="https://i.pravatar.cc/80?img=12"
                                    alt="Traveler avatar"
                                  />
                                  <AvatarFallback className="text-xs font-semibold uppercase text-slate-100">
                                    You
                                  </AvatarFallback>
                                </>
                              ) : (
                                <AvatarFallback className="text-xs font-semibold uppercase text-sky-100">
                                  VS
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div
                              className={`relative flex-1 space-y-4 rounded-3xl border px-5 py-5 shadow-xl transition ${isUser ? "animate-slideUpFade border-sky-500/35 bg-sky-500/10 text-slate-100 hover:border-sky-300/40" : "animate-slideUpFade border-white/12 bg-black/45 text-slate-100/90 hover:border-white/25"}`}
                            >
                              <div className="text-[0.65rem] uppercase tracking-[0.4em] text-slate-300/60">
                                {isUser ? "Traveler Transmission" : "Vox Solaris"}
                              </div>
                              <div className="space-y-4">
                                {message.parts?.map((part, index) => {
                                  if (part.type === "text") {
                                    return (
                                      <p
                                        key={index}
                                        className="whitespace-pre-wrap leading-relaxed text-slate-200/90"
                                      >
                                        {part.text}
                                      </p>
                                    );
                                  }

                                  if (part.type === "tool-weather") {
                                    if (
                                      part.state === "input-streaming" ||
                                      part.state === "input-available"
                                    ) {
                                      return (
                                        <div
                                          key={index}
                                          className="flex items-center gap-2 text-xs text-slate-300/80"
                                        >
                                          <Loader2 className="size-4 animate-spin text-sky-200" />
                                          Gathering weather telemetry...
                                        </div>
                                      );
                                    }

                                    if (part.state === "output-error") {
                                      return (
                                        <div
                                          key={index}
                                          className="text-sm text-rose-200"
                                        >
                                          Weather scan failed: {part.errorText}
                                        </div>
                                      );
                                    }

                                    if (part.state === "output-available") {
                                      const weatherData =
                                        part.output as WeatherResult;
                                      return (
                                        <div
                                          key={index}
                                          className="relative overflow-hidden rounded-3xl border border-sky-400/30 bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-slate-900/70 p-5 text-sm text-slate-100/90"
                                        >
                                          <div className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-sky-400/30 blur-3xl" />
                                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_70%)] opacity-80" />
                                          <div className="relative space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                              <div>
                                                <p className="text-[0.6rem] uppercase tracking-[0.42em] text-slate-200/70">
                                                  Weather brief
                                                </p>
                                                <p className="text-lg font-semibold text-slate-100">
                                                  {weatherData.location}
                                                </p>
                                              </div>
                                              <div className="flex items-baseline gap-2 text-sky-100">
                                                <span className="text-4xl font-semibold">
                                                  {weatherData.temperature}
                                                </span>
                                                <span className="text-sm font-medium">
                                                  °F
                                                </span>
                                              </div>
                                            </div>
                                            <div className="grid gap-3 text-[0.85rem] text-slate-200/85 sm:grid-cols-2">
                                              <div>
                                                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-300/65">
                                                  Conditions
                                                </p>
                                                <p>{weatherData.conditions}</p>
                                              </div>
                                              <div>
                                                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-300/65">
                                                  Wind
                                                </p>
                                                <p>{weatherData.wind}</p>
                                              </div>
                                              <div>
                                                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-300/65">
                                                  Radiation
                                                </p>
                                                <p>{weatherData.radiation}</p>
                                              </div>
                                              <div>
                                                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-300/65">
                                                  Advisory
                                                </p>
                                                <p>{weatherData.advisory}</p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }
                                  }

                                  if (part.type === "tool-whatToWear") {
                                    if (
                                      part.state === "input-streaming" ||
                                      part.state === "input-available"
                                    ) {
                                      return (
                                        <div
                                          key={index}
                                          className="flex items-center gap-2 text-xs text-slate-300/80"
                                        >
                                          <Loader2 className="size-4 animate-spin text-violet-200" />
                                          Drafting gear load-out...
                                        </div>
                                      );
                                    }

                                    if (part.state === "output-error") {
                                      return (
                                        <div
                                          key={index}
                                          className="text-sm text-rose-200"
                                        >
                                          Gear bay offline: {part.errorText}
                                        </div>
                                      );
                                    }

                                    if (part.state === "output-available") {
                                      const wearData =
                                        part.output as WeatherWear;
                                      return (
                                        <div
                                          key={index}
                                          className="rounded-3xl border border-violet-400/30 bg-violet-500/15 p-5 text-sm text-slate-100/90"
                                        >
                                          <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-violet-100">
                                              <ShieldHalf className="size-4" />
                                              Gear load-out
                                            </div>
                                            <Badge className="rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-slate-200">
                                              Up to 3 items
                                            </Badge>
                                          </div>
                                          <div className="mt-4 space-y-3">
                                            {wearData.suggestions.map(
                                              (
                                                item: WeatherWearItem,
                                                itemIndex: number
                                              ) => (
                                                <div
                                                  key={itemIndex}
                                                  className="rounded-2xl border border-white/15 bg-black/30 px-4 py-3"
                                                >
                                                  <p className="text-sm font-semibold text-slate-100">
                                                    {item.title}
                                                  </p>
                                                  <p className="text-sm text-slate-200/80">
                                                    {item.description}
                                                  </p>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      );
                                    }
                                  }

                                  if (part.type === "tool-hazardScan") {
                                    if (
                                      part.state === "input-streaming" ||
                                      part.state === "input-available"
                                    ) {
                                      return (
                                        <div
                                          key={index}
                                          className="flex items-center gap-2 text-xs text-slate-300/80"
                                        >
                                          <Loader2 className="size-4 animate-spin text-rose-200" />
                                          Running hazard scan...
                                        </div>
                                      );
                                    }

                                    if (part.state === "output-error") {
                                      return (
                                        <div
                                          key={index}
                                          className="text-sm text-rose-200"
                                        >
                                          Hazard scan failed: {part.errorText}
                                        </div>
                                      );
                                    }

                                    if (part.state === "output-available") {
                                      const hazardData =
                                        part.output as HazardScanReport;
                                      return (
                                        <div
                                          key={index}
                                          className="rounded-3xl border border-rose-400/30 bg-rose-500/15 p-5 text-sm text-slate-100/90"
                                        >
                                          <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-rose-100/80">
                                                Hazard perimeter
                                              </p>
                                              <p className="text-lg font-semibold text-slate-100">
                                                {hazardData.location}
                                              </p>
                                            </div>
                                            <Badge
                                              className={`rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] ${hazardBadgeStyles[hazardData.riskLevel]}`}
                                            >
                                              {hazardData.riskLevel} risk
                                            </Badge>
                                          </div>
                                          <div className="mt-4 space-y-3">
                                            {hazardData.hazards.map(
                                              (hazard, hazardIndex) => (
                                                <div
                                                  key={hazardIndex}
                                                  className="rounded-2xl border border-white/15 bg-black/30 px-4 py-3"
                                                >
                                                  <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-semibold text-slate-100">
                                                      {hazard.name}
                                                    </p>
                                                    <span
                                                      className={`rounded-full border border-white/15 px-2 py-1 text-[0.6rem] uppercase tracking-[0.3em] ${hazardBadgeStyles[hazard.severity]}`}
                                                    >
                                                      {hazard.severity}
                                                    </span>
                                                  </div>
                                                  <p className="mt-1 text-sm text-slate-200/80">
                                                    {hazard.guidance}
                                                  </p>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      );
                                    }
                                  }

                                  if (part.type === "tool-celestialEvents") {
                                    if (
                                      part.state === "input-streaming" ||
                                      part.state === "input-available"
                                    ) {
                                      return (
                                        <div
                                          key={index}
                                          className="flex items-center gap-2 text-xs text-slate-300/80"
                                        >
                                          <Loader2 className="size-4 animate-spin text-cyan-200" />
                                          Mapping celestial events...
                                        </div>
                                      );
                                    }

                                    if (part.state === "output-error") {
                                      return (
                                        <div
                                          key={index}
                                          className="text-sm text-rose-200"
                                        >
                                          Event tracker glitch: {part.errorText}
                                        </div>
                                      );
                                    }

                                    if (part.state === "output-available") {
                                      const events =
                                        part.output as CelestialEventFeed;
                                      return (
                                        <div
                                          key={index}
                                          className="rounded-3xl border border-cyan-400/30 bg-cyan-500/15 p-5 text-sm text-slate-100/90"
                                        >
                                          <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-cyan-100">
                                            <Sparkles className="size-4" />
                                            Celestial highlights
                                          </div>
                                          <div className="mt-4 space-y-3">
                                            {events.events.map((event, eventIndex) => (
                                              <div
                                                key={eventIndex}
                                                className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/25 px-4 py-4"
                                              >
                                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_70%)] opacity-70" />
                                                <div className="relative space-y-2">
                                                  <div className="flex items-center justify-between text-[0.6rem] uppercase tracking-[0.3em] text-cyan-100/80">
                                                    <span>{event.time}</span>
                                                    <span className="font-mono text-cyan-100/70">
                                                      #{eventIndex + 1}
                                                    </span>
                                                  </div>
                                                  <p className="text-base font-semibold text-slate-100">
                                                    {event.title}
                                                  </p>
                                                  <p className="text-sm text-slate-200/80">
                                                    {event.detail}
                                                  </p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    }
                                  }

                                  if (part.type === "tool-navigationWindows") {
                                    if (
                                      part.state === "input-streaming" ||
                                      part.state === "input-available"
                                    ) {
                                      return (
                                        <div
                                          key={index}
                                          className="flex items-center gap-2 text-xs text-slate-300/80"
                                        >
                                          <Loader2 className="size-4 animate-spin text-blue-200" />
                                          Calculating navigation windows...
                                        </div>
                                      );
                                    }

                                    if (part.state === "output-error") {
                                      return (
                                        <div
                                          key={index}
                                          className="text-sm text-rose-200"
                                        >
                                          Navigation planner offline: {part.errorText}
                                        </div>
                                      );
                                    }

                                    if (part.state === "output-available") {
                                      const windows =
                                        part.output as NavigationWindowGuide;
                                      return (
                                        <div
                                          key={index}
                                          className="rounded-3xl border border-blue-400/30 bg-blue-500/15 p-5 text-sm text-slate-100/90"
                                        >
                                          <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-blue-100">
                                            <Calendar className="size-4" />
                                            Navigation windows
                                          </div>
                                          <div className="mt-4 space-y-3">
                                            {windows.windows.map(
                                              (window, windowIndex) => (
                                                <div
                                                  key={windowIndex}
                                                  className="rounded-2xl border border-white/15 bg-black/30 px-4 py-3"
                                                >
                                                  <div className="flex items-baseline justify-between gap-2">
                                                    <p className="text-sm font-semibold text-slate-100">
                                                      {window.label}
                                                    </p>
                                                    <span className="font-mono text-xs uppercase tracking-[0.3em] text-blue-100/80">
                                                      {window.window}
                                                    </span>
                                                  </div>
                                                  <p className="mt-1 text-sm text-slate-200/80">
                                                    {window.note}
                                                  </p>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      );
                                    }
                                  }

                                  return null;
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </ConversationContent>
                <ConversationScrollButton className="border border-white/20 bg-black/60 text-slate-100 hover:bg-black/70" />
              </Conversation>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSubmit();
                }}
                aria-busy={isStreaming}
                className="relative border-t border-white/12 bg-black/60 px-6 py-5 backdrop-blur-2xl sm:px-8"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="relative flex-1">
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      rows={4}
                      spellCheck={false}
                      autoComplete="off"
                      maxLength={600}
                      placeholder="Plot your next stellar adventure…"
                      className="min-h-[120px] resize-none rounded-2xl border border-white/15 bg-black/50 px-5 py-4 text-sm text-slate-100 shadow-inner shadow-sky-500/10 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    />
                    <div className="pointer-events-none absolute inset-x-5 bottom-3 flex items-center justify-between text-[0.65rem] uppercase tracking-[0.35em] text-slate-400/80">
                      <span>{isStreaming ? "Streaming..." : "⌘ Enter to send"}</span>
                      <span>{characterCount}/600</span>
                    </div>
                  </div>
                  <div className="flex w-full flex-row gap-2 md:w-auto">
                    <Button
                      type="submit"
                      disabled={isStreaming || !input.trim()}
                      className="h-11 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-6 text-sm font-semibold text-slate-100 shadow-lg shadow-sky-500/30 transition hover:shadow-xl hover:shadow-sky-500/40 disabled:opacity-60"
                    >
                      {isStreaming ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Transmitting
                        </>
                      ) : (
                        <>
                          <SendHorizontal className="size-4" />
                          Send
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleClear}
                      disabled={!hasMessages && !input.trim().length}
                      className="h-11 rounded-full border border-white/15 bg-white/10 px-4 text-xs font-medium text-slate-100 transition hover:bg-white/20 disabled:opacity-50"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </section>
          <aside className="flex flex-col gap-5 rounded-[28px] border border-white/12 bg-white/10 p-6 backdrop-blur-2xl lg:sticky lg:top-24 lg:h-[calc(100dvh-220px)] lg:overflow-y-auto">
            <div className="rounded-2xl border border-white/15 bg-black/40 p-5">
              <div className="flex items-center gap-3">
                <Command className="size-5 text-sky-200" />
                <div>
                  <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-300/70">
                    Flight controls
                  </p>
                  <h3 className="text-lg font-semibold text-slate-100">
                    Shortcuts
                  </h3>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {keyboardShortcuts.map((shortcut) => (
                  <li
                    key={shortcut.label}
                    className="flex items-center justify-between rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs text-slate-200/80"
                  >
                    <span>{shortcut.label}</span>
                    <span className="rounded-lg border border-white/20 bg-black/40 px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.4em] text-slate-100">
                      {shortcut.combo}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-sky-400/25 bg-sky-500/15 p-5">
              <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-sky-100">
                <Sparkles className="size-4" />
                Mission recommendations
              </div>
              <p className="mt-3 text-sm text-slate-100/80">
                Vox loves chaining tools—ask for hazard scans before you undock, or throw in celestial events to wow your passengers.
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={focusInput}
                className="mt-4 w-full rounded-xl border border-white/20 bg-black/30 py-2 text-xs font-medium uppercase tracking-[0.3em] text-slate-100 transition hover:bg-black/40"
              >
                Focus input
              </Button>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/45 p-5 text-sm text-slate-200/80">
              <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-300/70">
                Telemetry
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-slate-100">
                <div>
                  <p className="text-2xl font-semibold">{messages.length}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70">
                    Messages
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{toolActivations}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70">
                    Tool runs
                  </p>
                </div>
                <div className="col-span-2 rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-xs leading-relaxed text-slate-200/80">
                  {statusDetails.description}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
