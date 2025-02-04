# Instalación y Configuración del Proyecto

Este documento detalla los pasos necesarios para configurar el entorno backend en NestJS.

---

## 1. Configuración

### Requisitos Previos
- Docker instalado en el sistema
- Docker Compose

### Instalación

1. Clonar el repositorio del backend:
   ```sh
   git clone https://github.com/RyanCFX/todo-api.git
   cd todo-api
   ```

2. Crear un archivo `.env` en la raíz del backend y configurar las variables de entorno.

3. Construir y levantar los contenedores:
   ```sh
   docker-compose up --build -d
   ```

4. Verificar que el contenedor está corriendo:
   ```sh
   docker ps
   ```

5. Acceder a los logs en tiempo real (opcional):
   ```sh
   docker logs -f todo
   ```

### Parar los Contenedores
Para detener los servicios sin eliminar los volúmenes:
   ```sh
   docker-compose down
   ```
Si deseas limpiar completamente los volúmenes y las imágenes construidas:
   ```sh
   docker-compose down --volumes --rmi all
   ```

### Acceso al Backend
El backend estará disponible en `http://localhost:9876`, pero necesitara utilizar un tunel https para poder manejarlo desde la aplicacion,
por temas de cors y cache el proyecto esta configurado para manejar peticiones https.

---

## 2. Tunel Https

- Levantar tunel:
  ```sh
    cloudflared tunnel --url http://localhost:9876
  ```

Esto imprimira una url en console que posteriormente debera establecer en la aplicacion como "API_URL".

En caso de utilizar otro puerto recuerde cambiarlo en la ejecucion de este comando.

---

## 3. Comandos Útiles

### Desarrollo
- Levantar NestJS en modo desarrollo (sin Docker):
  ```sh
  npm run start:dev
  ```

### Producción
- Construir el backend manualmente (sin Docker):
  ```sh
  npm run build
  ```
- Iniciar el backend en producción (sin Docker):
  ```sh
  npm run start:prod
  ```

---