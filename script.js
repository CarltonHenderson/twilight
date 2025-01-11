document.addEventListener("DOMContentLoaded", () => {
    const highlightTimeElem = document.getElementById("highlight-time");
    const progressBar = document.getElementById("progress-bar");
    const locationElem = document.getElementById("location");
    const duskTimeElem = document.getElementById("dusk-time");
    const turnaroundTimeElem = document.getElementById("turnaround-time");
    const startTimeElem = document.getElementById("start-time");
    const timeUntilDuskElem = document.getElementById("timeUntilDusk");
    const loadingElem = document.getElementById("loading");
    const toastElem = document.getElementById("toast");
    const resetButton = document.getElementById("reset");

    let hikeData = JSON.parse(localStorage.getItem("hikeData")) || null;
    let resetTimer;

    const showToast = (message) => {
        toastElem.textContent = message;
        toastElem.style.display = "block";
        setTimeout(() => {
            toastElem.style.display = "none";
        }, 3000);
    };

    const updateProgress = () => {
        const now = new Date();
        const elapsedTime = now.getTime() - hikeData.startTime;
        const totalTime = hikeData.duskTime - hikeData.startTime;

        const progress = Math.min((elapsedTime / totalTime) * 100, 100);
        progressBar.style.width = `${progress}%`;

        const timeUntilDusk = Math.round((hikeData.duskTime - now.getTime()) / (1000 * 60)); // Rounded to minutes
        const timeUntilTurnaround = Math.round((hikeData.turnaroundTime - now.getTime()) / (1000 * 60)); // Rounded to minutes

        highlightTimeElem.textContent =
            now.getTime() >= hikeData.turnaroundTime
                ? `Turnaround time passed! Head back.`
                : `Turnaround in ${timeUntilTurnaround} minutes`;

        timeUntilDuskElem.textContent = `Time Until Dusk: ${timeUntilDusk} minutes`;
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const initializeHike = () => {
        loadingElem.style.display = "block"; // Show loading text

        if (!hikeData) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const lat = position.coords.latitude.toFixed(2);
                    const lon = position.coords.longitude.toFixed(2);
                    const now = new Date();

                    locationElem.textContent = `Location: ${lat}, ${lon}`;

                    // Calculate dusk using SunCalc
                    const times = SunCalc.getTimes(now, lat, lon);
                    let duskTime = times.dusk.getTime();
                    const nowTime = now.getTime();

                    // If dusk is in the past, use 10 minutes from now
                    if (duskTime < nowTime) {
                        duskTime = nowTime + 10 * 60 * 1000;
                    }

                    const turnaroundTime = (nowTime + duskTime) / 2;

                    hikeData = {
                        startTime: nowTime,
                        duskTime,
                        turnaroundTime,
                    };

                    localStorage.setItem("hikeData", JSON.stringify(hikeData));

                    startTimeElem.textContent = formatTime(new Date(nowTime));
                    turnaroundTimeElem.textContent = formatTime(new Date(turnaroundTime));
                    duskTimeElem.textContent = formatTime(new Date(duskTime));

                    loadingElem.style.display = "none"; // Hide loading text
                    updateProgress();
                    setInterval(updateProgress, 1000);
                });
            } else {
                highlightTimeElem.textContent = "Geolocation not supported on this device.";
                loadingElem.style.display = "none"; // Hide loading text
            }
        } else {
            startTimeElem.textContent = formatTime(new Date(hikeData.startTime));
            turnaroundTimeElem.textContent = formatTime(new Date(hikeData.turnaroundTime));
            duskTimeElem.textContent = formatTime(new Date(hikeData.duskTime));

            loadingElem.style.display = "none"; // Hide loading text
            updateProgress();
            setInterval(updateProgress, 1000);
        }
    };

    const startReset = () => {
        resetTimer = setTimeout(() => {
            localStorage.removeItem("hikeData");
            location.reload();
        }, 2000);
    };

    const cancelReset = () => {
        clearTimeout(resetTimer);
    };

    turnaroundTimeElem.addEventListener("click", () => {
        navigator.clipboard.writeText(turnaroundTimeElem.textContent).then(() => {
            showToast("Turnaround time copied to clipboard!");
        });
    });

    resetButton.addEventListener("mousedown", startReset);
    resetButton.addEventListener("touchstart", startReset);
    resetButton.addEventListener("mouseup", cancelReset);
    resetButton.addEventListener("touchend", cancelReset);

    initializeHike();
});
