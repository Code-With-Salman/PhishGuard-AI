console.log("Content script loaded");

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {

        console.log("MESSAGE RECEIVED:", request);

        if (request.action === "extractEmail") {

            console.log("Extract email request received");

            const subject =
                document.querySelector("h2")?.innerText || "";

            const body =
                document.querySelector(".a3s")?.innerText || "";

            const senderEmail =
                document.querySelector(".gD")
                    ?.getAttribute("email") || "";

            const emailData = {
                sender: senderEmail,
                subject: subject,
                email_body: body,
                attachments: []
            };

            console.log(
                "EXTRACTED EMAIL DATA:",
                JSON.stringify(emailData, null, 2)
            );

            sendResponse(emailData);

            return true;
        }
    }
);

function injectBanner(result){

    const old =
    document.getElementById(
        "phishguard-banner"
    );

    if(old) old.remove();

    const banner =
    document.createElement("div");

    banner.id =
    "phishguard-banner";

    banner.style.padding =
    "12px";

    banner.style.fontWeight =
    "bold";

    banner.style.fontSize =
    "16px";

    if(
        result.verdict==="SAFE"
    ){
        banner.style.background =
        "#d1fae5";
    }
    else if(
        result.verdict==="SUSPICIOUS"
    ){
        banner.style.background =
        "#fef3c7";
    }
    else{
        banner.style.background =
        "#fee2e2";
    }

    banner.innerHTML =
    `🛡 ${result.verdict}
     | Risk Score:
     ${result.risk_score}`;

    const container =
    document.querySelector(
        ".ii.gt"
    );

    if(container){
        container.prepend(
            banner
        );
    }
}
