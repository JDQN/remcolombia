/* ==========================================================================
   REM Colombia — manifest.js
   Datos de configuración de la marca. No contiene contenido crítico:
   el contenido vive directamente en index.html (ver regla "content first").
   ========================================================================== */
(function () {
  "use strict";

  window.__BRAND__ = {
    name: "REM Colombia",
    legalTagline: "Reinventando el mundo",

    contact: {
      phone: "+57 314 3769696",
      phoneHref: "tel:+573143769696",
      whatsappNumber: "573143769696",
      whatsappMessage: "Hola REM Colombia, quiero información sobre sus servicios de consultoría y auditoría.",
      email: "reinventandoelmundo2015@gmail.com",
      addressLine: "Subachoque-El Rosal, Montería, Subachoque, Cundinamarca",
      city: "Bogotá, Colombia"
    },

    /* Formulario de contacto.
       provider:
       - "vercel-email": usa /api/contact con clave privada en variables de entorno.
       - "web3forms": envío directo desde frontend (menos recomendado). */
    form: {
      provider: "vercel-email",
      endpoint: "/api/contact",
      accessKey: "cff4bf90-8191-42f6-8e91-63bc81a95e62"
    }
  };
})();
