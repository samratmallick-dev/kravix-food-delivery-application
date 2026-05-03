import { useEffect, useRef, useState } from "react";

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  const rafRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    rafRef.current = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(rafRef.current!);
  }, []);

  const date = time.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const clock = time.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="text-right">
      <p className="text-[#1D9E75] font-mono text-sm font-semibold tracking-widest">{clock}</p>
      <p className="text-[#888884] text-xs font-mono">{date}</p>
    </div>
  );
};

export default LiveClock;
