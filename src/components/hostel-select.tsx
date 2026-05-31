"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { HOSTELS, type Hostel } from "@/lib/hostels";
import { cn } from "@/lib/utils";

type Props = {
  value: Hostel | "";
  onChange: (v: Hostel) => void;
  onBlur?: () => void;
  hasError?: boolean;
  id?: string;
  name?: string;
};

const PLACEHOLDER = "Select your hostel";

export function HostelSelect({
  value,
  onChange,
  onBlur,
  hasError,
  id,
  name,
}: Props) {
  const reactId = useId();
  const triggerId = id ?? `hostel-${reactId}`;
  const listboxId = `${triggerId}-listbox`;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number>(() => {
    const i = HOSTELS.indexOf(value as Hostel);
    return i >= 0 ? i : 0;
  });
  const [typed, setTyped] = useState("");
  const typedRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keep active option scrolled into view.
  useEffect(() => {
    if (!open) return;
    optionRefs.current[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const openMenu = useCallback(() => {
    const i = HOSTELS.indexOf(value as Hostel);
    setActive(i >= 0 ? i : 0);
    setOpen(true);
    // Focus list on next tick so arrow keys work.
    queueMicrotask(() => listRef.current?.focus());
  }, [value]);

  const closeMenu = useCallback(
    (focusTrigger = true) => {
      setOpen(false);
      if (focusTrigger) triggerRef.current?.focus();
    },
    [],
  );

  const select = useCallback(
    (i: number) => {
      const v = HOSTELS[i];
      if (!v) return;
      onChange(v);
      closeMenu();
    },
    [onChange, closeMenu],
  );

  function onTriggerKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (
      e.key === "Enter" ||
      e.key === " " ||
      e.key === "ArrowDown" ||
      e.key === "ArrowUp"
    ) {
      e.preventDefault();
      openMenu();
    }
  }

  function onListKey(e: KeyboardEvent<HTMLUListElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => (i + 1) % HOSTELS.length);
        return;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => (i - 1 + HOSTELS.length) % HOSTELS.length);
        return;
      case "Home":
        e.preventDefault();
        setActive(0);
        return;
      case "End":
        e.preventDefault();
        setActive(HOSTELS.length - 1);
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        select(active);
        return;
      case "Escape":
      case "Tab":
        e.preventDefault();
        closeMenu();
        return;
      default:
        // Type-ahead: jump to first option starting with the typed prefix.
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const next = (typed + e.key).toLowerCase();
          setTyped(next);
          if (typedRef.current) clearTimeout(typedRef.current);
          typedRef.current = setTimeout(() => setTyped(""), 600);
          const i = HOSTELS.findIndex((h) => h.toLowerCase().startsWith(next));
          if (i >= 0) setActive(i);
        }
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input type="hidden" name={name} value={value} readOnly />

      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={onTriggerKey}
        onBlur={onBlur}
        className={cn(
          "mt-2 flex w-full items-center justify-between gap-3 border-0 border-b border-rule bg-transparent py-2 text-left text-body text-ink",
          "focus:border-accent focus:outline-none",
          open && "border-accent",
          hasError && "border-accent",
        )}
      >
        <span className={cn(!value && "text-ink-soft/70")}>
          {value || PLACEHOLDER}
        </span>
        <Caret open={open} />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={triggerId}
          tabIndex={-1}
          onKeyDown={onListKey}
          className={cn(
            "absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto",
            "border border-rule bg-paper shadow-[0_8px_24px_-12px_oklch(22%_0.04_50_/_0.18)]",
            "focus:outline-none",
          )}
        >
          {HOSTELS.map((h, i) => {
            const isSelected = h === value;
            const isActive = i === active;
            return (
              <li
                key={h}
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  // Prevent the trigger button from losing focus before click.
                  e.preventDefault();
                }}
                onClick={() => select(i)}
                className={cn(
                  "cursor-pointer px-4 py-2.5 text-body transition-colors",
                  isActive
                    ? "bg-accent-soft text-accent-deep"
                    : "text-ink hover:bg-accent-soft/60",
                  isSelected && !isActive && "text-accent-deep",
                  // Pin "Day scholar" with a hairline above it.
                  h === "Day scholar" && "border-t border-rule",
                )}
              >
                <span className="flex items-center justify-between gap-3">
                  <span>{h}</span>
                  {isSelected && (
                    <span aria-hidden="true" className="text-accent-deep">
                      ✓
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Caret({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={cn(
        "size-3 shrink-0 text-ink-soft transition-transform duration-150",
        open && "rotate-180",
      )}
      fill="currentColor"
    >
      <path d="M3.5 6 8 10.5 12.5 6z" />
    </svg>
  );
}
