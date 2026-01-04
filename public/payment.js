// ================= CONFIG =================
const UPI_ID = "7995466261-2@axl";
const PAYEE_NAME = "Karthik Tatineni";
const AMOUNT = "1";
// =========================================

// ✅ Get referenceId from URL
const params = new URLSearchParams(window.location.search);
const referenceId = params.get("ref");

if (!referenceId) {
  alert("Invalid payment link. Reference ID missing.");
}

// Show reference & generate QR
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("refId").innerText = referenceId;

  const upiLink =
    `upi://pay?pa=${UPI_ID}` +
    `&pn=${encodeURIComponent(PAYEE_NAME)}` +
    `&am=${AMOUNT}` +
    `&cu=INR` +
    `&tn=${referenceId}`;

  new QRCode(document.getElementById("qr"), {
    text: upiLink,
    width: 220,
    height: 220,
    correctLevel: QRCode.CorrectLevel.H
  });
});

// Submit payment (UTR → backend)
function submitPayment() {
  const utr = document.getElementById("utr").value.trim();

  if (!utr) {
    alert("Please enter the UPI Transaction ID (UTR)");
    return;
  }

  fetch("/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ referenceId, utr })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Show receipt
        const reg = data.registration || {}; // in case backend returns name & phone
        const now = new Date().toLocaleString();


        document.getElementById("recRef").innerText = referenceId;
        document.getElementById("recUTR").innerText = utr;
        document.getElementById("recDate").innerText = now;

        document.getElementById("paymentReceipt").style.display = "block";

        alert("Payment submitted successfully! Scroll down to see your receipt.");
      } else {
        alert(data.message || "Payment submission failed.");
      }
    })
    .catch(() => alert("Server error. Try again."));
}


