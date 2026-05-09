async function testPayment() {
  try {
    const payload = {
      studentName: "Test Student " + Date.now(),
      studentClass: "Year 7",
      campus: "PRIMARY",
      name: "Test Parent",
      phone: "08012345678",
      email: "test@example.com",
      amount: "25000",
      note: "Test note"
    };

    console.log("Sending payload:", payload);

    const res = await fetch("http://localhost:3000/api/admissions/initiate-payment/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Response Status:", res.status);
    console.log("Response Data:", data);
  } catch (err) {
    console.error("Test Error:", err);
  }
}

testPayment();
