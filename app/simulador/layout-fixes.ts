'use client';

import { useEffect } from 'react';

/**
 * Hotfix visual:
 * - Alinha o botão de Tela Cheia (TV) na mesma linha da câmera.
 * - Oculta o "Histórico" duplicado do miolo do painel (deixa só o de baixo).
 *
 * Não altera estrutura nem markup; apenas força estilo quando o TV reescreve.
 */
export function useLayoutFixes() {
  useEffect(() => {
    const fix = () => {
      // 1) Alinhar ícone de Tela Cheia
      const btn = document.querySelector<HTMLElement>(
        'section.panel button[aria-label*="Tela cheia"], section.panel button[title*="Tela cheia"], section.panel .chartFsBtn'
      );
      if (btn) {
        btn.style.position = 'absolute';
        btn.style.top = '8px';      // mesma linha da câmera
        btn.style.right = '44px';   // ~1 cm de distância
        btn.style.bottom = '';      // remove o posicionamento por bottom
        btn.style.transform = 'none';
        btn.style.zIndex = '6';
      }

      // 2) Ocultar Histórico do MIolo (no grid compacto)
      document
        .querySelectorAll<HTMLElement>(
          'section.panel .compactGrid .histRow, section.panel .compactGrid .histWrap, section.panel .compactGrid .historyCard, section.panel .compactGrid .histCard'
        )
        .forEach((el) => (el.style.display = 'none'));
    };

    // roda agora…
    fix();

    // …e sempre que o TV/DOM mudar
    const mo = new MutationObserver(fix);
    mo.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });
    window.addEventListener('resize', fix);

    return () => {
      mo.disconnect();
      window.removeEventListener('resize', fix);
    };
  }, []);
}
