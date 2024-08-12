import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Pizza Order Taker AI Chatbot 🤖🍕😊",
  description:
    "Order your favorite pizza effortlessly with my AI-powered chatbot! Just chat with it like you would with a real person, and it will help you customize and place your pizza order in no time.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
