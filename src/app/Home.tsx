import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LOCAL_PLAN_KEY, useCatalog } from "./usePlan";

export function Home() {
  const catalog = useCatalog();
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      sessionStorage.setItem(LOCAL_PLAN_KEY, String(reader.result));
      void navigate("/local");
    };
    reader.readAsText(file);
  }

  return (
    <div className="page home">
      <header className="mast">
        <p className="eyebrow">Shop ticket</p>
        <h1>Bench plans</h1>
        <p className="lede">Open a project. Keep the tablet on the bench. The 3D view is the guide.</p>
      </header>

      <section className="catalog">
        {catalog.map((entry) => (
          <Link key={entry.id} className="ticket" to={`/p/${entry.id}`}>
            <span className="ticket-stamp">Ready</span>
            <h2>{entry.title}</h2>
            <p>{entry.summary}</p>
            <span className="ticket-go">Open on the bench →</span>
          </Link>
        ))}
      </section>

      <section className="open-file">
        <h2>Or open a plan file</h2>
        <p>A <code>.ww.yaml</code> from this computer. Nothing is uploaded.</p>
        <button type="button" className="btn" onClick={() => input.current?.click()}>
          Open .ww.yaml
        </button>
        <input
          ref={input}
          type="file"
          accept=".yaml,.ww.yaml,.yml"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
        />
      </section>
    </div>
  );
}
