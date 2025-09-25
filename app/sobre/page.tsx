/* ===== SOBRE v2 (layout da “foto anterior”) ===== */
.aboutV2-root{
  position:relative; max-width:1200px; margin:0 auto; padding:16px 18px;
  overflow:hidden;
}
.aboutV2-top{
  display:flex; align-items:center; justify-content:space-between;
  gap:12px; margin-bottom:12px;
}
.aboutV2-tag{
  font-size:12px; letter-spacing:.22em; color:var(--muted);
  padding:6px 10px; border:1px solid rgba(255,255,255,.10);
  border-radius:999px; background:rgba(255,255,255,.03);
}
.aboutV2-back{ padding:10px 14px; border-radius:10px; font-weight:800 }

/* grid com 3 colunas (cards | título | vazio) */
.aboutV2-hero{
  position:relative;
  display:grid;
  grid-template-columns: 340px 1fr 180px;
  gap: 18px;
  min-height: 60vh;
}
@media (max-width: 1100px){
  .aboutV2-hero{ grid-template-columns:1fr; }
}

/* Cards empilhados (vidro) */
.aboutV2-cards{ display:grid; gap:12px; align-content:start; }
.aboutV2-card{
  border-radius:14px; padding:14px;
  background:
    radial-gradient(900px 900px at -20% -20%, rgba(33,243,141,.08), transparent 40%),
    rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.10);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 8px 26px rgba(0,0,0,.25);
}
.aboutV2-cardTitle{
  color:var(--accent-strong); font-weight:900; margin-bottom:6px; letter-spacing:.01em;
}
.aboutV2-cardText{ margin:0; opacity:.95 }

/* Centro: título gigante com gradiente + subtítulo */
.aboutV2-center{
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  text-align:center; padding:8px 10px; position:relative;
}
.aboutV2-title{
  margin:0;
  font-weight:1000; letter-spacing:.02em;
  font-size: clamp(32px, 6vw, 76px);
  background: linear-gradient(180deg,#dfffe9 0%, #1cff80 100%);
  -webkit-background-clip:text; background-clip:text;
  -webkit-text-fill-color:transparent;
  text-shadow: 0 6px 28px rgba(33,243,141,.18);
}
.aboutV2-sub{
  margin:12px auto 0; max-width: 760px;
  color:#c9eedc; opacity:.9; font-size: clamp(14px,1.6vw,18px);
}

/* coluna direita fica vazia (respiro visual) */
.aboutV2-right{}

/* brilho suave de fundo (ajuda a “separar” como na foto antiga) */
.aboutV2-root::before{
  content:""; position:absolute; inset:-40%;
  background: radial-gradient(60% 60% at 70% 10%, rgba(33,243,141,.06), transparent 60%);
  pointer-events:none;
}
