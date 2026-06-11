import Link from "next/link";
import { ArrowRight, MessageSquareText, Smartphone, LayoutDashboard, Zap, ShieldCheck, Palette, Truck, Camera, Search } from "lucide-react";
import { PricingSection } from "@/components/landing/pricing-section";
import { AnimatedUrl } from "@/components/landing/animated-url";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased overflow-x-hidden">

      {/* ── NAV ──────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-zinc-100/80 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[oklch(0.55_0.22_250)] flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-white font-black text-sm">P</span>
            </div>
            <span className="font-bold text-zinc-900 tracking-tight">PickyApp</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
            <a href="#funciones" className="hover:text-zinc-900 transition-colors">Funciones</a>
            <a href="#como" className="hover:text-zinc-900 transition-colors">Cómo funciona</a>
            <a href="#planes" className="hover:text-zinc-900 transition-colors">Planes</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="hidden sm:block text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
              Entrar
            </Link>
            <Link href="/auth/register" className="text-sm bg-zinc-900 text-white px-4 py-2 rounded-full font-semibold hover:bg-zinc-700 transition-all hover:shadow-lg hover:shadow-zinc-900/20 hover:-translate-y-px active:translate-y-0">
              Empezar gratis →
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">

        {/* Animated blobs */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-16 right-[8%] h-[500px] w-[500px] rounded-full bg-[oklch(0.55_0.22_250)]/12 blur-[80px] animate-blob" />
          <div className="absolute top-32 right-[30%] h-[350px] w-[350px] rounded-full bg-violet-400/10 blur-[60px] animate-blob animation-delay-2s" />
          <div className="absolute top-8 left-[2%] h-[400px] w-[400px] rounded-full bg-[oklch(0.55_0.22_250)]/8 blur-[70px] animate-blob-slow animation-delay-4s" />
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: "radial-gradient(circle, #d4d4d8 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* ← Left: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[oklch(0.55_0.22_250)]/10 text-[oklch(0.45_0.22_250)] text-xs font-bold px-3.5 py-1.5 rounded-full mb-7 border border-[oklch(0.55_0.22_250)]/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[oklch(0.55_0.22_250)] animate-ping-slow" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0.22_250)]" />
                </span>
                Sin tarjeta de crédito · Empezá gratis, tu espacio para siempre
              </div>

              <h1 className="text-[3.2rem] sm:text-[4rem] lg:text-[4.5rem] font-black tracking-tight leading-[1.05] mb-6">
                Tu negocio creció.<br />
                <span
                  className="animate-shimmer bg-clip-text text-transparent"
                  style={{
                    backgroundImage: "linear-gradient(90deg, oklch(0.45 0.22 250), oklch(0.60 0.22 290), oklch(0.55 0.22 250), oklch(0.60 0.22 290), oklch(0.45 0.22 250))",
                    backgroundSize: "200% auto",
                  }}
                >
                  Tus pedidos siguen<br />perdidos en el chat.
                </span>
              </h1>

              <p className="text-lg text-zinc-500 leading-relaxed mb-8 max-w-[26rem]">
                <span className="text-zinc-700 font-medium">"¿tienen en stock?"</span>, <span className="text-zinc-700 font-medium">"¿qué ingredientes tiene?"</span>, <span className="text-zinc-700 font-medium">"¿aceptan transferencia?"</span>, <span className="text-zinc-700 font-medium">"¿a qué hora abren?"</span> — las mismas preguntas, todos los días, en el chat. Picky las responde por vos: un catálogo donde los pedidos llegan completos, sin interrogatorio.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link href="/auth/register" className="group inline-flex items-center gap-2 bg-zinc-900 text-white px-6 py-3.5 rounded-full font-bold text-sm hover:bg-[oklch(0.55_0.22_250)] transition-all duration-300 hover:shadow-xl hover:shadow-[oklch(0.55_0.22_250)]/30 hover:-translate-y-0.5 active:translate-y-0">
                  Crear mi tienda gratis
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#como" className="inline-flex items-center gap-2 bg-white text-zinc-700 px-6 py-3.5 rounded-full font-semibold text-sm border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-all hover:-translate-y-0.5">
                  Ver cómo funciona
                </a>
              </div>

            </div>

            {/* → Right: Phone mockup */}
            <div className="relative flex justify-center lg:justify-end select-none">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-72 w-72 rounded-full bg-[oklch(0.55_0.22_250)]/15 blur-3xl animate-blob animation-delay-700" />
              </div>

              {/* Phone */}
              <div className="relative z-10 w-[17rem] rounded-[2.5rem] border-[6px] border-zinc-900 bg-zinc-900 shadow-2xl shadow-zinc-900/40 animate-float">
                <div className="rounded-[2rem] overflow-hidden bg-white">
                  {/* Status bar */}
                  <div className="bg-zinc-900 px-5 pt-2 pb-1 flex justify-between items-center">
                    <span className="text-white text-[10px] font-medium">9:41</span>
                    <div className="h-3 w-16 bg-zinc-800 rounded-full" />
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-white/50" />
                      <div className="h-1.5 w-2.5 rounded-sm bg-white/50" />
                      <div className="h-1.5 w-3.5 rounded-sm bg-white/50" />
                    </div>
                  </div>

                  {/* Store header */}
                  <div className="bg-gradient-to-br from-[oklch(0.55_0.22_250)] to-violet-600 px-4 py-4 text-white">
                    <p className="text-[10px] opacity-60 mb-0.5">Bienvenido a</p>
                    <p className="font-bold text-base leading-tight">La Burger Co. 🍔</p>
                    <div className="flex gap-1.5 mt-2.5 flex-wrap">
                      {["Burgers", "Bebidas", "Postres"].map((c) => (
                        <span key={c} className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-medium">{c}</span>
                      ))}
                    </div>
                  </div>

                  {/* Products */}
                  <div className="px-3 py-3 space-y-2">
                    {[
                      { name: "Smash Burger", price: "$3.500", emoji: "🍔" },
                      { name: "Crispy Chicken", price: "$3.200", emoji: "🍗" },
                      { name: "Papas XL", price: "$1.800", emoji: "🍟" },
                    ].map((p) => (
                      <div key={p.name} className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-50">
                        <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center text-base shrink-0">{p.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-zinc-900 truncate">{p.name}</p>
                          <p className="text-[10px] text-zinc-500">{p.price}</p>
                        </div>
                        <div className="h-5 w-5 rounded-full bg-[oklch(0.55_0.22_250)] text-white text-[11px] flex items-center justify-center font-bold shrink-0">+</div>
                      </div>
                    ))}
                  </div>

                  {/* Cart button */}
                  <div className="px-3 pb-4">
                    <div className="w-full bg-zinc-900 text-white text-[11px] font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                      🛒 Ver carrito · 2 items
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating: new order */}
              <div className="absolute -left-6 top-1/4 bg-white rounded-2xl shadow-xl shadow-zinc-900/10 p-3 flex items-center gap-2.5 border border-zinc-100 z-20 animate-float-sm animation-delay-200">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <span className="text-emerald-600 text-sm font-bold">✓</span>
                </div>
                <div>
                  <p className="text-[9px] text-zinc-400 font-medium">Nuevo pedido</p>
                  <p className="text-[11px] font-bold text-zinc-900">2× Smash Burger</p>
                </div>
              </div>

              {/* Floating: stats */}
              <div className="absolute -right-4 bottom-1/3 bg-white rounded-2xl shadow-xl shadow-zinc-900/10 p-3.5 border border-zinc-100 z-20 animate-float-sm animation-delay-400">
                <p className="text-[9px] text-zinc-400 font-medium mb-1">Pedidos hoy</p>
                <p className="text-2xl font-black text-zinc-900 leading-none">47</p>
                <p className="text-[9px] text-emerald-600 font-bold mt-1">↑ 23% vs ayer</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── ¿TE SUENA? ───────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] mb-3">El problema</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">¿Te suena familiar?</h2>
            <p className="text-zinc-500 max-w-md mx-auto">Esto pasa todos los días en negocios que gestionan pedidos por chat.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: "💬",
                pain: "\"¿Qué modelo era? ¿Qué color? ¿En qué talle? ¿Tiene stock? ¿Hacen envío?\"",
                label: "Pedidos incompletos",
                desc: "El cliente escribe 3 palabras y empieza el interrogatorio.",
              },
              {
                icon: "🌀",
                pain: "\"No encuentro el pedido. Hay demasiados mensajes.\"",
                label: "Pedidos enterrados en el chat",
                desc: "Cuando el volumen sube, los pedidos se pierden entre conversaciones.",
              },
              {
                icon: "🔁",
                pain: "\"¿Tienen envío? ¿Cuánto cuesta? ¿A qué hora abren?\"",
                label: "Las mismas preguntas, todos los días",
                desc: "Precios, horarios, menú, disponibilidad. Una y otra vez.",
              },
              {
                icon: "😤",
                pain: "\"¿Ya salió? ¿Lo recibieron? ¿Está confirmado?\"",
                label: "Clientes que preguntan por el estado",
                desc: "Cada pedido genera más mensajes de seguimiento.",
              },
              {
                icon: "🧠",
                pain: "\"Cuando llega la hora pico, todo se rompe.\"",
                label: "El negocio depende de la memoria",
                desc: "WhatsApp + cuaderno + memoria. Funciona hasta que no funciona.",
              },
              {
                icon: "😩",
                pain: "\"Debería estar cocinando, pero estoy respondiendo chats.\"",
                label: "El dueño se vuelve operador de WhatsApp",
                desc: "El tiempo que deberías invertir en tu negocio, lo gastás en mensajes.",
              },
              {
                icon: "📉",
                pain: "\"La competencia ya tiene tienda online. Yo sigo con el cuaderno.\"",
                label: "La competencia se actualiza, vos te quedás",
                desc: "Cada día que operás de manera antigua es un día que el negocio de al lado te saca ventaja.",
              },
              {
                icon: "📸",
                pain: "\"¿Dónde guardé la foto? ¿Cuál era el precio nuevo? El cel está lleno de imágenes.\"",
                label: "Fotos y precios dispersos en mil lugares",
                desc: "Entre el celular, el grupo de WhatsApp y la carpeta de Drive, nunca encontrás lo que buscás.",
              },
              {
                icon: "🏃",
                pain: "\"Estoy atendiendo en persona y me piden info de un producto. No puedo buscar y mandar todo eso.\"",
                label: "No podés atender en persona y responder al mismo tiempo",
                desc: "Cuando estás con un cliente frente a frente, no hay tiempo de buscar fotos y mandárselas a otro.",
              },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl mb-3">{item.icon}</div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">{item.label}</p>
                <p className="text-sm italic text-zinc-500 mb-3 leading-relaxed">{item.pain}</p>
                <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Bridge */}
          <div className="mt-12 rounded-2xl bg-zinc-900 text-white p-8 text-center">
            <p className="text-lg sm:text-xl font-bold leading-snug max-w-2xl mx-auto">
              "Mi negocio creció, pero sigo gestionando pedidos<br className="hidden sm:block" /> como si recibiera diez mensajes por día."
            </p>
            <p className="text-zinc-400 text-sm mt-3">La frase que resume todo. Picky existe para cambiarla.</p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section id="funciones" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-[oklch(0.55_0.22_250)] uppercase tracking-[0.2em] mb-3">La solución</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
              Cada dolor tiene<br />
              <span className="text-zinc-300">su respuesta.</span>
            </h2>
          </div>

          {/* 0% comisión — full width highlight */}
          <div className="relative rounded-3xl p-8 md:p-12 overflow-hidden mb-4 text-white">
            {/* animated gradient bg */}
            <div
              className="absolute inset-0 animate-gradient-x"
              style={{ backgroundImage: "linear-gradient(135deg, oklch(0.20 0.05 250), oklch(0.15 0.02 280), oklch(0.18 0.08 240), oklch(0.12 0.02 260))" }}
            />
            {/* noise texture overlay */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
            />
            <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-[oklch(0.55_0.22_250)]/25 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-10 h-48 w-48 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col md:flex-row md:items-center gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-bold px-3 py-1.5 rounded-full mb-5 border border-white/15">
                  💰 Sin letra chica
                </div>
                <h3 className="text-3xl md:text-4xl font-black mb-3 leading-tight">
                  Vendás $1.000 o $1.000.000,<br className="hidden md:block" />
                  <span
                    className="animate-shimmer bg-clip-text text-transparent"
                    style={{
                      backgroundImage: "linear-gradient(90deg, oklch(0.85 0.12 250), oklch(0.95 0.05 280), oklch(0.85 0.12 250))",
                      backgroundSize: "200% auto",
                    }}
                  >
                    {" "}todo es tuyo.
                  </span>
                </h3>
                <p className="text-white/60 leading-relaxed max-w-lg">
                  Picky no cobra comisión sobre tus ventas. Nunca. Pagás el plan mensual y punto. Lo que generás con tu trabajo, queda en tu bolsillo.
                </p>
              </div>
              <div className="shrink-0 grid grid-cols-2 gap-3">
                {[
                  { v: "0%", l: "Comisión", sub: "sobre tus ventas" },
                  { v: "100%", l: "Tuyo", sub: "cada peso que entra" },
                ].map((s) => (
                  <div key={s.l} className="bg-white/8 border border-white/10 rounded-2xl p-5 text-center backdrop-blur-sm hover:bg-white/12 transition-colors">
                    <p className="text-4xl font-black text-white">{s.v}</p>
                    <p className="text-xs font-bold text-white/70 mt-1">{s.l}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tu espacio en la nube — full width */}
          <div className="relative rounded-3xl p-8 md:p-12 mb-4 overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 shadow-sm hover:shadow-xl hover:shadow-sky-200/40 transition-all duration-300 group">
            <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-sky-300/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[oklch(0.55_0.22_250)]/8 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col md:flex-row md:items-center gap-8 md:gap-16">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5 border border-sky-200">
                  ☁️ Tu dirección digital, incluida en el plan
                </div>
                <h3 className="text-3xl md:text-4xl font-black mb-3 leading-tight text-zinc-900">
                  Tu propio espacio<br />en la nube
                </h3>
                <p className="text-zinc-500 leading-relaxed max-w-md mb-5">
                  Tu tienda vive en una URL única, siempre disponible. Compartila, ponela en tu bio de Instagram, imprimila en el menú. Es tu dirección digital — y no te cuesta nada extra.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {[
                    "✓ Sin hosting",
                    "✓ Sin mantenimiento",
                    "✓ Sin licencias",
                    "✓ Sin técnicos",
                    "✓ Para siempre",
                  ].map((tag) => (
                    <span key={tag} className="text-[11px] bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full font-semibold">{tag}</span>
                  ))}
                </div>
                <Link href="/auth/register" className="inline-flex items-center gap-2 text-sm font-bold text-sky-700 hover:text-sky-900 transition-colors group/link">
                  Reclamar mi espacio gratis
                  <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* URL animation */}
              <div className="shrink-0 flex flex-col items-center md:items-start gap-3 w-full md:w-auto">
                <AnimatedUrl />
                <p className="text-xs text-zinc-400 text-center md:text-left">Disponible en todos los planes</p>
              </div>
            </div>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Catálogo + Pedidos — large */}
            <div className="md:col-span-2 group rounded-3xl p-8 bg-gradient-to-br from-[#e7faf0] to-[#f0fdf4] shadow-sm hover:shadow-xl hover:shadow-emerald-200/40 transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-2xl bg-[#25D366] flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <MessageSquareText className="h-6 w-6 text-white" />
              </div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Dolor #1 y #3 resueltos</p>
              <h3 className="text-2xl font-bold mb-2 text-zinc-900">Pedidos completos desde el primer mensaje</h3>
              <p className="text-zinc-600 leading-relaxed mb-6">
                El cliente elige del catálogo, selecciona cantidad, variantes y confirma. El pedido llega a tu panel con todo el detalle. Sin preguntar dos veces. Sin perderlo entre conversaciones.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Sin interrogatorio", "Sin pedidos perdidos", "Confirmación instantánea", "Todo organizado"].map((tag) => (
                  <span key={tag} className="text-[11px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">{tag}</span>
                ))}
              </div>
            </div>

            {/* Mobile */}
            <div className="group rounded-3xl p-8 bg-gradient-to-br from-[oklch(0.55_0.22_250)]/8 to-violet-50 shadow-sm hover:shadow-xl hover:shadow-[oklch(0.55_0.22_250)]/15 transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-2xl bg-[oklch(0.55_0.22_250)] flex items-center justify-center mb-6 shadow-lg shadow-[oklch(0.55_0.22_250)]/30 group-hover:scale-110 transition-transform">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <p className="text-xs font-bold text-[oklch(0.45_0.22_250)] uppercase tracking-wider mb-2">Dolor #4 resuelto</p>
              <h3 className="text-xl font-bold mb-2 text-zinc-900">Tu menú responde por vos, 24/7</h3>
              <p className="text-zinc-600 text-sm leading-relaxed">Precios, horarios, disponibilidad: todo está en el catálogo. Los clientes encuentran lo que buscan sin mandarte un mensaje.</p>
            </div>

            {/* Personalización — large */}
            <div className="md:col-span-2 group rounded-3xl p-8 bg-gradient-to-br from-violet-50 to-fuchsia-50 shadow-sm hover:shadow-xl hover:shadow-violet-200/40 transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-2xl bg-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-600/30 group-hover:scale-110 transition-transform">
                <Palette className="h-6 w-6 text-white" />
              </div>
              <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-2">Dolor #5 resuelto</p>
              <h3 className="text-2xl font-bold mb-2 text-zinc-900">Una sola fuente de verdad</h3>
              <p className="text-zinc-600 leading-relaxed mb-6">
                Se acabó el catálogo en papel, los precios en un grupo y el menú desactualizado. Tu tienda es la versión correcta. Siempre. Para todos.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Un solo lugar", "Siempre actualizado", "Tu marca y colores", "Accesible desde cualquier celular"].map((tag) => (
                  <span key={tag} className="text-[11px] bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full font-semibold">{tag}</span>
                ))}
              </div>
            </div>

            {/* Logística */}
            <div className="group rounded-3xl p-8 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm hover:shadow-xl hover:shadow-amber-200/40 transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Dolor #9 resuelto</p>
              <h3 className="text-xl font-bold mb-2 text-zinc-900">Dejá de ser el operador de chat</h3>
              <p className="text-zinc-600 text-sm leading-relaxed">El catálogo trabaja por vos. Vos volvés a enfocarte en cocinar, vender y hacer crecer el negocio.</p>
            </div>

            {/* Dashboard */}
            <div className="group rounded-3xl p-8 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm hover:shadow-xl hover:shadow-blue-200/40 transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Dolor #2 resuelto</p>
              <h3 className="text-xl font-bold mb-2 text-zinc-900">Escalá sin perder el control</h3>
              <p className="text-zinc-600 text-sm leading-relaxed">Cuando el volumen sube, el panel lo aguanta. Todos los pedidos, en orden, sin que nada se escape.</p>
            </div>

            {/* Speed */}
            <div className="group rounded-3xl p-8 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm hover:shadow-xl hover:shadow-orange-200/40 transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-2xl bg-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">Dolor #10 resuelto</p>
              <h3 className="text-xl font-bold mb-2 text-zinc-900">Sin depender de la memoria</h3>
              <p className="text-zinc-600 text-sm leading-relaxed">El catálogo digital reemplaza el cuaderno, el grupo de WhatsApp y la lista en papel. Funciona en hora pico.</p>
            </div>

            {/* Security — dark */}
            <div className="group rounded-3xl p-8 bg-zinc-900 text-white hover:bg-zinc-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-900/30">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:bg-white/15 transition-colors">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Seguro y confiable</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Tus datos protegidos. Tu tienda siempre disponible para tus clientes, las 24 horas.</p>
            </div>

            {/* Fotos en la nube — large */}
            <div className="md:col-span-2 group rounded-3xl p-8 bg-gradient-to-br from-rose-50 to-pink-50 shadow-sm hover:shadow-xl hover:shadow-rose-200/40 transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-2xl bg-rose-500 flex items-center justify-center mb-6 shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">Dolor #8 resuelto</p>
              <h3 className="text-2xl font-bold mb-2 text-zinc-900">Subí la foto una vez. Para siempre.</h3>
              <p className="text-zinc-600 leading-relaxed mb-6">
                Cargás la imagen en el catálogo y queda guardada en la nube. Sin llenar el celular, sin grupos de WhatsApp con fotos vencidas, sin buscar en tres carpetas distintas. El precio está ahí, al lado del producto, actualizado.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Fotos en la nube", "Sin carpetas de Drive", "Precios centralizados", "Siempre actualizado"].map((tag) => (
                  <span key={tag} className="text-[11px] bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full font-semibold">{tag}</span>
                ))}
              </div>
            </div>

            {/* Link directo al producto */}
            <div className="group rounded-3xl p-8 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-sm hover:shadow-xl hover:shadow-teal-200/40 transition-all duration-300 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-2xl bg-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-teal-600/30 group-hover:scale-110 transition-transform">
                <Search className="h-6 w-6 text-white" />
              </div>
              <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">Dolor #9 resuelto</p>
              <h3 className="text-xl font-bold mb-2 text-zinc-900">Compartí un producto en un tap</h3>
              <p className="text-zinc-600 text-sm leading-relaxed">Buscá el producto en segundos y mandá el link directo. Tu cliente lo ve, elige y confirma — sin que vos tengas que dejar de atender.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section id="como" className="py-24 px-6 bg-zinc-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-[oklch(0.55_0.22_250)]/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-violet-400/5 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-5xl relative">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[oklch(0.55_0.22_250)] uppercase tracking-[0.2em] mb-3">Cómo funciona</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
              Tres pasos.<br />
              <span className="text-zinc-400">Un negocio digital.</span>
            </h2>
            <p className="text-zinc-500 mt-4 max-w-lg mx-auto">
              Funciona para cualquier tipo de negocio — vendas productos físicos o ofrezcas servicios.
            </p>
          </div>

          {/* Paso 1 */}
          <div className="flex flex-col md:flex-row gap-6 mb-6 items-stretch">
            <div className="shrink-0 flex flex-col items-center gap-2 w-16">
              <div className="h-12 w-12 rounded-2xl bg-[oklch(0.55_0.22_250)] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[oklch(0.55_0.22_250)]/30">01</div>
              <div className="flex-1 w-px bg-zinc-200 hidden md:block" />
            </div>
            <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-zinc-900 mb-1">Creá tu cuenta gratis</h3>
              <p className="text-zinc-500 text-sm mb-4">Sin tarjeta de crédito, sin letra chica. En 30 segundos tenés tu espacio activo en Picky. Elegís el nombre de tu tienda y listo.</p>
              <div className="inline-flex items-center gap-2 bg-[oklch(0.55_0.22_250)]/8 text-[oklch(0.45_0.22_250)] text-xs font-semibold px-3 py-1.5 rounded-full">
                🛒 Productos &amp; 🗓️ Servicios — el mismo proceso para ambos
              </div>
            </div>
          </div>

          {/* Paso 2 */}
          <div className="flex flex-col md:flex-row gap-6 mb-6 items-stretch">
            <div className="shrink-0 flex flex-col items-center gap-2 w-16">
              <div className="h-12 w-12 rounded-2xl bg-violet-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-violet-600/30">02</div>
              <div className="flex-1 w-px bg-zinc-200 hidden md:block" />
            </div>
            <div className="flex-1 grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-[oklch(0.55_0.22_250)]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🛒</span>
                  <span className="text-xs font-bold text-[oklch(0.45_0.22_250)] uppercase tracking-wider">Modelo Productos</span>
                </div>
                <p className="font-semibold text-zinc-900 text-sm mb-2">Cargá tu catálogo de productos</p>
                <p className="text-zinc-500 text-xs leading-relaxed mb-3">Subí fotos, precio, descripción y variantes (talle, color, sabor). Organizá en categorías. Los clientes arman un carrito y confirman el pedido directamente.</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Carrito de compras", "Variantes", "Stock", "Pedidos al panel"].map(t => (
                    <span key={t} className="text-[10px] bg-[oklch(0.55_0.22_250)]/10 text-[oklch(0.45_0.22_250)] px-2 py-0.5 rounded-full font-semibold">{t}</span>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-400 mt-3 italic">Restaurantes · Indumentaria · Verdulería · Electrónica · Autos</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-emerald-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🗓️</span>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Modelo Servicios</span>
                </div>
                <p className="font-semibold text-zinc-900 text-sm mb-2">Cargá tu catálogo de servicios</p>
                <p className="text-zinc-500 text-xs leading-relaxed mb-3">Describí cada servicio con precio fijo, rango de precios o sin precio. El cliente ve tus opciones y te contacta por WhatsApp para coordinar fecha y detalles.</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Precio fijo o rango", "Sin precio visible", "Consulta por WhatsApp", "Catálogo profesional"].map(t => (
                    <span key={t} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">{t}</span>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-400 mt-3 italic">Peluquerías · Talleres · Profesionales · Estudios · Clínicas</p>
              </div>
            </div>
          </div>

          {/* Paso 3 */}
          <div className="flex flex-col md:flex-row gap-6 items-stretch">
            <div className="shrink-0 w-16">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-500/30">03</div>
            </div>
            <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-zinc-900 mb-1">Compartí tu link y empezá a recibir</h3>
              <p className="text-zinc-500 text-sm mb-5">
                Compartí tu URL en{" "}
                <span className="font-semibold text-zinc-800">Instagram, WhatsApp, menú impreso o donde quieras.</span>{" "}
                Desde ese momento, los clientes pueden ver tu catálogo{" "}
                <span className="font-semibold text-zinc-800">las 24 horas</span>, sin que vos estés disponible.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-[oklch(0.55_0.22_250)]/5 p-4 border border-[oklch(0.55_0.22_250)]/15">
                  <p className="text-xs font-bold text-[oklch(0.45_0.22_250)] mb-1">🛒 Con Productos</p>
                  <p className="text-xs text-zinc-600 leading-relaxed">Los pedidos llegan completos a tu panel. Confirmás, preparás y despachás. Sin preguntar nada extra.</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-700 mb-1">🗓️ Con Servicios</p>
                  <p className="text-xs text-zinc-600 leading-relaxed">Los clientes eligen el servicio y te escriben por WhatsApp. Vos coordinás el turno o la consulta. El catálogo filtra las dudas básicas.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-14">
            <Link href="/auth/register" className="group inline-flex items-center gap-2 bg-zinc-900 text-white px-8 py-4 rounded-full font-bold hover:bg-[oklch(0.55_0.22_250)] transition-all duration-300 hover:shadow-xl hover:shadow-[oklch(0.55_0.22_250)]/30 hover:-translate-y-0.5">
              Empezar ahora, es gratis
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────── */}
      <section id="planes" className="py-24 px-6 bg-zinc-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-[oklch(0.55_0.22_250)]/6 blur-3xl pointer-events-none" />
        <div className="mx-auto max-w-6xl relative">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[oklch(0.55_0.22_250)] uppercase tracking-[0.2em] mb-3">Planes</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">
              Empezá gratis.<br />
              <span className="text-zinc-400">Crecé cuando estés listo.</span>
            </h2>
            <p className="text-zinc-500">Sin contratos. Sin sorpresas. Cancelás cuando quieras.</p>
          </div>
          <PricingSection />
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section className="py-8 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="relative rounded-3xl px-8 py-20 text-center overflow-hidden">
            {/* Animated gradient background */}
            <div
              className="absolute inset-0 animate-gradient-x rounded-3xl"
              style={{ backgroundImage: "linear-gradient(135deg, oklch(0.18 0.05 250), oklch(0.13 0.02 280), oklch(0.20 0.08 240), oklch(0.15 0.03 260), oklch(0.18 0.05 250))" }}
            />
            <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-[oklch(0.55_0.22_250)]/25 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

            <div className="relative">
              <p className="text-xs font-bold text-[oklch(0.75_0.22_250)] uppercase tracking-[0.2em] mb-5">Empezá hoy</p>
              <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-4">
                Dejá de perder pedidos<br />en el chat.
              </h2>
              <p className="text-white/50 text-lg mb-10 max-w-lg mx-auto">
                Mientras seguís respondiendo las mismas preguntas de siempre, la competencia ya recibe pedidos organizados. Empezá hoy.
              </p>
              <Link href="/auth/register" className="group inline-flex items-center gap-2.5 bg-white text-zinc-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-zinc-50 transition-all hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1 active:translate-y-0">
                Crear mi tienda gratis
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-white/30 text-sm mt-5">Sin tarjeta de crédito · Listo en minutos · Empezá gratis, tu espacio para siempre</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="py-10 px-6 border-t border-zinc-100 mt-8">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-[oklch(0.55_0.22_250)] flex items-center justify-center">
              <span className="text-white font-black text-[10px]">P</span>
            </div>
            <span className="font-bold text-sm text-zinc-700">PickyApp</span>
          </div>
          <p className="text-sm text-zinc-400">© 2026 PickyApp · Hecho con ❤️ en Jujuy, Argentina 🇦🇷</p>
          <div className="flex gap-6 text-sm text-zinc-400">
            <a href="#" className="hover:text-zinc-700 transition-colors">Términos</a>
            <a href="#" className="hover:text-zinc-700 transition-colors">Privacidad</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
