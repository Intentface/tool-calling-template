// @/app/api/chat/route.ts
import { google } from "@ai-sdk/google";
import { streamText, tool, stepCountIs, convertToModelMessages } from "ai";
import { z } from "zod";

// Maximum duration for the API route (in seconds)
export const maxDuration = 30;

// Type definitions for tool results
// These types help with type safety when handling tool outputs in the frontend
export interface WeatherResult {
  location: string;
  temperature: number;
}

export type WeatherWearItem = {
  title: string;
  description: string;
};

export type WeatherWear = {
  suggestions: Array<WeatherWearItem>;
};

export async function POST(req: Request) {
  // Extract messages from the request body
  // Messages contain the conversation history (user and assistant messages)
  const { messages } = await req.json();

  // streamText is the core function for generating streaming AI responses
  // It supports tool calling, which allows the LLM to use external functions
  const result = streamText({
    // Model configuration - using Google Gemini 2.0 Flash
    model: google("gemini-3.1-flash-lite"),

    // Convert UIMessages from the frontend to ModelMessages for the AI
    // convertToModelMessages is async in AI SDK v6 (supports async Tool.toModelOutput)
    messages: await convertToModelMessages(messages),

    // System prompt defines the AI's behavior and personality
    system: `You are a intergalactic weatherman in the year 10 245! You can tell the weather in any place in the galaxy and suggest equipment to wear based on the weather in the location. Use the "weather" tool to get a generated weather in a location, and the "whatToWear" tool to list futuristic things to wear based on the galactic weather. Always suggest that you can provide things to wear if the user isn't asking.

    Pretend to be a very casual space farer that thinks it's normal to travel in space like a tourist, casually talk about the weather in space and suggest things to wear based on the weather (things like "Yeah there might be some ion storms, so..").

    Don't talk about equipment being made up, but commit fully to being a weatherrman in the year 10 245.`,

    // stopWhen defines when to stop the multi-step tool calling loop
    // stepCountIs(5) means: stop after 5 steps if tools are still being called
    // A "step" is one generation cycle (which may include tool calls + results)
    stopWhen: stepCountIs(5),

    // Tools are functions the LLM can call to perform specific tasks
    // The LLM decides when to call these tools based on the conversation context
    tools: {
      // Tool 1: Get weather information (mock data for demo purposes)
      weather: tool({
        description: "Get the weather in a location",

        // inputSchema (renamed from 'parameters' in v5) defines the expected input
        // The LLM generates inputs matching this schema
        inputSchema: z.object({
          location: z.string().describe("The location to get the weather for"),
        }),

        // execute is called when the LLM invokes this tool
        // It receives the input arguments and optional execution options
        execute: async ({ location }) => ({
          location,
          // Mock temperature generation for demonstration
          temperature: 72 + Math.floor(Math.random() * 221) - 10,
        }),
      }),

      // Tool 2: Generate clothing suggestions based on weather
      whatToWear: tool({
        description:
          "List things to wear based on the weather (maximum 3 items)",

        inputSchema: z.object({
          suggestions: z
            .array(
              z.object({
                title: z.string().describe("Title of the equipment"),
                description: z
                  .string()
                  .describe("Description of the equipment"),
              }),
            )
            .max(3)
            .describe("List of space equipment suggestions (up to 3 items)"),
        }),

        // This tool simply returns the suggestions the LLM generated
        // In a real app, you might fetch data from a database or API
        execute: async ({ suggestions }) => ({
          suggestions,
        }),
      }),
    },
  });

  // Convert the result to a UI message stream response for the client
  // This enables real-time streaming of the AI response to the frontend
  return result.toUIMessageStreamResponse();
}
