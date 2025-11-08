"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoaderProps {
  size?: number;
  text?: string;
  fullScreen?: boolean;
}

const Loader = ({ size = 40, text = "Loading...", fullScreen = false }: LoaderProps) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-3 text-gray-600">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <Loader2 size={size} className="text-blue-500" />
      </motion.div>
      {text && <p className="text-sm font-medium">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;
