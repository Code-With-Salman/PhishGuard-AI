console.log("Background loaded");

if (chrome.commands) {
    chrome.commands.onCommand.addListener((command) => {
        console.log(command);
    });
}
