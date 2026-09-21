"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, Check, MessageSquare, Send } from "lucide-react"
import { useState } from "react"

const features = [
  {
    icon: "🎯",
    title: "Occasion-Based Recommendations",
    description: "Perfect pieces for weddings, anniversaries, and special moments",
  },
  {
    icon: "💰",
    title: "Budget-Conscious Suggestions",
    description: "Find stunning jewelry within your price range",
  },
  {
    icon: "✨",
    title: "Style Preference Learning",
    description: "AI adapts to your unique taste over time",
  },
  {
    icon: "⚡",
    title: "Real-Time Availability",
    description: "Only shows pieces currently in stock",
  },
]

export function AIStylist() {
  const [messages, setMessages] = useState([
    {
      role: "user",
      content: "I'm looking for an engagement ring under $5,000",
    },
    {
      role: "assistant",
      content: "I'd recommend our Eternal Rose Diamond Ring. It features a stunning 1.5ct rose-cut diamond in 18k rose gold setting. At $4,850, it's within your budget and offers exceptional brilliance.",
    },
  ])

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Features */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#B8860B]/10 text-[#B8860B] px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Lumina AI Stylist</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-playfair-display text-gray-900 mb-6">
              Meet Your Personal Jewelry Stylist
            </h2>
            
            <p className="text-lg text-gray-600 mb-8">
              Our AI-powered stylist learns your preferences and helps you find the perfect piece for any occasion.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-3">
                  <div className="text-2xl">{feature.icon}</div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Button className="bg-[#B8860B] hover:bg-[#9A7009] text-white px-8 py-6 rounded-full text-base font-medium">
              <MessageSquare className="mr-2 w-5 h-5" />
              Start AI Consultation
            </Button>
          </div>
          
          {/* Right Side - Chat Interface */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-[#3D2800] to-[#5C3D00] px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#B8860B] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium">Lumina AI Stylist</h3>
                <p className="text-[#E8D5A0] text-sm">Online • Ready to help</p>
              </div>
            </div>
            
            {/* Chat Messages */}
            <div className="p-6 space-y-4 min-h-[300px] max-h-[400px] overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-[#B8860B] text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Chat Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ask about jewelry recommendations..."
                  className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:border-[#B8860B] text-sm"
                />
                <Button className="bg-[#B8860B] hover:bg-[#9A7009] text-white w-12 h-12 rounded-full p-0">
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
