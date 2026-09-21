"use client"

import { Star, CheckCircle } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Mitchell",
    product: "Eternal Rose Diamond Ring",
    date: "March 2024",
    rating: 5,
    text: "Absolutely stunning! The quality exceeded my expectations. My fiancée was speechless when she saw it. The craftsmanship is impeccable.",
    verified: true,
  },
  {
    name: "James Anderson",
    product: "Sapphire Pendant Necklace",
    date: "February 2024",
    rating: 5,
    text: "Perfect anniversary gift. The sapphire has the most beautiful deep blue color. Customer service was exceptional throughout the process.",
    verified: true,
  },
  {
    name: "Emily Chen",
    product: "Pearl Drop Earrings",
    date: "March 2024",
    rating: 5,
    text: "These earrings are elegant and versatile. I wear them to work and special occasions. The pearls are lustrous and the setting is secure.",
    verified: true,
  },
]

export function Testimonials() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair-display text-gray-900 mb-4">
            Loved by Our Clients
          </h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-[#B8860B] text-[#B8860B]" />
              ))}
            </div>
            <span className="text-lg font-medium text-gray-900">4.9/5</span>
          </div>
          <p className="text-gray-600">from 2,400+ reviews</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow"
            >
              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#B8860B] text-[#B8860B]" />
                ))}
              </div>
              
              {/* Testimonial Text */}
              <p className="text-gray-700 mb-6 leading-relaxed">{testimonial.text}</p>
              
              {/* Author Info */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    {testimonial.name}
                    {testimonial.verified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    Purchased {testimonial.product} • {testimonial.date}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
