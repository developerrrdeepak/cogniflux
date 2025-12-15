"use client";
import { useState, useEffect } from "react";
import { textToSpeech } from "../lib/elevenlabs";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [audio, setAudio] = useState(null);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (input.trim() === "") return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: newMessages }),
    });

    const data = await response.json();
    const aiMessage = data.response;

    setMessages([...newMessages, { role: "assistant", content: aiMessage }]);
  };

  const playAudio = async (text) => {
    setLoading(true);
    const audioData = await textToSpeech(text);
    if (audioData) {
      const audio = new Audio(`data:audio/mpeg;base64,${audioData}`);
      audio.play();
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            } mb-4`}
          >
            <div
              className={`rounded-lg p-3 ${
                msg.role === "user" ? "bg-blue-500" : "bg-gray-700"
              }`}
            >
              <p>{msg.content}</p>
              {msg.role === "assistant" && (
                <button
                  onClick={() => playAudio(msg.content)}
                  className="mt-2 px-2 py-1 bg-gray-600 rounded-lg hover:bg-gray-500"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Play Audio"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-700">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 p-2 rounded-lg bg-gray-800 text-white focus:outline-none"
            placeholder="Type your message..."
          />
          <button
            onClick={sendMessage}
            className="ml-4 px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
