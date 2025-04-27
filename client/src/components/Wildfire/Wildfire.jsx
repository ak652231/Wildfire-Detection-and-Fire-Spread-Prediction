"use client"

import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Flame, Map, BarChart3, AlertTriangle, ChevronRight } from 'lucide-react'
import RotatingGlobe from "../RotatingGlobe/RotatingGlobe"

export default function WildfirePage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const fireContainer = document.getElementById("fire-container")
    if (fireContainer) {
      createParticles(fireContainer, 60, 60)
    }
  }, [])

  const createParticles = (container, num, leftSpacing) => {
    for (let i = 0; i < num; i++) {
      const particle = document.createElement("div")
      particle.style.left = `calc((100% - 5em) * ${i / leftSpacing})`
      particle.setAttribute("class", "particle")
      particle.style.animationDelay = 4 * Math.random() + "s"
      container.appendChild(particle)
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 overflow-hidden">
      {/* Sidebar */}
      <div className="side-buttons flex flex-col justify-evenly p-2.5 h-[30rem] bg-orange-500 rounded-r-3xl z-50">
        <Link to="/fire-spread">
          <button className="circle-button w-[50px] h-[50px] my-2.5 bg-white rounded-full border-none z-[999] flex items-center justify-center hover:bg-gray-100 transition-colors">
            <Flame className="h-6 w-6 text-orange-500" />
          </button>
        </Link>
        <Link to="/kmean">
          <button className="circle-button w-[50px] h-[50px] my-2.5 bg-white rounded-full border-none z-[999] flex items-center justify-center hover:bg-gray-100 transition-colors">
            <Map className="h-6 w-6 text-orange-500" />
          </button>
        </Link>
        <Link to="/pred">
          <button className="circle-button w-[50px] h-[50px] my-2.5 bg-white rounded-full border-none z-[999] flex items-center justify-center hover:bg-gray-100 transition-colors">
            <BarChart3 className="h-6 w-6 text-orange-500" />
          </button>
        </Link>
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-50">
        <div className="flex justify-around p-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="flex flex-col items-center text-xs text-gray-300">
              <AlertTriangle className="h-5 w-5 text-orange-500 mb-1" />
              <span>Dashboard</span>
            </Button>
          </Link>

          <Link href="/current">
            <Button variant="ghost" size="sm" className="flex flex-col items-center text-xs text-gray-300">
              <Map className="h-5 w-5 text-orange-500 mb-1" />
              <span>Current</span>
            </Button>
          </Link>

          <Link href="/pred">
            <Button variant="ghost" size="sm" className="flex flex-col items-center text-xs text-gray-300">
              <BarChart3 className="h-5 w-5 text-orange-500 mb-1" />
              <span>Predictions</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Globe Section */}
            <div className="order-2 lg:order-1 flex justify-center">
              {isClient && <RotatingGlobe />}
            </div>

            {/* Text Section */}
            <div className="order-1 lg:order-2 space-y-6">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-orange-500 tracking-tight"
              >
                Get wildfire alerts!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-gray-300 text-lg"
              >
                Stay informed about wildfire risks in your area with our advanced prediction system.
                Our platform combines satellite imagery, weather data, and machine learning to provide
                accurate and timely wildfire alerts, helping you stay safe and prepared.
              </motion.p>

              <div id="fire-button">

                <div id="fire-container"></div>

                <Link to='/current'><button className="pick-region-button" >Pick a region</button></Link>

              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
          >
            <Card className="bg-gray-800 border-gray-700 p-6">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-orange-500/20 p-3 mb-4">
                  <AlertTriangle className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Real-time Alerts</h3>
                <p className="text-gray-400">Receive instant notifications about wildfire risks in your selected regions.</p>
              </div>
            </Card>

            <Card className="bg-gray-800 border-gray-700 p-6">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-orange-500/20 p-3 mb-4">
                  <Map className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Interactive Maps</h3>
                <p className="text-gray-400">Explore current wildfires and risk zones with our detailed interactive maps.</p>
              </div>
            </Card>

            <Card className="bg-gray-800 border-gray-700 p-6">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-orange-500/20 p-3 mb-4">
                  <BarChart3 className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Predictive Analytics</h3>
                <p className="text-gray-400">Our AI models predict wildfire risks before they happen, giving you time to prepare.</p>
              </div>
            </Card>
          </motion.div>
        </div>
        <div className="fire"></div>
      </div>

      {/* Fire animation styles */}
      <style jsx>{`
        :root {
  --fireColor1: #ff5000;
  --fireColor2: rgba(255,80,0,0);
  --fireDuration: 1s;
  --blur: 0.4px;
  --fireSize: 6rem;
  --glitter: url("https://assets.codepen.io/13471/silver-glitter-background.png");
  --fire-glow: 0 0 20px rgba(255, 80, 0, 0.7);
}

       #fire-button {
  position: relative;
  display: inline-block;
}
#fire-container {
  font-size: 24px;
  filter: blur(var(--blur));
  -webkit-filter: blur(var(--blur));
  position: absolute;
  width: 15em; /* Increased width from 10em to 15em */
  height: 4em; /* Decreased height from 6em to 4em */
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}
#fire-button:hover #fire-container {
  opacity: 1;
}
#fire-container .particle {
  animation: rise var(--fireDuration) ease-in infinite;
  background-image: radial-gradient(var(--fireColor1) 30%,var(--fireColor2) 70%);
  border-radius: 50%;
  mix-blend-mode: screen;
  opacity: 0;
  position: absolute;
  bottom: 0;
  width: var(--fireSize);
  height: var(--fireSize);
}
.pick-region-button {
  background-color: #ff9800;
  color: black;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  cursor: pointer;
  border-radius: 2rem;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: bold;
}
.pick-region-button:hover {
  background-color: rgba(0,0,0,0.0);
  box-shadow: var(--fire-glow);
  transform: translateY(-2px);
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(0) scale(1);
  }
  25% {
    opacity: 1;
  }
  to {
    opacity: 0;
    transform: translateY(-3em) scale(0);
  }
}
.fire::before,
.fire::after {
  content: "";
  position: absolute;
  inset: 0;
}
.fire::before {
  content: "";
  background-image: var(--glitter), var(--glitter),
      linear-gradient(
          0deg,
          white 0px,
          #ff8951 2.5px,
          #dcbc169c 15%,
          transparent 35%
      ),
      radial-gradient(ellipse at bottom, transparent 15%, black 30%);
      background-size: 350px 500px, 400px 650px, 100% 40%, 100% 100%;
  background-blend-mode: hard-light, color-dodge, multiply;
  background-position: 0px 0px, 0px 0px, var(--gradientPos);
  background-repeat: repeat, repeat, repeat, no-repeat;
  mix-blend-mode: color-dodge;
  filter: brightness(3.7) blur(3.5px) contrast(6);
  animation: fire 0.875s linear infinite;
  box-shadow: inset 0 -20px 25px -30px #63bbc5;
}
@keyframes fire {
  0% {
      background-position: center 0px, center 0px, 50% 100%, center center;
  }
  100% {
      background-position: center -500px, center -650px, 50% 100%, center center;
  }
}

/* Position the sidebar in the vertical center of the page */
.side-buttons {
  position: fixed; /* Fixed position instead of sticky */
  top: 50%; /* Position at 50% from the top */
  transform: translateY(-50%); /* Shift up by half its height to center it */
  /* Keep all original properties for size and layout */
}

@media screen and (max-width: 1200px) {
  .content-section {
    flex-direction: column;
    align-items: center;
    margin-left: 0;
  }
  .image-placeholder {
    margin-right: 0;
    margin-left: 0;
    margin-bottom: 2rem;
  }
  .text-section {
    margin-left: 0;
    text-align: center;
  }
}
@media screen and (max-width: 768px) {
  .wildfire-alert-container {
    flex-direction: column;
  }
  .side-buttons {
    position: static; /* Remove fixed positioning on smaller screens */
    transform: none; /* Remove transform on smaller screens */
    flex-direction: row;
    height: auto;
    width: 100%;
    border-radius: 0 0 2rem 2rem;
    margin-bottom: 2rem;
  }
  .text-section h1 {
    font-size: 2.5rem;
  }
  .text-section p {
    font-size: 0.9rem;
  }
}
@media screen and (max-width: 480px) {
  .text-section h1 {
    font-size: 2rem;
  }
  .text-section p {
    font-size: 0.8rem;
  }
  .pick-region-button {
    font-size: 0.9rem;
    padding: 8px 16px;
  }
}
      `}</style>
    </div>
  )
}
