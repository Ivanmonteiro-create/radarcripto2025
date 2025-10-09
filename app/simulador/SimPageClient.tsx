<style>{`
  /* Remove qualquer tarja/linha do topo */
  body:has(.page-simulador) .rc-backtop,
  body:has(.page-simulador) .rc-topbar,
  body:has(.page-simulador) .rc-topband,
  body:has(.page-simulador) .rc-topstrip,
  body:has(.page-simulador) .rc-page-top {
    display: none !important;
    height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  .page-simulador{ padding-top:0 !important; margin-top:0 !important; }

  /* Remove a "bolinha verde" que era um pseudo-elemento (::after) */
  main.page-simulador::after {
    display: none !important;
    content: none !important;
  }

  /* Cabeçalho do gráfico */
  .page-simulador .compactHeader{
    display:flex; align-items:center; justify-content:space-between;
    gap:8px; padding:6px 8px; margin:0;
    border-bottom:1px solid rgba(255,255,255,.06);
    background: rgba(0,0,0,.25);
  }
  .page-simulador .compactTitle{ margin:0; font-size:12.5px; font-weight:800; opacity:.85; }
  .page-simulador .tvFsBtn{
    width:28px; height:28px; border-radius:8px;
    display:grid; place-items:center;
    background:rgba(255,255,255,.12);
    color:#e6e6e6; border:1px solid rgba(255,255,255,.25);
    cursor:pointer; line-height:1; font-weight:900; font-size:14px;
  }
  .page-simulador .tvFsBtn:hover{ filter:brightness(1.05); }

  /* Painel de controles — referência */
  .page-simulador .rc-controls{ position:relative; padding-top:8px; }

  /* Voltar ao início dentro do painel, alinhado com o título */
  .page-simulador .backBtnInPanel{
    position:absolute;
    top: 10px;           /* 🔽 leve ajuste para alinhar exatamente ao título */
    right: 10px;
    z-index: 5;
    display:inline-flex; align-items:center; height:34px;
    white-space:nowrap;
  }

  /* Botão verde quadrado */
  .page-simulador .backBtnInPanel .rc-btn--green{
    display:inline-flex;
    height: 34px; padding: 0 14px;
    border-radius: 8px;
    font-weight: 800;
    background: #18e273;                   /* Verde principal RadarCrypto */
    color: #052515;
    box-shadow: 0 0 0 1px rgba(0,255,128,.28), 0 8px 24px rgba(0,0,0,.35);
  }
  .page-simulador .backBtnInPanel .rc-btn--green:hover{
    filter: brightness(1.07);
    transform: translateY(-1px);
  }
`}</style>
