"use client";

import { motion } from "framer-motion";
import { Calendar, MessageCircle } from "lucide-react";

export function StickyMobileCTA() {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/85 p-3 backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto flex max-w-lg gap-2">
        <a
          href="tel:+441234567890"
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 py-3 text-sm font-medium text-white"
        >
          <MessageCircle className="h-4 w-4 text-cyan" />
          Call
        </a>
        <a
          href="#booking"
          className="flex flex-[1.4] items-center justify-center gap-2 rounded-full bg-cyan py-3 text-sm font-medium text-black"
        >
          <Calendar className="h-4 w-4" />
          Book now
        </a>
      </div>
    </motion.div>
  );
}
