document.addEventListener('DOMContentLoaded', () => {
    const speedSelect = document.getElementById('speed-select');
    const qualitySelect = document.getElementById('quality-select'); // This will be mostly disabled/removed
    const lastUsedSpeedSpan = document.getElementById('last-used-speed');
    const lastUsedQualitySpan = document.getElementById('last-used-quality'); // This will be removed
    const setSpeedDefaultBtn = document.getElementById('set-speed-default');
    const setQualityDefaultBtn = document.getElementById('set-quality-default'); // This will be removed

    // Hide/Disable quality related elements if they are not controllable
    qualitySelect.disabled = true; // Disable dropdown
    qualitySelect.style.display = 'none'; // Hide if desired
    document.querySelector('label[for="quality-select"]').style.display = 'none';
    lastUsedQualitySpan.style.display = 'none';
    setQualityDefaultBtn.style.display = 'none';

    // Function to load and display current settings
    async function loadSettings() {
        const { availableSpeedOptions } = await chrome.storage.local.get(['availableSpeedOptions']);
        const { selectedSpeed } = await chrome.storage.local.get(['selectedSpeed']);
        if (availableSpeedOptions && availableSpeedOptions.length > 0) {
            populateSpeedSelect(availableSpeedOptions, selectedSpeed);
            const { lastUsedSpeed } = await chrome.storage.local.get(['lastUsedSpeed'])
            if (lastUsedSpeed) {
                // Display last used speed
                if (lastUsedSpeed !== undefined && lastUsedSpeed !== null) {
                    lastUsedSpeedSpan.textContent = lastUsedSpeed;
                    if (selectedSpeed !== lastUsedSpeed) {
                        setSpeedDefaultBtn.style.display = 'inline-block';
                        setSpeedDefaultBtn.onclick = () => {
                            speedSelect.value = lastUsedSpeed;
                            saveSetting('selectedSpeed', lastUsedSpeed);
                            setSpeedDefaultBtn.style.display = 'none'
                        }
                    }
                } else {
                    lastUsedSpeedSpan.textContent = 'N/A';
                    setSpeedDefaultBtn.style.display = 'none';
                }
            }
        } else {
            setTimeout(async () => await loadSettings(), 1000); // retry 5 times
        }
    }

    function populateSpeedSelect(speeds, selectedSpeed) {
        speedSelect.innerHTML = ''; // clear old options

        speeds.forEach(speed => {
            const opt = document.createElement('option');
            opt.value = speed;
            opt.textContent = speed;
            if (speed == selectedSpeed) {
                opt.selected = true
            } else if (!selectedSpeed && speed === 'Normal') {
                opt.selected = true
            }
            speedSelect.appendChild(opt);
        });
    }

    // Function to save a setting
    function saveSetting(key, value) {
        chrome.storage.local.set({ [key]: value }, () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "applyNewSpeed", speed: value });
                }
            });
        });
    }

    // Event listener for speed select changes
    speedSelect.addEventListener('change', (event) => {
        saveSetting('selectedSpeed', event.target.value);
    });

    // Load settings when popup opens
    loadSettings();
});