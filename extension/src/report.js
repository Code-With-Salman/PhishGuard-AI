chrome.storage.local.get(
"latestReport",
(data)=>{

    document
    .getElementById(
        "reportContent"
    )
    .textContent =
    data.latestReport.report ||
    "No report available";

});

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const data =
        await chrome.storage.local.get(
            "latestReport"
        );

        const report =
        data.latestReport;

        if(!report){

            document.body.innerHTML =
            "<h2>No report found</h2>";

            return;
        }

        document.getElementById(
            "reportContent"
        ).textContent =
        report.report ||
        JSON.stringify(
            report,
            null,
            2
        );

    }
);
