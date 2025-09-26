document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      return await response.json();
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function renderActivities(activities) {
    activitiesList.innerHTML = "";

    Object.entries(activities).forEach(([name, info]) => {
      const card = document.createElement("div");
      card.className = "activity-card";

      const spotsLeft = info.max_participants - info.participants.length;

      card.innerHTML = `
        <h4>${name}</h4>
        <p>${info.description}</p>
        <p><strong>Schedule:</strong> ${info.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="chips-container"></div>
      `;

      // Add participant chips with remove icon
      const chipsContainer = card.querySelector('.chips-container');
      info.participants.forEach(email => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = email;

        // Remove icon
        const removeIcon = document.createElement('span');
        removeIcon.className = 'remove-icon';
        removeIcon.innerHTML = '&times;';
        removeIcon.title = 'Remove participant';
        removeIcon.style.marginLeft = '8px';
        removeIcon.style.cursor = 'pointer';
        removeIcon.onclick = async () => {
          await unregisterParticipant(name, email);
        };
        chip.appendChild(removeIcon);
        chipsContainer.appendChild(chip);
      });

      activitiesList.appendChild(card);
    });
  // Unregister function
  async function unregisterParticipant(activity, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Unregister failed");
      }
      const result = await response.json();
      messageDiv.className = "message success";
      messageDiv.textContent = result.message;
      await refreshActivitiesUI();
    } catch (error) {
      messageDiv.className = "message error";
      messageDiv.textContent = error.message;
    }
    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }
  }

  async function populateActivitiesSelect(activities) {
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
    Object.keys(activities).forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  async function refreshActivitiesUI() {
    const activities = await fetchActivities();
    renderActivities(activities);
    populateActivitiesSelect(activities);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    messageDiv.className = "message hidden";
    messageDiv.textContent = "";

    if (!email || !activity) return;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Signup failed");
      }

      const result = await response.json();
      messageDiv.className = "message success";
      messageDiv.textContent = result.message;

      // Refresh activities list to show updated participants
      await refreshActivitiesUI();

      // Optionally, reset form
      signupForm.reset();
    } catch (error) {
      messageDiv.className = "message error";
      messageDiv.textContent = error.message;
    }

    messageDiv.classList.remove("hidden");

    // Hide message after 5 seconds
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  });

  // Initialize app
  refreshActivitiesUI();
});
