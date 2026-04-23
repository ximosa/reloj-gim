# ⚡ GymFlow HIIT Timer

**GymFlow** es una Progressive Web App (PWA) de alto rendimiento diseñada para entrenamientos de alta intensidad (HIIT y Tabata). Optimizada para uso móvil en entornos de gimnasio, ofrece una interfaz de alto contraste, feedback sensorial y cálculo de calorías en tiempo real.

[![Desplegado en GitHub Pages](https://img.shields.io/badge/Live-GitHub%20Pages-00ff88?style=for-the-badge&logo=github)](https://ximosa.github.io/reloj-gim/)

---

## ✨ Características Principales

- 🏋️ **Modo Gimnasio**: Configuración rápida de tiempo de trabajo, descanso y número de series.
- 🎨 **Interfaz de Alto Contraste**: Colores dinámicos (Verde/Rojo/Amarillo) y números gigantes legibles a más de 2 metros.
- 🔊 **Feedback Sensorial**: 
  - Sonidos de "pitido" tipo boxeo mediante Web Audio API.
  - Patrones de vibración para avisos de finalización (3s) y cambios de estado.
- 🔋 **Wake Lock API**: La pantalla nunca se apaga mientras el temporizador está activo.
- 📉 **Cálculo de Calorías**: Estimación basada en el peso del usuario y la intensidad (MET).
- 📱 **PWA (Progressive Web App)**: Instalable en el móvil y totalmente funcional sin conexión a internet.

---

## 🚀 Instalación y Uso Local

Si deseas ejecutar el proyecto localmente para desarrollo o pruebas, puedes hacerlo fácilmente usando **Node.js**.

### Requisitos
- [Node.js](https://nodejs.org/) instalado.

### Pasos
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/ximosa/reloj-gim.git
   cd reloj-gim
   ```

2. **Servir la aplicación:**
   Puedes usar cualquier servidor estático. Una opción rápida con Node es `npx`:
   ```bash
   npx serve .
   ```
   O si prefieres `http-server`:
   ```bash
   npx http-server .
   ```

3. **Abrir en el navegador:**
   Visita `http://localhost:3000` (o el puerto que indique el comando anterior).

> [!NOTE]
> Algunas funciones como el **Service Worker** (PWA) y el **Wake Lock** requieren una conexión segura (HTTPS) o `localhost` para funcionar correctamente.

---

## 🛠️ Futuros Cambios y Roadmap

Estamos trabajando para hacer de GymFlow la mejor herramienta de entrenamiento:

- [ ] **Historial de Entrenamientos**: Registro local de las sesiones completadas y calorías totales.
- [ ] **Gráficos de Progreso**: Visualización semanal/mensual del volumen de entrenamiento.
- [ ] **Soporte para Rutinas Guardadas**: Crear y nombrar diferentes configuraciones (ej: "Tabata Abs", "CrossFit HIIT").
- [ ] **Integración con Sensores**: Uso experimental de sensores de movimiento para contar repeticiones automáticamente.
- [ ] **Voces de Guía**: Opción de activar una voz que anuncie el inicio de las series.
- [ ] **Temas Personalizados**: Selección de colores y estilos adicionales.

---

## 📄 Licencia

Este proyecto es de código abierto. ¡Siéntete libre de contribuir!

---

Desarrollado con ❤️ para la comunidad fitness.
