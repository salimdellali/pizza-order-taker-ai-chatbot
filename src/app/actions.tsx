"use server"

import { createStreamableValue } from "ai/rsc"
import { CoreMessage, CoreTool, streamText, StreamTextResult } from "ai"
import { openai as vercelOpenAI } from "@ai-sdk/openai"
import OpenAI, { APIError } from "openai"
import fs from "fs"
import { OpenAIChatModelId } from "@ai-sdk/openai/internal"

const systemSetUpMessage = `
  You are Pizza AI, an automated service that collects orders for a pizza restaurant.
  You are not allowed to speak on any other topic.
  You first greet the customer, then collect the order, and then asks if it's a pickup or delivery.
  The user is not allowed to ask for anything outside of the menu
  You wait to collect the entire order, then summarize it and check for a final time if the customer wants to add anything else.
  If it's a delivery, you ask for an address, and add $5 to the final price
  Before finishing, you confirm the entire order and the final price of the order. Make sure to calculate correctly the final price.
  Finally you collect the payment.
  Make sure to clarify all options, extras and sizes to uniquely identify the item from the menu.
  You respond in a short, very conversational friendly style.

  The menu includes :
    Pizzas:
    - Pepperoni Pizza:
      - Ingredients: tomato sauce, shredded mozzarella cheese, and pepperoni
      - Sizes: Large $12.95, Medium $10.00, Small $7.00 
    - Cheese Pizza:
      - Ingredients: tomato sauce, shredded mozzarella cheese, and cheddar cheese
      - Sizes: Large $10.95, Medium $9.25, Small $6.50
    - Eggplant Pizza:
      - Ingredients: tomato sauce and eggplant
      - Sizes: Large $11.95, Medium $9.75, Small $6.75
    
    Sides:
    - fries: 
      - sizes: medium $4.50, small $3.50
    - greek salad $7.25

    Toppings:
    - extra cheese $2.00
    - mushrooms $1.50
    - sausage $3.00
    - canadian bacon $3.50
    - AI sauce $1.50
    - peppers $1.00

    Drinks:
    - coca-cola:
      - sizes: 2L $3.00, 1L $2.00, 330ml $1.00
    - sprite:
      - sizes: 2L $3.00, 1L $2.00, 330ml $1.00
    - bottled water 500ml $2.50
`

const openAIChatModelId: OpenAIChatModelId = "gpt-4o-mini"

export async function continueConversation(messages: CoreMessage[]) {
  const result: StreamTextResult<Record<string, CoreTool<any, any>>> =
    await streamText({
      model: vercelOpenAI(openAIChatModelId),
      system: systemSetUpMessage,
      messages,
    })

  const stream = createStreamableValue(result.textStream)
  return stream.value
}

export async function transcribe(base64Audio: string) {
  // define the file path for storing the temporary WAV file
  const filePath = "tmp/input.wav"

  try {
    // convert the base64 audio data to a buffer
    const audioBuffer = Buffer.from(base64Audio, "base64")

    // write the audio data to temporary WAV file synchronously
    fs.writeFileSync(filePath, audioBuffer)

    // create a readable strea, from the temporary WAV file
    const readStream = fs.createReadStream(filePath)

    // transcribe the audio using OpenAI's Whisper API
    const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const transcription = await openAI.audio.transcriptions.create({
      file: readStream,
      model: "whisper-1",
      language: "en", // this is optional but helps the model, also if it detects another language, it will translate it to english
      temperature: 0, // the model will always choose the most probable (or "deterministic") next word in the sequence
    })

    // remove the temporary file after successful processing
    fs.unlinkSync(filePath)

    // return empty audio message if the received transcription is empty
    // @TODO replace with a warning toast
    if (transcription.text === "") {
      return {
        text: "The audio provided was empty. Please try again",
      }
    }

    // return the transcribed data as { text: string } object
    return transcription
  } catch (error) {
    console.error("❗ Error transcribing audio")

    // @TODO: handle errors properly
    // @TODO: replace with an error toast
    if (error instanceof APIError) {
      if (error.code === "audio_too_short") {
        console.error(
          "Audio file is too short. Minimum audio length is 0.1 seconds",
          error,
        )
        return {
          text: "The audio is too short. minimum audio length should be at least 0.1 seconds",
        }
      }
      // @TODO add more API errors handling
    }

    // return generic error message if unknown error caught
    console.error("Unknown error", error)
    return { text: "Unknown error" }
  } finally {
    // clean up the temporary file in case it still exists
    // (could be the case when the file have been created
    // and the error happened after)
    fs.existsSync(filePath) && fs.unlinkSync(filePath)
  }
}
