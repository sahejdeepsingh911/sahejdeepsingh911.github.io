/* Sukhjeevani Diagnostic & Digital X-Ray Centre, Dasuya
   Design © 2026 Sahejdeep Singh */
(function () {
  "use strict";

  /* ---------- Settings ---------- */
  // PocketBase endpoint for your 'booking' collection
  var BOOKING_ENDPOINT = "http://127.0.0.1:8090/api/collections/booking/records";

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("nav-menu");

  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("open", open);
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", function (e) {
      if (e.matches) setMenu(false);
    });
  }

  /* ---------- Booking form ---------- */
  var form = document.getElementById("booking-form");
  if (!form) return;

  var status = document.getElementById("form-status");
  var defaultNote = status.textContent;
  var submitBtn = form.querySelector('button[type="submit"]');

  var fields = {
    name: {
      input: document.getElementById("patient-name"),
      error: document.getElementById("name-error"),
      check: function (v) {
        return v.trim().length >= 2 ? "" : "Enter the patient's name.";
      }
    },
    mobile: {
      input: document.getElementById("mobile"),
      error: document.getElementById("mobile-error"),
      check: function (v) {
        return /^[6-9]\d{9}$/.test(v) ? "" : "Enter a 10-digit mobile number, for example 9876543210.";
      }
    },
    test: {
      input: document.getElementById("test-needed"),
      error: document.getElementById("test-error"),
      check: function (v) {
        return v.trim().length >= 2 ? "" : 'Tell us which test you need, or write "not sure".';
      }
    }
  };

  // Keep only digits in the mobile field
  fields.mobile.input.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "").slice(0, 10);
  });

  function validateField(key) {
    var f = fields[key];
    var msg = f.check(f.input.value);
    f.error.textContent = msg;
    f.input.closest(".field").classList.toggle("invalid", Boolean(msg));
    f.input.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }

  Object.keys(fields).forEach(function (key) {
    fields[key].input.addEventListener("blur", function () { validateField(key); });
    fields[key].input.addEventListener("input", function () {
      if (fields[key].input.closest(".field").classList.contains("invalid")) validateField(key);
    });
  });

  function setStatus(text, kind) {
    status.textContent = text;
    status.className = "form-note" + (kind ? " " + kind : "");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var firstBad = null;
    Object.keys(fields).forEach(function (key) {
      if (!validateField(key) && !firstBad) firstBad = fields[key].input;
    });

    if (firstBad) {
      setStatus("Please fix the highlighted fields.", "bad");
      firstBad.focus();
      return;
    }

    var payload = {
      name: fields.name.input.value.trim(),
      mobile: fields.mobile.input.value,
      test: fields.test.input.value.trim(),
      homeVisit: document.getElementById("home-visit").checked
    };

    // Safety check
    if (!BOOKING_ENDPOINT) {
      setStatus("Details look good, but online booking is not switched on yet. Please call 78144-04227 or message us on WhatsApp.", "bad");
      return;
    }

    submitBtn.disabled = true;
    setStatus("Sending your request...", "");

    fetch(BOOKING_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Request failed: " + res.status);
        form.reset();
        setStatus("Request received. We will call you to confirm your booking.", "ok");
      })
      .catch(function (err) {
        console.error("Booking error:", err);
        setStatus("We could not send your request. Please call 78144-04227 or message us on WhatsApp.", "bad");
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });

  form.addEventListener("reset", function () {
    Object.keys(fields).forEach(function (key) {
      fields[key].error.textContent = "";
      fields[key].input.closest(".field").classList.remove("invalid");
      fields[key].input.removeAttribute("aria-invalid");
    });
    setTimeout(function () { if (!status.classList.contains("ok")) setStatus(defaultNote, ""); }, 0);
  });
})();