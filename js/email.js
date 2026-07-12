const sendReminderBtn = document.getElementById("send-reminders-btn");

sendReminderBtn.addEventListener("click", sendWeddingReminder);

async function sendWeddingReminder() {

    sendReminderBtn.disabled = true;
    sendReminderBtn.textContent = "Sending...";

    try {

        const response = await fetch(
            "https://personal-t3vejdmt.outsystemscloud.com/Cat/rest/SendRSVP/RSVPSendEmail",
            {
                method: "POST"
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        alert("✅ Wedding reminders sent successfully!");

    } catch (err) {

        console.error(err);
        alert("Failed to send reminders.\n\n" + err.message);

    } finally {

        sendReminderBtn.disabled = false;
        sendReminderBtn.textContent = "📧 Send Wedding Reminder";

    }

}