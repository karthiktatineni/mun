
  const form = document.getElementById("regForm");
  const msg = document.getElementById("msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const inputs = form.querySelectorAll("input");

    // Helper functions
    const isValidEmail = (email) => email.includes("@");
    const isValidPhone = (phone) => /^\d{10}$/.test(phone);

    // Reset previous field styles
    inputs.forEach(input => input.style.borderColor = "");

    // Check all fields are filled
    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i].value.trim() === "") {
        inputs[i].style.borderColor = "red";
        msg.style.color = "red";
        msg.innerText = "Please fill out all required fields.";
        return;
      }
    }

    // Gather emails and phones
    const emails = [inputs[1].value, inputs[4].value, inputs[7].value];
    const phones = [inputs[2].value, inputs[5].value, inputs[8].value];

    // Validate emails
    for (let i = 0; i < emails.length; i++) {
      if (!isValidEmail(emails[i])) {
        inputs[i === 0 ? 1 : i === 1 ? 4 : 7].style.borderColor = "red";
        msg.style.color = "red";
        msg.innerText = `Email ${i + 1} is invalid. Must contain '@'.`;
        return;
      }
    }

    // emails are different
    if (new Set(emails).size !== emails.length) {
      msg.style.color = "red";
      msg.innerText = "All emails must be different.";
      return;
    }

    // Validate phones
    for (let i = 0; i < phones.length; i++) {
      if (!isValidPhone(phones[i])) {
        inputs[i === 0 ? 2 : i === 1 ? 5 : 8].style.borderColor = "red";
        msg.style.color = "red";
        msg.innerText = `Phone number ${i + 1} is invalid. Must be 10 digits.`;
        return;
      }
    }

    // phones are different
    if (new Set(phones).size !== phones.length) {
      msg.style.color = "red";
      msg.innerText = "All phone numbers must be different.";
      return;
    }

    // Prepare data
    const data = {
      leader: { name: inputs[0].value, email: inputs[1].value, phone: inputs[2].value },
      delegate1: { name: inputs[3].value, email: inputs[4].value, phone: inputs[5].value },
      delegate2: { name: inputs[6].value, email: inputs[7].value, phone: inputs[8].value },
      college: inputs[9].value,
      committee: inputs[10].value,
      time: new Date().toLocaleString()
    };

    try {
      const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      msg.style.color = "lime";
      msg.innerText = result.message;
      form.reset();

    } catch (error) {
      msg.style.color = "red";
      msg.innerText = "Error submitting form. Please try again.";
    }
  });
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('active');
}
);
