
const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia",
  "DR Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
  "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia",
  "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
  "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran"
];

// ----- COMMITTEES -----
const committees = ["UNSC", "DISEC", "IP", "UNHRC"];
let allocated = {};
committees.forEach(c => allocated[c] = []);

// ----- AUTOCOMPLETE FUNCTION -----
function setupAutocomplete(selector) {
  document.querySelectorAll(selector).forEach(input => {
    input.addEventListener("input", function() {
      const val = this.value.toLowerCase();
      const parent = this.parentNode;

      const oldBox = parent.querySelector(".suggestions");
      if (oldBox) oldBox.remove();
      if (!val) return;

      const selected = Array.from(document.querySelectorAll('input[name$="_country1"], input[name$="_country2"], input[name$="_country3"]'))
        .map(i => i.value.toLowerCase())
        .filter(v => v);

      const matches = countries.filter(c => c.toLowerCase().startsWith(val) && !selected.includes(c.toLowerCase()));
      if (!matches.length) return;

      const box = document.createElement("div");
      box.className = "suggestions";
      box.style.position = "absolute";
      box.style.background = "rgba(0,0,0,0.85)";
      box.style.color = "silver";
      box.style.zIndex = "1000";
      box.style.width = "100%";
      box.style.maxHeight = "150px";
      box.style.overflowY = "auto";
      box.style.borderRadius = "4px";

      matches.forEach(m => {
        const div = document.createElement("div");
        div.innerText = m;
        div.style.padding = "5px 10px";
        div.style.cursor = "pointer";
        div.addEventListener("click", () => {
          input.value = m;
          box.remove();
        });
        box.appendChild(div);
      });

      parent.appendChild(box);
    });

    input.addEventListener("blur", () => {
      setTimeout(() => {
        const box = input.parentNode.querySelector(".suggestions");
        if (box) box.remove();
      }, 200);
    });
  });
}

// Apply autocomplete
setupAutocomplete('input[name$="_country1"], input[name$="_country2"], input[name$="_country3"]');

// ----- FORM SUBMIT -----
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("regForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const msg = document.getElementById("msg");
    msg.innerText = "";
    msg.style.color = "red";

    // Collect basic info
    const name = this.name.value.trim();
    const email = this.email.value.trim();
    const phone = this.phone.value.trim();
    const college = this.college.value.trim();
    const muns = this.muns.value.trim();

    // Validate
    if (!name || !email || !phone || !college || !muns) {
      msg.innerText = "Please fill all fields.";
      return;
    }

    if (!email.includes("@")) { msg.innerText = "Email must contain @."; return; }
    if (!/^\d{10}$/.test(phone)) { msg.innerText = "Phone number must be exactly 10 digits."; return; }

    // Collect committee preferences
    const prefs = [];
    for (let i = 1; i <= 3; i++) {
      const committee = this[`committee${i}`].value;
      const countriesInput = [
        this[`committee${i}_country1`].value.trim(),
        this[`committee${i}_country2`].value.trim(),
        this[`committee${i}_country3`].value.trim()
      ];

      if (!committee || countriesInput.some(c => !c)) {
        msg.innerText = `Please select committee ${i} and all its countries.`;
        return;
      }

      prefs.push({ committee, countries: countriesInput });
    }

    // Allocate countries without duplicates
    const allocation = [];
    for (let pref of prefs) {
      const chosen = [];
      for (let c of pref.countries) {
        if (!allocated[pref.committee].includes(c)) {
          allocated[pref.committee].push(c);
          chosen.push(c);
        }
      }
      allocation.push({ committee: pref.committee, countries: chosen });
    }

    const payload = { name, email, phone, college, muns, allocation };

    try {
      const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        // Redirect to payment page (UTR collected there)
        window.location.href = `payment.html?ref=${data.referenceId}`;
      } else {
        msg.innerText = data.error || "Failed to register. Try again.";
      }
    } catch (err) {
      console.error(err);
      msg.innerText = "Server error. Try again.";
    }
  });
});
