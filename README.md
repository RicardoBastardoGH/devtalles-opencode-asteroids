# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción          |
| --------- | --------------- |
| `←` `→`   | Rotar nave      |
| `↑`       | Propulsar       |
| `Espacio` | Disparar        |
| `S`       | Cambiar de skin |

## Puntuación

| Asteroide      | Puntos |
| -------------- | ------ |
| Grande         | 20     |
| Mediano        | 50     |
| Pequeño        | 100    |
| Estrella fugaz | 200    |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up Velocidad: ficha con forma de diamante cian ('V') que duplica el impulso de la nave por 5 segundos al recogerla
- Estrella fugaz: asteroide especial veloz con cola luminosa que cruza la pantalla de forma periódica y desaparece con el tiempo (200 puntos)
- Sistema de skins con persistencia en `localStorage` (tecla `S`):
  - **Clásica**: Silueta retro blanca con micro-chispas vectoriales al propulsar.
  - **Interceptor**: Caza afilado en verde neón con halo resplandeciente (`glow`) pulsante continuo.
  - **Vanguard**: Nave pesada de doble proa en violeta estelar con estela cuántica de siluetas fantasma (`ghosting`).
  - Los íconos de vidas en el HUD y el indicador de skin activa se adaptan en tiempo real a la apariencia seleccionada.
