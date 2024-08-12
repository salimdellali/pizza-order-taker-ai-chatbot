"use client"

import { useEffect, useState, useRef } from "react"
import { blobToBase64 } from "@/lib/blobToBase64"
import { transcribe } from "../app/actions"

export const useRecordVoice = () => {
  // state to hold the transcribed text
  const [transcription, setTranscription] = useState<string>("")

  // state to hold the media recorder instance
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)

  // state to track whether recording is currently in progress
  // to use when re-rendering is needed (like changing the recording icon)
  const [recording, setRecording] = useState<boolean>(false)

  // ref to track whether recording is currently in progress
  // to be used when re-rendering should be avoided for better performances
  const isRecording = useRef<boolean>(false)

  // ref to store audio chunks during recording
  const chunks = useRef<BlobPart[]>([])

  // function to start the recording
  const startRecording = () => {
    if (mediaRecorder) {
      // isRecording ref and recording state go hand in hand
      isRecording.current = true
      mediaRecorder.start()
      setRecording(true)
    }
  }

  // function to stop the recording
  const stopRecording = () => {
    if (mediaRecorder) {
      // isRecording ref and recording state go hand in hand
      isRecording.current = false
      mediaRecorder.stop()
      setRecording(false)
    }
  }

  const getText = async (base64data: string | undefined): Promise<void> => {
    // @TODO: handle better this edge case
    if (!base64data) {
      console.error("No base64 data provided")
      return
    }

    try {
      const transcriptionObj = await transcribe(base64data)
      setTranscription(transcriptionObj.text)
    } catch (error) {
      console.error(error)
    }
  }

  // function to initialize the media recorder with the provided stream
  const InitializeMediaRecorder = (stream: MediaStream): void => {
    const mediaRecorder = new MediaRecorder(stream)

    // event handler when recording starts
    mediaRecorder.onstart = () => {
      // @TODO: animate the microphone levels
      // createMediaStream(stream, isRecording.current, (peak) => {
      // // Do something with the peak level
      // })
      chunks.current = [] // resetting chunks array
    }

    // event handler when data becomes available during recording
    mediaRecorder.ondataavailable = (ev: BlobEvent) => {
      chunks.current.push(ev.data) // storing data chunks
    }

    // event handler when recording stops
    mediaRecorder.onstop = () => {
      // creating blob from accumulated audio chunks with WAV format
      const audioBlob = new Blob(chunks.current, { type: "audio/wav" })
      console.log("audioBlob", audioBlob)

      // You can do something with the audioBlob, like sending it to a server or processing it further
      blobToBase64(audioBlob, getText)
    }

    setMediaRecorder(mediaRecorder)
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(InitializeMediaRecorder)
    }
  }, [])

  return { recording, startRecording, stopRecording, transcription }
}
