
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'REDSEV FCA - UNCA',
    short_name: 'REDSEV FCA',
    description: 'Repositorio Digital de la Secretaría de Extensión y Vinculación FCA - UNCA.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2e7d32',
    icons: [
      {
        src: 'https://placehold.co/192x192/2e7d32/ffffff?text=REDSEV',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://placehold.co/512x512/2e7d32/ffffff?text=REDSEV',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
