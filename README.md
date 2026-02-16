# ATS Desk

ATS Desk es un sistema de escritorio remoto diseñado para **granjas y explotaciones ganaderas**, basado en un fork de RustDesk.  
Su objetivo es ofrecer soporte remoto **fiable, desatendido y controlado** sobre ordenadores de granja y controladores ambientales (ATS Monitor).

## Características principales

- ✅ Acceso remoto desatendido a PCs de granja y ordenadores ATS.
- ✅ Servidor propio, autoalojado, gestionado por Albesa Tech.
- ✅ Pensado para uso intensivo en entorno industrial (granjas, naves, salas técnicas).
- ✅ Integración futura con:
  - Ordenador de granja **ATS Monitor** (pantalla táctil 24").
  - App móvil **ATS Desk** para técnicos y clientes.

## Estado del proyecto

- Proyecto en fase **experimental / early development**.
- Código basado en RustDesk, con:
  - Modificaciones específicas para Albesa Tech.
  - Integración progresiva con lógica de control de granja.

No se recomienda aún su uso en producción sin pruebas y validación adicionales.

## Arquitectura (visión rápida)

- **Core**: Rust (fork de RustDesk).
- **Frontend de escritorio**: Flutter (cliente ATS Desk para Windows, etc.).
- **Infraestructura**: servidor RustDesk autoalojado (relay + rendezvous), configurado para uso interno de Albesa.

## Uso previsto

- Soporte remoto interno de Albesa Tech:
  - Técnicos con acceso prioritario a todas las explotaciones.
- Soporte remoto a clientes:
  - Instalación del cliente ATS Desk en PCs de granja y ATS Monitor.
  - Acceso controlado, con configuración mínima para el granjero!

## Licencia

Este proyecto es un fork de [RustDesk](https://github.com/rustdesk/rustdesk), que está licenciado bajo **AGPL-3.0**.  
En consecuencia, ATS Desk se distribuye también bajo la licencia **AGPL-3.0**.

Consulta el archivo `LICENSE` para más detalles. 
