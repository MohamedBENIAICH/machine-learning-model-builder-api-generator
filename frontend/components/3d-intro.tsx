"use client"

import { useState, useEffect, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { PerspectiveCamera } from "@react-three/drei"

function AdvancedAnimatedScene() {
  const groupRef = useRef(null)
  const torusRef = useRef(null)
  const spheresRef = useRef([])
  const particlesRef = useRef(null)
  const coresRef = useRef([])
  const waveRef = useRef(null)

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()

    if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(time * 0.3) * 0.3
      groupRef.current.rotation.y += 0.0003
      groupRef.current.rotation.z = Math.cos(time * 0.25) * 0.2
    }

    if (torusRef.current) {
      torusRef.current.rotation.z += 0.002
      torusRef.current.rotation.x += 0.0005
      torusRef.current.scale.set(
        1 + Math.sin(time * 2) * 0.1,
        1 + Math.cos(time * 2.5) * 0.1,
        1 + Math.sin(time * 1.8) * 0.1,
      )
    }

    if (particlesRef.current) {
      const geometry = particlesRef.current.geometry
      const positions = geometry.attributes.position.array as Float32Array

      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time + positions[i] * 0.1) * 0.01
        positions[i] += Math.cos(time * 0.5 + positions[i + 2] * 0.1) * 0.005

        if (Math.abs(positions[i + 1]) > 12) positions[i + 1] *= -0.8
        if (Math.abs(positions[i]) > 12) positions[i] *= -0.8
      }
      geometry.attributes.position.needsUpdate = true
    }

    spheresRef.current.forEach((sphere, i) => {
      if (sphere) {
        const angle = time * 0.5 + (i * Math.PI * 2) / 3
        const radius = 3.5 + Math.sin(time * 0.7 + i) * 0.8
        sphere.position.x = Math.cos(angle) * radius
        sphere.position.z = Math.sin(angle) * radius
        sphere.position.y = Math.sin(time * 0.4 + i) * 1.2
        sphere.rotation.x += 0.008
        sphere.rotation.y += 0.012
        sphere.scale.set(
          1 + Math.sin(time * 3 + i) * 0.15,
          1 + Math.sin(time * 3 + i) * 0.15,
          1 + Math.sin(time * 3 + i) * 0.15,
        )
      }
    })

    coresRef.current.forEach((core, i) => {
      if (core) {
        const pulse = Math.sin(time * 2 + i * 1.57) * 0.4
        core.scale.set(1 + pulse * 0.3, 1 + pulse * 0.3, 1 + pulse * 0.3)
        core.rotation.x += 0.004
        core.rotation.z += 0.003
        core.rotation.y += 0.002

        // Float animation
        core.position.y += Math.sin(time * 1.5 + i) * 0.015
      }
    })

    if (waveRef.current) {
      waveRef.current.rotation.z += 0.001
    }
  })

  return (
    <group ref={groupRef}>
      {/* Central multi-ring system */}
      <mesh ref={torusRef} position={[0, 0, 0]}>
        <torusGeometry args={[2.2, 0.5, 32, 200]} />
        <meshPhongMaterial color="#6366f1" emissive="#4f46e5" wireframe={false} shininess={150} />
      </mesh>

      {/* Secondary rotating rings at various angles */}
      {[
        { rotation: [Math.PI / 4, 0, 0], scale: 0.8 },
        { rotation: [0, Math.PI / 3, 0], scale: 0.9 },
        { rotation: [Math.PI / 6, Math.PI / 4, 0], scale: 0.7 },
      ].map((props, idx) => (
        <mesh key={`ring-${idx}`} rotation={props.rotation as [number, number, number]}>
          <torusGeometry args={[2.2 * props.scale, 0.25, 16, 100]} />
          <meshPhongMaterial
            color={["#8b5cf6", "#06b6d4", "#ec4899"][idx]}
            emissive={["#7c3aed", "#0891b2", "#be185d"][idx]}
            opacity={0.6 + idx * 0.1}
            transparent
            shininess={120}
          />
        </mesh>
      ))}

      {/* Enhanced orbiting spheres with glow */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={`sphere-${i}`}
          ref={(el) => {
            if (el) spheresRef.current[i] = el
          }}
        >
          <sphereGeometry args={[0.6, 64, 64]} />
          <meshPhongMaterial
            color={i === 0 ? "#06b6d4" : i === 1 ? "#8b5cf6" : "#ec4899"}
            emissive={i === 0 ? "#0891b2" : i === 1 ? "#7c3aed" : "#be185d"}
            shininess={150}
          />
        </mesh>
      ))}

      {/* Tetrahedron formations for geometric complexity */}
      {[
        [-2, 2, -2],
        [2, 2, -2],
        [-2, -2, -2],
        [2, -2, -2],
      ].map((pos, i) => (
        <mesh
          key={`core-${i}`}
          position={pos as [number, number, number]}
          ref={(el) => {
            if (el) coresRef.current[i] = el
          }}
        >
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshPhongMaterial
            color={["#10b981", "#f59e0b", "#ef4444", "#3b82f6"][i]}
            emissive={["#059669", "#d97706", "#dc2626", "#1d4ed8"][i]}
            shininess={100}
          />
        </mesh>
      ))}

      {/* Enhanced particle system */}
      <AdvancedParticleSystem ref={particlesRef} />

      {/* Neural network connecting lines */}
      <AdvancedNeuralNetworkLines />
    </group>
  )
}

