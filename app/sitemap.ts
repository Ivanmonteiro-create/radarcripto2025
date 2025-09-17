import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://radarcripto.space";
  return [
    { url: `${base}/`, priority: 1.0 },
    { url: `${base}/sobre`, priority: 0.6 },
    { url: `${base}/planos`, priority: 0.5 },
    { url: `${base}/acessar-simulador`, priority: 0.7 },
    { url: `${base}/fale-com-agente`, priority: 0.4 },
    { url: `${base}/simulador`, priority: 0.8 },
  ];
}
