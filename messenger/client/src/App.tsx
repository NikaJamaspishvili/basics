import { useState, useEffect } from "react";

function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<{ host?: string; guest?: string }[]>(
    [],
  );
  const [input, setInput] = useState("");

  useEffect(() => {
    const queryString = window.location.search;
    const id = new URLSearchParams(queryString).get("id");
    console.log("id: ", id);
    const websocket = new WebSocket(`ws://localhost:3000?id=${id}`);
    setWs(websocket);

    websocket.onopen = () => console.log("websocket connection is open...");
    websocket.onmessage = (event) => {
      setMessages((prev) => [...prev, { guest: event.data }]);
    };

    websocket.onclose = () => console.log("websocket connection closed....");

    return () => websocket.close();
  }, []);

  const sendMessage = () => {
    const sendingTo = new URLSearchParams(window.location.search).get(
      "guestId",
    );
    const trimmedInput = input.trim();

    if (ws && trimmedInput) {
      ws.send(
        JSON.stringify({
          sendingTo: parseInt(sendingTo || "0"),
          message: trimmedInput,
        }),
      );
      setMessages((prev) => [...prev, { host: trimmedInput }]);
      setInput("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-100 p-4 sm:p-8">
      <main className="mx-auto flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/85 shadow-[0_25px_70px_-20px_rgba(30,64,175,0.35)] backdrop-blur">
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Messenger Clone
            </h1>
            <p className="text-sm text-slate-500">Realtime conversation</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Connected
          </div>
        </header>

        <section className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(191,219,254,0.4),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(167,243,208,0.35),transparent_45%)] px-4 py-5 sm:px-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.host ? "justify-start" : "justify-end"}`}
            >
              <p
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm sm:max-w-[65%] ${
                  message.host
                    ? "rounded-bl-md bg-blue-600 text-white shadow-blue-200/70"
                    : "rounded-br-md bg-emerald-500 text-white shadow-emerald-200/70"
                }`}
              >
                {message.host ?? message.guest}
              </p>
            </div>
          ))}
        </section>

        <section className="border-t border-slate-200/80 bg-white/80 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <input
              value={input}
              type="text"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              className="h-11 flex-1 rounded-full border border-slate-300 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Write a message..."
            />
            <button
              onClick={sendMessage}
              className="h-11 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-medium text-white shadow-lg shadow-blue-300/60 transition hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
            >
              Send
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
