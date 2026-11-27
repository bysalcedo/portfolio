---
title: El campo que mentía sobre el árbol STP
description: Una auditoría marcó como hallazgo alto que un equipo desconocido era el root de Spanning Tree. No lo era. Cómo comprobarlo en el cable en vez de en la API.
date: 2026-09-22
draft: false
stack: [UniFi, STP, tcpdump, auditoría de red]
---

## Qué pasó

Durante una auditoría de la red, la API del controlador devolvía en dos switches un campo
`root_switch` con una MAC que no correspondía a ningún equipo propio ni a ningún cliente
conocido. Leído literalmente, significaba que un dispositivo ajeno se había hecho root del
árbol Spanning Tree: todo el tráfico entre switches podía estar pasando por él. Lo clasifiqué
como hallazgo **alto**.

## Por qué era falso

Subí la prioridad STP del switch de core a 4096 para forzar que fuera el root. El árbol cambió:
los puertos bloqueados cambiaron de sitio. El campo `root_switch` **no cambió**. Si el campo
reflejara el root real, tendría que haberse movido.

## Cómo comprobarlo de verdad

El root de Spanning Tree se anuncia en las BPDU, en el campo `root-id`. Basta con escuchar el
cable en cualquier puerto con STP activo:

```bash
tcpdump -i <interfaz> -nn -e -vv -c 3 "ether dst 01:80:c2:00:00:00"
```

Las BPDU decían lo esperado: el switch de core con prioridad 4096 como root y el de cómputo
con 8192 como respaldo.

## Lecciones

- **Un campo de una API es una afirmación, no una medida.** Antes de abrir un hallazgo alto,
  buscar la fuente primaria: aquí, el protocolo en el cable.
- **Fijar las prioridades explícitamente**, no dejar que el root salga del desempate por MAC.
  Y comprobar que siguen fijadas tras una readopción o un reset de fábrica de un switch.
- El hallazgo falso costó una ventana de mantenimiento. Documentar el campo engañoso evita que
  lo cueste dos veces.
