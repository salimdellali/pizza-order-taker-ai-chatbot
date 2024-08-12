"use client"

import { Input } from "../components/ui/input"
import { useEffect, useRef, useState } from "react"
import { type CoreMessage } from "ai"
import { continueConversation } from "./actions"
import { readStreamableValue } from "ai/rsc"
import { Separator } from "../components/ui/separator"
import { Skeleton } from "../components/ui/skeleton"
import { useRecordVoice } from "@/hooks/useRecordVoice"

// Enum to represent the role of the message sender (user or assistant)
enum Role {
  USER = "user",
  ASSISTANT = "assistant",
}

// Maximum duration allowed for streaming responses
export const maxDuration = 30

export default function Chat() {
  // State to hold the chat messages
  const [messages, setMessages] = useState<CoreMessage[]>([])

  // State to manage the input value
  const [input, setInput] = useState<string>("")

  // State to manage loading status
  const [isLoading, setIsLoading] = useState(false)

  // Destructure the voice recording utilities from the custom hook
  const { recording, startRecording, stopRecording, transcription } =
    useRecordVoice()

  // Reference to the messages end for auto-scrolling bottom
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Function to scroll to the bottom of the messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Input reference to focus back on input when it is not disabled anymore
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus()
    }
  }, [isLoading])

  // Send a message when a transcription is received
  useEffect(() => {
    if (transcription) {
      sendMessageAndSetResponse(transcription)
    }
  }, [transcription])

  // Function to handle sending a message and setting the received response
  async function sendMessageAndSetResponse(
    userTextMessage: string,
  ): Promise<void> {
    // Add the user's message to the messages state
    const newMessages: CoreMessage[] = [
      ...messages,
      {
        role: Role.USER,
        content: userTextMessage,
      },
    ]
    setMessages(newMessages)

    // Clear the input field
    setInput("")

    // Set the loading state to true
    setIsLoading(true)

    // Call the backend action to continue the conversation and get the assistant's response
    const result = await continueConversation(newMessages)

    // Set the loading state back to false
    setIsLoading(false)

    // asynchronously iterate over the chunks of received data and
    // update the messages state with the received assistant's response
    for await (const content of readStreamableValue(result)) {
      setMessages([
        ...newMessages,
        { role: Role.ASSISTANT, content: content as string },
      ])
    }
  }

  return (
    <div className="flex flex-col w-full max-w-md py-12 mx-auto stretch">
      {/* Render the header */}
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-4">
        Pizza Order Taker AI Chatbot 🤖🍕
      </h4>
      <p className="text-sm text-muted-foreground">
        Pizza AI is an AI chatbot that helps you order just like talking to a
        real person in a store.
      </p>

      <Separator className="my-4" />

      {/* Render the chat messages */}
      {messages.map((m, i) => (
        <div
          key={i}
          className={`whitespace-pre-wrap break-words ${
            m.role === Role.ASSISTANT && "mb-4"
          }`}
        >
          {m.role === Role.USER ? "🧑 User: " : "🤖 Pizza AI: "}
          {m.content as string}
        </div>
      ))}

      {/* Render the loading indicator if AI is processing */}
      {isLoading && (
        <div className="space-y-2">
          🤖 AI is thinking...
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      )}

      {/* Render the input field */}
      <div ref={messagesEndRef}>
        <div className="flex items-center fixed bottom-0 w-full max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessageAndSetResponse(input)
            }}
            className="flex-grow"
          >
            <Input
              ref={inputRef}
              value={input}
              className="p-2 mb-8 border border-gray-500 rounded shadow-xl"
              placeholder="Talk to Pizza AI ..."
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
          </form>

          {/* Render the voice recording button */}
          <button
            onMouseDown={startRecording} // Start recording when mouse is pressed
            onMouseUp={stopRecording} // Stop recording when mouse is released
            onTouchStart={startRecording} // Start recording on touch start
            onTouchEnd={stopRecording} // Stop recording on touch end
            className="p-2 mb-8 ml-2 border border-gray-500 rounded shadow-xl"
          >
            {recording ? "🔴" : "🎤"}
          </button>
        </div>
      </div>
    </div>
  )
}
