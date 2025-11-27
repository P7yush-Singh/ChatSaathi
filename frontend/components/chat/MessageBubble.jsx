import { Check, CheckCheck } from "lucide-react";

// components/chat/MessageBubble.jsx
export default function MessageBubble({ fromMe, text, time, status = "sent" }) {
  // choose tick style based on status
  let tickColor = "";
  if (status === "read") tickColor = "text-";        // read
  else if (status === "delivered") tickColor = "text-slate-100"; // delivered
  else tickColor = "text-slate-400";                             // sent / pending

  const showDoubleTick = status === "sent" || status === "delivered" || status === "read";
  const showSingleTick = status === "pending";

  return (
    <div className={`flex mb-2 ${fromMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative px-3 py-2 rounded-xl text-sm max-w-[70%] shadow-sm ${
          fromMe
            ? "bg-gradient-to-br from-[#00a884] to-[#017561] text-white rounded-tr-none"
            : "bg-[#202c33] text-slate-50 rounded-tl-none"
        }`}
      >
        <span>{text}</span>

        {fromMe && (
          <div className="flex items-center gap-1 justify-end mt-1">
            <span
              className={`text-[10px] ${
                fromMe ? "text-white/70" : "text-slate-300/70"
              }`}
            >
              {time}
            </span>

            {/* read receipt */}
            <span className={`text-[11px] ${tickColor} leading-none`}>
              {showDoubleTick && <CheckCheck size={14} />}
              {showSingleTick && <Check size={14} />}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
