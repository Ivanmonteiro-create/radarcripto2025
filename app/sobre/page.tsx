/* ===== SOBRE — layout clássico (sem título gigante/gradiente) ===== */
.aboutClassic{
  max-width: 1100px;
  margin: 0 auto;
  padding: 18px;
}
.aboutTop{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.aboutKicker{
  font-size: 12px;
  letter-spacing: .22em;
  color: var(--muted);
  padding: 6px 10px;
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 999px;
  background: rgba(255,255,255,.03);
}
.aboutBackBtn{ padding: 10px 14px; border-radius: 10px; font-weight: 800; }

.aboutHead{
  text-align: center;
  margin: 8px 0 18px;
}
.aboutTitle{
  margin: 0;
  font-size: clamp(22px, 3.2vw, 34px);
  font-weight: 900;
  letter-spacing: .02em;
  /* remove qualquer override anterior de gradiente */
  background: none !important;
  -webkit-text-fill-color: currentColor !important;
}
.aboutSubtitle{
  margin: 8px auto 0;
  max-width: 760px;
  color: #c9eedc;
  opacity: .9;
}

.aboutGrid{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.aboutCard{
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 14px;
  padding: 14px;
}
.aboutCardTitle{
  font-weight: 800;
  color: var(--accent-strong);
  margin-bottom: 6px;
}
.aboutCardText{
  margin: 0;
  color: var(--text);
  opacity: .95;
}

@media (max-width: 960px){
  .aboutGrid{ grid-template-columns: 1fr; }
  .aboutClassic{ padding: 14px; }
}
