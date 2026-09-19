"use strict";

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ success: false, message: "Method not allowed" }));
    return;
  }

  try {
    var body = req.body || {};
    var name = clean(body.name);
    var institucion = clean(body.institucion);
    var email = clean(body.email);
    var phone = clean(body.phone);
    var message = clean(body.message);
    var consent = !!body.consent;

    if (!name || !email || !message || !consent) {
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, message: "Datos incompletos" }));
      return;
    }

    if (!isEmail(email)) {
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, message: "Correo inválido" }));
      return;
    }

    var apiKey = process.env.RESEND_API_KEY;
    var toEmail = process.env.CONTACT_TO_EMAIL;
    var fromEmail = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";

    if (!apiKey || !toEmail) {
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, message: "Variables de entorno incompletas" }));
      return;
    }

    var subject = "Nuevo contacto desde remcolombia.co";
    var text = [
      "Nuevo mensaje de contacto:",
      "",
      "Nombre: " + name,
      "Institución: " + (institucion || "N/A"),
      "Correo: " + email,
      "Teléfono: " + (phone || "N/A"),
      "",
      "Mensaje:",
      message
    ].join("\n");

    var html = ""
      + "<h2>Nuevo mensaje de contacto</h2>"
      + "<p><strong>Nombre:</strong> " + escapeHtml(name) + "</p>"
      + "<p><strong>Institución:</strong> " + escapeHtml(institucion || "N/A") + "</p>"
      + "<p><strong>Correo:</strong> " + escapeHtml(email) + "</p>"
      + "<p><strong>Teléfono:</strong> " + escapeHtml(phone || "N/A") + "</p>"
      + "<p><strong>Mensaje:</strong></p>"
      + "<p>" + escapeHtml(message).replace(/\n/g, "<br>") + "</p>";

    var resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: subject,
        reply_to: email,
        text: text,
        html: html
      })
    });

    if (!resendResponse.ok) {
      var errorBody = await safeJson(resendResponse);
      console.error("Resend error", resendResponse.status, errorBody);
      res.statusCode = 502;
      res.end(JSON.stringify({ success: false, message: "No fue posible enviar el correo" }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify({ success: true }));
  } catch (err) {
    console.error("Contact API error", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, message: "Error interno" }));
  }
};

function clean(value) {
  return String(value == null ? "" : value).trim();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch (_) {
    return null;
  }
}