const AdvancedParticleSystem = React.forwardRef(function ParticleSystem(props: any, ref: any) {
  const pointsRef = useRef(null)

  const particleCount = 2500
  const positions = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 30
    positions[i + 1] = (Math.random() - 0.5) * 30
    positions[i + 2] = (Math.random() - 0.5) * 30
  }

  React.useImperativeHandle(ref, () => pointsRef.current)

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={particleCount} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.08} color="#6366f1" sizeAttenuation transparent opacity={0.7} />
    </points>
  )
})

function AdvancedNeuralNetworkLines() {
  const lineRef = useRef(null)

  useFrame(() => {
    if (lineRef.current) {
      lineRef.current.rotation.z += 0.0008
      lineRef.current.rotation.x += 0.0003
    }
  })

  const positions: [number, number, number][] = [
    [0, 0, 0],
    [4, 2, 1],
    [0, 4, 2],
    [0, 0, 4],
    [-4, 0, 1],
    [0, -4, 2],
    [0, 0, -4],
    [3, 3, 3],
    [-3, -3, 3],
  ]

  const flatPositions = positions.flat()

  return (
    <>
      {positions.map((pos1, i1) =>
        positions.slice(i1 + 1).map((pos2, i2) => (
          <line key={`line-${i1}-${i2}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={new Float32Array([...pos1, ...pos2])}
                count={2}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#6366f1" opacity={0.2} transparent linewidth={1} />
          </line>
        )),
      )}
    </>
  )
}

import React from "react"
import { fetchDashboardStats, type DashboardStats } from "@/lib/api"

export function Intro3D({ onComplete }: { onComplete: () => void }) {
  const [displayText, setDisplayText] = useState("")
  const [showStats, setShowStats] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const text = "ML Model Manager"

  useEffect(() => {
    // Fetch dashboard stats on mount
    const loadStats = async () => {
      const data = await fetchDashboardStats()
      setStats(data)
    }
    loadStats()
  }, [])

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index))
        index++
      } else {
        clearInterval(interval)
        setTimeout(() => setShowStats(true), 300)
        setTimeout(onComplete, 4000)
      }
    }, 80)

    return () => clearInterval(interval)
  }, [onComplete])

  // Use real stats or fallback to defaults
  const displayStats = stats || {
    totalModels: 0,
    classificationCount: 0,
    regressionCount: 0,
    avgAccuracy: 0
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* 3D Canvas Background */}
      <Canvas className="absolute inset-0">
        <PerspectiveCamera position={[0, 0, 11]} fov={75} />
        <AdvancedAnimatedScene />
        <ambientLight intensity={0.8} />
        <pointLight position={[25, 25, 25]} intensity={2} />
        <pointLight position={[-25, -25, 25]} intensity={1.5} color="#8b5cf6" />
        <pointLight position={[25, -25, -25]} intensity={1.2} color="#06b6d4" />
        <pointLight position={[-15, 15, 15]} intensity={1} color="#ec4899" />
      </Canvas>

      {/* Content Overlay */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4 py-8">
        {/* Main Title */}
        <div className="text-center mb-8">
          <h1 className="text-7xl md:text-8xl font-black text-white tracking-tighter mb-2">
            {displayText}
            {displayText.length < text.length && <span className="animate-pulse text-indigo-400">|</span>}
          </h1>
          <p className="text-xl text-slate-300 font-light">Advanced ML Training Platform</p>
        </div>

        {/* Enhanced Statistics Display */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl w-full mb-8 animate-fadeIn">
            {[
              { label: "Modèles totaux", value: displayStats.totalModels.toString(), icon: "🤖", delay: 0 },
              { label: "Classification", value: displayStats.classificationCount.toString(), icon: "📊", delay: 150 },
              { label: "Régression", value: displayStats.regressionCount.toString(), icon: "📈", delay: 300 },
              { label: "Précision moyenne", value: `${displayStats.avgAccuracy}%`, icon: "✨", delay: 450 },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-4 text-center transform transition-all duration-500 hover:bg-white/20 hover:border-white/30 hover:shadow-lg hover:shadow-indigo-500/20"
                style={{ animation: `fadeInScale 0.5s ease-out ${stat.delay}ms forwards`, opacity: 0 }}
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Loading Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
          </div>
          <p className="text-sm text-slate-400">Initializing workspace...</p>
        </div>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}

