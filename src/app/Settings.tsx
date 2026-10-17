import { createContext, useContext, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Icon } from "./ui";

export type Settings = {
  theme: "auto" | "light" | "dark";
  text: "m" | "l" | "xl";
  paint: boolean;
  dims: boolean;
  grid: boolean;
};

const DEFAULTS: Settings = { theme: "auto", text: "m", paint: true, dims: true, grid: true };
const KEY = "woodwork.settings";

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    // storage blocked or corrupt: use defaults
  }
  return DEFAULTS;
}

type Ctx = { settings: Settings; set: (patch: Partial<Settings>) => void };
const SettingsContext = createContext<Ctx>({ settings: DEFAULTS, set: () => undefined });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.text = settings.text;
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      // not saved; still works this session
    }
  }, [settings]);

  const value = useMemo(
    () => ({ settings, set: (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })) }),
    [settings],
  );
  return <SettingsContext value={value}>{children}</SettingsContext>;
}

export function useSettings(): Ctx {
  return useContext(SettingsContext);
}

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  function arrow(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = options.findIndex(([v]) => v === value);
    const next = options[(i + step + options.length) % options.length][0];
    onChange(next);
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-v="${next}"]`)?.focus();
  }
  return (
    <div className="setting" role="radiogroup" aria-label={label}>
      <span className="setting-name">{label}</span>
      <div className="seg" onKeyDown={arrow}>
        {options.map(([v, text]) => (
          <button
            key={v}
            data-v={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            tabIndex={value === v ? 0 : -1}
            className={value === v ? "on" : ""}
            onClick={() => onChange(v)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function Switch({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="setting switch">
      <span>
        <span className="setting-name">{label}</span>
        <span className="setting-hint">{hint}</span>
      </span>
      <input type="checkbox" role="switch" checked={value} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function SettingsButton() {
  const { settings, set } = useSettings();
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        aria-label="Settings"
        title="Settings"
        onClick={() => dialog.current?.showModal()}
      >
        <Icon name="gear" />
        <span className="btn-text">Settings</span>
      </button>
      <dialog
        ref={dialog}
        className="sheet"
        aria-labelledby="settings-title"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="sheet-body">
        <div className="sheet-head">
          <h2 id="settings-title">Settings</h2>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Close" onClick={() => dialog.current?.close()}>
            <Icon name="close" />
          </button>
        </div>
        <Choice
          label="Look"
          value={settings.theme}
          options={[
            ["auto", "Auto"],
            ["light", "Day"],
            ["dark", "Night"],
          ]}
          onChange={(theme) => set({ theme })}
        />
        <Choice
          label="Text size"
          value={settings.text}
          options={[
            ["m", "Normal"],
            ["l", "Large"],
            ["xl", "Huge"],
          ]}
          onChange={(text) => set({ text })}
        />
        <Switch
          label="Show paint"
          hint="Colour the model on the optional paint step and in finished pictures."
          value={settings.paint}
          onChange={(paint) => set({ paint })}
        />
        <Switch
          label="Show measurements"
          hint="Lengths and drill sizes on the 3D model."
          value={settings.dims}
          onChange={(dims) => set({ dims })}
        />
        <Switch
          label="Show floor grid"
          hint="A ruled mat under the model."
          value={settings.grid}
          onChange={(grid) => set({ grid })}
        />
        <p className="setting-foot">Saved on this device only.</p>
        </div>
      </dialog>
    </>
  );
}
