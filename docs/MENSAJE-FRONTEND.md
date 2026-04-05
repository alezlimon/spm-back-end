# Mensaje para Frontend

Hola equipo frontend,

Ya tenéis disponible el contrato real de la API en docs/API-CONTRACT.md (enlazado desde el README). Incluye ejemplos de request/response, endpoints activos, reglas de negocio y gaps respecto al checklist original.

Puntos clave:
- El contrato de errores ya está estandarizado en los endpoints prioritarios: message + errorCode + details.
- No hay Swagger/OpenAPI aún, pero la colección Postman está actualizada.
- Faltan endpoints como booking filters, property/room/guest detail, cancelaciones, refresh/logout, etc.
- El seed crea usuarios demo: admin@hotel.com / Admin123! y staff@hotel.com / Staff123!
- No hay paginación ni filtros globales aún.
- El contrato puede cambiar en los endpoints no cubiertos por DoD.

Si necesitáis algún endpoint o ajuste prioritario para la integración, avisadnos para priorizarlo.

Gracias por la coordinación y cualquier duda, estamos atentos.
