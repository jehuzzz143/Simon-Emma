const sendReminderBtn = document.getElementById("send-reminders-btn");

sendReminderBtn.addEventListener("click", sendWeddingReminder);

async function sendWeddingReminder() {

    sendReminderBtn.disabled = true;
    sendReminderBtn.textContent = "Sending...";

    try {

        const { data, error } = await supabaseClient.functions.invoke(
            "swift-handler"
        );

        if (error) throw error;

        alert(`✅ ${data.sent} email(s) sent.\n❌ ${data.failed} failed.`);

    } catch (err) {

        console.error(err);
        alert("Failed to send reminders.\n\n" + err.message);

    }

    sendReminderBtn.disabled = false;
    sendReminderBtn.textContent = "📧 Send Wedding Reminder";

}