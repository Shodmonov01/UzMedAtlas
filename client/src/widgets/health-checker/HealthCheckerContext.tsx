import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type HealthCheckerContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const HealthCheckerContext = createContext<HealthCheckerContextValue | null>(null);

export function HealthCheckerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const value = useMemo(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle],
  );

  return <HealthCheckerContext.Provider value={value}>{children}</HealthCheckerContext.Provider>;
}

export function useHealthChecker() {
  const ctx = useContext(HealthCheckerContext);
  if (!ctx) {
    throw new Error("useHealthChecker must be used within HealthCheckerProvider");
  }
  return ctx;
}
