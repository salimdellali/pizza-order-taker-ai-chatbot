"use client"

import { Input } from "../components/ui/input"
import { useEffect, useRef, useState } from "react"
import { type CoreMessage } from "ai"
import { continueConversation } from "./actions"
import { readStreamableValue } from "ai/rsc"
import { Separator } from "../components/ui/separator"

enum Role {
  USER = "user",
  ASSISTANT = "assistant",
}

// Allow streaming responses up to 30s
export const maxDuration = 30

export default function Chat() {
  const [messages, setMessages] = useState<CoreMessage[]>([])
  const [input, setInput] = useState<string>("")

  // enable auto bottom scroll
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // 1. prevent default form submission behavior
    e.preventDefault()

    // 2. update the messages state by appending the new user input message to the current list of messages
    const newMessages: CoreMessage[] = [
      ...messages,
      {
        role: Role.USER,
        content: input,
      },
    ]
    setMessages(newMessages)

    // 3. clear user input
    setInput("")

    // 4. call the continue conversation backend action and get the assistant's response
    const result = await continueConversation(newMessages)

    // 5. asynchronously iterate over the chunks of received data and
    // update the messages state with the received assistant's response
    for await (const content of readStreamableValue(result)) {
      setMessages([
        ...newMessages,
        { role: Role.ASSISTANT, content: content as string },
      ])
    }
  }

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {/* render the header */}
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-4">
        Pizza Order Taker AI Chatbot 🤖🍕
      </h4>

      <p className="text-sm text-muted-foreground">
        Pizza AI is an AI chatbot that helps you order just like talking to a
        real person in a store.
      </p>

      <Separator className="my-4" />

      {/* render the messages */}
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

      {/* render the input */}
      <div ref={messagesEndRef}>
        <form onSubmit={handleSubmit}>
          <Input
            className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-500 rounded shadow-xl"
            value={input}
            placeholder="Talk to Pizza AI ..."
            onChange={(e) => setInput(e.target.value)}
          />
        </form>
      </div>
    </div>
  )
}
