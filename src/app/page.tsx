export default function App() {
  return (
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-12 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 text-white font-bold text-lg tracking-wide hover:opacity-80 transition cursor-pointer">
          <span className="bg-green-500 text-black px-2 py-0.5 rounded-md text-sm">
            {"</>"}
          </span>
          Coda
        </div>

        {/* Run Button */}
        <button className="bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded-md transition cursor-pointer">
          ▶ Run
        </button>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 bg-zinc-900 border-r border-zinc-800 p-4 text-white">
          <p className="mb-2">main.py</p>
          <p className="mb-2">app.py</p>
          <p>index.js</p>
        </div>

        {/* Editor Container */}
        <div className="flex-1 bg-zinc-950 flex items-center justify-center text-zinc-500 text-lg">
          Editor
        </div>
      </div>

      {/* Footer */}
      <div className="h-6 bg-zinc-900 border-t border-zinc-800 px-4 flex items-center justify-between text-[10px] text-zinc-500">
        <span>Ready</span>
        <span>Language: JavaScript</span>
      </div>
    </div>
  );
}