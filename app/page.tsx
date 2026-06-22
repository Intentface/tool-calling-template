// @/app/page.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/conversation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import type {
  WeatherResult,
  WeatherWear,
  WeatherWearItem,
} from "./api/chat/route";

export default function Home() {
  // useChat hook configured with the API endpoint using DefaultChatTransport
  // In AI SDK v6, this automatically handles streaming and tool calls
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const [input, setInput] = useState("");

  return (
    <div className="flex flex-col h-screen">
      <Conversation className="flex-1">
        <ConversationContent>
          <div className="w-full max-w-md mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 py-24">
                The intergalactic weather assistant is here to help you with the
                weather and what to wear. Try asking it about the weather in any
                place in the galaxy or what to wear based on the weather. 🪐
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className="flex flex-col gap-2 animate-in">
                <div className="flex gap-2">
                  <Avatar>
                    {m.role === "user" ? (
                      <>
                        <AvatarImage src="https://i.pravatar.cc/80?img=69" />
                        <AvatarFallback>Me</AvatarFallback>
                      </>
                    ) : (
                      <>
                        {/* <AvatarImage src="" /> */}
                        <AvatarFallback>AI</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    {m.parts?.map((part, index) => {
                      switch (part.type) {
                        case "text":
                          return <div key={index}>{part.text}</div>;

                        case "tool-weather":
                          switch (part.state) {
                            case "input-streaming":
                            case "input-available":
                              return (
                                <div
                                  key={index}
                                  className="text-sm text-slate-500 my-2"
                                >
                                  Getting weather information...
                                </div>
                              );
                            case "output-available": {
                              const weatherData = part.output as WeatherResult;
                              return (
                                <div
                                  key={index}
                                  className="border-l-2 border-blue-200 pl-4 my-2"
                                >
                                  <p className="text-sm text-slate-500 mb-1">
                                    Weather Check
                                  </p>
                                  <div className="rounded-lg bg-slate-100 p-4">
                                    <h3 className="font-medium mb-2">
                                      Weather Information
                                    </h3>
                                    <p>Location: {weatherData.location}</p>
                                    <p>
                                      Temperature: {weatherData.temperature}°F
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                            case "output-error":
                              return (
                                <div key={index} className="text-red-500 my-2">
                                  Error getting weather: {part.errorText}
                                </div>
                              );
                          }

                        case "tool-whatToWear":
                          switch (part.state) {
                            case "input-streaming":
                            case "input-available":
                              return (
                                <div
                                  key={index}
                                  className="text-sm text-slate-500 my-2"
                                >
                                  Generating equipment suggestions...
                                </div>
                              );
                            case "output-available": {
                              const wearData = part.output as WeatherWear;
                              return (
                                <div
                                  key={index}
                                  className="border-l-2 border-blue-200 pl-4 my-2"
                                >
                                  <p className="text-sm text-slate-500 mb-1">
                                    Equipment Suggestions
                                  </p>
                                  <div className="rounded-lg bg-blue-200 p-4">
                                    <h3 className="font-medium mb-2">
                                      What to Wear
                                    </h3>
                                    {wearData.suggestions.map(
                                      (
                                        item: WeatherWearItem,
                                        itemIndex: number
                                      ) => (
                                        <div
                                          key={itemIndex}
                                          className="mb-2 last:mb-0"
                                        >
                                          <p className="font-bold">
                                            {item.title}
                                          </p>
                                          <p>{item.description}</p>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            case "output-error":
                              return (
                                <div key={index} className="text-red-500 my-2">
                                  Error generating suggestions: {part.errorText}
                                </div>
                              );
                          }

                        default:
                          return null;
                      }
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput("");
          }
        }}
        className="border-t p-4"
      >
        <div className="w-full max-w-md mx-auto relative">
          <Textarea
            className="dark:bg-zinc-900 bg-white/50 backdrop-blur-xl rounded-xl w-full pb-[60px] border border-zinc-300 dark:border-zinc-800 shadow-xl"
            value={input}
            rows={3}
            placeholder="Say something..."
            onChange={(e) => setInput(e.target.value)}
          />
          <Button
            type="submit"
            disabled={status === "streaming"}
            size="sm"
            className="absolute bottom-2 right-2"
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
