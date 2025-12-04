"use client";

import { useEffect, useState, type ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = "" }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`${className} ${
        isVisible ? "animate-page-enter" : "opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

// Staggered list animation wrapper
interface StaggeredListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggeredList({ children, className = "" }: StaggeredListProps) {
  return (
    <div className={`animate-stagger ${className}`}>
      {children}
    </div>
  );
}

// Animated card wrapper for delete animations
interface AnimatedCardProps {
  children: ReactNode;
  isDeleting?: boolean;
  onDeleteComplete?: () => void;
  className?: string;
}

export function AnimatedCard({
  children,
  isDeleting = false,
  onDeleteComplete,
  className = "",
}: AnimatedCardProps) {
  useEffect(() => {
    if (isDeleting && onDeleteComplete) {
      const timer = setTimeout(() => {
        onDeleteComplete();
      }, 400); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isDeleting, onDeleteComplete]);

  return (
    <div
      className={`${className} ${
        isDeleting ? "animate-delete" : "animate-scale-in"
      }`}
    >
      {children}
    </div>
  );
}

// Fade transition for content changes
interface FadeTransitionProps {
  children: ReactNode;
  show: boolean;
  className?: string;
}

export function FadeTransition({ children, show, className = "" }: FadeTransitionProps) {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!shouldRender) return null;

  return (
    <div className={`${className} ${show ? "animate-fade-in" : "animate-fade-out"}`}>
      {children}
    </div>
  );
}

// Slide transition for modals/panels
interface SlideTransitionProps {
  children: ReactNode;
  show: boolean;
  direction?: "bottom" | "top" | "left" | "right";
  className?: string;
}

export function SlideTransition({
  children,
  show,
  direction = "bottom",
  className = "",
}: SlideTransitionProps) {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!shouldRender) return null;

  const directionClass = {
    bottom: show ? "animate-slide-in-bottom" : "animate-fade-out",
    top: show ? "animate-slide-in-top" : "animate-fade-out",
    left: show ? "animate-slide-in-left" : "animate-fade-out",
    right: show ? "animate-slide-in-right" : "animate-fade-out",
  };

  return (
    <div className={`${className} ${directionClass[direction]}`}>
      {children}
    </div>
  );
}

