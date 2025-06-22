(function () {
    function isAdPlaying() {
        return document.querySelector('.ad-showing') !== null;
    }

    function getMainVideo() {
        const video = document.querySelector('video');
        return video?.classList.contains('html5-main-video') ? video : null;
    }

    function togglePlaybackSpeedMenu() {
        const gearBtn = document.querySelector('.ytp-settings-button');
        if (gearBtn) gearBtn.click();
    }

    let speedOptions = [];

    function updateAvailableSpeedOptions() {
        chrome.storage.local.set({ availableSpeedOptions: speedOptions }, () => {
            console.log(`✅ Speed options saved to storage`);
        });
    }

    function clickMenuItemWithText(text, settingType) {
        const items = document.querySelectorAll('.ytp-menuitem-label');
        // updating available options list once
        if (settingType === 'speed' && speedOptions.length === 0) {
            speedOptions = [...items?.values()].map((label) => label.textContent.trim()).filter((val) => val.toLowerCase().indexOf('custom'));
            if (speedOptions?.length) updateAvailableSpeedOptions(speedOptions)
        }
        for (let item of items) {
            if (item.textContent.trim() === text) {
                item.click();
                return true;
            }
        }
        return false;
    }

    function setSpeedInUI(speed = '') {
        togglePlaybackSpeedMenu();
        setTimeout(() => {
            if (!clickMenuItemWithText('Playback speed')) return;

            setTimeout(() => {
                clickMenuItemWithText(speed, 'speed');
                console.log('Desired playback speed set automatically!!')
                setTimeout(() => togglePlaybackSpeedMenu(), 1000)
            }, 1000);
        }, 1000);
    }

    async function getSelectedSpeedAndTriggerUpdate() {
        chrome.storage.local.get(['selectedSpeed'], (result) => {
            setSpeedInUI(result?.selectedSpeed);
            videoPlaybackSet = true;
        });
    }

    let videoPlaybackSet = false;
    const observer = new MutationObserver(async () => {
        const mainVideo = getMainVideo();
        if (mainVideo) {
            if (isAdPlaying()) {
                // probably an advertisemnt
                // fast forwarding it
                // const adVideo = document.querySelector('video');
                // adVideo.playbackRate = 16;
            } else {
                if (!videoPlaybackSet) {
                    // resetting speed
                    mainVideo.playbackRate = 1

                    // storing manually changed speed by user
                    mainVideo?.addEventListener('ratechange', () => {
                        console.log('Changed speed to:', mainVideo.playbackRate);
                        chrome.storage.local.set({ lastUsedSpeed: mainVideo.playbackRate === 1 ? 'Normal' : mainVideo.playbackRate })
                    });


                    // set speed via UI
                    getSelectedSpeedAndTriggerUpdate();
                }
            }
        }
    });

    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.action === 'applyNewSpeed') {
            getSelectedSpeedAndTriggerUpdate();
        }
    });


    observer.observe(document.body, { childList: true, subtree: true });
})()
